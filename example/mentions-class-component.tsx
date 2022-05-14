import * as React from 'react';
import { SafeAreaView } from 'react-native';
import { MentionInput, Triggers } from '../src';
import { hashtags, users } from './data';
import { Suggestions } from './suggestions-component';

// Config of suggestible triggers
const triggersConfig = {
  mention: {
    trigger: '@',
  },
  hashtag: {
    trigger: '#',
    textStyle: {
      fontWeight: 'bold',
      color: 'grey',
    },
  },
};

// Config of highlightable patterns (like links, bold, italic text etc.)
const patternsConfig = {
  url: {
    pattern:
      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
    textStyle: { color: 'blue' },
  },
};

type MentionsClassComponentState = {
  textValue: string;
  triggers?: Triggers<'mention' | 'hashtag'>;
};

// If for some reason you don't like functional components and hooks – you can use class components with `MentionInput` component
class MentionsClassComponent extends React.Component<any, MentionsClassComponentState> {
  constructor(props: any) {
    super(props);

    this.state = {
      textValue: '',
      triggers: undefined,
    };
  }

  render() {
    const { textValue, triggers } = this.state;

    return (
      <SafeAreaView>
        {triggers ? (
          <>
            <Suggestions suggestions={users} {...triggers.mention} />
            <Suggestions suggestions={hashtags} {...triggers.hashtag} />
          </>
        ) : null}

        <MentionInput
          value={textValue}
          onChange={(newTextValue) => this.setState({ textValue: newTextValue })}
          onTriggersChange={(newTriggers) => this.setState({ triggers: newTriggers })}

          triggersConfig={triggersConfig}
          patternsConfig={patternsConfig}
        />
      </SafeAreaView>
    );
  }
}

export { MentionsClassComponent };
