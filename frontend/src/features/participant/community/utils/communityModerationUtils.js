import { COMMUNITY_POST_STATUS } from '../constants/communityConstants';
import { parseCommunityDate } from './communityDateUtils';
import { normalizeCommunityName } from './communityProfileUtils';

export const REPORTED_POST_HIDE_DELAY_MS = 20 * 1000;

const normalizeCommunityId = (value) => (
  typeof value === 'string' ? value.trim() : ''
);

export const isCommunityContentVisible = (item = {}) => (
  !item.hiddenByAdmin
  && item.status !== COMMUNITY_POST_STATUS.hidden
  && item.status !== COMMUNITY_POST_STATUS.deleted
);

export const getCurrentCommunityUserId = (...sources) => {
  for (const source of sources) {
    const userId = normalizeCommunityId(source?.uid)
      || normalizeCommunityId(source?.userId)
      || normalizeCommunityId(source?.id);

    if (userId) return userId;
  }

  return 'current-user';
};

export const getPostAuthorId = (post = {}) => (
  normalizeCommunityId(post.authorId)
  || normalizeCommunityId(post.userId)
  || normalizeCommunityId(post.ownerId)
);

export const getCommentAuthorId = (comment = {}) => (
  normalizeCommunityId(comment.authorId)
  || normalizeCommunityId(comment.userId)
  || normalizeCommunityId(comment.ownerId)
);

export const hasStablePostAuthorId = (post = {}) => Boolean(getPostAuthorId(post));

export const isLegacyPostOwnedByDisplayNameFallback = (post = {}, localUserName) => {
  if (hasStablePostAuthorId(post) || post.isAnonymous) return false;

  const normalizedLocalName = normalizeCommunityName(localUserName);
  if (!normalizedLocalName) return false;

  return [
    post.author,
    post.authorDisplayName,
  ].some((name) => normalizeCommunityName(name ?? '') === normalizedLocalName);
};

export const isPostOwnedByCurrentUser = (post = {}, localUserId, localUserName) => {
  const currentUserId = normalizeCommunityId(localUserId);
  const postAuthorId = getPostAuthorId(post);

  if (postAuthorId) return Boolean(currentUserId && postAuthorId === currentUserId);

  return isLegacyPostOwnedByDisplayNameFallback(post, localUserName);
};

export const isLegacyCommentOwnedByDisplayNameFallback = (comment = {}, localUserName) => {
  if (getCommentAuthorId(comment)) return false;

  if (comment.isLocalCurrentUser) return true;

  const normalizedLocalName = normalizeCommunityName(localUserName);
  if (!normalizedLocalName) return false;

  return [comment.author, comment.authorDisplayName]
    .some((name) => normalizeCommunityName(name ?? '') === normalizedLocalName);
};

export const isCommentOwnedByCurrentUser = (comment = {}, localUserId, localUserName) => {
  const currentUserId = normalizeCommunityId(localUserId);
  const commentAuthorId = getCommentAuthorId(comment);

  if (commentAuthorId) return Boolean(currentUserId && commentAuthorId === currentUserId);

  return isLegacyCommentOwnedByDisplayNameFallback(comment, localUserName);
};

export const getFollowAuthorKey = (post = {}) => getPostAuthorId(post) || post.author;

export const isAuthorCurrentUser = (post = {}, localUserId, localUserName) => (
  isPostOwnedByCurrentUser(post, localUserId, localUserName)
);

export const isAuthorFollowed = (post = {}, followedAuthors = []) => {
  const postAuthorId = getPostAuthorId(post);
  const followedValues = Array.isArray(followedAuthors) ? followedAuthors : [];

  if (postAuthorId && followedValues.includes(postAuthorId)) return true;

  return followedValues.includes(post.author);
};

export const getPostReportForUser = (post = {}, localUserId) => {
  const currentUserId = normalizeCommunityId(localUserId);
  if (!currentUserId) return null;

  const reportedBy = Array.isArray(post.reportedBy) ? post.reportedBy : [];
  const reports = Array.isArray(post.reports) ? post.reports : [];

  const reportRecord = reports.find((report) => (
    normalizeCommunityId(report?.reporterUserId) === currentUserId
    || normalizeCommunityId(report?.userId) === currentUserId
  ));

  if (reportRecord) return reportRecord;
  if (reportedBy.includes(currentUserId)) return { reporterUserId: currentUserId, createdAt: null };

  return null;
};

export const getPostReportedAtTime = (post = {}, localUserId) => {
  const reportRecord = getPostReportForUser(post, localUserId);
  if (!reportRecord) return null;

  const parsedDate = parseCommunityDate(
    reportRecord.reportedAt
    ?? reportRecord.createdAt
    ?? reportRecord.date
  );

  return parsedDate ? parsedDate.getTime() : null;
};

export const isPostReportedByUser = (post = {}, localUserId) => (
  Boolean(getPostReportForUser(post, localUserId))
);

export const shouldHidePostReportedByUser = (post = {}, localUserId, now = Date.now()) => {
  if (!isPostReportedByUser(post, localUserId)) return false;

  const reportedAtTime = getPostReportedAtTime(post, localUserId);
  if (reportedAtTime === null) return true;

  return now - reportedAtTime >= REPORTED_POST_HIDE_DELAY_MS;
};
