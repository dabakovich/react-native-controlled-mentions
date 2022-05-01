import type { Change } from 'diff';
import type { StyleProp, TextStyle } from 'react-native';

type Suggestion = {
  id: string;
  name: string;
};

type TriggerData = {
  original: string;
  trigger: string;
  name: string;
  id: string;
};

type CharactersDiffChange = Omit<Change, 'count'> & { count: number };

type RegexMatchResult = string[] & {
  // Matched string
  0: string;

  // original
  1: string;

  // trigger
  2: string;

  // name
  3: string;

  // id
  4: string;

  // Start position of matched text in whole string
  index: number;

  // Group names (duplicates TriggerData type)
  groups: TriggerData;
};

// The same as text selection state
type Position = {
  start: number;
  end: number;
};

/**
 * Props that we can provide to the suggestions components
 */
type SuggestionsProvidedProps = {
  // current keyword for the trigger
  keyword?: string;
  // callback for selecting a suggestion
  onSelect: (suggestion: Suggestion) => void;
};

// ToDo — remove "=" here
type TriggerPartType<TriggerName = string> = {
  // ToDo — add support for non-single triggers (#38, #51)
  // single trigger character eg '@' or '#'
  trigger: string;

  // How many spaces are allowed for mention keyword
  allowedSpacesCount?: number;

  // Should we add a space after selected mentions if the mention is at the end of row
  isInsertSpaceAfterMention?: boolean;

  // Custom mention styles in text input
  textStyle?: StyleProp<TextStyle>;

  // Plain string generator for mention
  getPlainString?: (mention: TriggerData) => string;
};

type PatternPartType = {
  // RexExp with global flag
  pattern: RegExp;

  textStyle?: StyleProp<TextStyle>;
};

type PartType = TriggerPartType | PatternPartType;

/**
 * Config of trigger part types
 */
type TriggersConfig<TriggerName extends string> = Record<TriggerName, TriggerPartType<TriggerName>>;

/**
 * Config of pattern part types that can highlight some matches in the `TextInput`
 */
type PatternsConfig = Record<string, PatternPartType>;

type Part = {
  text: string;
  position: Position;

  partType?: PartType;

  data?: TriggerData;
};

type MentionState = { plainText: string; parts: Part[] };

type Triggers<TriggerName extends string> = Record<TriggerName, SuggestionsProvidedProps>;

type UseMentionsConfig<TriggerName extends string> = {
  value: string;
  onChange: (value: string) => void;

  // IMPORTANT! We need to memoize this prop externally
  triggersConfig?: TriggersConfig<TriggerName>;

  // IMPORTANT! We need to memoize this prop externally
  patternsConfig?: PatternsConfig;
};

export type {
  Suggestion,
  TriggerData,
  CharactersDiffChange,
  RegexMatchResult,
  Position,
  Part,
  SuggestionsProvidedProps,
  TriggerPartType,
  PatternPartType,
  TriggersConfig,
  PatternsConfig,
  PartType,
  MentionState,
  Triggers,
  UseMentionsConfig,
};
