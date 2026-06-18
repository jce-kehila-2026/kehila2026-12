// `labelKey` resolves to a participant-UI translation key (see
// participantUiTranslations.js); the rendered label is localized at the call site.
export const FEED_TABS = [
  { id: 'all', labelKey: 'tabAllPosts' },
  { id: 'following', labelKey: 'tabFollowing' },
  { id: 'my-posts', labelKey: 'tabMyPosts' },
  { id: 'anonymous', labelKey: 'tabAnonymous' },
];

// `value` is the canonical (stable) reason persisted with a report so admin
// moderation stays language-independent; `labelKey` is only for display.
export const REPORT_REASON_OPTIONS = [
  { value: 'Offensive content', labelKey: 'reasonOffensive' },
  { value: 'Harassment or bullying', labelKey: 'reasonHarassment' },
  { value: 'False information', labelKey: 'reasonFalseInfo' },
  { value: 'Spam', labelKey: 'reasonSpam' },
  { value: 'Inappropriate community content', labelKey: 'reasonInappropriate' },
  { value: 'Other', labelKey: 'reasonOther' },
];

export const COMMUNITY_POSTS_STORAGE_KEY = 'community.posts';
export const COMMUNITY_STREAK_STORAGE_KEY = 'community.streak';
export const COMMUNITY_PREFERENCES_STORAGE_KEY = 'community.preferences';
export const COMMUNITY_USER_PROFILE_STORAGE_KEY = 'community.userProfile';
export const COMMUNITY_FOLLOWED_AUTHORS_STORAGE_KEY = 'community.followedAuthors';
export const COMMUNITY_GUIDELINES_VERSION = 'v1';
export const COMMUNITY_GUIDELINES_ACCEPTED_KEY = 'communityGuidelinesAccepted';

export const COMMUNITY_POST_STATUS = {
  active: 'active',
  visible: 'visible',
  reported: 'reported',
  hidden: 'hidden',
  deleted: 'deleted',
};

export const COMMUNITY_USER_STATUS = {
  active: 'active',
  inactive: 'inactive',
  blocked: 'blocked',
};
