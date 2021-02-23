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
  // Matched string
  0: string;

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

type MentionSuggestionsProps = {
  keyword: string | undefined;
  onSuggestionPress: (suggestion: Suggestion) => void;
};

type MentionPartType = {
  // single trigger character eg '@' or '#'
  trigger: string;

  // Function for render suggestions
  renderSuggestions?: (props: MentionSuggestionsProps) => ReactNode;

  // How much spaces are allowed for mention keyword
  allowedSpacesCount?: number;

  // Should we add a space after selected mentions if the mention is at the end of row
  isInsertSpaceAfterMention?: boolean;

  // Should we render either at the top or bottom of the input
  isBottomMentionSuggestionsRender?: boolean;

  // Custom mention styles in text input
  textStyle?: StyleProp<TextStyle>;

  // Plain string generator for mention
  getPlainString?: (mention: MentionData) => string;
};

type PatternPartType = {
  // RexExp with global flag
  pattern: RegExp;

  textStyle?: StyleProp<TextStyle>;
};

type PartType = MentionPartType | PatternPartType;

type Part = {
  text: string;
  position: Position;

  partType?: PartType;

  data?: MentionData;
};

type MentionInputProps = Omit<TextInputProps, 'onChange'> & {
  value: string;
  onChange: (value: string) => any;

  partTypes?: PartType[];

  inputRef?: Ref<TextInput>;

  containerStyle?: StyleProp<ViewStyle>;
  overlayContainerStyle?: StyleProp<ViewStyle>;
};

export {
  Suggestion,
  MentionData,
  RegexMatchResult,
  Position,
  Part,
  MentionSuggestionsProps,
  MentionPartType,
  PatternPartType,
  PartType,
  MentionInputProps,
};
