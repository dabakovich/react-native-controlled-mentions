# Migration Guide: v2 to v3

This guide will help you migrate your existing `react-native-controlled-mentions` implementation from v2 to v3.

## Overview of Changes

Version 3 introduces significant architectural changes to improve flexibility and type safety:

- **Hook-based API**: Replace `MentionInput` component with `useMentions` hook
- **Separate configuration objects**: Split `partTypes` into `triggersConfig` and `patternsConfig`
- **New mention format**: Mentions now include trigger in curly braces (e.g., `{@}[Name](id)`)
- **Simplified suggestions handling**: Use `SuggestionsProvidedProps` interface
- **Required single capturing group**: Pattern regex must include single capturing group

## Step-by-Step Migration

### 1. Update Imports

**v2:**

```tsx
import { MentionInput, Suggestion } from 'react-native-controlled-mentions';
```

**v3:**

```tsx
import {
  useMentions,
  SuggestionsProvidedProps,
  TriggersConfig,
  PatternsConfig,
} from 'react-native-controlled-mentions';
import { TextInput } from 'react-native';
```

### 2. Replace MentionInput with useMentions Hook

**v2:**

```tsx
const App = () => {
  const [value, setValue] = useState('Hello @[Mary](2)! How are you?');

  return (
    <MentionInput
      value={value}
      onChange={setValue}
      partTypes={
        [
          /* ... */
        ]
      }
      style={
        {
          /* styles */
        }
      }
      placeholder="Type here..."
    />
  );
};
```

**v3:**

```tsx
const App = () => {
  const [value, setValue] = useState('Hello {@}[Mary](2)! How are you?');

  const { textInputProps, triggers } = useMentions({
    value,
    onChange: setValue,
    triggersConfig,
    patternsConfig,
  });

  return (
    <TextInput
      {...textInputProps}
      style={
        {
          /* styles */
        }
      }
      placeholder="Type here..."
    />
  );
};
```

### 3. Convert partTypes to Separate Configurations

**v2:**

```tsx
<MentionInput
  partTypes={[
    {
      trigger: "@",
      renderSuggestions: renderMentionSuggestions
    },
    {
      trigger: "#",
      allowedSpacesCount: 0,
      renderSuggestions: renderHashtagSuggestions,
      textStyle: { fontWeight: "bold", color: "grey" }
    },
    {
      pattern: /(https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.(xn--)?[a-z0-9-]{2,20}\b([-a-zA-Z0-9@:%_\+\[\],.~#?&\/=]*[-a-zA-Z0-9@:%_\+\]~#?&\/=])*/gi,
      textStyle: { color: "blue" }
    }
  ]}

  /* ... */
/>;
```

**v3:**

```tsx
// Create as constants outside component or memoize with useMemo
const triggersConfig: TriggersConfig<'mention' | 'hashtag'> = {
  mention: {
    trigger: '@',
    textStyle: { fontWeight: 'bold', color: 'blue' },
  },
  hashtag: {
    trigger: '#',
    allowedSpacesCount: 0,
    textStyle: { fontWeight: 'bold', color: 'grey' },
  },
};

const patternsConfig: PatternsConfig = {
  url: {
    pattern:
      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
    textStyle: { color: 'blue' },
  },
};
```

### 4. Update Suggestions Implementation

**v2:**

```tsx
const renderSuggestions: (suggestions: Suggestion[]) => FC<MentionSuggestionsProps> =
  (suggestions) =>
  ({ keyword, onSuggestionPress }) => {
    if (keyword == null) {
      return null;
    }

    return (
      <View>
        {suggestions
          .filter((one) => one.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()))
          .map((one) => (
            <Pressable key={one.id} onPress={() => onSuggestionPress(one)} style={{ padding: 12 }}>
              <Text>{one.name}</Text>
            </Pressable>
          ))}
      </View>
    );
  };

const renderMentionSuggestions = renderSuggestions(users);
const renderHashtagSuggestions = renderSuggestions(hashtags);
```

**v3:**

```tsx
const Suggestions: FC<SuggestionsProvidedProps & { suggestions: any[] }> = ({
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
        .filter((one) =>
          one.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())
        )
        .map((one) => (
          <Pressable
            key={one.id}
            onPress={() => onSelect(one)}
            style={{ padding: 12 }}>
            <Text>{one.name}</Text>
          </Pressable>
        ))}
    </View>
  );
};

// Usage:
<Suggestions {...triggers.mention} suggestions={users} />
<Suggestions {...triggers.hashtag} suggestions={hashtags} />
```

### 5. Update Mention Format in Initial Values

**v2 format:** `@[Mary](2)`

**v3 format:** `{@}[Mary](2)`

```tsx
// v2
const [value, setValue] = useState('Hello @[Mary](2)! How are you?');
```


```tsx
// v3
const [value, setValue] = useState('Hello {@}[Mary](2)! How are you?');
```

### 6. Pattern Regex Requirements

**Important:** In v3, all pattern regex must include single capturing group.

**v2 (may work without capturing group):**

```tsx
pattern: /https?:\/\/[^\s]+/gi;
```

**v3 (requires single capturing group):**

```tsx
pattern: /(https?:\/\/[^\s]+)/gi;
```

### 7. Update Helper Functions

Several helper functions have been renamed for consistency:

**v2:**

```tsx
import {
  replaceMentionValues,
  isMentionPartType,
  mentionRegEx,
} from 'react-native-controlled-mentions';

// Replace mentions in text
const processedText = replaceMentionValues(value, ({ id }) => `@${id}`);

// Check if part type is mention
if (isMentionPartType(partType)) {
  // Handle mention
}

// Use mention regex
const matches = value.match(mentionRegEx);
```

**v3:**

