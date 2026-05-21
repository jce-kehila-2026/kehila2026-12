import {
  createCommunityCommentModel,
  createCommunityPostModel,
  createCommunityStreakModel,
} from './communityModels';

export const INITIAL_COMMUNITY_STREAK_COUNT = 0;
export const INITIAL_LAST_ACTIVITY_DATE = null;
export const COMMUNITY_POSTS_STORAGE_KEY = 'community.posts';
export const COMMUNITY_STREAK_STORAGE_KEY = 'community.streak';
export const COMMUNITY_PREFERENCES_STORAGE_KEY = 'community.preferences';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const createCommunityId = (prefix, createdAt = new Date()) => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${createdAt.getTime()}`
);

export const createPostModel = ({ author, content, isAnonymous }) => {
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

export const normalizeCommunityPosts = (posts) => posts.map((post, index) => ({
  ...post,
  id: post.id ?? `demo-post-${index + 1}`,
  likesCount: post.likesCount ?? post.likes ?? 0,
  isLiked: post.isLiked ?? false,
  comments: Array.isArray(post.comments) ? post.comments : post.previewComments ?? [],
}));

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
    id: comment?.id ?? `stored-comment-${index + 1}`,
    author: comment?.author ?? 'Current User',
    content,
    createdAt,
    initials: comment?.initials ?? 'CU',
    time: comment?.time ?? 'Just now',
    text: comment?.text ?? content,
  };
};

const normalizeStoredPost = (post, index) => {
  const content = typeof post?.content === 'string' ? post.content : post?.body ?? '';
  const comments = Array.isArray(post?.comments)
    ? post.comments.map(normalizeComment)
    : [];
  const likesCount = Number.isFinite(post?.likesCount)
    ? post.likesCount
    : Number.isFinite(post?.likes)
      ? post.likes
      : 0;

  return {
    ...post,
    id: post?.id ?? `stored-post-${index + 1}`,
    author: post?.author ?? 'Current User',
    content,
    createdAt: post?.createdAt ?? null,
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
    support: post?.support ?? 0,
    tone: post?.tone ?? 'pink',
    previewComments: Array.isArray(post?.previewComments) ? post.previewComments : [],
  };
};

export const serializeCommunityPost = (post) => ({
  id: post.id,
  author: post.author,
  content: post.content ?? post.body ?? '',
  createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt ?? null,
  likesCount: post.likesCount ?? post.likes ?? 0,
  isLiked: Boolean(post.isLiked),
  isAnonymous: Boolean(post.isAnonymous),
  comments: Array.isArray(post.comments) ? post.comments.map((comment) => ({
    id: comment.id,
    author: comment.author,
    content: comment.content ?? comment.text ?? '',
    createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt ?? null,
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
  support: post.support ?? 0,
  tone: post.tone,
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
