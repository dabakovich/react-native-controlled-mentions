import { useMentions } from '@mention-hooks';
import React, { ReactElement, Ref, useEffect } from 'react';
import { TextInput } from 'react-native';
import { MentionInputProps } from './props';

const MentionInputComponent = <TriggerName extends string>(
  { onTriggersChange, ...props }: MentionInputProps<TriggerName>,
  ref: Ref<TextInput>,
) => {
  const { triggers, textInputProps } = useMentions(props);

  useEffect(() => {
    onTriggersChange && onTriggersChange(triggers);
  }, [triggers]);

  return <TextInput ref={ref} {...textInputProps} />;
};

const MentionInput = React.forwardRef(MentionInputComponent) as <TriggerName extends string>(
  p: MentionInputProps<TriggerName> & { ref?: Ref<TextInput> },
) => ReactElement | null;

export { MentionInput };
