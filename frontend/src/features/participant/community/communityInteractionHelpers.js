import {
  COMMUNITY_POST_STATUS,
} from './communityModels';
import {
  formatRelativeCommunityTime,
  getDayDifference,
  getDateKeyTimestamp,
  getTodayKey,
  isStreakAtRiskForDate,
  isStreakReminderDueForDate,
  normalizeCommunityDateKey,
  parseCommunityDate,
} from './utils/communityDateUtils';
import { isCommunityContentVisible } from './utils/communityModerationUtils';

export {
  COMMUNITY_FOLLOWED_AUTHORS_STORAGE_KEY,
  COMMUNITY_PREFERENCES_STORAGE_KEY,
  COMMUNITY_POSTS_STORAGE_KEY,
  COMMUNITY_STREAK_STORAGE_KEY,
  COMMUNITY_USER_PROFILE_STORAGE_KEY,
} from './constants/communityConstants';
export {
  formatRelativeCommunityTime,
  getDateKeyTimestamp,
  getDayDifference,
  getTodayKey,
  isStreakAtRiskForDate,
  isStreakReminderDueForDate,
  normalizeCommunityDateKey,
  parseCommunityDate,
} from './utils/communityDateUtils';
export { isCommunityContentVisible } from './utils/communityModerationUtils';

export const INITIAL_COMMUNITY_STREAK_COUNT = 0;
export const INITIAL_LAST_ACTIVITY_DATE = null;

export const createCommunityId = (prefix, createdAt = new Date()) => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${createdAt.getTime()}`
);
