import * as React from 'react';
import { useState } from 'react';
import { SafeAreaView, TextInput } from 'react-native';
import { useMentions } from '../src';
import { Suggestions } from './suggestions-component';
import { hashtags, users } from './data';

// Config of suggestible triggers
const triggersConfig = {
  mention: {
    trigger: '@',
  },
  hashtag: {
    trigger: '#',
    textStyle: {
      fontWeight: 'bold',
      color: 'grey',
    },
  },
};

// Config of highlightable patterns (like links, bold, italic text etc.)
const patternsConfig = {
  url: {
    pattern:
      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
    textStyle: { color: 'blue' },
  },
};

const MentionsFunctionalComponent = () => {
  const [textValue, setTextValue] = useState('Hello @[Mary](2)! How are you?');

  const { textInputProps, triggers } = useMentions({
    value: textValue,
    onChange: setTextValue,

    triggersConfig,
    patternsConfig,
  });

  return (
    <SafeAreaView>
      <Suggestions suggestions={users} {...triggers.mention} />
      <Suggestions suggestions={hashtags} {...triggers.hashtag} />

      <TextInput placeholder="Type here..." style={{ padding: 12 }} {...textInputProps} />
    </SafeAreaView>
  );
};

export { MentionsFunctionalComponent };
