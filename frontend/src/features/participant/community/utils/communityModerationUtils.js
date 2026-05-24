import { COMMUNITY_POST_STATUS } from '../constants/communityConstants';
import { normalizeCommunityName } from './communityProfileUtils';

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

export const isPostReportedByUser = (post = {}, localUserId) => {
  if (!localUserId) return false;

  const reportedBy = Array.isArray(post.reportedBy) ? post.reportedBy : [];
  if (reportedBy.includes(localUserId)) return true;

  const reports = Array.isArray(post.reports) ? post.reports : [];
  return reports.some((report) => (
    report?.reporterUserId === localUserId
    || report?.userId === localUserId
  ));
};
