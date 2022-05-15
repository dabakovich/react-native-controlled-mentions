import {
  TriggerConfig,
  Part,
  Config,
  PatternConfig,
  PatternsConfig,
  TriggersConfig,
} from '../src/types';
import {
  generateTriggerPart,
  generatePlainTextPart,
  generateValueFromMentionStateAndChangedText,
  getTriggerPartSuggestionKeywords,
  getTriggerValue,
  parseValue,
  replaceTriggerValues,
  getConfigsArray,
  getTextLength,
  getKeyword,
  getPartsInterval,
} from '../src/utils';

const users = [
  {
    id: '1-a',
    name: 'David🥳 Tabaka🥳',
  },
  {
    id: '2b',
    name: 'Mary🥳',
  },
  {
    id: '3',
    name: 'Tony',
  },
  {
    id: 'c4',
    name: 'Mike',
  },
  {
    id: 'd-5',
    name: 'Grey',
  },
];

const mentionConfig: TriggerConfig = {
  trigger: '@',
};

const hashtagConfig: TriggerConfig = {
  trigger: '#',
};

const urlPatternConfig: PatternConfig = {
  pattern:
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
};

const configs: Config[] = [mentionConfig, hashtagConfig, urlPatternConfig];

const triggersConfig: TriggersConfig<'mention'> = {
  mention: mentionConfig,
};

const patternsConfig: PatternsConfig = {
  url: urlPatternConfig,
};

test('generates parts array from configs', () => {
  expect(getConfigsArray(triggersConfig, patternsConfig)).toEqual([
    mentionConfig,
    urlPatternConfig,
  ]);
});

test('generates plain text part', () => {
  const text = 'Hey';
  expect(generatePlainTextPart(text)).toEqual<Part>({
    text,
    position: {
      start: 0,
      end: text.length,
    },
  });
});

test('finding correct trigger position', () => {
  const cursor = 8;
  const text = 'Hey☺️! @dav';

  expect(getTextLength(text)).toEqual(11);

  const keyword = getKeyword({
    mentionState: {
      parts: [
        {
          text,
          position: {
            start: 0,
            end: 10,
          },
        },
      ],
      plainText: text,
    },
    selection: {
      start: cursor,
      end: cursor,
    },
    config: {
      trigger: '@',
      allowedSpacesCount: 0,
    },
  });

  expect(keyword).toEqual('');
});

test('getting correct parts interval', () => {
  const cursor = 0;
  const text = 'Hello👨‍👩‍👧‍👦, how are you?';

  const parts: Part[] = [
    {
      text,
      position: {
        start: 0,
        end: getTextLength(text),
      },
    },
  ];

  const expectedText = 'Hello👨‍👩‍👧‍👦, how are you';
  expect(getPartsInterval(parts, cursor, getTextLength(expectedText))).toEqual([
    {
      text: expectedText,
      position: {
        start: 0,
        end: getTextLength(expectedText),
      },
    },
  ]);
});

test('generates regex result part', () => {
  const user = users[1];

  const mentionValue = getTriggerValue(mentionConfig, user);
  expect(mentionValue).toEqual(`{@}[${user.name}](${user.id})`);

  const mentionData = {
    original: mentionValue,
    trigger: mentionConfig.trigger,
    ...user,
  };
  const mentionPart = generateTriggerPart(mentionConfig, mentionData);

  const expectedPlainText = `@${user.name}`;

  expect(mentionPart).toEqual<Part>({
    text: expectedPlainText,
    config: mentionConfig,
    data: mentionData,
    position: {
      start: 0,
      end: getTextLength(expectedPlainText),
    },
  });
});

test('generates correct parts length from value', () => {
  expect(parseValue('Hey David! How are you?', configs).parts.length).toEqual(1);

  expect(parseValue('{@}[David](1)', configs).parts.length).toEqual(1);

  expect(parseValue('Hey, {@}[David](1)', configs).parts.length).toEqual(2);

  expect(parseValue('Hey, {@}[David](1)! How are you?', configs).parts.length).toEqual(3);

  expect(
    parseValue('https://google.com/, Hey, {@}[David](1)! How are you?', configs).parts.length,
  ).toEqual(4);

  expect(
    parseValue('https://google.com/, Hey, {@}[David](1)! How are you, {@}[David](1)?', configs).parts
      .length,
  ).toEqual(6);

  expect(parseValue('{#}[help](help)', configs).parts.length).toEqual(1);

  expect(
    parseValue('{#}[help](help), {@}[David](1), {#}[to_do](to_do)!', configs).parts.length,
  ).toEqual(6);
});

