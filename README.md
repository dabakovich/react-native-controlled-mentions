react-native-controlled-mentions [![npm version][npm-image]][npm-url]
-
Pretty simple and fully controlled mentions input. It can:

* Gracefully render formatted mentions directly in RN `TextInput` component
* Use `value`/`onChange` as in usual `TextInput` props
* Completely typed (written on TypeScript)
* No need native libraries

Demo
-
Try it on Expo Snack: https://snack.expo.io/@dabakovich/mentionsapp

![](demo.gif)

Getting started
-

Install the library using either Yarn:

``yarn add react-native-controlled-mentions``

or npm:

``npm install --save react-native-controlled-mentions``

Example
-

```tsx
import * as React from 'react';
import { FC, useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { Mentions, MentionSuggestionsProps, Suggestion } from 'react-native-controlled-mentions';

const suggestions = [
  {id: '1', name: 'David Tabaka'},
  {id: '2', name: 'Mary'},
  {id: '3', name: 'Tony'},
  {id: '4', name: 'Mike'},
  {id: '5', name: 'Grey'},
];

const MentionSuggestions: FC<MentionSuggestionsProps> = ({keyword, onSuggestionPress}) => {
  if (keyword == null) {
    return null;
  }

  return (
    <View>
      {users
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
}

const App = () => {
  const [value, setValue] = useState('Hello @[Mary](2)! How are you?');

  return (
    <SafeAreaView>
      <Mentions
        value={value}
        onChange={setValue}

        renderSuggestions={MentionSuggestions}

        placeholder="Type here..."
        style={{padding: 12}}
      />
    </SafeAreaView>
  );
};

export default App;
```

Configuration
-

The `Mentions` component supports next props:

| Property name             | Type                                              | Required | Default value | Description                                                                        |
|---------------------------|---------------------------------------------------|----------|---------------|------------------------------------------------------------------------------------|
| value                     | string                                            | true     |               |                                                                                    |
| onChange                  | function (value)                                  | true     |               |                                                                                    |
| renderSuggestions         | function ({keyword, onSuggestionPress}) ReactNode | false    |               |                                                                                    |
| trigger                   | string                                            | false    | '@'           | Character that will trigger mentions                                               |
| isInsertSpaceAfterMention | boolean                                           | false    | false         | Should we add a space after selected mentions if the mention is at the end of row  |
| inputRef                  | TextInput                                         | false    |               |                                                                                    |
| containerStyle            | StyleProp\<ViewStyle>                             | false    |               |                                                                                    |
| ...textInputProps         | TextInputProps                                    | false    |               | Other text input props                                                             |

Parsing `Mention`'s value
-

You can import RegEx that is using in the component and then extract all your mentions
from `Mention`'s value using your own logic.

```ts
import { mentionRegEx } from 'react-native-controlled-mentions';
```

Or you can use `replaceMentionValues` helper to replace all mentions from `Mention`'s input using
your replacer function that receives `MentionData` type and returns string.

```ts
import { replaceMentionValues } from 'react-native-controlled-mentions';

const value = 'Hello @[David Tabaka](5)! How are you?';

console.log(replaceMentionValues(value, ({id}) => `@${id}`)); // Hello @5! How are you?
console.log(replaceMentionValues(value, ({name}) => `@${name}`)); // Hello @David Tabaka! How are you?
```

To Do
-

* Add more customizations
* Add ability to handle few mention types ("#", "@" etc)

Known issues
-

* Mention name regex accepts white spaces (eg `{name: ' ', value: 1}`)
* ~~Keyboard auto-correction not working if suggested word has the same length~~ FIXED
* ~~Text becomes transparent when setting custom font size in TextInput~~ FIXED

[npm-image]: https://img.shields.io/npm/v/react-native-controlled-mentions

[npm-url]: https://npmjs.org/package/react-native-controlled-mentions
