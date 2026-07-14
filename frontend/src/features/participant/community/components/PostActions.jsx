import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function PostActions({
  commentsCount = 0,
  hasCurrentUserComment = false,
  isCommentComposerOpen = false,
  isReportedByCurrentUser = false,
  likesCount = 0,
  onOpenCommentComposer,
  onToggleLike,
  post,
}) {
  const { t } = useParticipantLocale();
  const likeAria = t('likePostAria')
    .replace('{action}', post.isLiked ? t('unlikeAction') : t('likeAction'))
    .replace('{author}', post.author)
    .replace('{n}', String(likesCount));
  const commentAria = t('commentsOnPostAria')
    .replace('{n}', String(commentsCount))
    .replace('{author}', post.author);

  return (
    <footer className="community-page-post__actions">
      <div className="community-page-post__primary-actions">
        <button
          aria-pressed={post.isLiked}
          aria-label={likeAria}
          className={post.isLiked ? 'is-liked' : undefined}
          disabled={isReportedByCurrentUser}
          onClick={() => onToggleLike(post.id)}
          type="button"
        >
          {post.isLiked ? (
            <FavoriteOutlinedIcon fontSize="small" />
          ) : (
            <FavoriteBorderOutlinedIcon fontSize="small" />
          )}
          {t('like')}
          <span>{likesCount}</span>
        </button>
        <button
          type="button"
          aria-expanded={isCommentComposerOpen}
          aria-label={commentAria}
          className={hasCurrentUserComment ? 'is-commenting' : undefined}
          disabled={isReportedByCurrentUser}
          onClick={onOpenCommentComposer}
        >
          {hasCurrentUserComment ? (
            <ChatBubbleOutlinedIcon fontSize="small" />
          ) : (
            <ChatBubbleOutlineOutlinedIcon fontSize="small" />
          )}
          {t('comment')}
          <span>{commentsCount}</span>
        </button>
      </div>
    </footer>
  );
}