```tsx
import {
  replaceTriggerValues,
  isTriggerConfig,
  triggerRegEx,
} from 'react-native-controlled-mentions';

// Replace triggers in text
const processedText = replaceTriggerValues(value, ({ id }) => `@${id}`);

// Check if config is trigger config
if (isTriggerConfig(config)) {
  // Handle trigger
}

// Use trigger regex
const matches = value.match(triggerRegEx);
```

**Migration mapping:**

- `replaceMentionValues` → `replaceTriggerValues`
- `isMentionPartType` → `isTriggerConfig`
- `mentionRegEx` → `triggerRegEx`

## Key API Changes Summary

| Feature                 | v2                        | v3                                          |
| ----------------------- | ------------------------- | ------------------------------------------- |
| **Main Component**      | `<MentionInput />`        | `useMentions()` hook + `<TextInput />`      |
| **Configuration**       | `partTypes` array         | `triggersConfig` + `patternsConfig` objects |
| **Mention Format**      | `@[Name](id)`             | `{@}[Name](id)`                             |
| **Suggestions Props**   | `MentionSuggestionsProps` | `SuggestionsProvidedProps`                  |
| **Suggestion Callback** | `onSuggestionPress`       | `onSelect`                                  |
| **Pattern Regex**       | Optional capturing group  | Required capturing group                    |
| **Triggers Access**     | Via `renderSuggestions`   | Via `triggers` object from hook             |

## Complete Migration Example

Here's a complete before/after comparison:

**🚀 Try the live demos:**

- **v2 Demo:** https://snack.expo.dev/@dabakovich/mentionsapp?platform=ios
- **v3 Demo:** https://snack.expo.dev/@dabakovich/mentionsappv3?platform=ios

<details>
<summary><strong>v2 Implementation</strong></summary>

```tsx
import * as React from 'react';
import { FC, useState } from 'react';
import { MentionInput, Suggestion } from 'react-native-controlled-mentions';
import { Pressable, Text, View } from 'react-native';

const users = [
  { id: '1', name: 'David Tabaka' },
  { id: '2', name: 'Mary' },
];

const renderSuggestions: (suggestions: Suggestion[]) => FC<MentionSuggestionsProps> =
  (suggestions) =>
  ({ keyword, onSuggestionPress }) => {
    if (keyword == null) return null;

    return (
      <View>
        {suggestions
          .filter((one) => one.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()))
          .map((one) => (
            <Pressable key={one.id} onPress={() => onSuggestionPress(one)} style={{ padding: 12 }}>
              <Text>{one.name}</Text>
            </Pressable>
          ))}
      </View>
    );
  };

const App = () => {
  const [value, setValue] = useState('Hello @[Mary](2)!');

  return (
    <MentionInput
      value={value}
      onChange={setValue}
      partTypes={[
        {
          trigger: '@',
          renderSuggestions: renderSuggestions(users),
        },
        {
          pattern: /https?:\/\/[^\s]+/gi,
          textStyle: { color: 'blue' },
        },
      ]}
      style={{ padding: 12, fontSize: 18 }}
      placeholder="Type here..."
    />
  );
};
```

</details>

<details>
<summary><strong>v3 Implementation</strong></summary>

```tsx
import * as React from 'react';
import { FC, useState } from 'react';
import {
  useMentions,
  SuggestionsProvidedProps,
  TriggersConfig,
  PatternsConfig,
} from 'react-native-controlled-mentions';
import { Pressable, Text, TextInput, View } from 'react-native';

const users = [
  { id: '1', name: 'David Tabaka' },
  { id: '2', name: 'Mary' },
];

const Suggestions: FC<SuggestionsProvidedProps & { suggestions: any[] }> = ({
  keyword,
  onSelect,
  suggestions,
}) => {
  if (keyword == null) return null;

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

const triggersConfig: TriggersConfig<'mention'> = {
  mention: {
    trigger: '@',
    textStyle: { fontWeight: 'bold', color: 'blue' },
  },
};

const patternsConfig: PatternsConfig = {
  url: {
    pattern: /(https?:\/\/[^\s]+)/gi,
    textStyle: { color: 'blue' },
  },
};

const App = () => {
  const [value, setValue] = useState('Hello {@}[Mary](2)!');

  const { textInputProps, triggers } = useMentions({
    value,
    onChange: setValue,
    triggersConfig,
    patternsConfig,
  });

  return (
    <>
      <Suggestions {...triggers.mention} suggestions={users} />

      <TextInput
        {...textInputProps}
        style={{ padding: 12, fontSize: 18 }}
        placeholder="Type here..."
      />
    </>
  );
};
```

</details>

## Performance Considerations

1. **Create configurations outside component**: Define `triggersConfig` and `patternsConfig` as constants outside your component or memoize them with `useMemo` to avoid unnecessary re-renders.

2. **Memoize suggestions**: Consider memoizing your suggestions component if you have large suggestion lists.

```tsx
const triggersConfig = useMemo(
  () => ({
    mention: {
      trigger: '@',
      textStyle: { fontWeight: 'bold', color: 'blue' },
    },
  }),
  [],
);
```

## TypeScript Benefits

v3 provides better TypeScript support:

- **Typed trigger names**: `TriggersConfig<'mention' | 'hashtag'>`
- **Typed suggestions props**: `SuggestionsProvidedProps`
- **Better inference**: More accurate type checking for configurations

## Common Migration Issues

1. **Missing capturing group**: Ensure all pattern regex include capturing group `/(pattern)/gi` (#89)
2. **Wrong mention format**: Update existing mention strings from `@[Name](id)` to `{@}[Name](id)`
3. **Missing TextInput import**: Don't forget to import `TextInput` from React Native

## Additional Resources

- [v3 API Documentation](./README.md#api)
- [Example Implementation](./example)
- [Type Definitions](./src/types.ts)
