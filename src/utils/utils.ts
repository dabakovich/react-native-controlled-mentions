import { Change, diffChars } from 'diff';
import { StyleProp, TextStyle } from 'react-native';
// @ts-ignore the lib do not have TS declarations yet
import matchAll from 'string.prototype.matchall';
import { MentionData, Part, Position, RegexMatchResult, Suggestion } from '../types';

const mentionRegEx = /(?<original>@\[(?<name>([^@[]*))]\((?<id>([\d\w-]*))\))/gi;

const defaultMentionTextStyle: StyleProp<TextStyle> = {fontWeight: 'bold', color: '#4f69f3'};

type CharactersDiffChange = Omit<Change, 'count'> & { count: number };

const getPartIndexByCursor = (parts: Part[], cursor: number, isIncludeEnd?: boolean) => {
  return parts.findIndex(one => cursor >= one.position.start && isIncludeEnd ? cursor <= one.position.end : cursor < one.position.end);
};

/**
 * The method for getting parts between two cursor positions.
 *
 * | part1 |   part2   |   part3   |
 *  a b c|d e f g h i j h k|l m n o
 *  We will get 3 parts here:
 *  1. Part included 'd'
 *  2. Part included 'efghij'
 *  3. Part included 'hk'
 *  Cursor will move to position after 'k'
 *
 * @param parts full part list
 * @param cursor current cursor position
 * @param count count of characters that didn't change
 */
const getPartsInterval = (parts: Part[], cursor: number, count: number): Part[] => {
  const newCursor = cursor + count;

  const currentPartIndex = getPartIndexByCursor(parts, cursor);
  const currentPart = parts[currentPartIndex];

  const newPartIndex = getPartIndexByCursor(parts, newCursor, true);
  const newPart = parts[newPartIndex];

  let partsInterval: Part[] = [];

  // Push whole first affected part or sub-part of the first affected part
  if (currentPart.position.start === cursor && currentPart.position.end <= newCursor) {
    partsInterval.push(currentPart);
  } else {
    partsInterval.push(generatePart(currentPart.text.substr(cursor - currentPart.position.start, count)));
  }

  if (newPartIndex > currentPartIndex) {
    // Concat fully included parts
    partsInterval = partsInterval.concat(parts.slice(currentPartIndex + 1, newPartIndex));

    // Push whole last affected part or sub-part of the last affected part
    if (newPart.position.end === newCursor && newPart.position.start >= cursor) {
      partsInterval.push(newPart);
    } else {
      partsInterval.push(generatePart(newPart.text.substr(0, newCursor - newPart.position.start)));
    }
  }

  return partsInterval;
};

/**
 * Generates new value when we changing text.
 *
 * @param parts full parts list
 * @param originalText original plain text
 * @param changedText changed plain text
 */
const generateValueFromPartsAndChangedText = (parts: Part[], originalText: string, changedText: string) => {
  const changes = diffChars(originalText, changedText) as CharactersDiffChange[];

  let newParts: Part[] = [];

  let cursor = 0;

  changes.forEach(change => {
    switch (true) {
      /**
       * We should:
       * - Move cursor forward on the changed text length
       */
      case change.removed: {
        cursor += change.count;

        break;
      }

      /**
       * We should:
       * - Push new part to the parts with that new text
       */
      case change.added: {
        newParts.push(generatePart(change.value));

        break;
      }

      /**
       * We should concat parts that didn't change.
       * - In case when we have only one affected part we should push only that one sub-part
       * - In case we have two affected parts we should push first
       */
      default: {
        newParts = newParts.concat(getPartsInterval(parts, cursor, change.count));

        cursor += change.count;

        break;
      }
    }
  });

  return getValueFromParts(newParts);
};

/**
 * Method for adding suggestion to the parts and generating value. We should:
 * - Find part with plain text where we were tracking mention typing using selection state
 * - Split the part to next parts:
 * -* Before new mention
 * -* With new mention
 * -* After mention with space at the beginning
 * - Generate new parts array and convert it to value
 *
 * @param parts full part list
 * @param trigger trigger for mention
 * @param plainText current plain text
 * @param selection current selection
 * @param suggestion suggestion that should be added
 * @param isInsertSpaceAfterMention should we insert a space just after added suggestion
 */
const generateValueWithAddedSuggestion = (
  parts: Part[],
  trigger: string,
  plainText: string,
  selection: Position,
  suggestion: Suggestion,
  isInsertSpaceAfterMention?: boolean,
): string | undefined => {
  const currentPartIndex = parts.findIndex(one => selection.end >= one.position.start && selection.end <= one.position.end);
  const currentPart = parts[currentPartIndex];

  if (!currentPart) {
    return;
  }

  const triggerPartIndex = currentPart.text.lastIndexOf(trigger, selection.end - currentPart.position.start);
  const spacePartIndex = currentPart.text.lastIndexOf(' ', selection.end - currentPart.position.start - 1);

  if (spacePartIndex > triggerPartIndex) {
    return;
  }

  const newMentionPartPosition: Position = {
    start: triggerPartIndex,
    end: selection.end - currentPart.position.start,
  };

  const isInsertSpaceToNextPart = isInsertSpaceAfterMention
    // Cursor is at the very end of parts or text row
    && (plainText.length === selection.end || parts[currentPartIndex]?.text.startsWith('\n', newMentionPartPosition.end));

  return getValueFromParts([
    ...parts.slice(0, currentPartIndex),

    // Create part with string before mention
    generatePart(currentPart.text.substring(0, newMentionPartPosition.start)),
    generateMentionPart(trigger, {
      ...suggestion,
      original: getMentionValue(suggestion),
    }),
    // Create part with rest of string after mention and add a space if needed
    generatePart(`${isInsertSpaceToNextPart ? ' ' : ''}${currentPart.text.substring(newMentionPartPosition.end)}`),

    ...parts.slice(currentPartIndex + 1),
  ]);
};

/**
 * Method for generating part for plain text
 *
 * @param text - plain text that will be added to the part
 * @param positionOffset - position offset from the very beginning of text
 */
const generatePart = (text: string, positionOffset = 0): Part => ({
  text,
  position: {
    start: positionOffset,
    end: positionOffset + text.length,
  },
});

/**
 * Method for generating part for mention
 *
 * @param trigger trigger for mention
 * @param mention mention data
 * @param positionOffset position offset from the very beginning of text
 */
const generateMentionPart = (trigger: string, mention: MentionData, positionOffset = 0): Part => {
  const text = `${trigger}${mention.name}`;

  return {
    text,
    position: {
      start: positionOffset,
      end: positionOffset + text.length,
    },
    data: mention,
  };
};

/**
 * Method for generation mention value that accepts mention regex
 *
 * @param suggestion
 */
const getMentionValue = (suggestion: Suggestion) => `@[${suggestion.name}](${suggestion.id})`;

/**
 * Function for generating parts array from value
 *
 * @param trigger
 * @param value
 */
const getPartsFromValue = (trigger: string, value: string) => {
  const results: RegexMatchResult[] = Array.from(matchAll(value ?? '', mentionRegEx));
  const parts: Part[] = [];

  let plainText = '';

  // In case when we don't have any mentions we just return the only one part with plain text
  if (results.length == 0) {
    parts.push(generatePart(value, 0));

    plainText += value;

    return {
      parts,
      plainText,
    };
  }

  // In case when we have some text before first mention
  if (results[0].index != 0) {
    const text = value.substr(0, results[0].index);

    parts.push(generatePart(text, 0));

    plainText += text;
  }

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    const mentionPart = generateMentionPart(trigger, result.groups, plainText.length);

    parts.push(mentionPart);

    plainText += mentionPart.text;

    if ((result.index + result.groups.original.length) !== value.length) {
      const isLastResult = i == results.length - 1;

      const text = value.slice(
        result.index + result.groups.original.length,
        isLastResult ? undefined : results[i + 1].index,
      );

      parts.push(generatePart(text, plainText.length));

      plainText += text;
    }
  }

  return {
    plainText,
    parts: parts.filter(item => item.text),
  };
};

/**
 * Function for generation value from parts array
 *
 * @param parts
 */
const getValueFromParts = (parts: Part[]) => parts
  .map(item => (item.data ? item.data.original : item.text))
  .join('');

/**
 * Replace all mention values in value to some specified format
 *
 * @param value - value that is generated by Mentions component
 * @param replacer - function that takes mention object as parameter and returns string
 */
const replaceMentionValues = (
  value: string,
  replacer: (mention: MentionData) => string,
) => value.replace(mentionRegEx, (mention, original, name, id) => replacer({original, name, id}));

export {
  mentionRegEx,
  defaultMentionTextStyle,
  generateValueFromPartsAndChangedText,
  generateValueWithAddedSuggestion,
  generatePart,
  generateMentionPart,
  getMentionValue,
  getPartsFromValue,
  getValueFromParts,
  replaceMentionValues,
};
