import {
  COMMUNITY_POST_STATUS,
  createCommunityCommentModel,
  createCommunityPostModel,
  createCommunityStreakModel,
  createCommunityUserProfileModel,
} from './communityModels';

export const INITIAL_COMMUNITY_STREAK_COUNT = 0;
export const INITIAL_LAST_ACTIVITY_DATE = null;
export const COMMUNITY_POSTS_STORAGE_KEY = 'community.posts';
export const COMMUNITY_STREAK_STORAGE_KEY = 'community.streak';
export const COMMUNITY_PREFERENCES_STORAGE_KEY = 'community.preferences';
export const COMMUNITY_USER_PROFILE_STORAGE_KEY = 'community.userProfile';
export const COMMUNITY_FOLLOWED_AUTHORS_STORAGE_KEY = 'community.followedAuthors';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getModerationFields = (item = {}) => {
  const reportsCount = Number(item.reportsCount);

  return {
    status: item.status ?? COMMUNITY_POST_STATUS.active,
    reportsCount: Number.isFinite(reportsCount) && reportsCount >= 0 ? reportsCount : 0,
    reportedBy: Array.isArray(item.reportedBy) ? item.reportedBy : [],
    hiddenByAdmin: Boolean(item.hiddenByAdmin),
  };
};

export const isCommunityContentVisible = (item = {}) => (
  !item.hiddenByAdmin
  && item.status !== COMMUNITY_POST_STATUS.hidden
  && item.status !== COMMUNITY_POST_STATUS.deleted
);

