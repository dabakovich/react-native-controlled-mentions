import React, { FC, useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Platform,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  View,
} from 'react-native';

import { MentionsProps, Position, Suggestion } from '../types';
import { getMentionPart, getMentionValue, getPart, getParts, getValue } from '../utils';

const Mentions: FC<MentionsProps> = (
  {
    value,
    onChange,

    renderSuggestions,

    trigger = '@',

    containerStyle,

    inputRef: propInputRef,

    ...textInputProps
  },
) => {
  const textInput = useRef<TextInput | null>(null);

  const [selection, setSelection] = useState({start: 0, end: 0});

  const {plainText, parts} = useMemo(() => getParts(trigger, value), [value]);

  const onSelectionChange = (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    setSelection(event.nativeEvent.selection);
  };

  /**
   * Callback that trigger on TextInput text change.
   * We detecting is there added text or removed.
   *
   * On added text we should:
   * - Find affected part
   * - Include added text
   * - Remove mention data if the part is mention
   *
   * On removed text we should:
   * - Find all affected parts
   * - Remove all parts that was fully affected
   * - Update parts that was affected partly
   * - Remove mention data if partly affected parts is mentions
   * @param text
   */
  const onChangeInput = (text: string) => {
    // How much symbols was added or removed
    const difference = Math.abs(text.length - plainText.length);

    // In case when nothing changed - just exit
    if (difference === 0) return;

    // Was symbols added or removed
    const isAdded = (text.length - plainText.length) > 0;

    // In case when we add new characters
    if (isAdded) {
      /**
       * On iOS selection changes fires before text change fires.
       * So here we have already new cursor position on iOS.
       * But also we have old position (before change) on Android
       */
      const addedTextPosition = Platform.OS === 'ios' ? selection.end - difference : selection.end;

      // Finding part where text was added
      const currentPartIndex = parts.findIndex(one => addedTextPosition >= one.position.start && addedTextPosition <= one.position.end);
      const currentPart = parts[currentPartIndex];

      if (!currentPart) return;

      const addedTextPartPositionBeforeChange = addedTextPosition - currentPart.position.start;
      const addedText = text.substring(addedTextPosition, addedTextPosition + difference);

      // In case when user edited mention we remove mention
      if (currentPart.data != null) {
        // In case when we added text at the end of mention
        if (currentPart.position.end === addedTextPosition) {
          onChange(getValue([
            ...parts.slice(0, currentPartIndex),
            currentPart,
            getPart(addedText, addedTextPosition),
            ...parts.slice(currentPartIndex + 1),
          ]));

          return;
        }
        currentPart.data = undefined;
      }

      currentPart.text = [
        currentPart.text.substring(0, addedTextPartPositionBeforeChange),
        addedText,
        currentPart.text.substring(addedTextPartPositionBeforeChange),
      ].join('');

      onChange(getValue(parts));

      return;
    }

    // In case when we remove characters
    if (!isAdded) {
      /**
       * On iOS selection changes fires before text change fires.
       * So here we have already new cursor position on iOS.
       * But also we have old position (before change) on Android
       */
      const removedTextPosition: Position = Platform.OS === 'ios' ? {
        start: selection.end,
        end: selection.end + difference,
      } : {
        start: selection.end - difference,
        end: selection.end,
      };

      const newParts = parts

        // Filter fully removed parts
        .filter(one => one.position.start < removedTextPosition.start || one.position.end > removedTextPosition.end)

        // Update partly affected parts
        .map((one) => {
          if (
            removedTextPosition.start >= one.position.start && removedTextPosition.start < one.position.end
            || removedTextPosition.end > one.position.start && removedTextPosition.end <= one.position.end
          ) {
            const positionOffset = one.position.start;

            const removedTextPartPosition: Position = {
              start: Math.max(removedTextPosition.start, one.position.start) - positionOffset,
              end: Math.min(removedTextPosition.end, one.position.end) - positionOffset,
            };

            one.text = [
              one.text.substring(0, removedTextPartPosition.start),
              one.text.substring(removedTextPartPosition.end),
            ].join('');

            // In case when user edited mention we remove mention
            if (one.data) {
              one.data = undefined;
            }
          }

          return one;
        });

      onChange(getValue(newParts));

      return;
    }
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

    const newMentionPart: Position = {
      start: triggerPartIndex,
      end: selection.end - currentPart.position.start,
    };

    const isInsertSpaceToNextPart = !parts[currentPartIndex]?.text.startsWith(' ');

    const newParts = [
      ...parts.slice(0, currentPartIndex),

      // Create part with string before mention
      getPart(currentPart.text.substring(0, newMentionPart.start)),
      getMentionPart(trigger, {
        ...suggestion,
        original: getMentionValue(suggestion),
      }),
      // Create part with rest of string after mention and add a space if needed
      getPart(`${isInsertSpaceToNextPart ? ' ' : ''}${currentPart.text.substring(newMentionPart.end)}`),

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
        onSelectionChange={onSelectionChange}
      >
        <Text>
          {parts.map(({text, data}, index) => (
            <Text key={index} style={data ? {fontWeight: 'bold', color: '#4f69f3'} : {}}>
              {text}
            </Text>
          ))}
        </Text>
      </TextInput>
    </View>
  );
};

export { Mentions };
