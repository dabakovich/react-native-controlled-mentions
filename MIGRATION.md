# Migration Guide

## From v2 to v3

v3 represents a complete architectural overhaul of react-native-controlled-mentions. The library has been redesigned from the ground up with a focus on flexibility, performance, and developer experience. The most significant change is the deprecating of the `MentionInput` component in favor of a powerful `useMentions` hook.

### 1. Replace `MentionInput` with `useMentions` hook

**v2 approach:**

```tsx
import { MentionInput } from 'react-native-controlled-mentions';

<MentionInput
  value={textValue}
  onChange={setTextValue}
  partTypes={[
    {
      trigger: '@',
      renderSuggestions: ({ keyword, onSuggestionPress }) => (
        <Suggestions keyword={keyword} onSelect={onSuggestionPress} suggestions={users} />
      ),
      textStyle: { fontWeight: 'bold', color: 'blue' },
    },
  ]}
/>;
```

**v3 approach:**

```tsx
import { useMentions, TriggersConfig } from 'react-native-controlled-mentions';
import { TextInput } from 'react-native';

const triggersConfig: TriggersConfig<'mention'> = {
  mention: {
    trigger: '@',
    textStyle: { fontWeight: 'bold', color: 'blue' },
  },
};

const { textInputProps, triggers } = useMentions({
  value: textValue,
  onChange: setTextValue,
  triggersConfig,
});

return (
  <>
    <Suggestions {...triggers.mention} suggestions={users} />
    <TextInput {...textInputProps} />
  </>
);
```

### 2. Update configuration format

**v2 configuration:**

```tsx
const partTypes = [
  {
    trigger: '@',
    textStyle: { fontWeight: 'bold', color: 'blue' },
    renderSuggestions: ({ keyword, onSuggestionPress }) => (
      <Suggestions keyword={keyword} onSelect={onSuggestionPress} />
    ),
  },
  {
    trigger: '#',
    textStyle: { fontWeight: 'bold', color: 'grey' },
    renderSuggestions: ({ keyword, onSuggestionPress }) => (
      <HashtagSuggestions keyword={keyword} onSelect={onSuggestionPress} />
    ),
  },
];
```

**v3 configuration:**

```tsx
const triggersConfig: TriggersConfig<'mention' | 'hashtag'> = {
  mention: {
    trigger: '@',
    textStyle: { fontWeight: 'bold', color: 'blue' },
  },
  hashtag: {
    trigger: '#',
    textStyle: { fontWeight: 'bold', color: 'grey' },
  },
};
```

### 3. Update suggestion rendering

**v2 suggestion rendering:**

- Suggestions were rendered through the `renderSuggestions` prop within each `partType`
- The callback received `keyword` and `onSuggestionPress` parameters

**v3 suggestion rendering:**

- Suggestions are rendered as separate components
- Use the `triggers` object returned from `useMentions` hook
- The trigger objects contain `keyword` and `onSelect` properties

```tsx
// v3 approach
<Suggestions {...triggers.mention} suggestions={users} />
<HashtagSuggestions {...triggers.hashtag} suggestions={hashtags} />
```

### 4. Update mention format in stored data

If you have existing data with mentions, you need to update the format:

- **v2 format:** `@[Name](id)` → **v3 format:** `{@}[Name](id)`

**Migration script example:**

```tsx
const migrateMentionFormat = (oldText: string): string => {
  // Convert @[Name](id) to {@}[Name](id)
  return oldText.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '{@}[$1]($2)');
};

// Example usage
const oldValue = 'Hello @[Mary](1), how are you?';
const newValue = migrateMentionFormat(oldValue); // 'Hello {@}[Mary](1), how are you?'
```

### 5. Update component props and callbacks

**Props name changes:**

- `onSuggestionPress` → `onSelect`
- `partTypes` → `triggersConfig`
- Component no longer accepts `renderSuggestions` prop

**Removed props:**

- `containerStyle` (use wrapper component instead)
- `inputRef` (use `ref` directly on `TextInput`)
- `renderSuggestions` (render suggestions separately)
- `isBottomMentionSuggestionsRender` (handle positioning in your suggestion component)

### 6. Benefits of migration

- **Better performance:** Optimized rendering and state management
- **More flexibility:** Full control over suggestion rendering and positioning
- **Better TypeScript support:** Enhanced type safety throughout the library
- **Cleaner architecture:** Separation of concerns between input and suggestions
- **Multiple trigger support:** Better support for multi-character triggers like `@@`, `##`

### 7. Step-by-step migration checklist

1. ✅ Install v3.0.0: `npm install react-native-controlled-mentions@latest` or `yarn install react-native-controlled-mentions@latest`
2. ✅ Replace `MentionInput` imports with `useMentions` and `TriggersConfig`
3. ✅ Convert `partTypes` array to `triggersConfig` object
4. ✅ Move suggestion rendering outside of the configuration
5. ✅ Update your `TextInput` to use `textInputProps` from the hook
6. ✅ Use `triggers` object to pass props to your suggestion components
7. ✅ Update stored mention data format from `@[Name](id)` to `{@}[Name](id)`
8. ✅ Test your implementation thoroughly

For detailed examples and advanced use cases, check the `/example` directory in the repository.