test('generates correct parts', () => {
  const user = users[1];

  const mentionValue = `{@}[${user.name}](${user.id})`;

  const expectingPlainText = `@${user.name}`;

  const expectedMentionPart = {
    config: mentionConfig,
    text: expectingPlainText,
    data: {
      id: user.id,
      name: user.name,
      trigger: '@',
      original: mentionValue,
    },
    position: {
      start: 0,
      end: getTextLength(expectingPlainText),
    },
  };

  let { parts } = parseValue(mentionValue, [mentionConfig]);

  expect(parts).toEqual<Part[]>([expectedMentionPart]);

  ({ parts } = parseValue(`${mentionValue} hey!`, [mentionConfig]));

  expect(parts).toEqual<Part[]>([
    expectedMentionPart,
    {
      text: ' hey!',
      position: {
        start: getTextLength(expectingPlainText),
        end: getTextLength(expectingPlainText) + 5,
      },
    },
  ]);
});

test('generates value from parts and changed text', () => {
  const { parts, plainText } = parseValue('Hey', [mentionConfig]);

  const newValue = generateValueFromMentionStateAndChangedText(
    {
      parts,
      plainText,
    },
    'Hey David!👨‍👩‍👧‍👦',
  );
  expect(newValue).toEqual<string>('Hey David!👨‍👩‍👧‍👦');
});

const getExpectingResultForKeyword = (keyword?: string) => ({
  mention: {
    keyword,
    onSelect: expect.any(Function),
  },
});

test('getting correct mention part type keywords', () => {
  let text = 'Hello @David Tabaka how are you?';

  let { parts, plainText } = parseValue(text, [mentionConfig]);

  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 0,
        end: 0,
      },
      triggersConfig,
      () => {},
    ),
  ).toEqual(getExpectingResultForKeyword(undefined));
  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 7,
        end: 7,
      },
      triggersConfig,
    ),
  ).toEqual(getExpectingResultForKeyword(''));
  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 12,
        end: 12,
      },
      triggersConfig,
    ),
  ).toEqual(getExpectingResultForKeyword('David'));
  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 19,
        end: 19,
      },
      triggersConfig,
    ),
  ).toEqual(getExpectingResultForKeyword('David Tabaka'));
  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 20,
        end: 20,
      },
      triggersConfig,
    ),
  ).toEqual(getExpectingResultForKeyword(undefined));

  // Text with already present mention part type
  text = 'Hello {@}[David](2b) how are you?';
  ({ parts, plainText } = parseValue(text, [mentionConfig]));

  // 'Hello {@}[Dav|id](2b) how are you?' - should not find keyword due to the we are in mention
  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 10,
        end: 10,
      },
      triggersConfig,
    ),
  ).toEqual(getExpectingResultForKeyword(undefined));

  // 'Hello {@}[David](2b) ho|w are you?' - should not find keyword due to the we have mention there
  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 15,
        end: 15,
      },
      triggersConfig,
    ),
  ).toEqual(getExpectingResultForKeyword(undefined));

  // 'Hello {@}[David](2b)| how are you?' - should not find keyword due to we have mention there
  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 12,
        end: 12,
      },
      triggersConfig,
    ),
  ).toEqual(getExpectingResultForKeyword(undefined));

  // Text with email entering
  text = 'Hello dabakovich@gmail.com';
  ({ parts, plainText } = parseValue(text, [mentionConfig]));

  // 'Hello dabakovich@gmail.com' - should not find keyword due to we don't have space or new line before trigger
  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 17,
        end: 17,
      },
      triggersConfig,
    ),
  ).toEqual(getExpectingResultForKeyword(undefined));

  // Text with triggers at the beginning of string or line
  text = '@\n@';
  ({ parts, plainText } = parseValue(text, [mentionConfig]));

  // 'Hello dabakovich@gmail.com' - should find trigger at the beginning of string
  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 1,
        end: 1,
      },
      triggersConfig,
    ),
  ).toEqual(getExpectingResultForKeyword(''));

  // 'Hello dabakovich@gmail.com' - should find trigger at the beginning of line
  expect(
    getTriggerPartSuggestionKeywords(
      {
        parts,
        plainText,
      },
      {
        start: 3,
        end: 3,
      },
      triggersConfig,
    ),
  ).toEqual(getExpectingResultForKeyword(''));
});

test("replacing mention's value", () => {
  const value = '{@}[David](1) and {@}[Mary](2)';

  const replacedById = replaceTriggerValues(value, ({ id }) => `@${id}`);
  expect(replacedById).toEqual<string>('@1 and @2');

  const replacedByName = replaceTriggerValues(value, ({ name }) => `@${name}`);
  expect(replacedByName).toEqual<string>('@David and @Mary');
});
