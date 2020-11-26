React Native Controlled Mentions
-

### Getting started
Install the library using either Yarn:

``yarn add react-native-controlled-mentions``

or npm:

``npm install --save react-native-controlled-mentions``

### Example

```
import React, { FC, useState } from 'react';
import { Mentions, Suggestion } from 'react-native-controlled-mentions';
import { Pressable, Text, View } from 'react-native';

const suggestions = [
  {id: '1', name: 'David Tabaka'},
  {id: '2', name: 'Mary'},
  {id: '3', name: 'Tony'},
  {id: '4', name: 'Mike'},
  {id: '5', name: 'Grey'},
];

type MentionSuggestionsProps = {
  keyword?: string;
  suggestions: Suggestion[];
  onSuggestionPress: (suggestion: Suggestion) => void;
};

const MentionSuggestions: FC<MentionSuggestionsProps> = (
  {
    keyword,
    suggestions,
    onSuggestionPress,
  },
) => keyword != null ? (
  <View>
    {suggestions
      .filter(item => item.name.toLowerCase().includes(keyword.toLowerCase()))
      .map(suggestion => (
        <Pressable
          key={suggestion.id}
          style={{padding: 8}}
          onPress={() => onSuggestionPress(suggestion)}
        >
          <Text>{suggestion.name}</Text>
        </Pressable>
      ))
    }
  </View>
) : null;

const App = () => {
  const [value, setValue] = useState('Hello @[David Tabaka](5)! How are you?');

  return (
    <Mentions
      value={value}
      onChange={setValue}

      renderSuggestions={({keyword, onSuggestionPress}) => (
        <MentionSuggestions
          keyword={keyword}
          suggestions={suggestions}
          onSuggestionPress={onSuggestionPress}
        />
      )}
    />
  );
};

export { App };
```

### Configuration
The `Mentions` component supports next props:

| Prop name         | Type                                              | Required | Default value | Description |
|-------------------|---------------------------------------------------|----------|---------------|-------------|
| value             | string                                            | true     |               |             |
| onChange          | function (value)                                  | true     |               |             |
| renderSuggestions | function ({keyword, onSuggestionPress}) ReactNode | false    |               |             |
| trigger           | string                                            | false    | '@'           |             |
| inputRef          | TextInput                                         | false    |               |             |
| containerStyle    | StyleProp<ViewStyle>                              | false    |               |             |

### Known issues
* Mention names not works with local characters (that are not in range a-z and A-Z)
* Mention name regex accepts white spaces
* Keyboard auto-correction not working if suggested word has the same length
* Text becomes transparent when setting custom font size in TextInput
