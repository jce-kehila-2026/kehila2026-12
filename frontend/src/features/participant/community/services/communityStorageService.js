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

// The accepted-version cache is namespaced per user so acceptance never leaks
// between accounts sharing a browser (or an admin impersonating a participant):
// without the uid suffix, the first member to accept would suppress the modal
// for every subsequent member on that device. Falls back to the legacy global
// key when no uid is supplied so older callers keep working.
const getAcceptedGuidelinesKey = (uid) => (
  uid ? `${COMMUNITY_GUIDELINES_ACCEPTED_KEY}:${uid}` : COMMUNITY_GUIDELINES_ACCEPTED_KEY
);

export const getAcceptedGuidelinesVersion = (uid) => (
  safeLoadStringFromStorage(getAcceptedGuidelinesKey(uid))
);

export const saveAcceptedGuidelinesVersion = (version, uid) => {
  safeSaveStringToStorage(
    getAcceptedGuidelinesKey(uid),
    version ?? COMMUNITY_GUIDELINES_VERSION,
  );
};
