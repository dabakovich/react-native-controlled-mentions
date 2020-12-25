import { Part } from '../src/types';
import {
  generatePart,
  generateMentionPart,
  getMentionValue,
  generateValueFromPartsAndChangedText,
  getPartsFromValue,
} from '../src/utils';

const trigger = '@';

const users = [
  {id: '1-a', name: 'David Tabaka'},
  {id: '2b', name: 'Mary'},
  {id: '3', name: 'Tony'},
  {id: 'c4', name: 'Mike'},
  {id: 'd-5', name: 'Grey'},
];

test('generates correct parts', () => {
  const text = 'Hey';
  expect(generatePart(text)).toEqual<Part>({text, position: {start: 0, end: text.length}});
});

test('generates correct parts', () => {
  const textPart = generatePart('Hey');
  expect(textPart).toEqual<Part>({text: 'Hey', position: {start: 0, end: 'Hey'.length}});

  const mentionValue = getMentionValue(users[1]);
  expect(mentionValue).toEqual(`@[Mary](2b)`);

  const mentionPart = generateMentionPart(trigger, {...users[1], original: mentionValue});
  expect(mentionPart).toEqual<Part>({
    text: '@Mary',
    data: {...users[1], original: mentionValue},
    position: {start: 0, end: '@Mary'.length},
  });

});

test('generates value from parts and changed text', () => {
  const {parts, plainText} = getPartsFromValue(trigger, 'Hey');

  expect(generateValueFromPartsAndChangedText(parts, plainText, 'Hey David!'))
    .toEqual<string>('Hey David!');
});
