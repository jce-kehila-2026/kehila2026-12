import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function PostActions({
  commentsCount = 0,
  isCommentComposerOpen = false,
  isReportedByCurrentUser = false,
  likesCount = 0,
  onOpenCommentComposer,
  onToggleLike,
  onToggleSupport,
  post,
  supportCount = 0,
}) {
  const { t } = useParticipantLocale();
  const likeAria = t('likePostAria')
    .replace('{action}', post.isLiked ? t('unlikeAction') : t('likeAction'))
    .replace('{author}', post.author)
    .replace('{n}', String(likesCount));
  const commentAria = t('commentsOnPostAria')
    .replace('{n}', String(commentsCount))
    .replace('{author}', post.author);
  const supportAria = t('supportPostAria')
    .replace('{action}', post.isSupported ? t('removeSupportAction') : t('supportAction'))
    .replace('{author}', post.author)
    .replace('{n}', String(supportCount));

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
          <FavoriteBorderOutlinedIcon fontSize="small" />
          {t('like')}
          <span>{likesCount}</span>
        </button>
        <button
          type="button"
          aria-expanded={isCommentComposerOpen}
          aria-label={commentAria}
          className={isCommentComposerOpen ? 'is-commenting' : undefined}
          disabled={isReportedByCurrentUser}
          onClick={onOpenCommentComposer}
        >
          <ChatBubbleOutlineOutlinedIcon fontSize="small" />
          {t('comment')}
          <span>{commentsCount}</span>
        </button>
        <button
          aria-pressed={post.isSupported}
          className={post.isSupported ? 'is-supported' : undefined}
          type="button"
          disabled={isReportedByCurrentUser}
          aria-label={supportAria}
          onClick={() => onToggleSupport(post.id)}
        >
          <VolunteerActivismOutlinedIcon fontSize="small" />
          {t('support')}
          <span>{supportCount}</span>
        </button>
      </div>
    </footer>
  );
}
