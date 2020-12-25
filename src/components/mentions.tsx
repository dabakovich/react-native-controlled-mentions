import React, { FC, MutableRefObject, useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  View,
} from 'react-native';

import { MentionsProps, Suggestion } from '../types';
import {
  defaultMentionTextStyle,
  generateValueFromPartsAndChangedText,
  generateValueWithAddedSuggestion,
  getPartsFromValue,
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

  const {plainText, parts} = useMemo(() => getPartsFromValue(trigger, value), [value]);

  const handleSelectionChange = (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    setSelection(event.nativeEvent.selection);

    onSelectionChange && onSelectionChange(event);
  };

  /**
   * Callback that trigger on TextInput text change
   *
   * @param changedText
   */
  const onChangeInput = (changedText: string) => {
    onChange(generateValueFromPartsAndChangedText(parts, plainText, changedText));
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
    const newLineIndex = plainText.lastIndexOf('\n', selection.end - 1);

    switch (true) {
      case triggerIndex == -1:
        return undefined;

      case triggerIndex === selection.end:
        return undefined;

      case triggerIndex < spaceIndex:
        return undefined;

      // When we have a mention at the very beginning of text
      case spaceIndex == -1 && newLineIndex == -1:

      // When we have a mention on the new line
      case newLineIndex + trigger.length === triggerIndex:

      // When we have a mention just after space
      case spaceIndex + trigger.length === triggerIndex:
        return plainText.substring(
          triggerIndex + trigger.length,
          selection.end,
        );
    }
  }, [parts, plainText, selection, trigger]);

  /**
   * Callback on mention suggestion press. We should:
   * - Get updated value
   * - Trigger onChange callback with new value
   *
   * @param suggestion
   */
  const onMentionSuggestionPress = (suggestion: Suggestion) => {
    const newValue = generateValueWithAddedSuggestion(
      parts,
      trigger,
      plainText,
      selection,
      suggestion,
      isInsertSpaceAfterMention,
    );

    if (!newValue) {
      return;
    }

    onChange(newValue);

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

    if (propInputRef) {
      if (typeof propInputRef === 'function') {
        propInputRef(ref);
      } else {
        (propInputRef as MutableRefObject<TextInput>).current = ref as TextInput;
      }
    }
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
