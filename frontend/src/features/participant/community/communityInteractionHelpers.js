import {
  COMMUNITY_POST_STATUS,
  createCommunityCommentModel,
  createCommunityPostModel,
  createCommunityStreakModel,
  createCommunityUserProfileModel,
} from './communityModels';
import {
  formatRelativeCommunityTime,
  getDateKeyTimestamp,
  getDayDifference,
  getTodayKey,
  isStreakAtRiskForDate,
  normalizeCommunityDateKey,
  parseCommunityDate,
} from './utils/communityDateUtils';
import { isCommunityContentVisible } from './utils/communityModerationUtils';
import {
  loadStoredCommunityPosts,
  loadStoredCommunityPreferences,
  loadStoredCommunityStreak,
  loadStoredCommunityUserProfile,
  safeLoadFromStorage,
  safeSaveToStorage,
} from './services/communityStorageService';

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
  normalizeCommunityDateKey,
  parseCommunityDate,
} from './utils/communityDateUtils';
export { isCommunityContentVisible } from './utils/communityModerationUtils';
export {
  safeLoadFromStorage,
  safeSaveToStorage,
} from './services/communityStorageService';

export const INITIAL_COMMUNITY_STREAK_COUNT = 0;
export const INITIAL_LAST_ACTIVITY_DATE = null;

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

export const createCommunityId = (prefix, createdAt = new Date()) => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${createdAt.getTime()}`
);

export const createPostModel = ({
  author,
  authorId = null,
  content,
  isAnonymous,
  attachment = null,
}) => {
  const createdAt = new Date();
  const postModel = createCommunityPostModel({
    id: createCommunityId('community-post', createdAt),
    authorId,
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
    userId: authorId,
    initials: 'CU',
    isLocalCurrentUser: true,
    time: formatRelativeCommunityTime(createdAt),
    text: content,
  };
};

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
    authorId: comment?.authorId ?? comment?.userId ?? null,
    userId: comment?.userId ?? comment?.authorId ?? null,
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
    authorId: post?.authorId ?? post?.userId ?? post?.ownerId ?? null,
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
    title: post?.title ?? null,
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
  authorId: post.authorId ?? null,
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
    userId: comment.userId ?? comment.authorId ?? null,
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
  const storedPosts = loadStoredCommunityPosts();

  if (Array.isArray(storedPosts)) {
    return storedPosts.map(normalizeStoredPost);
  }

  return normalizeCommunityPosts(defaultPosts);
};

export const getInitialStreakState = () => {
  const storedStreak = loadStoredCommunityStreak();
  const storedStreakCount = Number(storedStreak?.streakCount);
  const storedLastActivityDate = normalizeCommunityDateKey(storedStreak?.lastActivityDate);

  return createCommunityStreakModel({
    streakCount: Number.isFinite(storedStreakCount) && storedStreakCount >= 0
      ? storedStreakCount
      : INITIAL_COMMUNITY_STREAK_COUNT,
    lastActivityDate: storedLastActivityDate ?? INITIAL_LAST_ACTIVITY_DATE,
    updatedAt: storedStreak?.updatedAt ?? new Date(),
  });
};

export const getInitialCommunityPreferences = () => {
  const storedPreferences = loadStoredCommunityPreferences();

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
  loadStoredCommunityUserProfile(),
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