export const createCommunityId = (prefix, createdAt = new Date()) => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${createdAt.getTime()}`
);

export const createPostModel = ({ author, content, isAnonymous, attachment = null }) => {
  const createdAt = new Date();
  const postModel = createCommunityPostModel({
    id: createCommunityId('community-post', createdAt),
    authorDisplayName: author,
    isAnonymous,
    content,
    createdAt,
    updatedAt: createdAt,
  });

  return {
    ...postModel,
    author,
    isLiked: false,
    initials: isAnonymous ? 'AU' : 'CU',
    time: 'Just now',
    topic: 'Community share',
    title: 'New community post',
    body: content,
    likes: 0,
    support: 0,
    supportCount: 0,
    isSupported: false,
    attachment,
    tone: 'pink',
    previewComments: [],
  };
};

export const createCommentModel = (content, author = 'Current User') => {
  const createdAt = new Date();
  const commentModel = createCommunityCommentModel({
    id: createCommunityId('community-comment', createdAt),
    authorDisplayName: author,
    content,
    createdAt,
    updatedAt: createdAt,
  });

  return {
    ...commentModel,
    author,
    initials: 'CU',
    time: 'Just now',
    text: content,
  };
};

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

export const getTodayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getDateKeyTimestamp = (dateKey) => {
  if (typeof dateKey !== 'string') return null;

  const dateParts = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateParts) return null;

  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]);
  const day = Number(dateParts[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year
    || parsedDate.getMonth() !== month - 1
    || parsedDate.getDate() !== day
  ) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
};

export const getDayDifference = (previousDateKey, currentDateKey = getTodayKey()) => {
  const previousTimestamp = getDateKeyTimestamp(previousDateKey);
  const currentTimestamp = getDateKeyTimestamp(currentDateKey);

  if (previousTimestamp === null || currentTimestamp === null) return null;

  return Math.round((currentTimestamp - previousTimestamp) / MS_PER_DAY);
};

export const isStreakAtRiskForDate = (lastActivityDate, todayKey = getTodayKey()) => (
  getDayDifference(lastActivityDate, todayKey) === 2
);

const normalizeComment = (comment, index) => {
  const content = typeof comment?.content === 'string'
    ? comment.content
    : comment?.text ?? '';
  const createdAt = comment?.createdAt ?? null;

  return {
    ...comment,
    id: comment?.id ?? `stored-comment-${index + 1}`,
    author: comment?.author ?? 'Current User',
    authorDisplayName: comment?.authorDisplayName ?? comment?.author ?? 'Current User',
    content,
    createdAt,
    initials: comment?.initials ?? 'CU',
    time: comment?.time ?? 'Just now',
    text: comment?.text ?? content,
    ...getModerationFields(comment),
  };
};

const normalizeStoredPost = (post, index) => {
  const content = typeof post?.content === 'string' ? post.content : post?.body ?? '';
  const rawComments = Array.isArray(post?.comments)
    ? post.comments
    : Array.isArray(post?.previewComments)
      ? post.previewComments
      : [];
  const comments = rawComments.map(normalizeComment);
  const likesCount = Number.isFinite(post?.likesCount)
    ? post.likesCount
    : Number.isFinite(post?.likes)
      ? post.likes
      : 0;
  const supportCount = Number.isFinite(post?.supportCount)
    ? post.supportCount
    : Number.isFinite(post?.support)
      ? post.support
      : 0;

  return {
    ...post,
    id: post?.id ?? `stored-post-${index + 1}`,
    author: post?.author ?? 'Current User',
    authorDisplayName: post?.authorDisplayName ?? post?.author ?? 'Current User',
    content,
    createdAt: post?.createdAt ?? null,
    updatedAt: post?.updatedAt ?? null,
    likesCount,
    isLiked: Boolean(post?.isLiked),
    isAnonymous: Boolean(post?.isAnonymous),
    comments,
    initials: post?.initials ?? (post?.isAnonymous ? 'AU' : 'CU'),
    time: post?.time ?? 'Just now',
    topic: post?.topic ?? 'Community share',
    title: post?.title ?? 'New community post',
    body: post?.body ?? content,
    likes: likesCount,
    support: supportCount,
    supportCount,
    isSupported: Boolean(post?.isSupported),
    attachment: post?.attachment ?? null,
    tone: post?.tone ?? 'pink',
    category: post?.category,
    type: post?.type,
    previewComments: Array.isArray(post?.previewComments) ? post.previewComments : [],
    commentsCount: comments.filter(isCommunityContentVisible).length,
    ...getModerationFields(post),
  };
};

export const normalizeCommunityPosts = (posts) => posts.map(normalizeStoredPost);

export const serializeCommunityPost = (post) => ({
  id: post.id,
  author: post.author,
  authorDisplayName: post.authorDisplayName ?? post.author,
  content: post.content ?? post.body ?? '',
  createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt ?? null,
  updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt ?? null,
  likesCount: post.likesCount ?? post.likes ?? 0,
  isLiked: Boolean(post.isLiked),
  isAnonymous: Boolean(post.isAnonymous),
  commentsCount: Array.isArray(post.comments)
    ? post.comments.filter(isCommunityContentVisible).length
    : post.commentsCount ?? 0,
  status: post.status ?? COMMUNITY_POST_STATUS.active,
  reportsCount: post.reportsCount ?? 0,
  reportedBy: Array.isArray(post.reportedBy) ? post.reportedBy : [],
  hiddenByAdmin: Boolean(post.hiddenByAdmin),
  comments: Array.isArray(post.comments) ? post.comments.map((comment) => ({
    id: comment.id,
    author: comment.author,
    authorDisplayName: comment.authorDisplayName ?? comment.author,
    content: comment.content ?? comment.text ?? '',
    createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt ?? null,
    updatedAt: comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : comment.updatedAt ?? null,
    status: comment.status ?? COMMUNITY_POST_STATUS.active,
    reportsCount: comment.reportsCount ?? 0,
    reportedBy: Array.isArray(comment.reportedBy) ? comment.reportedBy : [],
    hiddenByAdmin: Boolean(comment.hiddenByAdmin),
    initials: comment.initials,
    time: comment.time,
    text: comment.text ?? comment.content ?? '',
  })) : [],
  initials: post.initials,
  time: post.time,
  topic: post.topic,
  title: post.title,
  body: post.body ?? post.content ?? '',
  likes: post.likesCount ?? post.likes ?? 0,
  support: post.supportCount ?? post.support ?? 0,
  supportCount: post.supportCount ?? post.support ?? 0,
  isSupported: Boolean(post.isSupported),
  attachment: post.attachment ?? null,
  tone: post.tone,
  category: post.category,
  type: post.type,
  previewComments: Array.isArray(post.previewComments) ? post.previewComments : [],
});

export const getInitialPosts = (defaultPosts) => {
  const storedPosts = safeLoadFromStorage(COMMUNITY_POSTS_STORAGE_KEY);

  if (Array.isArray(storedPosts)) {
    return storedPosts.map(normalizeStoredPost);
  }

  return normalizeCommunityPosts(defaultPosts);
};

export const getInitialStreakState = () => {
  const storedStreak = safeLoadFromStorage(COMMUNITY_STREAK_STORAGE_KEY);
  const storedStreakCount = Number(storedStreak?.streakCount);
  const storedLastActivityDate = storedStreak?.lastActivityDate;

  return createCommunityStreakModel({
    streakCount: Number.isFinite(storedStreakCount) && storedStreakCount >= 0
      ? storedStreakCount
      : INITIAL_COMMUNITY_STREAK_COUNT,
    lastActivityDate: getDateKeyTimestamp(storedLastActivityDate) === null
      ? INITIAL_LAST_ACTIVITY_DATE
      : storedLastActivityDate,
    updatedAt: storedStreak?.updatedAt ?? new Date(),
  });
};

export const getInitialCommunityPreferences = () => {
  const storedPreferences = safeLoadFromStorage(COMMUNITY_PREFERENCES_STORAGE_KEY);

  if (storedPreferences?.communityPreferencesCompleted === true) {
    return {
      birthdayVisibilityCompleted: true,
      showBirthday: Boolean(storedPreferences.showBirthdayInCommunity),
    };
  }

  return {
    birthdayVisibilityCompleted: false,
    showBirthday: false,
  };
};

export const serializeCommunityPreferences = (preferences) => ({
  communityPreferencesCompleted: Boolean(preferences.birthdayVisibilityCompleted),
  showBirthdayInCommunity: Boolean(preferences.showBirthday),
});

export const createDefaultCommunityUserProfile = () => createCommunityUserProfileModel({
  id: 'current-user',
  displayName: '',
  birthday: '',
  showBirthday: false,
  allowAnonymousPosting: true,
  profileCompleted: false,
});

const normalizeStoredCommunityUserProfile = (profile) => {
  if (!profile || profile.profileCompleted !== true || typeof profile.displayName !== 'string') {
    return createDefaultCommunityUserProfile();
  }

  const displayName = profile.displayName.trim();
  if (!displayName) return createDefaultCommunityUserProfile();

  return createCommunityUserProfileModel({
    id: profile.id || 'current-user',
    displayName,
    avatarUrl: profile.avatarUrl ?? '',
    birthday: profile.birthday ?? '',
    showBirthday: Boolean(profile.showBirthday),
    allowAnonymousPosting: profile.allowAnonymousPosting !== false,
    communityJoinedAt: profile.communityJoinedAt ?? new Date(),
    profileCompleted: true,
    role: profile.role ?? 'participant',
    status: profile.status ?? 'active',
  });
};

export const getInitialCommunityUserProfile = () => normalizeStoredCommunityUserProfile(
  safeLoadFromStorage(COMMUNITY_USER_PROFILE_STORAGE_KEY),
);

export const serializeCommunityUserProfile = (profile) => ({
  id: profile.id || 'current-user',
  displayName: profile.displayName ?? '',
  birthday: profile.birthday ?? '',
  showBirthday: Boolean(profile.showBirthday),
  allowAnonymousPosting: profile.allowAnonymousPosting !== false,
  profileCompleted: Boolean(profile.profileCompleted),
  communityJoinedAt: profile.communityJoinedAt instanceof Date
    ? profile.communityJoinedAt.toISOString()
    : profile.communityJoinedAt ?? null,
});
