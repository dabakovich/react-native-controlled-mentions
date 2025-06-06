## react-native-controlled-mentions [![npm version][npm-image]][npm-url]

Add to your `TextInput` ability to highlight mentions, hashtags or other custom patterns. It can:

- Gracefully render formatted text directly in React Native `TextInput` component
- Support for different mention types (**[@user mentions](#demo)**, **#hashtags**, etc)
- Completely typed (written on TypeScript)
- No need for native libraries

In addition, you can add custom styling for a regex pattern (like URLs).

## Contents

- [Demo](#demo)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [API](#api)
- [Migration Guide](#migration-guide)
- [Parsing Mention's Value](#parsing-mentions-value)
- [Rendering Mention's Value](#rendering-mentions-value)
- [To Do](#to-do)
- [Known Issues](#known-issues)
- [Support Me](#support-me)

## Demo

Try it on Expo Snack: https://snack.expo.dev/@dabakovich/mentionsappv3?platform=ios

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

  return <TextInput value={textValue} onChangeText={setTextValue} />;
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
import { useMentions } from 'react-native-controlled-mentions';

const Mentions = () => {
  const [textValue, setTextValue] = useState('');

  const { textInputProps } = useMentions({
    value: textValue,
    onChange: setTextValue,
  });

  return <TextInput {...textInputProps} />;
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
import { useMentions, TriggersConfig } from 'react-native-controlled-mentions';

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

  return <TextInput {...textInputProps} />;
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
    name: 'David',
  },
  {
    id: '2',
    name: 'Mary',
  },
  // ...
];

const Suggestions: FC<SuggestionsProvidedProps> = ({ keyword, onSelect }) => {
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

export { Suggestions };
```

</details>

[`useMentions`](#hook-usementions) hook returns also [`triggers`](#triggers) value that you can use as provided props for rendering suggestions.

<details>
<summary>See code</summary>

```typescript jsx
import { TextInput } from 'react-native';
import { useMentions, TriggersConfig } from 'react-native-controlled-mentions';
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

Config that allows to define what other highlights should support your input (like urls, bold, italic text, etc.).<br>
It presents an object with pattern name keys (for instance `url`, `bold`) and [`PatternConfig`](#type-patternconfig) values.

<details>
<summary>Example</summary>

```typescript
const patternsConfig: PatternsConfig = {
  doubleAt: {
    pattern: /(@@)/gi, // ✅ Correct: wrapped in capturing group
    textStyle: { color: 'blue' },
  },
  url: {
    pattern: /(https?:\/\/[^\s]+)/gi, // ✅ Correct: wrapped in capturing group
    textStyle: { color: 'blue' },
  },
};
```

</details>

### Type `Config`

[TriggerConfig](#type-triggerconfig) | [PatternConfig](#type-patternconfig)

### Type `TriggerConfig`

| **Property name**           | **Description**                                                                                | **Type**                                                                                      | **Required**                | **Default** |
| --------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------- | ----------- |
| `trigger`                   | Character that will trigger current mention type                                               | string                                                                                        | true                        |             |
| `pattern`                   | Custom trigger pattern                                                                         | RegExp                                                                                        | false                       |             |
| `getTriggerData`            | Callback for getting [TriggerData](#type-triggerdata), is required when we have custom pattern | (match: string) => [TriggerData](#type-triggerdata)                                           | true, when `pattern` exists |             |
| `getTriggerValue`           | Callback for getting trigger value, is required when we have custom pattern                    | (triggerData: [TriggerData](#type-triggerdata)) => string                                     | true, when `pattern` exists |             |
| `allowedSpacesCount`        | How much spaces are allowed for mention keyword                                                | number                                                                                        | false                       |             |
| `isInsertSpaceAfterMention` | Should we add a space after selected mentions if the mention is at the end of row              | boolean                                                                                       | false                       | false       |
| `textStyle`                 | Text style for mentions in `TextInput`                                                         | StyleProp\<TextStyle> \| (mention: [TriggerData](#type-triggerdata)) => StyleProp\<TextStyle> | false                       |             |
| `getPlainString`            | Function for generating custom mention text in text input                                      | (mention: [TriggerData](#type-triggerdata)) => string                                         | false                       |             |

### Type `PatternConfig`

| **Property name** | **Description**                                          | **Type**                                                                                      | **Required** | **Default** |
| ----------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------ | ----------- |
| `pattern`         | RegExp for parsing a pattern, should include global flag | RegExp                                                                                        | true         |             |
| `textStyle`       | Text style for pattern in `TextInput`                    | StyleProp\<TextStyle> \| (mention: [TriggerData](#type-triggerdata)) => StyleProp\<TextStyle> | false        |             |

> **⚠️ Important:** The `pattern` regex **must include capturing groups** for the library to work correctly.
> The library uses `String.split()` internally which requires capturing groups to preserve the matched text.
>
> **✅ Correct:** `/(@@)/gi`, `/(https?:\/\/[^\s]+)/gi`, `/(#\w+)/gi`
>
> **❌ Incorrect:** `/@@/gi`, `/https?:\/\/[^\s]+/gi`, `/#\w+/gi`

<details>
<summary>Example</summary>

```typescript
const patternsConfig: PatternsConfig = {
  doubleAt: {
    pattern: /(@@)/gi, // ✅ Correct: wrapped in capturing group
    textStyle: { color: 'blue' },
  },
  url: {
    pattern: /(https?:\/\/[^\s]+)/gi, // ✅ Correct: wrapped in capturing group
    textStyle: { color: 'blue' },
  },
};
```

</details>

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

Name that will be shown in your `TextInput` when user will select the suggestion.

### Type `TriggerData`

For example, we have that mention value `{@}[David Tabaka](123)`. Then after parsing that string by `triggerRegEx` we will
get next properties:

`original: string`

The whole mention value string - `{@}[David Tabaka](123)`

`trigger: string`

The extracted trigger - `@`

`name: string`

The extracted name - `David Tabaka`

`id: string`

The extracted id - `123`

### Default pattern `triggerRegEx`

```jsregexp
/({([^{^}]*)}\[([^[]*)]\(([^(^)]*)\))/i
```

### Deprecated `MentionInput` component props

If you prefer to use class component without hooks the `MentionInput` is for you.

| **Property name** | **Description**                                                       | **Type**                              | **Required** | **Default** |
| ----------------- | --------------------------------------------------------------------- | ------------------------------------- | ------------ | ----------- |
| `value`           | The same as in `TextInput`                                            | string                                | true         |             |
| `onChange`        | The same as in `TextInput`                                            | (value: string) => void               | true         |             |
| `triggersConfig`  | Declare what trigger configs you want to support (mentions, hashtags) | [TriggerConfig](#type-triggerconfig)] | false        | {}          |
| `patternsConfig`  | Declare what pattern configs you want to support (urls, bold, italic) | [PatternConfig](#type-patternconfig)] | false        | {}          |
| ...textInputProps | Other text input props                                                | Partial<TextInputProps>               | false        |             |

## Migration Guide

### From v2 to v3

For detailed migration instructions from v2 to v3, please see [MIGRATION.md](./MIGRATION.md).

## Parsing Mention's Value

You can import RegEx that is using in the component and then extract all mentions
from `textValue` using your own logic.

```ts
import { triggerRegEx } from 'react-native-controlled-mentions';
```

Or you can use `replaceTriggerValues` helper to replace all mentions from `textValue` using
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
import { Part, Config, parseValue, isTriggerConfig } from 'react-native-controlled-mentions';

/**
 * Part renderer
 *
 * @param part
 * @param index
 */
const renderPart = (part: Part, index: number) => {
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
    <Text key={`${index}-pattern`} style={part.config.textStyle}>
      {part.text}
    </Text>
  );
};

/**
 * Value renderer. Parsing value to parts array and then mapping the array using 'renderPart'
 *
 * @param value - `textValue` that you're getting from the `useState` hook
 * @param configs - configs array that you providing to the `useMentions` hook
 */
const renderValue: FC = (value: string, configs: Config[]) => {
  const { parts } = parseValue(value, configs);

  return <Text>{parts.map(renderPart)}</Text>;
};
```

## To Do

- Add ability to have dynamic text style (#134, #135)
- Add ability to remove whole mention by backspace (#88, #129, #133)
- ~~Add support for different text formatting (e.g. URLs)~~
- ~~Add more customizations~~ DONE
- ~~Add ability to handle few mention types ("#", "@" etc)~~ DONE

## Known Issues

- Lags with very long text (#92)
- Could remove mention when two triggers are together (#137)
- Could merge mention with text on some Samsung devices (#118)
- ~~Mention name regex accepts white spaces (e.g. `{name: ' ', value: 1}`)~~ FIXED
- ~~Keyboard auto-correction not working if suggested word has the same length~~ FIXED
- ~~Text becomes transparent when setting custom font size in TextInput~~ FIXED

## Support Me

Unfortunately, common donation platforms (like GitHub Sponsors, Buy Me a Coffee, PayPal, and Stripe) are currently not available in Ukraine.

However, you can still support me and this library in other meaningful ways:

- ⭐ **Star the project** on GitHub to help increase its visibility
- 🔗 **Link back to this project** in your own projects and documentation
- 🤝 **Contribute** with your great ideas, bug reports, or code improvements
- 📢 **Share** the project with others who might find it useful

Your support in any of these forms is greatly appreciated and helps keep this project alive and growing!

[npm-image]: https://img.shields.io/npm/v/react-native-controlled-mentions
[npm-url]: https://npmjs.org/package/react-native-controlled-mentions
