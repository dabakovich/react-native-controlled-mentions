import { Position, UseMentionsConfig } from '@mention-types';
import {
  defaultMentionTextStyle,
  emptyObject,
  generateValueFromPartsAndChangedText,
  getConfigsArray,
  getTriggerPartSuggestionKeywords,
  parseValue,
} from '@mention-utils';
import React, { useMemo, useState } from 'react';
import { NativeSyntheticEvent, Text, TextInputSelectionChangeEventData } from 'react-native';

/**
 * Hook that stores mention context.
 *
 * @param value
 * @param onChange
 * @param triggersConfig
 * @param patterns
 */
const useMentions = <TriggerName extends string>({
  value,
  onChange,

  triggersConfig = emptyObject,
  patternsConfig = emptyObject,
}: UseMentionsConfig<TriggerName>) => {
  const [selection, setSelection] = useState<Position>({
    start: 0,
    end: 0,
  });

  /**
   * State that includes current parts and plain text
   */
  const mentionState = useMemo(
    () => parseValue(value, getConfigsArray(triggersConfig, patternsConfig)),
    [value, triggersConfig, patternsConfig],
  );

  /**
   * Callback that handles TextInput text change
   *
   * @param text
   */
  const handleTextChange = (text: string) => {
    onChange(generateValueFromPartsAndChangedText(mentionState, text));
  };

  /**
   * Callback that handles TextInput selection change
   *
   * @param event
   */
  const handleSelectionChange = (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    setSelection(event.nativeEvent.selection);
  };

  /**
   * Object with triggers and their current keyword state depending on current text and selection
   */
  const triggers = useMemo(
    () =>
      getTriggerPartSuggestionKeywords<TriggerName>(
        mentionState,
        selection,
        triggersConfig,
        onChange,
      ),
    [mentionState, selection, triggersConfig, onChange],
  );

  /**
   * `TextInput` props that we can provide to the `TextInput` component.
   */
  const textInputProps = {
    onChangeText: handleTextChange,
    onSelectionChange: handleSelectionChange,
    children: React.createElement(
      Text,
      null,
      mentionState.parts.map(({ text, partType, data }, index) =>
        partType
          ? React.createElement(
              Text,
              {
                key: `${index}-${data?.trigger ?? 'pattern'}`,
                style: partType.textStyle ?? defaultMentionTextStyle,
              },
              text,
            )
          : React.createElement(Text, { key: index }, text),
      ),
    ),
  };

  return {
    triggers,
    textInputProps,
  };
};

export { useMentions };
