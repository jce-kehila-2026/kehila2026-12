import {
  COMMUNITY_GUIDELINES_ACCEPTED_KEY,
  COMMUNITY_GUIDELINES_VERSION,
} from '../constants/communityConstants';

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

export const getAcceptedGuidelinesVersion = () => (
  safeLoadStringFromStorage(COMMUNITY_GUIDELINES_ACCEPTED_KEY)
);

export const saveAcceptedGuidelinesVersion = (version) => {
  safeSaveStringToStorage(
    COMMUNITY_GUIDELINES_ACCEPTED_KEY,
    version ?? COMMUNITY_GUIDELINES_VERSION,
  );
};
