import { StyleProp, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { MutableRefObject, ReactNode } from 'react';

type Suggestion = {
  id: string;
  name: string;
};

type MentionData = {
  id: string;
  name: string;
  original: string;
};

type RegexMatchResult = {
  // Start position of matched text in whole string
  index: number;

  // Group names (duplicates MentionData type)
  groups: MentionData;
};

// The same as text selection state
type Position = {
  start: number;
  end: number;
};

type Part = {
  text: string;
  position: Position;
  data?: MentionData;
};

type MentionSuggestionsProps = {
  keyword: string | undefined;
  onSuggestionPress: (suggestion: Suggestion) => void;
};

type MentionsProps = Omit<TextInputProps, 'onChange'> & {
  value: string;
  onChange: (value: string) => any;

  renderSuggestions?: (props: MentionSuggestionsProps) => ReactNode;

  // Character that will trigger mentions (usually '@')
  trigger?: string;

  containerStyle?: StyleProp<ViewStyle>;

  inputRef?: MutableRefObject<TextInput | null>;
};

export {
  Suggestion,
  MentionData,
  RegexMatchResult,
  Position,
  Part,
  MentionSuggestionsProps,
  MentionsProps,
};
