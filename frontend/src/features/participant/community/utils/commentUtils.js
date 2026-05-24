export const COMMENTS_PREVIEW_LIMIT = 2;

export const getCommentInitials = (comment = {}) => {
  if (comment.initials) return comment.initials;

  const displayName = comment.authorDisplayName ?? comment.author ?? 'CU';
  return displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CU';
};

export const getVisiblePreviewComments = (comments = [], isExpanded = false) => (
  isExpanded ? comments : comments.slice(0, COMMENTS_PREVIEW_LIMIT)
);
