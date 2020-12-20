import React, { FC, useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  View,
} from 'react-native';

import { MentionsProps, Position, Suggestion } from '../types';
import {
  defaultMentionTextStyle,
  getChangedPositions,
  getMentionPart,
  getMentionValue,
  getPart,
  getParts,
  getValue,
} from '../utils';

const Mentions: FC<MentionsProps> = (
  {
    value,
    onChange,

    renderSuggestions,

    trigger = '@',

    isInsertSpaceAfterMention = false,

    inputRef: propInputRef,

    mentionTextStyle = defaultMentionTextStyle,

    containerStyle,

    onSelectionChange,

    ...textInputProps
  },
) => {
  const textInput = useRef<TextInput | null>(null);

  const [selection, setSelection] = useState({start: 0, end: 0});

  const {plainText, parts} = useMemo(() => getParts(trigger, value), [value]);

  const handleSelectionChange = (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    setSelection(event.nativeEvent.selection);

    onSelectionChange && onSelectionChange(event);
  };

  /**
   * Callback that trigger on TextInput text change
   * We should:
   *
   * - Find all change positions
   *
   * - Remove all parts that was fully deleted
   * - Update parts that was partly deleted
   *
   * - Update parts that has added stuff
   *
   * - Remove mention data if some affected part is mention
   * @param text
   */
  const onChangeInput = (text: string) => {
    const changePositions = getChangedPositions(plainText, text);

    let newParts = parts;

    // Process deleting changes
    if (changePositions.deleted.length) {
      changePositions.deleted.forEach(({start, end}) => {
        newParts = newParts

          // Filter fully removed parts
          .filter(one => one.position.start < start || one.position.end > end)

          // Update partly affected parts
          .map((one) => {
            if (
              start >= one.position.start && start < one.position.end
              || end > one.position.start && end <= one.position.end
            ) {
              const positionOffset = one.position.start;

              const removedTextPartPosition: Position = {
                start: Math.max(start, one.position.start) - positionOffset,
                end: Math.min(end, one.position.end) - positionOffset,
              };

              one.text = [
                one.text.substring(0, removedTextPartPosition.start),
                one.text.substring(removedTextPartPosition.end),
              ].join('');

              // In case when user edited mention we remove mention
              if (one.data) {
                delete one.data;
              }
            }

            return one;
          });
      });
    }

    // Process adding changes
    if (changePositions.added.length) {
      changePositions.added.forEach(({start, value}) => {
        // Finding part where text was added
        const partWithAdditionIndex = newParts.findIndex(one => start >= one.position.start && start <= one.position.end);
        const partWithAddition = newParts[partWithAdditionIndex];

        if (!partWithAddition) return;

        const addedTextPartPositionBeforeChange = start - partWithAddition.position.start;

        // In case when user edited mention we remove mention
        if (partWithAddition.data != null) {
          // In case when we added text at the end of mention
          if (partWithAddition.position.end === start) {
            newParts = [
              ...newParts.slice(0, partWithAdditionIndex),
              partWithAddition,
              getPart(value, start),
              ...newParts.slice(partWithAdditionIndex + 1),
            ];

            return;
          }

          delete partWithAddition.data;
        }

        partWithAddition.text = [
          partWithAddition.text.substring(0, addedTextPartPositionBeforeChange),
          value,
          partWithAddition.text.substring(addedTextPartPositionBeforeChange),
        ].join('');
      });
    }

    onChange(getValue(newParts));
  };

  /**
   * We memoize the keyword to know should we show mention suggestions or not.
   * If keyword is undefined then we don't tracking mention typing and shouldn't show suggestions.
   * If keyword is not undefined (even empty string '') then we are tracking mention typing.
   *
   * Examples where @name is just plain text yet, not mention:
   * '|abc @name dfg' - keyword is undefined
   * 'abc @| dfg' - keyword is ''
   * 'abc @name| dfg' - keyword is 'name'
   * 'abc @na|me dfg' - keyword is 'na'
   * 'abc @|name dfg' - keyword is against ''
   * 'abc @name |dfg' - keyword is against undefined'
   */
  const keyword = useMemo((): string | undefined => {
    if (selection.end != selection.start) {
      return undefined;
    }

    if (parts.some(one => one.data != null && selection.end >= one.position.start && selection.end <= one.position.end)) {
      return undefined;
    }

    const triggerIndex = plainText.lastIndexOf(trigger, selection.end);
    const spaceIndex = plainText.lastIndexOf(' ', selection.end - 1);

    switch (true) {
      case triggerIndex == -1:
        return undefined;

      case triggerIndex === selection.end:
        return undefined;

      case triggerIndex < spaceIndex:
        return undefined;

      case spaceIndex == -1 || spaceIndex + trigger.length === triggerIndex: {

        return plainText.substring(
          triggerIndex + trigger.length,
          selection.end,
        );
      }
    }
  }, [parts, plainText, selection, trigger]);

  /**
   * Callback on mention suggestion press. We should:
   * - Find part with plain text where we were tracking mention typing using selection state
   * - Split the part to next parts:
   * -* Before new mention
   * -* With new mention
   * -* After mention with space at the beginning
   * - Generate new parts array
   * - Trigger onChange callback with new value generated from the new parts array (using toValue)
   *
   * @param suggestion
   */
  const onMentionSuggestionPress = (suggestion: Suggestion) => {
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
      // Cursor it at the very of parts or text row
      && (plainText.length === selection.end || parts[currentPartIndex]?.text.startsWith('\n', newMentionPartPosition.end));

    const newParts = [
      ...parts.slice(0, currentPartIndex),

      // Create part with string before mention
      getPart(currentPart.text.substring(0, newMentionPartPosition.start)),
      getMentionPart(trigger, {
        ...suggestion,
        original: getMentionValue(suggestion),
      }),
      // Create part with rest of string after mention and add a space if needed
      getPart(`${isInsertSpaceToNextPart ? ' ' : ''}${currentPart.text.substring(newMentionPartPosition.end)}`),

      ...parts.slice(currentPartIndex + 1),
    ];

    onChange(getValue(newParts));

    /**
     * Move cursor to the end of just added mention starting from trigger string and including:
     * - Length of trigger string
     * - Length of mention name
     * - Length of space after mention (1)
     *
     * Not working now due to the RN bug
     */
    // const newCursorPosition = currentPart.position.start + triggerPartIndex + trigger.length +
    // suggestion.name.length + 1;

    // textInput.current?.setNativeProps({selection: {start: newCursorPosition, end: newCursorPosition}});
  };

  const handleTextInputRef = (ref: TextInput) => {
    textInput.current = ref as TextInput;
    if (propInputRef) propInputRef.current = ref as TextInput;
  };

  return (
    <View style={containerStyle}>
      {renderSuggestions && renderSuggestions({
        keyword,
        onSuggestionPress: onMentionSuggestionPress,
      })}

      <TextInput
        {...textInputProps}

        ref={handleTextInputRef}

        multiline

        onChangeText={onChangeInput}
        onSelectionChange={handleSelectionChange}
      >
        <Text>
          {parts.map(({text, data}, index) => data ? (
            <Text key={`${index}-m`} style={mentionTextStyle}>{text}</Text>
          ) : (
            <Text key={index}>{text}</Text>
          ))}
        </Text>
      </TextInput>
    </View>
  );
};

export { Mentions };
