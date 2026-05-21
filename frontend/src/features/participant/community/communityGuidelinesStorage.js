export const COMMUNITY_GUIDELINES_VERSION = 'v1';
export const COMMUNITY_GUIDELINES_ACCEPTED_KEY = 'communityGuidelinesAccepted';

export function getAcceptedGuidelinesVersion() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(COMMUNITY_GUIDELINES_ACCEPTED_KEY);
  } catch (error) {
    console.warn('Unable to read community guidelines acceptance:', error);
    return null;
  }
}

export function saveAcceptedGuidelinesVersion() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(COMMUNITY_GUIDELINES_ACCEPTED_KEY, COMMUNITY_GUIDELINES_VERSION);
  } catch (error) {
    console.warn('Unable to save community guidelines acceptance:', error);
  }
}
