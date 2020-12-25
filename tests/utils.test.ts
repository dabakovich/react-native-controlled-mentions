import { MentionType, Part } from '../src/types';
import {
  generatePart,
  generateMentionPart,
  getMentionValue,
  generateValueFromPartsAndChangedText,
  getPartsFromValue,
} from '../src/utils';

const users = [
  {id: '1-a', name: 'David Tabaka'},
  {id: '2b', name: 'Mary'},
  {id: '3', name: 'Tony'},
  {id: 'c4', name: 'Mike'},
  {id: 'd-5', name: 'Grey'},
];

const mentionType: MentionType = {
  trigger: '@',
};

test('generates correct parts', () => {
  const text = 'Hey';
  expect(generatePart(text)).toEqual<Part>({text, position: {start: 0, end: text.length}});
});

test('generates correct parts', () => {
  const textPart = generatePart('Hey');
  expect(textPart).toEqual<Part>({text: 'Hey', position: {start: 0, end: 'Hey'.length}});

  const mentionValue = getMentionValue(mentionType.trigger, users[1]);
  expect(mentionValue).toEqual(`@[Mary](2b)`);

  const mentionData = {original: mentionValue, trigger: mentionType.trigger, ...users[1]};
  const mentionPart = generateMentionPart(mentionType, mentionData);
  expect(mentionPart).toEqual<Part>({
    text: '@Mary',
    data: mentionData,
    position: {start: 0, end: '@Mary'.length},
  });
});

test('generates value from parts and changed text', () => {
  const {parts, plainText} = getPartsFromValue([mentionType], 'Hey');

  const newValue = generateValueFromPartsAndChangedText(parts, plainText, 'Hey David!');
  expect(newValue).toEqual<string>('Hey David!');
});
