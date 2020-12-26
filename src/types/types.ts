import { ReactNode, Ref } from 'react';
import { StyleProp, TextInput, TextInputProps, TextStyle, ViewStyle } from 'react-native';

type Suggestion = {
  id: string;
  name: string;
};

type MentionData = {
  original: string;
  trigger: string;
  name: string;
  id: string;
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

type MentionType = {
  // single trigger character eg '@' or '#'
  trigger: string;

  // Function for render suggestions
  renderSuggestions?: (props: MentionSuggestionsProps) => ReactNode;

  // Should we add a space after selected mentions if the mention is at the end of row
  isInsertSpaceAfterMention?: boolean;

  // Custom mention styles in text input
  textStyle?: StyleProp<TextStyle>;

  // Plain string generator for mention
  getPlainString?: (mention: MentionData) => string;
};

type MentionInputProps = Omit<TextInputProps, 'onChange'> & {
  value: string;
  onChange: (value: string) => any;

  mentionTypes?: MentionType[];

  inputRef?: Ref<TextInput>;

  containerStyle?: StyleProp<ViewStyle>;
};

export {
  Suggestion,
  MentionData,
  RegexMatchResult,
  Position,
  Part,
  MentionSuggestionsProps,
  MentionType,
  MentionInputProps,
};
