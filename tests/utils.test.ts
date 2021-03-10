import { MentionPartType, Part, PartType, PatternPartType } from '../src/types';
import {
  generateMentionPart,
  generatePlainTextPart,
  generateValueFromPartsAndChangedText,
  getMentionPartSuggestionKeywords,
  getMentionValue,
  parseValue,
  replaceMentionValues,
} from '../src/utils';

const users = [
  {id: '1-a', name: 'David Tabaka'},
  {id: '2b', name: 'Mary'},
  {id: '3', name: 'Tony'},
  {id: 'c4', name: 'Mike'},
  {id: 'd-5', name: 'Grey'},
];

const mentionPartType: MentionPartType = {
  trigger: '@',
};

const hashtagPartType: MentionPartType = {
  trigger: '#',
};

const urlPatternPartType: PatternPartType = {
  pattern: /(https?:\/\/|www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.(xn--)?[a-z0-9-]{2,20}\b([-a-zA-Z0-9@:%_\+\[\],.~#?&\/=]*[-a-zA-Z0-9@:%_\+\]~#?&\/=])*/gi,
};

const partTypes: PartType[] = [
  mentionPartType,
  hashtagPartType,
  urlPatternPartType,
];

test('generates plain text part', () => {
  const text = 'Hey';
  expect(generatePlainTextPart(text)).toEqual<Part>({text, position: {start: 0, end: text.length}});
});

test('generates regex result part', () => {
  const mentionValue = getMentionValue(mentionPartType.trigger, users[1]);
  expect(mentionValue).toEqual(`@[Mary](2b)`);

  const mentionData = {original: mentionValue, trigger: mentionPartType.trigger, ...users[1]};
  const mentionPart = generateMentionPart(mentionPartType, mentionData);
  expect(mentionPart).toEqual<Part>({
    text: '@Mary',
    partType: mentionPartType,
    data: mentionData,
    position: {start: 0, end: '@Mary'.length},
  });
});

test('generates correct parts length from value', () => {
  expect(
    parseValue('Hey David! How are you?', partTypes).parts.length,
  ).toEqual(1);

  expect(
    parseValue('@[David](1)', partTypes).parts.length,
  ).toEqual(1);

  expect(
    parseValue('Hey, @[David](1)', partTypes).parts.length,
  ).toEqual(2);

  expect(
    parseValue('Hey, @[David](1)! How are you?', partTypes).parts.length,
  ).toEqual(3);

  expect(
    parseValue('https://google.com/, Hey, @[David](1)! How are you?', partTypes).parts.length,
  ).toEqual(4);

  expect(
    parseValue('https://google.com/, Hey, @[David](1)! How are you, @[David](1)?', partTypes).parts.length,
  ).toEqual(6);

  expect(
    parseValue('#[help](help)', partTypes).parts.length,
  ).toEqual(1);

  expect(
    parseValue('#[help](help), @[David](1), #[to_do](to_do)!', partTypes).parts.length,
  ).toEqual(6);
});

test('generates correct parts', () => {
  const mentionValue = '@[David](1:@)';
  const expectedMentionPart = {
    partType: mentionPartType,
    text: '@David',
    data: {
      id: '1:@',
      name: 'David',
      trigger: '@',
      original: '@[David](1:@)',
    },
    position: {start: 0, end: 6},
  };

  let {parts} = parseValue(mentionValue, [mentionPartType]);

  expect(parts).toEqual<Part[]>([expectedMentionPart]);

  ({parts} = parseValue(`${mentionValue} hey!`, [mentionPartType]));

  expect(parts).toEqual<Part[]>([
    expectedMentionPart,
    {text: ' hey!', position: {start: 6, end: 11}},
  ]);

});

test('generates value from parts and changed text', () => {
  const {parts, plainText} = parseValue('Hey', [mentionPartType]);

  const newValue = generateValueFromPartsAndChangedText(parts, plainText, 'Hey David!');
  expect(newValue).toEqual<string>('Hey David!');
});

test('getting correct mention part type keywords', () => {
  let text = 'Hello @David Tabaka how are you?';

  let {parts, plainText} = parseValue(text, [mentionPartType]);

  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 0, end: 0}, [mentionPartType]
  )).toEqual({'@': undefined});
  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 7, end: 7}, [mentionPartType]
  )).toEqual({'@': ''});
  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 12, end: 12}, [mentionPartType]
  )).toEqual({'@': 'David'});
  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 19, end: 19}, [mentionPartType]
  )).toEqual({'@': 'David Tabaka'});
  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 20, end: 20}, [mentionPartType]
  )).toEqual({'@': undefined});

  // Text with already present mention part type
  text = 'Hello @[David](2b) how are you?';
  ({parts, plainText} = parseValue(text, [mentionPartType]));

  // 'Hello @[Dav|id](2b) how are you?' - should not find keyword due to the we are in mention
  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 10, end: 10}, [mentionPartType]
  )).toEqual({'@': undefined});

  // 'Hello @[David](2b) ho|w are you?' - should not find keyword due to the we have mention there
  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 15, end: 15}, [mentionPartType]
  )).toEqual({'@': undefined});

  // 'Hello @[David](2b)| how are you?' - should not find keyword due to the we have mention there
  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 12, end: 12}, [mentionPartType]
  )).toEqual({'@': undefined});

  // Text with email entering
  text = 'Hello dabakovich@gmail.com';
  ({parts, plainText} = parseValue(text, [mentionPartType]));

  // 'Hello dabakovich@gmail.com' - should not find keyword due to the we don't have space or new line before trigger
  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 17, end: 17}, [mentionPartType]
  )).toEqual({'@': undefined});

  // Text with triggers at the beginning of string or line
  text = '@\n@';
  ({parts, plainText} = parseValue(text, [mentionPartType]));

  // 'Hello dabakovich@gmail.com' - should find trigger at the beginning of string
  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 1, end: 1}, [mentionPartType]
  )).toEqual({'@': ''});

  // 'Hello dabakovich@gmail.com' - should find trigger at the beginning of line
  expect(getMentionPartSuggestionKeywords(
    parts, plainText, {start: 3, end: 3}, [mentionPartType]
  )).toEqual({'@': ''});
});

test('replacing mention\'s value', () => {
  const value = '@[David](1) and @[Mary](2)';

  const replacedById = replaceMentionValues(value, ({id}) => `@${id}`);
  expect(replacedById).toEqual<string>('@1 and @2');

  const replacedByName = replaceMentionValues(value, ({name}) => `@${name}`);
  expect(replacedByName).toEqual<string>('@David and @Mary');
});
