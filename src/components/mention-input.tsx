import React, { FC, MutableRefObject, useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  View,
} from 'react-native';

import { MentionInputProps, MentionPartType, Suggestion } from '../types';
import {
  defaultMentionTextStyle,
  generateValueFromPartsAndChangedText,
  generateValueWithAddedSuggestion,
  isMentionPartType,
  parseValue,
} from '../utils';

const MentionInput: FC<MentionInputProps> = (
  {
    value,
    onChange,

    partTypes = [],

    inputRef: propInputRef,

    containerStyle,

    onSelectionChange,

    ...textInputProps
  },
) => {
  const textInput = useRef<TextInput | null>(null);

  const [selection, setSelection] = useState({start: 0, end: 0});

  const {
    plainText,
    parts,
  } = useMemo(() => parseValue(value, partTypes), [value, partTypes]);

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
  const keywordByTrigger = useMemo((): { [trigger: string]: string | undefined } => {
    const newKeywordByTrigger: { [trigger: string]: string | undefined } = {};

    partTypes.filter(isMentionPartType).forEach((mentionPartType) => {
      if (selection.end != selection.start) {
        return undefined;
      }

      if (parts.some(one => one.data != null && selection.end >= one.position.start && selection.end <= one.position.end)) {
        return undefined;
      }

      const triggerIndex = plainText.lastIndexOf(mentionPartType.trigger, selection.end);
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
        case newLineIndex + 1 === triggerIndex:

        // When we have a mention just after space
        case spaceIndex + 1 === triggerIndex:
          newKeywordByTrigger[mentionPartType.trigger] = plainText.substring(
            triggerIndex + 1,
            selection.end,
          );
      }
    });

    return newKeywordByTrigger;
  }, [parts, plainText, selection, partTypes]);

  /**
   * Callback on mention suggestion press. We should:
   * - Get updated value
   * - Trigger onChange callback with new value
   */
  const onSuggestionPress = (mentionType: MentionPartType) => (suggestion: Suggestion) => {
    const newValue = generateValueWithAddedSuggestion(
      parts,
      mentionType,
      plainText,
      selection,
      suggestion,
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
      {(partTypes
        .filter(one => isMentionPartType(one) && one.renderSuggestions != null) as MentionPartType[])
        .map((mentionType) => (
          <React.Fragment key={mentionType.trigger}>
            {mentionType.renderSuggestions && mentionType.renderSuggestions({
              keyword: keywordByTrigger[mentionType.trigger],
              onSuggestionPress: onSuggestionPress(mentionType),
            })}
          </React.Fragment>
        ))
      }

      <TextInput
        {...textInputProps}

        ref={handleTextInputRef}

        multiline

        onChangeText={onChangeInput}
        onSelectionChange={handleSelectionChange}
      >
        <Text>
          {parts.map(({text, partType, data}, index) => partType ? (
            <Text
              key={`${index}-${data?.trigger ?? 'pattern'}`}
              style={partType.textStyle ?? defaultMentionTextStyle}
            >
              {text}
            </Text>
          ) : (
            <Text key={index}>{text}</Text>
          ))}
        </Text>
      </TextInput>
    </View>
  );
};

export { MentionInput };
