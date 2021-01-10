import * as React from 'react';
import { FC, useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { MentionInput, MentionSuggestionsProps, Suggestion } from '../src';

const users = [
  {id: '1', name: 'David Tabaka'},
  {id: '2', name: 'Mary'},
  {id: '3', name: 'Tony'},
  {id: '4', name: 'Mike'},
  {id: '5', name: 'Grey'},
];

const hashtags = [
  {id: 'todo', name: 'todo'},
  {id: 'help', name: 'help'},
  {id: 'loveyou', name: 'loveyou'},
];

const renderSuggestions: (suggestions: Suggestion[]) => FC<MentionSuggestionsProps> = (suggestions) => (
  {keyword, onSuggestionPress},
) => {
  if (keyword == null) {
    return null;
  }

  return (
    <View>
      {suggestions
        .filter(one => one.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()))
        .map(one => (
          <Pressable
            key={one.id}
            onPress={() => onSuggestionPress(one)}

            style={{padding: 12}}
          >
            <Text>{one.name}</Text>
          </Pressable>
        ))
      }
    </View>
  );
};

const renderMentionSuggestions = renderSuggestions(users);

const renderHashtagSuggestions = renderSuggestions(hashtags);

const App = () => {
  const [value, setValue] = useState('Hello @[Mary](2)! How are you?');

  return (
    <SafeAreaView>
      <MentionInput
        value={value}
        onChange={setValue}

        partTypes={[
          {
            trigger: '@',
            renderSuggestions: renderMentionSuggestions,
          },
          {
            trigger: '#',
            renderSuggestions: renderHashtagSuggestions,
            textStyle: {fontWeight: 'bold', color: 'grey'},
          },
          {
            pattern: /(https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.(xn--)?[a-z0-9-]{2,20}\b([-a-zA-Z0-9@:%_\+\[\],.~#?&\/=]*[-a-zA-Z0-9@:%_\+\]~#?&\/=])*/gi,
            textStyle: {color: 'blue'},
          },
        ]}

        placeholder="Type here..."
        style={{padding: 12}}
      />
    </SafeAreaView>
  );
};

export default App;
