import { StyleProp, TextStyle } from 'react-native';

/**
 * RegEx grouped results. Example - "{@}[Full Name](123abc)"
 * We have 4 groups here:
 * - The whole original string - "{@}[Full Name](123abc)"
 * - Mention trigger - "@"
 * - Name - "Full Name"
 * - Id - "123abc"
 */
const triggerRegEx = /({([^{^}]*)}\[([^[]*)]\(([^(^)]*)\))/i;

/**
 * We need this single group regex for using String.prototype.split method
 */
const singleGroupTriggerRegEx = /({[^{^}]*}\[[^[]*]\([^(^)]*\))/gi;

const DEFAULT_ALLOWED_SPACES_COUNT = 1;

// Empty object with static reference
const emptyObject: any = {};

const defaultTriggerTextStyle: StyleProp<TextStyle> = {
  fontWeight: 'bold',
  color: 'blue',
};

export {
  triggerRegEx,
  singleGroupTriggerRegEx,
  DEFAULT_ALLOWED_SPACES_COUNT,
  emptyObject,
  defaultTriggerTextStyle,
};
