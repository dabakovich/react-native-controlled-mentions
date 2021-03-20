import type { Change } from 'diff';
import type { ReactNode, Ref } from 'react';
import type { StyleProp, TextInput, TextInputProps, TextStyle, ViewStyle } from 'react-native';
declare type Suggestion = {
    id: string;
    name: string;
};
declare type MentionData = {
    original: string;
    trigger: string;
    name: string;
    id: string;
};
declare type PartData = {
    name: string;
    id: string;
    cant: number;
    data: any;
};
declare type CharactersDiffChange = Omit<Change, 'count'> & {
    count: number;
};
declare type RegexMatchResult = string[] & {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    index: number;
    groups: MentionData;
};
declare type Position = {
    start: number;
    end: number;
};
declare type MentionSuggestionsProps = {
    keyword: string | undefined;
    onSuggestionPress: (suggestion: Suggestion) => void;
};
declare type MentionPartType = {
    trigger: string;
    renderSuggestions?: (props: MentionSuggestionsProps) => ReactNode;
    allowedSpacesCount?: number;
    isInsertSpaceAfterMention?: boolean;
    isBottomMentionSuggestionsRender?: boolean;
    textStyle?: StyleProp<TextStyle>;
    getPlainString?: (mention: MentionData) => string;
};
declare type PatternPartType = {
    pattern: RegExp;
    textStyle?: StyleProp<TextStyle>;
};
declare type PartType = MentionPartType | PatternPartType;
declare type Part = {
    text: string;
    position: Position;
    partType?: PartType;
    data?: MentionData;
};
declare type MentionInputProps = Omit<TextInputProps, 'onChange'> & {
    value: string;
    onChange: (value: string) => void;
    onChangePartsData: (partsData: PartData[]) => void;
    partTypes?: PartType[];
    inputRef?: Ref<TextInput>;
    containerStyle?: StyleProp<ViewStyle>;
};
export type { Suggestion, MentionData, CharactersDiffChange, RegexMatchResult, Position, Part, MentionSuggestionsProps, MentionPartType, PatternPartType, PartType, MentionInputProps, PartData };
