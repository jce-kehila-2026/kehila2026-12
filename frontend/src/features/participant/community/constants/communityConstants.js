export const FEED_TABS = [
  { id: 'all', label: 'All Posts' },
  { id: 'following', label: 'Following' },
  { id: 'anonymous', label: 'Anonymous' },
];

export const REPORT_REASON_OPTIONS = [
  'Offensive content',
  'Harassment or bullying',
  'False information',
  'Spam',
  'Inappropriate community content',
  'Other',
];

export const COMMUNITY_POSTS_STORAGE_KEY = 'community.posts';
export const COMMUNITY_STREAK_STORAGE_KEY = 'community.streak';
export const COMMUNITY_PREFERENCES_STORAGE_KEY = 'community.preferences';
export const COMMUNITY_USER_PROFILE_STORAGE_KEY = 'community.userProfile';
export const COMMUNITY_FOLLOWED_AUTHORS_STORAGE_KEY = 'community.followedAuthors';

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
