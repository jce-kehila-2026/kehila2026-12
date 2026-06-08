/**
 * Resolves a participant's first name from profile or auth data.
 * @param {object|null|undefined} profile
 * @param {{ displayName?: string|null }|null|undefined} authUser
 * @returns {string}
 */
export function getParticipantFirstName(profile, authUser) {
  const fullName = String(
    profile?.fullName
    || profile?.firstName
    || authUser?.displayName
    || '',
  ).trim();

  if (!fullName) return '';

  return fullName.split(/\s+/)[0];
}

/**
 * @param {object|null|undefined} profile
 * @param {{ displayName?: string|null }|null|undefined} authUser
 * @returns {string}
 */
export function getParticipantFullName(profile, authUser) {
  return String(
    profile?.fullName
    || profile?.firstName
    || authUser?.displayName
    || '',
  ).trim();
}

/**
 * @param {object|null|undefined} profile
 * @param {{ email?: string|null }|null|undefined} authUser
 * @returns {string}
 */
export function getParticipantEmail(profile, authUser) {
  const email = String(profile?.email || authUser?.email || '').trim();
  return email || 'No email available';
}
