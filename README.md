## react-native-controlled-mentions [![npm version][npm-image]][npm-url]

Add to your `TextInput` ability to highlight mentions, hashtags or other custom patterns. It can:

* Gracefully render formatted text directly in React Native `TextInput` component
* Support for different mention types (**[@user mentions](#demo)**, **#hashtags**, etc)
* Completely typed (written on TypeScript)
* No need for native libraries

In addition, you can add custom styling for a regex pattern (like URLs).

## Contents

- [Demo](#demo)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [API](#api)
- [Parsing Mention's Value](#parsing-mentions-value)
- [Rendering Mention's Value](#rendering-mentions-value)
- [To Do](#to-do)
- [Known Issues](#known-issues)
- [Support Me](#support-me)

## Demo
Try it on Expo Snack: https://snack.expo.io/@dabakovich/mentionsapp

![](demo.gif)

## Installation

```
// with npm
npm install --save react-native-controlled-mentions

// with yarn
yarn add react-native-controlled-mentions
```

## Getting Started

For instance, you have next controlled `TextInput`:

```tsx
import { TextInput } from 'react-native';

const Mentions = () => {
  const [textValue, setTextValue] = useState('');

  return (
    <TextInput
      value={textValue}
      onChangeText={setTextValue}
    />
  );
};
```

Now you need few simple steps:
- Add hook [`useMentions`](#hook-usementions) from the `react-native-controlled-mentions`
- Move `textValue` and `setTextValue` from `TextInput` to the just added hook as you see below 
- Use returned [`textInputProps`](#textinputprops) as new props for the `TextInput` component now

<details>
<summary>See code</summary>

```tsx
import { TextInput } from 'react-native';
import { useMentions } from 'react-native-controlled-mentions'

const Mentions = () => {
  const [textValue, setTextValue] = useState('');
  
  const { textInputProps } = useMentions({
    value: textValue,
    onChange: setTextValue,
  });

  return (
    <TextInput {...textInputProps} />
  );
};
```
</details>

Add the [`triggersConfig`](#triggersconfig-triggersconfigtriggername) property where you can define what trigger types you want to support.

> Important. Create the constant once out of functional component body, or memoize it using `useMemo` to avoid unnecessary
> re-renders.

<details>
<summary>See code</summary>

```typescript jsx
import { TextInput } from 'react-native';
import { useMentions, TriggersConfig } from 'react-native-controlled-mentions'

// Create config as static object out of function component
// Or memoize it inside FC using `useMemo`
const triggersConfig: TriggersConfig<'mention'> = {
  mention: {
    // Symbol that will trigger keyword change
    trigger: '@',

    // Style which mention will be highlighted in the `TextInput`
    textStyle: { fontWeight: 'bold', color: 'blue' },
  },
};

const Mentions = () => {
  const [textValue, setTextValue] = useState('');

  const { textInputProps } = useMentions({
    value: textValue,
    onChange: setTextValue,

    // Add the config here
    triggersConfig,
  });

  return (
    <TextInput {...textInputProps} />
  );
};
```
</details>

Define your `Suggestions` functional component that
receives [SuggestionsProvidedProps](#type-suggestionsprovidedprops):

<details>
<summary>See code</summary>

```tsx
import { Pressable, View } from 'react-native';

const suggestions = [
  {
    id: '1',
    name: 'David'
  },
  {
    id: '2',
    name: 'Mary'
  },
  // ...
];

const Suggestions: FC<SuggestionsProvidedProps> = ({
  keyword,
  onSelect
}) => {
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
            onPress={() => onSelect(one)}

            style={{padding: 12}}
          >
            <Text>{one.name}</Text>
          </Pressable>
        ))
      }
    </View>
  );
};

export { Suggestions }
```
</details>

[`useMentions`](#hook-usementions) hook returns also [`triggers`](#triggers) value that you can use as provided props for rendering suggestions.

<details>
<summary>See code</summary>

```typescript jsx
import { TextInput } from 'react-native';
import { useMentions, TriggersConfig } from 'react-native-controlled-mentions'
import { Suggestions } from './suggestions';

const triggersConfig: TriggersConfig<'mention'> = {
  mention: {
    // Symbol that will trigger keyword change
    trigger: '@',

    // Style which mention will be highlighted in the `TextInput`
    textStyle: { fontWeight: 'bold', color: 'blue' },
  },
};

const Mentions = () => {
  const [textValue, setTextValue] = useState('');

  const { textInputProps, triggers } = useMentions({
    value: textValue,
    onChange: setTextValue,

    triggersConfig,
  });

  return (
    <>
      <Suggestions {...triggers.mention} />

      <TextInput {...textInputProps} />
    </>
  );
};
```
</details>

You're done!

The whole example is in the `/example` folder. You can find also `class` variant of using mentions, without hooks.

## API

### Hook `useMentions`
Receives as parameter `UseMentionsConfig<TriggerName>` config.
Returns an object with two keys:

#### `textInputProps`
Props that should be provided to the `TextInput` components.
> Be careful and don't override three required props in the `TextInput` – `onChangeText`, `onSelectionChange`, `children`.
> 
> Also, don't provide `value` to the `TextInput` directly. Now it's fully controlling by the `useMentions` hook.

#### `triggers`
Object with same keys that has provided `triggersConfig` object. Values of the `triggers` has [SuggestionsProvidedProps](#type-suggestionsprovidedprops) type and can be used in your custom component for rendering suggestions.

### Type `UseMentionsConfig<TriggerName>`

An object with next keys:
#### `value: string`
Resulting mention value that should be controlled externally.

#### `onChange: (value: string) => void`
Callback that will trigger external `value` update.

#### `triggersConfig: TriggersConfig<TriggerName>`
Config that allows you to define you what trigger types will handle your input (mentions, hashtags, etc.).<br>
It presents an object with `TriggerName` union type keys (for instance `'mention' | 'hashtag'`) and [`TriggerConfig`](#type-triggerconfig) values.

<details>
<summary>Example</summary>

```typescript
const triggersConfig: TriggersConfig<'mention' | 'hashtag'> = {
  mention: {
    trigger: '@',
  },
  hashtag: {
    trigger: '#',
    allowedSpacesCount: 0,
    isInsertSpaceAfterMention: true,
    textStyle: {
      fontWeight: 'bold',
      color: 'grey',
    },
  },
};
```
</details>

#### `patternsConfig: PatternsConfig`
Config that allows to define what another highlights should support your input (like urls, bold, italic text, etc.).<br>
It presents an object with pattern name keys (for instance `url`, `bold`) and [`PatternConfig`](#type-patternconfig) values.

<details>
<summary>Example</summary>

```typescript
const patternsConfig: PatternsConfig = {
  url: {
    pattern: /a/gi, // your custom url regex pattern
    textStyle: { color: 'blue' },
  }
}
```
</details>

### Type `Config`

[TriggerConfig](#type-triggerconfig) | [PatternConfig](#type-patternconfig)

### Type `TriggerConfig`

| **Property name**           | **Description**                                                                                 | **Type**                                                  | **Required**                | **Default** |
|-----------------------------|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------|-----------------------------|-------------|
| `trigger`                   | Character that will trigger current mention type                                                | string                                                    | true                        |             |
| `pattern`                   | Custom trigger pattern                                                                          | number                                                    | false                       |             |
| `getTriggerData`            | Callback for getting [TriggerData](#type-triggerdata), is required when we have custom pattern  | (match: string) => [TriggerData](#type-triggerdata)       | true, when `pattern` exists |             |
| `getTriggerValue`           | Callback for getting trigger value, is required when we have custom pattern                     | (triggerData: [TriggerData](#type-triggerdata)) => string | true, when `pattern` exists |             |
| `allowedSpacesCount`        | How much spaces are allowed for mention keyword                                                 | number                                                    | false                       |             |
| `isInsertSpaceAfterMention` | Should we add a space after selected mentions if the mention is at the end of row               | boolean                                                   | false                       | false       |
| `textStyle`                 | Text style for mentions in `TextInput`                                                          | StyleProp\<TextStyle>                                     | false                       |             |
| `getPlainString`            | Function for generating custom mention text in text input                                       | (mention: [TriggerData](#type-triggerdata)) => string     | false                       |             |

### Type `PatternConfig`

| **Property name** | **Description**                                          | **Type**              | **Required** | **Default** |
|-------------------|----------------------------------------------------------|-----------------------|--------------|-------------|
| `pattern`         | RegExp for parsing a pattern, should include global flag | RegExp                | true         |             |
| `textStyle`       | Text style for pattern in `TextInput`                    | StyleProp\<TextStyle> | false        |             |

### Type `SuggestionsProvidedProps`

#### `keyword: string | undefined`
Keyword that will provide string between trigger character (e.g. '@') and cursor.

If the cursor is not tracking any mention typing the `keyword` will be `undefined`.

Examples where @name is just plain text yet, not mention and `|` is cursor position:

```
'|abc @name dfg' - keyword is undefined
'abc @| dfg' - keyword is ''
'abc @name| dfg' - keyword is 'name'
'abc @na|me dfg' - keyword is 'na'
'abc @|name dfg' - keyword is against ''
'abc @name |dfg' - keyword is against undefined
```

#### `onSelect: (suggestion: Suggestion) => void`

You should call that callback when user selects any suggestion.

### Type `Suggestion`

`id: string`

Unique id for each suggestion.

`name: string`

Name that will be shown in `MentionInput` when user will select the suggestion.

### Type `TriggerData`

For example, we have that mention value `{@}[David Tabaka](123)`. Then after parsing that string by `mentionRegEx` we will
get next properties:

`original: string`

The whole mention value string - `{@}[David Tabaka](123)`

`trigger: string`

The extracted trigger - `@`

`name: string`

The extracted name - `David Tabaka`

`id: string`

The extracted id - `123`

### Default pattern `mentionRegEx`

```jsregexp
/({([^{^}]*)}\[([^[]*)]\(([^(^)]*)\))/i
```

### `MentionInput` component props

If you prefer to use class component without hooks the `MentionInput` is for you.

| **Property name** | **Description**                                                       | **Type**                              | **Required** | **Default** |
|-------------------|-----------------------------------------------------------------------|---------------------------------------|--------------|-------------|
| `value`           | The same as in `TextInput`                                            | string                                | true         |             |
| `onChange`        | The same as in `TextInput`                                            | (value: string) => void               | true         |             |
| `triggersConfig`  | Declare what trigger configs you want to support (mentions, hashtags) | [TriggerConfig](#type-triggerconfig)] | false        | {}          |
| `patternsConfig`  | Declare what pattern configs you want to support (urls, bold, italic) | [PatternConfig](#type-patternconfig)] | false        | {}          |
| ...textInputProps | Other text input props                                                | Partial<TextInputProps>               | false        |             |

## Parsing Mention's Value

You can import RegEx that is using in the component and then extract all your mentions
from `MentionInput`'s value using your own logic.

```ts
import { mentionRegEx } from 'react-native-controlled-mentions';
```

Or you can use `replaceTriggerValues` helper to replace all mentions from `MentionInput`'s input using
your replacer function that receives [TriggerData](#type-triggerdata) type and returns string.

```ts
import { replaceTriggerValues } from 'react-native-controlled-mentions';

const value = 'Hello {@}[David Tabaka](5)! How are you?';

console.log(replaceTriggerValues(value, ({ id }) => `@${id}`)); // Hello @5! How are you?
console.log(replaceTriggerValues(value, ({ name }) => `@${name}`)); // Hello @David Tabaka! How are you?
```

## Rendering Mention's Value

If you want to parse and render your value somewhere else you can use `parseValue` tool which gives you array of parts
and then use your own part renderer to resolve this issue.

Here is an example:

```typescript jsx
import {
  Part,
  Config,
  parseValue,
  isTriggerConfig,
} from 'react-native-controlled-mentions';

/**
 * Part renderer
 *
 * @param part
 * @param index
 */
const renderPart = (
  part: Part,
  index: number,
) => {
  // Just plain text
  if (!part.config) {
    return <Text key={index}>{part.text}</Text>;
  }

  // Mention type part
  if (isTriggerConfig(part.config)) {
    return (
      <Text
        key={`${index}-${part.data?.trigger}`}
        style={part.config.textStyle}
        onPress={() => console.log('Pressed', part.data)}
      >
        {part.text}
      </Text>
    );
  }

  // Other styled part types
  return (
    <Text
      key={`${index}-pattern`}
      style={part.config.textStyle}
    >
      {part.text}
    </Text>
  );
};

/**
 * Value renderer. Parsing value to parts array and then mapping the array using 'renderPart'
 *
 * @param value - value from MentionInput
 * @param configs - configs array that you providing to MentionInput
 */
const renderValue: FC = (
  value: string,
  configs: Config[],
) => {
  const { parts } = parseValue(value, configs);

  return <Text>{parts.map(renderPart)}</Text>;
};
```

## To Do

* ~~Add support for different text formatting (e.g. URLs)~~
* ~~Add more customizations~~ DONE
* ~~Add ability to handle few mention types ("#", "@" etc)~~ DONE

## Known Issues

* Mention name regex accepts white spaces (e.g. `{name: ' ', value: 1}`)
* ~~Keyboard auto-correction not working if suggested word has the same length~~ FIXED
* ~~Text becomes transparent when setting custom font size in TextInput~~ FIXED

## Support Me

<a href="https://www.buymeacoffee.com/dabakovich" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

[npm-image]: https://img.shields.io/npm/v/react-native-controlled-mentions

[npm-url]: https://npmjs.org/package/react-native-controlled-mentions
