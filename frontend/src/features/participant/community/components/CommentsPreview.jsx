import { formatRelativeCommunityTime } from '../communityInteractionHelpers';
import {
  COMMENTS_PREVIEW_LIMIT,
  getCommentInitials,
  getVisiblePreviewComments,
} from '../utils/commentUtils';
import { isCommentOwnedByCurrentUser } from '../utils/communityModerationUtils';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';
import { localizeField } from '../../../../i18n/localizeField';

export default function CommentsPreview({
  comments = [],
  totalCommentsCount = 0,
  isExpanded = false,
  localUserId,
  localUserName,
  onDeleteComment,
  onToggleExpanded,
  relativeTimeNow,
}) {
  const { t, locale } = useParticipantLocale();
  // Compare against the server-backed total, not the loaded array: the feed only
  // preloads the first two comments, so relying on comments.length here would
  // hide the "show more" toggle for any post with more than two comments and
  // leave the rest permanently unreachable (the toggle is what triggers the
  // full fetch).
  const totalComments = Math.max(totalCommentsCount, comments.length);
  const hasMoreComments = totalComments > COMMENTS_PREVIEW_LIMIT;
  const remainingCount = totalComments - COMMENTS_PREVIEW_LIMIT;
  const visibleComments = getVisiblePreviewComments(comments, isExpanded);

  if (visibleComments.length === 0) {
    return (
      <section className="comments-preview comments-preview--empty" aria-label={t('commentsPreviewAria')}>
        <p className="comments-preview__empty">{t('beFirstToComment')}</p>
      </section>
    );
  }

  return (
    <section className="comments-preview" aria-label={t('commentsPreviewAria')}>
      <div className="comments-preview__list">
        {visibleComments.map((comment) => {
          const commentAuthor = comment.authorDisplayName ?? comment.author ?? t('communityMember');
          const canDeleteComment = isCommentOwnedByCurrentUser(comment, localUserId, localUserName);
          const commentTime = formatRelativeCommunityTime(comment.createdAt, relativeTimeNow, t);

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
                      {t('delete')}
                    </button>
                  )}
                </header>
                <p>{localizeField(comment.translations?.content ?? (comment.content ?? comment.text), locale)}</p>
              </div>
            </article>
          );
        })}
      </div>
      {hasMoreComments && (
        <button className="comments-preview__view-all" onClick={onToggleExpanded} type="button">
          {isExpanded
            ? t('showLess')
            : t('showMoreComments').replace('{n}', String(remainingCount))}
        </button>
      )}
    </section>
  );
}
