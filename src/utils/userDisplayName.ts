const GENERIC_DISPLAY_NAMES = new Set([
  'anonymous developer',
  'community member',
  'careervivid user',
  'careervivid member',
  'user',
  'my profile',
]);

export const getEmailDisplayName = (email?: string | null): string => {
  const value = (email || '').trim();
  if (!value) return '';

  const atIndex = value.indexOf('@');
  const localPart = atIndex > 0 ? value.slice(0, atIndex) : value;
  return localPart.trim();
};

const cleanDisplayName = (name?: string | null): string => (name || '').trim();

const isGenericDisplayName = (name: string): boolean =>
  GENERIC_DISPLAY_NAMES.has(name.toLowerCase());

interface ResolveUserDisplayNameInput {
  profileDisplayName?: string | null;
  email?: string | null;
  authDisplayName?: string | null;
  fallback?: string;
}

export const resolveUserDisplayName = ({
  profileDisplayName,
  email,
  authDisplayName,
  fallback = 'CareerVivid member',
}: ResolveUserDisplayNameInput): string => {
  const profileName = cleanDisplayName(profileDisplayName);
  if (profileName && !isGenericDisplayName(profileName)) {
    return profileName;
  }

  const emailName = getEmailDisplayName(email);
  if (emailName) {
    return emailName;
  }

  const authName = cleanDisplayName(authDisplayName);
  if (authName && !isGenericDisplayName(authName)) {
    return authName;
  }

  return fallback;
};

