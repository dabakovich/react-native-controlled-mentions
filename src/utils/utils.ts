import { Change, diffChars } from 'diff';
import { StyleProp, TextStyle } from 'react-native';
// @ts-ignore the lib do not have TS declarations yet
import matchAll from 'string.prototype.matchall';
import {
  MentionData,
  MentionPartType,
  Part,
  PartType,
  Position,
  RegexMatchResult,
  Suggestion,
} from '../types';

const mentionRegEx = /(?<original>(?<trigger>.)\[(?<name>([^[]*))]\((?<id>([\d\w-]*))\))/gi;

const defaultMentionTextStyle: StyleProp<TextStyle> = {fontWeight: 'bold', color: 'blue'};

const defaultPlainStringGenerator = ({trigger}: MentionPartType, {name}: MentionData) => `${trigger}${name}`;

type CharactersDiffChange = Omit<Change, 'count'> & { count: number };

const isMentionPartType = (partType: PartType): partType is MentionPartType => {
  return (partType as MentionPartType).trigger != null;
};

const getPartIndexByCursor = (parts: Part[], cursor: number, isIncludeEnd?: boolean) => {
  return parts.findIndex(one => cursor >= one.position.start && isIncludeEnd ? cursor <= one.position.end : cursor < one.position.end);
};

/**
 * The method for getting parts between two cursor positions.
 * ```
 * | part1 |   part2   |   part3   |
 *  a b c|d e f g h i j h k|l m n o
 *  ```
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

  if (!currentPart || !newPart) {
    return partsInterval;
  }

  // Push whole first affected part or sub-part of the first affected part
  if (currentPart.position.start === cursor && currentPart.position.end <= newCursor) {
    partsInterval.push(currentPart);
  } else {
    partsInterval.push(generatePlainTextPart(currentPart.text.substr(cursor - currentPart.position.start, count)));
  }

  if (newPartIndex > currentPartIndex) {
    // Concat fully included parts
    partsInterval = partsInterval.concat(parts.slice(currentPartIndex + 1, newPartIndex));

    // Push whole last affected part or sub-part of the last affected part
    if (newPart.position.end === newCursor && newPart.position.start >= cursor) {
      partsInterval.push(newPart);
    } else {
      partsInterval.push(generatePlainTextPart(newPart.text.substr(0, newCursor - newPart.position.start)));
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
        newParts.push(generatePlainTextPart(change.value));

        break;
      }

      /**
       * We should concat parts that didn't change.
       * - In case when we have only one affected part we should push only that one sub-part
       * - In case we have two affected parts we should push first
       */
      default: {
        if (change.count !== 0) {
          newParts = newParts.concat(getPartsInterval(parts, cursor, change.count));

          cursor += change.count;
        }

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
 * @param parts - full part list
 * @param mentionType - actually the mention type
 * @param plainText - current plain text
 * @param selection - current selection
 * @param suggestion - suggestion that should be added
 */
const generateValueWithAddedSuggestion = (
  parts: Part[],
  mentionType: MentionPartType,
  plainText: string,
  selection: Position,
  suggestion: Suggestion,
): string | undefined => {
  const currentPartIndex = parts.findIndex(one => selection.end >= one.position.start && selection.end <= one.position.end);
  const currentPart = parts[currentPartIndex];

  if (!currentPart) {
    return;
  }

  const triggerPartIndex = currentPart.text.lastIndexOf(mentionType.trigger, selection.end - currentPart.position.start);
  const spacePartIndex = currentPart.text.lastIndexOf(' ', selection.end - currentPart.position.start - 1);

  if (spacePartIndex > triggerPartIndex) {
    return;
  }

  const newMentionPartPosition: Position = {
    start: triggerPartIndex,
    end: selection.end - currentPart.position.start,
  };

  const isInsertSpaceToNextPart = mentionType.isInsertSpaceAfterMention
    // Cursor is at the very end of parts or text row
    && (plainText.length === selection.end || parts[currentPartIndex]?.text.startsWith('\n', newMentionPartPosition.end));

  return getValueFromParts([
    ...parts.slice(0, currentPartIndex),

    // Create part with string before mention
    generatePlainTextPart(currentPart.text.substring(0, newMentionPartPosition.start)),
    generateMentionPart(mentionType, {
      original: getMentionValue(mentionType.trigger, suggestion),
      trigger: mentionType.trigger,
      ...suggestion,
    }),

    // Create part with rest of string after mention and add a space if needed
    generatePlainTextPart(`${isInsertSpaceToNextPart ? ' ' : ''}${currentPart.text.substring(newMentionPartPosition.end)}`),

    ...parts.slice(currentPartIndex + 1),
  ]);
};

/**
 * Method for generating part for plain text
 *
 * @param text - plain text that will be added to the part
 * @param positionOffset - position offset from the very beginning of text
 */
const generatePlainTextPart = (text: string, positionOffset = 0): Part => ({
  text,
  position: {
    start: positionOffset,
    end: positionOffset + text.length,
  },
});

/**
 * Method for generating part for mention
 *
 * @param mentionPartType
 * @param mention - mention data
 * @param positionOffset - position offset from the very beginning of text
 */
const generateMentionPart = (mentionPartType: MentionPartType, mention: MentionData, positionOffset = 0): Part => {
  const text = mentionPartType.getPlainString
    ? mentionPartType.getPlainString(mention)
    : defaultPlainStringGenerator(mentionPartType, mention);

  return {
    text,
    position: {
      start: positionOffset,
      end: positionOffset + text.length,
    },
    partType: mentionPartType,
    data: mention,
  };
};

/**
 * Generates part for matched regex result
 *
 * @param partType - current part type (pattern or mention)
 * @param result - matched regex result
 * @param positionOffset - position offset from the very beginning of text
 */
const generateRegexResultPart = (partType: PartType, result: RegexMatchResult, positionOffset = 0): Part => {
  if (isMentionPartType(partType)) {
    return generateMentionPart(partType, result.groups, positionOffset);
  }

  return {
    text: result[0],
    position: {
      start: positionOffset,
      end: positionOffset + result[0].length,
    },
    partType,
  };
};

/**
 * Method for generation mention value that accepts mention regex
 *
 * @param trigger
 * @param suggestion
 */
const getMentionValue = (trigger: string, suggestion: Suggestion) => `${trigger}[${suggestion.name}](${suggestion.id})`;

/**
 * Recursive function for deep parse MentionInput's value and get plainText with parts
 *
 * @param value - the MentionInput's value
 * @param partTypes - All provided part types
 * @param positionOffset - offset from the very beginning of plain text
 */
const parseValue = (
  value: string,
  partTypes: PartType[],
  positionOffset = 0,
): { plainText: string; parts: Part[] } => {

  let plainText = '';
  let parts: Part[] = [];

  // We don't have any part types so adding just plain text part
  if (partTypes.length === 0) {
    plainText += value;
    parts.push(generatePlainTextPart(value, positionOffset));
  } else {
    const [partType, ...restPartTypes] = partTypes;

    const regex = isMentionPartType(partType) ? mentionRegEx : partType.pattern;

    const matches: RegexMatchResult[] = Array.from(matchAll(value ?? '', regex));

    // In case when we didn't get any matches continue parsing value with rest part types
    if (matches.length === 0) {
      return parseValue(value, restPartTypes, positionOffset);
    }

    // In case when we have some text before matched part parsing the text with rest part types
    if (matches[0].index != 0) {
      const text = value.substr(0, matches[0].index);

      const plainTextAndParts = parseValue(text, restPartTypes, positionOffset);
      parts = parts.concat(plainTextAndParts.parts);
      plainText += plainTextAndParts.plainText;
    }

    // Iterating over all found pattern matches
    for (let i = 0; i < matches.length; i++) {
      const result = matches[i];

      // Matched pattern is a mention and the mention doesn't match current mention type
      // We should parse the mention with rest part types
      if (isMentionPartType(partType) && result.groups.trigger !== partType.trigger) {
        const plainTextAndParts = parseValue(result['0'], restPartTypes, positionOffset + plainText.length);
        parts = parts.concat(plainTextAndParts.parts);
        plainText += plainTextAndParts.plainText;
      } else {
        const part = generateRegexResultPart(partType, result, positionOffset + plainText.length);

        parts.push(part);

        plainText += part.text;
      }

      // Check if the result is not at the end of whole value so we have a text after matched part
      // We should parse the text with rest part types
      if ((result.index + result[0].length) !== value.length) {
        // Check if it is the last result
        const isLastResult = i === matches.length - 1;

        // So we should to add the last substring of value after matched mention
        const text = value.slice(
          result.index + result[0].length,
          isLastResult ? undefined : matches[i + 1].index,
        );

        const plainTextAndParts = parseValue(text, restPartTypes, positionOffset + plainText.length);
        parts = parts.concat(plainTextAndParts.parts);
        plainText += plainTextAndParts.plainText;
      }
    }
  }

  // Exiting from generatePartsFromValue
  return {
    plainText,
    parts,
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
) => value.replace(mentionRegEx, (mention, original, trigger, name, id) => replacer({
  original,
  trigger,
  name,
  id,
}));

export {
  mentionRegEx,
  defaultMentionTextStyle,
  isMentionPartType,
  generateValueFromPartsAndChangedText,
  generateValueWithAddedSuggestion,
  generatePlainTextPart,
  generateMentionPart,
  generateRegexResultPart,
  getMentionValue,
  parseValue,
  getValueFromParts,
  replaceMentionValues,
};
