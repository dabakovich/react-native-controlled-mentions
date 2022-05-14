import * as React from 'react';
import { FC, useState } from 'react';
import { Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import { MentionInput, Suggestion, SuggestionsProvidedProps, Triggers, useMentions } from '../src';

const users = [
  {
    id: '1',
    name: 'David Tabaka',
  },
  {
    id: '2',
    name: 'Mary',
  },
  {
    id: '3',
    name: 'Tony',
  },
  {
    id: '4',
    name: 'Mike',
  },
  {
    id: '5',
    name: 'Grey',
  },
];

const hashtags = [
  {
    id: 'todo',
    name: 'todo',
  },
  {
    id: 'help',
    name: 'help',
  },
  {
    id: 'loveyou',
    name: 'loveyou',
  },
];

// Custom component for rendering suggestions
const Suggestions: FC<SuggestionsProvidedProps & { suggestions: Suggestion[] }> = ({
  keyword,
  onSelect,
  suggestions,
}) => {
  if (keyword == null) {
    return null;
  }

  return (
    <View>
      {suggestions
        .filter((one) => one.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()))
        .map((one) => (
          <Pressable key={one.id} onPress={() => onSelect(one)} style={{ padding: 12 }}>
            <Text>{one.name}</Text>
          </Pressable>
        ))}
    </View>
  );
};

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
    pattern: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
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

type MentionsClassComponentState = {
  textValue: string;
  triggers?: Triggers<'mention' | 'hashtag'>;
};

// If for some reason you don't like functional components and hooks – you can use class components with `MentionInput` component
class MentionsClassComponent extends React.Component<any, MentionsClassComponentState> {
  constructor(props: any) {
    super(props);

    this.state = {
      textValue: '',
      triggers: undefined,
    };
  }

  render() {
    const { textValue, triggers } = this.state;

    return (
      <SafeAreaView>
        {triggers ? (
          <>
            <Suggestions suggestions={users} {...triggers.mention} />
            <Suggestions suggestions={hashtags} {...triggers.hashtag} />
          </>
        ) : null}

        <MentionInput
          value={textValue}
          onChange={(newTextValue) => this.setState({ textValue: newTextValue })}
          onTriggersChange={(newTriggers) => this.setState({ triggers: newTriggers })}
        />
      </SafeAreaView>
    );
  }
}

export { MentionsFunctionalComponent, MentionsClassComponent };
