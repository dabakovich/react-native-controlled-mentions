import { Position, UseMentionsConfig } from '@mention-types';
import {
  defaultTriggerTextStyle,
  emptyObject,
  generateValueFromMentionStateAndChangedText,
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

  onSelectionChange,
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
    onChange(generateValueFromMentionStateAndChangedText(mentionState, text));
  };

  /**
   * Callback that handles TextInput selection change
   *
   * @param event
   */
  const handleSelectionChange = (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    const newSelection = event.nativeEvent.selection;

    setSelection(newSelection);
    onSelectionChange && onSelectionChange(newSelection);
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
      mentionState.parts.map(({ text, config, data }, index) =>
        config
          ? React.createElement(
              Text,
              {
                key: `${index}-${data?.trigger ?? 'pattern'}`,
                style: config.textStyle ?? defaultTriggerTextStyle,
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

    mentionState,
  };
};

export { useMentions };
