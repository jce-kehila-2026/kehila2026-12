import { memo } from 'react';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import {
  formatRelativeCommunityTime,
  isCommunityContentVisible,
} from '../communityInteractionHelpers';
import CommentComposer from './CommentComposer';
import CommentsPreview from './CommentsPreview';
import PostActions from './PostActions';
import PostOverflowMenu from './PostOverflowMenu';

const GENERIC_POST_TITLE = 'New community post';

function CommunityPostCard({
  commentFeedback,
  commentText,
  isCommentsExpanded,
  isCommentComposerOpen,
  isFollowingAuthor,
  isOwnPost,
  isReportedByCurrentUser,
  localUserId,
  localUserName,
  onCommentTextChange,
  onDeleteComment,
  onDeletePost,
  onEditPost,
  onFollowAuthor,
  onOpenCommentComposer,
  onReportPost,
  onSubmitComment,
  onToggleSupport,
  onToggleCommentsExpanded,
  onToggleLike,
  post,
  postEditFeedback,
  relativeTimeNow,
  reportFeedback,
}) {
  const likesCount = post.likesCount ?? post.likes ?? 0;
  const supportCount = post.supportCount ?? post.support ?? 0;
  const comments = (Array.isArray(post.comments) ? post.comments : post.previewComments ?? [])
    .filter(isCommunityContentVisible);
  const commentsCount = comments.length;
  const postBody = post.content ?? post.body;
  const postTitle = typeof post.title === 'string' && post.title.trim() !== GENERIC_POST_TITLE
    ? post.title.trim()
    : '';
  const postTime = formatRelativeCommunityTime(post.createdAt, relativeTimeNow);
  const commentFeedbackId = commentFeedback ? `comment-feedback-${post.id}` : undefined;
  const reportFeedbackId = reportFeedback ? `report-feedback-${post.id}` : undefined;

  const renderAttachment = () => {
    if (!post.attachment) return null;

    if (post.attachment.type === 'image') {
      return (
        <figure className="community-page-post__attachment">
          <img src={post.attachment.url} alt={post.attachment.name || 'Community post attachment'} />
        </figure>
      );
    }

    if (post.attachment.type === 'voice') {
      return (
        <div className="community-page-post__attachment community-page-post__attachment--voice">
          <audio controls src={post.attachment.url} aria-label="Community post voice note" />
        </div>
      );
    }

    return null;
  };

  return (
    <article
      id={`community-post-${post.id}`}
      className={`community-page-post community-page-post--${post.tone}${isReportedByCurrentUser ? ' is-reported-by-user' : ''}`}
    >
      {isReportedByCurrentUser && (
        <div className="community-page-post__reported-overlay" aria-live="polite">
          <span>You reported this post</span>
        </div>
      )}
      <header className="community-page-post__header">
        <span className="community-page-post__avatar">{post.initials}</span>
        <div className="community-page-post__meta">
          <div className="community-page-post__author-row">
            <strong>{post.author}</strong>
            {post.isAnonymous && (
              <span className="community-page-post__anonymous-badge">
                <ShieldOutlinedIcon fontSize="inherit" />
                Anonymous
              </span>
            )}
            {!post.isAnonymous && !isOwnPost && (
              <button
                aria-pressed={isFollowingAuthor}
                className={`community-page-post__follow${isFollowingAuthor ? ' is-following' : ''}`}
                type="button"
                onClick={onFollowAuthor}
              >
                {isFollowingAuthor ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          <small>{postTime}</small>
        </div>
        <span className="community-page-post__topic">{post.topic}</span>
        <PostOverflowMenu
          isOwnPost={isOwnPost}
          isReportedByCurrentUser={isReportedByCurrentUser}
          onDeletePost={onDeletePost}
          onEditPost={onEditPost}
          onReportPost={onReportPost}
          post={post}
          reportFeedbackId={reportFeedbackId}
        />
      </header>
      <div className="community-page-post__content">
        {postTitle && <h3>{postTitle}</h3>}
        <p>{postBody}</p>
      </div>
      {commentFeedback?.type === 'success' && (
        <p
          className="community-comment-toast"
          id={commentFeedbackId}
          role="status"
          aria-live="polite"
        >
          {commentFeedback.message}
        </p>
      )}
      {postEditFeedback?.type === 'success' && (
        <p
          className="community-comment-toast community-post-edit-toast"
          role="status"
          aria-live="polite"
        >
          {postEditFeedback.message}
        </p>
      )}
      {renderAttachment()}
      <PostActions
        commentsCount={commentsCount}
        isCommentComposerOpen={isCommentComposerOpen}
        isReportedByCurrentUser={isReportedByCurrentUser}
        likesCount={likesCount}
        onOpenCommentComposer={onOpenCommentComposer}
        onToggleLike={onToggleLike}
        onToggleSupport={onToggleSupport}
        post={post}
        supportCount={supportCount}
      />
      {reportFeedback && (
        <p
          className={`community-page-post__report-feedback community-page-post__report-feedback--${reportFeedback.type}`}
          id={reportFeedbackId}
          role={reportFeedback.type === 'error' ? 'alert' : undefined}
          aria-live={reportFeedback.type === 'success' ? 'polite' : undefined}
        >
          {reportFeedback.message}
        </p>
      )}
      {!isReportedByCurrentUser && (
        <CommentsPreview
          comments={comments}
          isExpanded={isCommentsExpanded}
          localUserId={localUserId}
          localUserName={localUserName}
          onDeleteComment={onDeleteComment}
          onToggleExpanded={onToggleCommentsExpanded}
          relativeTimeNow={relativeTimeNow}
        />
      )}
      {isCommentComposerOpen && !isReportedByCurrentUser && (
        <CommentComposer
          commentFeedback={commentFeedback}
          commentFeedbackId={commentFeedbackId}
          commentText={commentText}
          onCommentTextChange={onCommentTextChange}
          onSubmitComment={onSubmitComment}
          postAuthor={post.author}
        />
      )}
      {commentFeedback?.type === 'error' && (
        <p
          className={`community-comment-form__feedback community-comment-form__feedback--${commentFeedback.type}`}
          id={commentFeedbackId}
          role={commentFeedback.type === 'error' ? 'alert' : undefined}
          aria-live={commentFeedback.type === 'success' ? 'polite' : undefined}
        >
          {commentFeedback.message}
        </p>
      )}
    </article>
  );
}

// Handler props (on*) are recreated on every CommunityPage render (inline
// closures / hook callbacks that aren't memoized), but their behavior is stable
// per post — each only touches its own post via functional setState updaters.
// So we compare data props only and ignore handler identity. This stops a
// keystroke in one card's comment composer (which updates parent state) from
// re-rendering every other card in the feed.
function arePostCardPropsEqual(prevProps, nextProps) {
  const keys = Object.keys(prevProps);
  if (keys.length !== Object.keys(nextProps).length) return false;
  return keys.every(
    (key) => key.startsWith('on') || Object.is(prevProps[key], nextProps[key]),
  );
}

export default memo(CommunityPostCard, arePostCardPropsEqual);
