import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';

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
  return (
    <footer className="community-page-post__actions">
      <div className="community-page-post__primary-actions">
        <button
          aria-pressed={post.isLiked}
          aria-label={`${post.isLiked ? 'Unlike' : 'Like'} ${post.author}'s post. ${likesCount} likes`}
          className={post.isLiked ? 'is-liked' : undefined}
          disabled={isReportedByCurrentUser}
          onClick={() => onToggleLike(post.id)}
          type="button"
        >
          <FavoriteBorderOutlinedIcon fontSize="small" />
          Like
          <span>{likesCount}</span>
        </button>
        <button
          type="button"
          aria-expanded={isCommentComposerOpen}
          aria-label={`${commentsCount} comments on ${post.author}'s post`}
          className={isCommentComposerOpen ? 'is-commenting' : undefined}
          disabled={isReportedByCurrentUser}
          onClick={onOpenCommentComposer}
        >
          <ChatBubbleOutlineOutlinedIcon fontSize="small" />
          Comment
          <span>{commentsCount}</span>
        </button>
        <button
          aria-pressed={post.isSupported}
          className={post.isSupported ? 'is-supported' : undefined}
          type="button"
          disabled={isReportedByCurrentUser}
          aria-label={`${post.isSupported ? 'Remove support from' : 'Support'} ${post.author}'s post. ${supportCount} support reactions`}
          onClick={() => onToggleSupport(post.id)}
        >
          <VolunteerActivismOutlinedIcon fontSize="small" />
          Support
          <span>{supportCount}</span>
        </button>
      </div>
    </footer>
  );
}
