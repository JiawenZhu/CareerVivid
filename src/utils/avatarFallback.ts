export type CareerVividAvatarVariant = 'glasses' | 'bow';

export const CAREERVIVID_RABBIT_AVATARS: Record<CareerVividAvatarVariant, string> = {
  glasses: '/avatars/careervivid-rabbit-glasses.jpg',
  bow: '/avatars/careervivid-rabbit-bow.jpg',
};

const FEMALE_FIRST_NAMES = new Set([
  'ava', 'emma', 'olivia', 'sophia', 'isabella', 'mia', 'amelia', 'harper',
  'evelyn', 'abigail', 'ella', 'scarlett', 'grace', 'chloe', 'lily', 'zoe',
  'nora', 'hannah', 'aria', 'layla', 'violet', 'ellie', 'stella', 'natalie',
  'maya', 'leah', 'audrey', 'bella', 'claire', 'lucy', 'anna', 'sarah',
  'emily', 'elizabeth', 'victoria', 'eva', 'eve', 'jane', 'julia', 'laura',
  'samantha', 'rachel', 'ashley', 'jessica', 'amanda', 'nicole', 'melissa',
  'michelle', 'kimberly', 'angela', 'stephanie', 'christina', 'katherine',
  'catherine', 'madison', 'alexandra', 'alyssa', 'brianna', 'jennifer',
  'mary', 'patricia', 'linda', 'barbara', 'susan', 'margaret', 'lisa',
  'nancy', 'karen', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth',
]);

const MALE_FIRST_NAMES = new Set([
  'liam', 'noah', 'oliver', 'elijah', 'james', 'william', 'benjamin',
  'lucas', 'henry', 'theodore', 'jack', 'levi', 'alexander', 'jackson',
  'mateo', 'daniel', 'michael', 'mason', 'sebastian', 'ethan', 'logan',
  'owen', 'samuel', 'jacob', 'asher', 'aiden', 'john', 'joseph', 'david',
  'wyatt', 'matthew', 'luke', 'dylan', 'isaac', 'gabriel', 'carter',
  'anthony', 'jayden', 'ezra', 'evan', 'robert', 'charles', 'thomas',
  'christopher', 'mark', 'donald', 'george', 'kenneth', 'steven', 'edward',
  'brian', 'ronald', 'anthony', 'kevin', 'jason', 'jeffrey', 'ryan',
  'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin',
  'scott', 'brandon', 'frank', 'gregory', 'raymond', 'patrick', 'alex',
]);

const FEMALE_NAME_SUFFIXES = ['ella', 'elle', 'ette', 'ina', 'ia', 'lyn', 'lynn'];

interface AvatarFallbackInput {
  displayName?: string | null;
  firstName?: string | null;
  email?: string | null;
  seed?: string | null;
}

interface PreferredAvatarInput extends AvatarFallbackInput {
  photoURL?: string | null;
  avatarUrl?: string | null;
}

const normalizeName = (value?: string | null): string => {
  if (!value) return '';

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
};

const getFirstNameCandidate = ({ displayName, firstName, email }: AvatarFallbackInput): string => {
  const directName = normalizeName(firstName);
  if (directName) return directName;

  const displayFirstName = normalizeName(displayName?.trim().split(/\s+/)[0]);
  if (displayFirstName) return displayFirstName;

  const emailName = email?.split('@')[0]?.split(/[._+\-\d]+/)[0] || '';
  return normalizeName(emailName);
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export const getCareerVividAvatarVariant = (input: AvatarFallbackInput): CareerVividAvatarVariant => {
  const firstName = getFirstNameCandidate(input);

  if (FEMALE_FIRST_NAMES.has(firstName)) return 'bow';
  if (MALE_FIRST_NAMES.has(firstName)) return 'glasses';

  if (
    firstName.length > 3 &&
    FEMALE_NAME_SUFFIXES.some((suffix) => firstName.endsWith(suffix))
  ) {
    return 'bow';
  }

  const seed = firstName || input.email || input.displayName || input.seed || 'careervivid';
  return hashString(seed) % 2 === 0 ? 'glasses' : 'bow';
};

export const getCareerVividFallbackAvatar = (input: AvatarFallbackInput): string => {
  return CAREERVIVID_RABBIT_AVATARS[getCareerVividAvatarVariant(input)];
};

export const getPreferredUserAvatar = (input: PreferredAvatarInput): string => {
  const accountAvatar = input.photoURL?.trim() || input.avatarUrl?.trim();
  return accountAvatar || getCareerVividFallbackAvatar(input);
};
