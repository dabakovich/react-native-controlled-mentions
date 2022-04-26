import React, { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { NativeSyntheticEvent, Text, TextInput, TextInputSelectionChangeEventData } from "react-native";

import { MentionInputProps, MentionState } from "@mention-types";
import {
  defaultMentionTextStyle,
  generateValueFromPartsAndChangedText,
  getMentionPartSuggestionKeywords,
  parseValue
} from "@mention-utils";

// ToDo — move to the components/mention-input folder
const MentionInput = React.forwardRef<TextInput, MentionInputProps>(
  (
    {
      value,
      onChange,

      onMentionsChange,

      partTypes = [],

      onSelectionChange,

      ...textInputProps
    },
    externalRef,
  ) => {
    const textInput = useRef<TextInput | null>(null);

    const prevMentionState = useRef<MentionState>({ parts: [], plainText: '' });

    const mentionState = useMemo(() => {
      const newMentionState = parseValue(value, partTypes);

      // Store previous mentionValue to generate complex mentionStateAndSelection later
      prevMentionState.current = newMentionState;

      return newMentionState;
    }, [value, partTypes]);

    /**
     * We are using this complex mentionState and selection state
     * to avoid unnecessary re-renders on suggestions component.
     *
     * Fixes https://github.com/dabakovich/react-native-controlled-mentions/issues/55
     */
    const [mentionStateAndSelection, setMentionStateAndSelection] = useState({
      mentionState,
      selection: { start: 0, end: 0 },
    });

    useEffect(() => {
      const { mentionState, selection } = mentionStateAndSelection;

      onMentionsChange(
        getMentionPartSuggestionKeywords(mentionState, selection, partTypes, onChange),
      );
    }, [mentionStateAndSelection, partTypes, onChange, onMentionsChange]);

    const handleTextInputRef = (ref: TextInput) => {
      textInput.current = ref as TextInput;

      if (externalRef) {
        if (typeof externalRef === 'function') {
          externalRef(ref);
        } else {
          (externalRef as MutableRefObject<TextInput>).current = ref as TextInput;
        }
      }
    };

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
      setMentionStateAndSelection({
        mentionState: prevMentionState.current,
        selection: event.nativeEvent.selection,
      });

      onSelectionChange && onSelectionChange(event);
    };

    return (
      <TextInput
        {...textInputProps}
        ref={handleTextInputRef}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
      >
        <Text>
          {mentionState.parts.map(({ text, partType, data }, index) =>
            partType ? (
              <Text
                key={`${index}-${data?.trigger ?? 'pattern'}`}
                style={partType.textStyle ?? defaultMentionTextStyle}
              >
                {text}
              </Text>
            ) : (
              <Text key={index}>{text}</Text>
            ),
          )}
        </Text>
      </TextInput>
    );
  },
);

export { MentionInput };
