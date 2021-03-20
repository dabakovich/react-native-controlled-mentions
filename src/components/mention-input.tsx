import React, { FC, MutableRefObject, useMemo, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  View
} from 'react-native';

import { MentionInputProps, MentionPartType, Suggestion, PartData, Part } from '../types';
import {
  defaultMentionTextStyle,
  generateValueFromPartsAndChangedText,
  generateValueWithAddedSuggestion,
  getMentionPartSuggestionKeywords,
  isMentionPartType,
  parseValue,
} from '../utils';
const AddOrEdit = <S extends unknown>(arr: S[], val: S, i: number) => {
  if(i === -1) {
    arr.push(val);
  } else {
    arr[i] = val;
  }
}
const MentionInput: FC<MentionInputProps> = (
  {
    value,
    onChange,

    partTypes = [],

    inputRef: propInputRef,

    containerStyle,

    onSelectionChange,
    onChangePartsData,
    ...textInputProps
  } : MentionInputProps,
) => {
  const textInput = useRef<TextInput | null>(null);

  const [selection, setSelection] = useState({start: 0, end: 0});
  const [partsData, setPartsData] = useState<PartData[]>([]);

  const {
    plainText,
    parts,
  } = useMemo(() => parseValue(value, partTypes), [value, partTypes]);

  const handleSelectionChange = (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    setSelection(event.nativeEvent.selection);

    onSelectionChange && onSelectionChange(event);
  };

  /**
   * Callback that trigger on TextInput text change
   *
   * @param changedText
   */
  const onChangeInput = (changedText: string) => {
    const newValue = generateValueFromPartsAndChangedText(parts, plainText, changedText);
    const { parts: newParts } = parseValue(newValue, partTypes);
    partDataHasChanged(newParts);    
    onChange(newValue);
  };
  /**
   * Determines when the onChangePartsData event should triggerred
   * @param newParts 
   */
  const partDataHasChanged = (newParts: Part[]) => {
    const partsWithData = newParts.filter(part => part.partType && isMentionPartType(part.partType));
    const newPartsData = partsWithData.reduce((acc, part) => {
      const id = part.data?.id;
      const name = part.data?.name;
      const partData = partsData.find(pd => pd.id === id);
      const accI = acc.findIndex(ad => ad.id === id);
      const lastValue = acc[accI];
      const val = { cant: (lastValue?.cant ?? 0) + 1, data: partData?.data, id, name } as PartData;
      AddOrEdit(acc, val, accI);
      return acc;
    }, [] as PartData[]);
    const eventMustBeTriggered = newPartsData.length !== partsData.length 
      || newPartsData.some(npd => partsData.find(pd => pd.id === npd.id)?.cant !== npd.cant);
    if(eventMustBeTriggered)
      ChangePartsData(newPartsData);
  };
  const ChangePartsData = (newPartsData: PartData[]) => {
    setPartsData(newPartsData);
    if(typeof onChangePartsData === 'function'){
      onChangePartsData(newPartsData);
    }
  };
  /**
   * We memoize the keyword to know should we show mention suggestions or not
   */
  const keywordByTrigger = useMemo(() => {
    return getMentionPartSuggestionKeywords(
      parts,
      plainText,
      selection,
      partTypes,
    );
  }, [parts, plainText, selection, partTypes]);

  /**
   * Callback on mention suggestion press. We should:
   * - Get updated value
   * - Trigger onChange callback with new value
   */
  const onSuggestionPress = (mentionType: MentionPartType) => (suggestion: Suggestion) => {
    const newValue = generateValueWithAddedSuggestion(
      parts,
      mentionType,
      plainText,
      selection,
      suggestion,
    );

    if (!newValue) {
      return;
    }
    //
    const copyPartsData = [...partsData];
    const i = copyPartsData.findIndex(ad => ad.id === suggestion.id);
    const lastValue = copyPartsData[i];
    const val = {
      cant: (lastValue?.cant ?? 0) + 1, 
      data: suggestion, 
      id: suggestion.id, 
      name: suggestion.name 
    } as PartData;
    AddOrEdit(copyPartsData, val, i);
    ChangePartsData(copyPartsData);

    onChange(newValue);

    /**
     * Move cursor to the end of just added mention starting from trigger string and including:
     * - Length of trigger string
     * - Length of mention name
     * - Length of space after mention (1)
     *
     * Not working now due to the RN bug
     */
    // const newCursorPosition = currentPart.position.start + triggerPartIndex + trigger.length +
    // suggestion.name.length + 1;

    // textInput.current?.setNativeProps({selection: {start: newCursorPosition, end: newCursorPosition}});
  };

  const handleTextInputRef = (ref: TextInput) => {
    textInput.current = ref as TextInput;

    if (propInputRef) {
      if (typeof propInputRef === 'function') {
        propInputRef(ref);
      } else {
        (propInputRef as MutableRefObject<TextInput>).current = ref as TextInput;
      }
    }
  };

  const renderMentionSuggestions = (mentionType: MentionPartType) => (
    <React.Fragment key={mentionType.trigger}>
      {mentionType.renderSuggestions && mentionType.renderSuggestions({
        keyword: keywordByTrigger[mentionType.trigger],
        onSuggestionPress: onSuggestionPress(mentionType),
      })}
    </React.Fragment>
  );

  return (
    <View style={containerStyle}>
      {(partTypes
        .filter(one => (
          isMentionPartType(one)
          && one.renderSuggestions != null
          && !one.isBottomMentionSuggestionsRender
        )) as MentionPartType[])
        .map(renderMentionSuggestions)
      }

      <TextInput
        multiline

        {...textInputProps}

        ref={handleTextInputRef}

        onChangeText={onChangeInput}
        onSelectionChange={handleSelectionChange}
      >
        <Text>
          {parts.map(({text, partType, data}, index) => partType ? (
            <Text
              key={`${index}-${data?.trigger ?? 'pattern'}`}
              style={partType.textStyle ?? defaultMentionTextStyle}
            >
              {text}
            </Text>
          ) : (
            <Text key={index}>{text}</Text>
          ))}
        </Text>
      </TextInput>

      {(partTypes
        .filter(one => (
          isMentionPartType(one)
          && one.renderSuggestions != null
          && one.isBottomMentionSuggestionsRender
        )) as MentionPartType[])
        .map(renderMentionSuggestions)
      }
    </View>
  );
};

export { MentionInput };
