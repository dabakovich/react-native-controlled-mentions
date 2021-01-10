import { MentionPartType, Part, PartType, PatternPartType } from '../src/types';
import {
  generateMentionPart,
  parseValue,
  generatePlainTextPart,
  generateValueFromPartsAndChangedText,
  getMentionValue,
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

test('generates value from parts and changed text', () => {
  const {parts, plainText} = parseValue('Hey', [mentionPartType]);

  const newValue = generateValueFromPartsAndChangedText(parts, plainText, 'Hey David!');
  expect(newValue).toEqual<string>('Hey David!');
});
