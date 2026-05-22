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
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

const getModerationFields = (item = {}) => {
  const reportsCount = Number(item.reportsCount);

  return {
    status: item.status ?? COMMUNITY_POST_STATUS.active,
    reportsCount: Number.isFinite(reportsCount) && reportsCount >= 0 ? reportsCount : 0,
    reportedBy: Array.isArray(item.reportedBy) ? item.reportedBy : [],
    reports: Array.isArray(item.reports) ? item.reports : [],
    hiddenByAdmin: Boolean(item.hiddenByAdmin),
  };
};

export const isCommunityContentVisible = (item = {}) => (
  !item.hiddenByAdmin
  && item.status !== COMMUNITY_POST_STATUS.hidden
  && item.status !== COMMUNITY_POST_STATUS.deleted
);

export const parseCommunityDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'object' && typeof value.seconds === 'number') {
    const parsedTimestamp = new Date(value.seconds * 1000);
    return Number.isNaN(parsedTimestamp.getTime()) ? null : parsedTimestamp;
  }

  if (typeof value === 'number') {
    const parsedTimestamp = new Date(value);
    return Number.isNaN(parsedTimestamp.getTime()) ? null : parsedTimestamp;
  }

  if (typeof value !== 'string') return null;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatCommunityDayMonth = (date) => (
  `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`
);

export const formatRelativeCommunityTime = (createdAt, now = new Date()) => {
  const createdDate = parseCommunityDate(createdAt);
  const currentDate = parseCommunityDate(now) ?? new Date();

  if (!createdDate) return 'just now';

  const diffMs = Math.max(currentDate.getTime() - createdDate.getTime(), 0);

  if (diffMs < MS_PER_MINUTE) return 'just now';

  if (diffMs < MS_PER_HOUR) {
    const minutes = Math.floor(diffMs / MS_PER_MINUTE);
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
  }

  if (diffMs < MS_PER_DAY) {
    const hours = Math.floor(diffMs / MS_PER_HOUR);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  if (diffMs <= 3 * MS_PER_DAY) {
    const days = Math.floor(diffMs / MS_PER_DAY);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  return formatCommunityDayMonth(createdDate);
};

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
    time: formatRelativeCommunityTime(createdAt),
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

export const createCommentModel = (content, author = 'Current User', authorId = 'current-user') => {
  const createdAt = new Date();
  const commentModel = createCommunityCommentModel({
    id: createCommunityId('community-comment', createdAt),
    authorId,
    authorDisplayName: author,
    content,
    createdAt,
    updatedAt: createdAt,
  });

  return {
    ...commentModel,
    author,
    initials: 'CU',
    isLocalCurrentUser: true,
    time: formatRelativeCommunityTime(createdAt),
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
  const createdAtDate = parseCommunityDate(comment?.createdAt)
    ?? parseCommunityDate(comment?.date)
    ?? inferCreatedAtFromLegacyTime(comment?.time, index)
    ?? new Date(Date.now() - index * MS_PER_MINUTE);
  const updatedAtDate = parseCommunityDate(comment?.updatedAt) ?? createdAtDate;

  return {
    ...comment,
    id: comment?.id ?? `stored-comment-${index + 1}`,
    authorId: comment?.authorId ?? null,
    author: comment?.author ?? 'Current User',
    authorDisplayName: comment?.authorDisplayName ?? comment?.author ?? 'Current User',
    content,
    createdAt: createdAtDate.toISOString(),
    updatedAt: updatedAtDate.toISOString(),
    initials: comment?.initials ?? 'CU',
    isLocalCurrentUser: Boolean(comment?.isLocalCurrentUser),
    time: formatRelativeCommunityTime(createdAtDate),
    text: comment?.text ?? content,
    ...getModerationFields(comment),
  };
};

const inferCreatedAtFromLegacyTime = (time, index) => {
  if (typeof time !== 'string') return null;

  const now = new Date();
  const normalizedTime = time.trim().toLowerCase();

  if (!normalizedTime || normalizedTime === 'just now') return now;

  const minutesAgoMatch = normalizedTime.match(/^(\d+)\s*m(?:in)?s?\b/);
  if (minutesAgoMatch) {
    return new Date(now.getTime() - Number(minutesAgoMatch[1]) * MS_PER_MINUTE);
  }

  const hoursAgoMatch = normalizedTime.match(/^(\d+)\s*h(?:our)?s?\b/);
  if (hoursAgoMatch) {
    return new Date(now.getTime() - Number(hoursAgoMatch[1]) * MS_PER_HOUR);
  }

  if (normalizedTime.startsWith('today')) {
    const timeParts = normalizedTime.match(/(\d{1,2}):(\d{2})/);
    if (!timeParts) return new Date(now.getTime() - index * MS_PER_MINUTE);

    const todayDate = new Date(now);
    todayDate.setHours(Number(timeParts[1]), Number(timeParts[2]), 0, 0);
    return todayDate;
  }

  if (normalizedTime.startsWith('yesterday')) {
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    yesterdayDate.setHours(12, 0, 0, 0);
    return yesterdayDate;
  }

  const weekdayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    .indexOf(normalizedTime);

  if (weekdayIndex >= 0) {
    const weekdayDate = new Date(now);
    const currentWeekdayIndex = now.getDay();
    let dayDifference = currentWeekdayIndex - weekdayIndex;
    if (dayDifference <= 0) dayDifference += 7;
    weekdayDate.setDate(now.getDate() - dayDifference);
    weekdayDate.setHours(12, 0, 0, 0);
    return weekdayDate;
  }

  return null;
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
  const createdAtDate = parseCommunityDate(post?.createdAt)
    ?? parseCommunityDate(post?.date)
    ?? inferCreatedAtFromLegacyTime(post?.time, index)
    ?? new Date(Date.now() - index * MS_PER_MINUTE);
  const updatedAtDate = parseCommunityDate(post?.updatedAt) ?? createdAtDate;

  return {
    ...post,
    id: post?.id ?? `stored-post-${index + 1}`,
    author: post?.author ?? 'Current User',
    authorDisplayName: post?.authorDisplayName ?? post?.author ?? 'Current User',
    content,
    createdAt: createdAtDate.toISOString(),
    updatedAt: updatedAtDate.toISOString(),
    likesCount,
    isLiked: Boolean(post?.isLiked),
    isAnonymous: Boolean(post?.isAnonymous),
    comments,
    initials: post?.initials ?? (post?.isAnonymous ? 'AU' : 'CU'),
    time: formatRelativeCommunityTime(createdAtDate),
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
  reports: Array.isArray(post.reports) ? post.reports.map((report) => ({
    id: report.id,
    postId: report.postId ?? post.id,
    reporterUserId: report.reporterUserId ?? report.userId ?? null,
    postOwnerId: report.postOwnerId ?? null,
    reason: report.reason ?? '',
    createdAt: report.createdAt instanceof Date ? report.createdAt.toISOString() : report.createdAt ?? null,
  })) : [],
  hiddenByAdmin: Boolean(post.hiddenByAdmin),
  comments: Array.isArray(post.comments) ? post.comments.map((comment) => ({
    id: comment.id,
    authorId: comment.authorId ?? null,
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
    isLocalCurrentUser: Boolean(comment.isLocalCurrentUser),
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
