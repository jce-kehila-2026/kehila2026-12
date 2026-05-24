import {
  COMMUNITY_FOLLOWED_AUTHORS_STORAGE_KEY,
  COMMUNITY_GUIDELINES_ACCEPTED_KEY,
  COMMUNITY_GUIDELINES_VERSION,
  COMMUNITY_PREFERENCES_STORAGE_KEY,
  COMMUNITY_POSTS_STORAGE_KEY,
  COMMUNITY_STREAK_STORAGE_KEY,
  COMMUNITY_USER_PROFILE_STORAGE_KEY,
} from '../constants/communityConstants';

export const safeLoadFromStorage = (storageKey) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return null;

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
};

export const safeSaveToStorage = (storageKey, value) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Storage can fail in private mode or when quota is exceeded; keep local state working.
  }
};

export const safeLoadStringFromStorage = (storageKey) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return null;

  try {
    return window.localStorage.getItem(storageKey);
  } catch (error) {
    console.warn(`Unable to read ${storageKey}:`, error);
    return null;
  }
};

export const safeSaveStringToStorage = (storageKey, value) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey, value);
  } catch (error) {
    console.warn(`Unable to save ${storageKey}:`, error);
  }
};

export const loadStoredCommunityPosts = () => safeLoadFromStorage(COMMUNITY_POSTS_STORAGE_KEY);

export const saveStoredCommunityPosts = (serializedPosts) => {
  safeSaveToStorage(COMMUNITY_POSTS_STORAGE_KEY, serializedPosts);
};

export const loadStoredCommunityStreak = () => safeLoadFromStorage(COMMUNITY_STREAK_STORAGE_KEY);

export const saveStoredCommunityStreak = (streakState) => {
  safeSaveToStorage(COMMUNITY_STREAK_STORAGE_KEY, streakState);
};

export const loadStoredCommunityPreferences = () => (
  safeLoadFromStorage(COMMUNITY_PREFERENCES_STORAGE_KEY)
);

export const saveStoredCommunityPreferences = (serializedPreferences) => {
  safeSaveToStorage(COMMUNITY_PREFERENCES_STORAGE_KEY, serializedPreferences);
};

export const loadStoredCommunityUserProfile = () => (
  safeLoadFromStorage(COMMUNITY_USER_PROFILE_STORAGE_KEY)
);

export const saveStoredCommunityUserProfile = (serializedProfile) => {
  safeSaveToStorage(COMMUNITY_USER_PROFILE_STORAGE_KEY, serializedProfile);
};

export const loadStoredFollowedAuthors = () => {
  const storedAuthors = safeLoadFromStorage(COMMUNITY_FOLLOWED_AUTHORS_STORAGE_KEY);
  return Array.isArray(storedAuthors)
    ? storedAuthors.filter((author) => typeof author === 'string' && author.trim())
    : [];
};

export const saveStoredFollowedAuthors = (followedAuthors) => {
  safeSaveToStorage(COMMUNITY_FOLLOWED_AUTHORS_STORAGE_KEY, followedAuthors);
};

export const getAcceptedGuidelinesVersion = () => (
  safeLoadStringFromStorage(COMMUNITY_GUIDELINES_ACCEPTED_KEY)
);

export const saveAcceptedGuidelinesVersion = () => {
  safeSaveStringToStorage(COMMUNITY_GUIDELINES_ACCEPTED_KEY, COMMUNITY_GUIDELINES_VERSION);
};
