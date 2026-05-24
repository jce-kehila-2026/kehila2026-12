import { COMMUNITY_POST_STATUS } from '../constants/communityConstants';
import { normalizeCommunityName } from './communityProfileUtils';

export const isCommunityContentVisible = (item = {}) => (
  !item.hiddenByAdmin
  && item.status !== COMMUNITY_POST_STATUS.hidden
  && item.status !== COMMUNITY_POST_STATUS.deleted
);

export const isPostOwnedByCurrentUser = (post = {}, localUserId, localUserName) => {
  if (localUserId && post.authorId === localUserId) return true;

  const normalizedLocalName = normalizeCommunityName(localUserName);
  if (!normalizedLocalName || post.isAnonymous) return false;

  return [
    post.author,
    post.authorDisplayName,
  ].some((name) => normalizeCommunityName(name ?? '') === normalizedLocalName);
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
