import * as React from 'react';
import { FC, useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { MentionInput, PartType, Suggestion, SuggestionsProvidedProps } from '../src';
import { Mentions } from '../src/types';

const users = [
  { id: '1', name: 'David Tabaka' },
  { id: '2', name: 'Mary' },
  { id: '3', name: 'Tony' },
  { id: '4', name: 'Mike' },
  { id: '5', name: 'Grey' },
];

const hashtags = [
  { id: 'todo', name: 'todo' },
  { id: 'help', name: 'help' },
  { id: 'loveyou', name: 'loveyou' },
];

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

const partTypes: PartType[] = [
  {
    trigger: '@',
  },
  {
    trigger: '#',
    textStyle: { fontWeight: 'bold', color: 'grey' },
  },
  {
    pattern: new RegExp(
      /(https?:\/\/|www\.)[-a-zA-Z0-9@:%._+~#=]{1,256}\.(xn--)?[a-z0-9-]{2,20}\b([-a-zA-Z0-9@:%_+[\],.~#?&/=]*[-a-zA-Z0-9@:%_+\]~#?&/=])*/,
      'gi',
    ),
    textStyle: { color: 'blue' },
  },
];

const App = () => {
  const [value, setValue] = useState('Hello @[Mary](2)! How are you?');
  const [mentions, setMentions] = useState<Mentions>({});

  return (
    <SafeAreaView>
      <Suggestions suggestions={users} {...mentions?.['@']} />
      <Suggestions suggestions={hashtags} {...mentions?.['#']} />

      <MentionInput
        value={value}
        onChange={setValue}
        onMentionsChange={setMentions}
        partTypes={partTypes}
        placeholder="Type here..."
        style={{ padding: 12 }}
      />
    </SafeAreaView>
  );
};

export default App;
