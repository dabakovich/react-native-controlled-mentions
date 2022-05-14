// Custom component for rendering suggestions
import { FC } from 'react';
import { Suggestion, SuggestionsProvidedProps } from '../src';
import { Pressable, Text, View } from 'react-native';
import * as React from 'react';

const Suggestions: FC<SuggestionsProvidedProps & { suggestions: Suggestion[] }> = ({
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
