import { formatRelativeCommunityTime } from '../communityInteractionHelpers';
import {
  COMMENTS_PREVIEW_LIMIT,
  getCommentInitials,
  getVisiblePreviewComments,
} from '../utils/commentUtils';
import { isCommentOwnedByCurrentUser } from '../utils/communityModerationUtils';

export default function CommentsPreview({
  comments = [],
  isExpanded = false,
  localUserId,
  localUserName,
  onDeleteComment,
  onToggleExpanded,
  relativeTimeNow,
}) {
  const hasMoreComments = comments.length > COMMENTS_PREVIEW_LIMIT;
  const visibleComments = getVisiblePreviewComments(comments, isExpanded);

  if (visibleComments.length === 0) {
    return (
      <section className="comments-preview comments-preview--empty" aria-label="Comments preview">
        <p className="comments-preview__empty">Be the first to comment.</p>
      </section>
    );
  }

  return (
    <section className="comments-preview" aria-label="Comments preview">
      <div className="comments-preview__list">
        {visibleComments.map((comment) => {
          const commentAuthor = comment.authorDisplayName ?? comment.author ?? 'Community member';
          const canDeleteComment = isCommentOwnedByCurrentUser(comment, localUserId, localUserName);
          const commentTime = formatRelativeCommunityTime(comment.createdAt, relativeTimeNow);

          return (
            <article className="comments-preview__item" key={comment.id ?? `${comment.author}-${comment.text}`}>
              <span className="comments-preview__avatar" aria-hidden="true">{getCommentInitials(comment)}</span>
              <div className="comments-preview__bubble">
                <header className="comments-preview__header">
                  <div className="comments-preview__meta">
                    <strong>{commentAuthor}</strong>
                    <small>{commentTime}</small>
                  </div>
                  {canDeleteComment && (
                    <button
                      className="comments-preview__delete"
                      type="button"
                      onClick={() => onDeleteComment?.(comment.id)}
                    >
                      Delete
                    </button>
                  )}
                </header>
                <p>{comment.content ?? comment.text}</p>
              </div>
            </article>
          );
        })}
      </div>
      {hasMoreComments && (
        <button className="comments-preview__view-all" onClick={onToggleExpanded} type="button">
          {isExpanded ? 'Show less' : `Show ${comments.length - COMMENTS_PREVIEW_LIMIT} more comments`}
        </button>
      )}
    </section>
  );
}
