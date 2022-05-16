import * as React from 'react';
import { useState } from 'react';
import { SafeAreaView, TextInput } from 'react-native';
import { TriggersConfig, useMentions } from '../src';
import { Suggestions } from './suggestions-component';
import { hashtags, users } from './data';

// Different trigger examples
const triggersConfig: TriggersConfig<
  'mention' | 'doubleMention' | 'customPatternMention' | 'hashtag'
> = {
  // Basic and simple mention trigger
  mention: {
    trigger: '@',
  },

  // Hashtag with custom styles
  hashtag: {
    trigger: '#',
    textStyle: {
      fontWeight: 'bold',
      color: 'grey',
    },
  },

  // You can also use multiple characters trigger
  doubleMention: {
    trigger: '@@',
  },

  // You can define your custom pattern for mention value (for example `david:123`)
  customPatternMention: {
    trigger: '##',

    // Your custom pattern (in this example – `name:id`)
    pattern: /(\w+:\w+)/gi,

    // How to parse regex match and get required for data for internal logic
    getTriggerData: (match) => {
      const [name, id] = match.split(':');

      return ({
        original: match,
        trigger: '##',
        name,
        id,
      });
    },

    // How to generate internal mention value from selected suggestion
    getTriggerValue: (suggestion) => `${suggestion.name}:${suggestion.id}`,

    // How the highlighted mention will appear in TextInput for user
    getPlainString: (triggerData) => triggerData.name,
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
