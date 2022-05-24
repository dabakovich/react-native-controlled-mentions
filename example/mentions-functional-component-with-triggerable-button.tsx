import * as React from 'react';
import { useRef, useState } from 'react';
import { Button, Platform, SafeAreaView, TextInput } from 'react-native';
import { useMentions, generateValueFromMentionStateAndChangedText } from '../src';
import { Suggestions } from './suggestions-component';
import { users } from './data';

// Config of suggestible triggers
const triggersConfig = {
  mention: {
    trigger: '@',
  },
};

const MentionsFunctionalComponent = () => {
  const textInput = useRef<TextInput>(null);

  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const [textValue, setTextValue] = useState('Hello @[Mary](2)! How are you?');

  const { textInputProps, triggers, mentionState } = useMentions({
    value: textValue,
    onChange: setTextValue,

    triggersConfig,

    onSelectionChange: setSelection,
  });

  const onPutMention = () => {
    // Adding '@' in the plain text just like we did it by typing using keyboard
    const newText = `${mentionState.plainText.substring(
      0,
      selection.start,
    )}@${mentionState.plainText.substring(selection.end)}`;
    setTextValue(generateValueFromMentionStateAndChangedText(mentionState, newText));

    if (Platform.OS !== 'android') {
      // Put cursor just after '@'
      const newCursor = selection.end;
      textInput.current!.setNativeProps({
        selection: { start: newCursor, end: newCursor },
      });
    }
  };

  return (
    <SafeAreaView>
      <Button title="PUT MENTION" onPress={onPutMention} />

      <Suggestions suggestions={users} {...triggers.mentions} />

      <TextInput
        ref={textInput}
        placeholder="Type here..."
        style={{ padding: 12 }}
        {...textInputProps}
      />
    </SafeAreaView>
  );
};

export { MentionsFunctionalComponent };
