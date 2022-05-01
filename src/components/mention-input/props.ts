import { Triggers, UseMentionsConfig } from '@mention-types';
import { TextInputProps } from 'react-native';

type MentionInputProps<TriggerName extends string> = Omit<TextInputProps, 'onChange'> &
  UseMentionsConfig<TriggerName> & {
    onTriggersChange?: (triggers: Triggers<TriggerName>) => void;
  };

export { MentionInputProps };
