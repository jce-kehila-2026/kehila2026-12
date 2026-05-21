import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import CommentsPreview from './CommentsPreview';

export default function CommunityPostCard({
  commentText,
  onCommentTextChange,
  onSubmitComment,
  onToggleLike,
  post,
}) {
  const likesCount = post.likesCount ?? post.likes ?? 0;
  const commentsCount = post.commentsCount ?? (
    Array.isArray(post.comments) ? post.comments.length : post.comments ?? 0
  );
  const previewComments = Array.isArray(post.comments) ? post.comments : post.previewComments ?? [];
  const postBody = post.content ?? post.body;
  const handleCommentSubmit = (event) => {
    event.preventDefault();
    onSubmitComment();
  };

  return (
    <article className={`community-page-post community-page-post--${post.tone}`}>
      <header>
        <span className="community-page-post__avatar">{post.initials}</span>
        <div>
          <strong>{post.author}</strong>
          <small>{post.time}</small>
        </div>
        <span className="community-page-post__topic">{post.topic}</span>
      </header>
      <div className="community-page-post__content">
        <h3>{post.title}</h3>
        <p>{postBody}</p>
      </div>
      <footer>
        <button
          aria-pressed={post.isLiked}
          className={post.isLiked ? 'is-liked' : undefined}
          onClick={() => onToggleLike(post.id)}
          type="button"
        >
          <FavoriteBorderOutlinedIcon fontSize="small" />
          Like
          <span>{likesCount}</span>
        </button>
        <button type="button">
          <ChatBubbleOutlineOutlinedIcon fontSize="small" />
          Comment
          <span>{commentsCount}</span>
        </button>
        <button type="button">
          <VolunteerActivismOutlinedIcon fontSize="small" />
          Support
          <span>{post.support}</span>
        </button>
      </footer>
      <CommentsPreview comments={previewComments} />
      <form className="community-comment-form" onSubmit={handleCommentSubmit}>
        <input
          aria-label={`Add a comment to ${post.author}'s post`}
          onChange={(event) => onCommentTextChange(event.target.value)}
          placeholder="Write a comment..."
          type="text"
          value={commentText}
        />
        <button type="submit">Post</button>
      </form>
    </article>
  );
}
