import * as React from 'react';
import { useMemo, useState } from 'react';
import { SafeAreaView, TextInput } from 'react-native';
import { TriggersConfig, useMentions, parseValue } from '../src';
import { Suggestions } from './suggestions-component';
import { users } from './data';

// Config of suggestible triggers
const triggersConfig: TriggersConfig<'mention'> = {
  mention: {
    trigger: '@',
  },
};

const MentionsFunctionalComponentWithFiltering = () => {
  const [textValue, setTextValue] = useState('Hello @[Mary](2)! How are you?');

  // Extract user IDs that are already mentioned in the text
  const usedUserIds = useMemo(
    () =>
      parseValue(textValue, [triggersConfig.mention]).parts.reduce((acc, part) => {
        if (part.data?.id) {
          acc.push(part.data.id);
        }
        return acc;
      }, [] as string[]),
    [textValue],
  );

  // Filter out users that are already mentioned
  const filteredUsers = useMemo(
    () => users.filter((user) => !usedUserIds.includes(user.id)),
    [usedUserIds],
  );

  const { textInputProps, triggers } = useMentions({
    value: textValue,
    onChange: setTextValue,

    triggersConfig,
  });

  return (
    <SafeAreaView>
      {/* Use filtered users instead of all users */}
      <Suggestions suggestions={filteredUsers} {...triggers.mention} />

      <TextInput placeholder="Type here..." style={{ padding: 12 }} {...textInputProps} />
    </SafeAreaView>
  );
};

export { MentionsFunctionalComponentWithFiltering };
