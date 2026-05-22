import { useEffect, useRef, useState } from 'react';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import {
  formatRelativeCommunityTime,
  isCommunityContentVisible,
} from '../communityInteractionHelpers';
import CommentsPreview from './CommentsPreview';

export default function CommunityPostCard({
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
  onFollowAuthor,
  onOpenCommentComposer,
  onReportPost,
  onSubmitComment,
  onToggleSupport,
  onToggleCommentsExpanded,
  onToggleLike,
  post,
  relativeTimeNow,
  reportFeedback,
}) {
  const commentInputRef = useRef(null);
  const postMenuRef = useRef(null);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const likesCount = post.likesCount ?? post.likes ?? 0;
  const supportCount = post.supportCount ?? post.support ?? 0;
  const comments = (Array.isArray(post.comments) ? post.comments : post.previewComments ?? [])
    .filter(isCommunityContentVisible);
  const commentsCount = comments.length;
  const postBody = post.content ?? post.body;
  const postTime = formatRelativeCommunityTime(post.createdAt, relativeTimeNow);
  const commentFeedbackId = commentFeedback ? `comment-feedback-${post.id}` : undefined;
  const handleCommentSubmit = (event) => {
    event.preventDefault();
    onSubmitComment();
  };
  const reportFeedbackId = reportFeedback ? `report-feedback-${post.id}` : undefined;
  const postMenuId = `community-post-menu-${post.id}`;

  useEffect(() => {
    if (isCommentComposerOpen) {
      commentInputRef.current?.focus();
    }
  }, [isCommentComposerOpen]);

  useEffect(() => {
    if (!isPostMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!postMenuRef.current?.contains(event.target)) {
        setIsPostMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isPostMenuOpen]);

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

  const handlePostMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsPostMenuOpen(false);
    }
  };

  const handleReportFromMenu = () => {
    if (isReportedByCurrentUser) return;
    setIsPostMenuOpen(false);
    onReportPost();
  };

  return (
    <article className={`community-page-post community-page-post--${post.tone}${isReportedByCurrentUser ? ' is-reported-by-user' : ''}`}>
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
                onClick={() => onFollowAuthor(post.author)}
              >
                {isFollowingAuthor ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          <small>{postTime}</small>
        </div>
        <span className="community-page-post__topic">{post.topic}</span>
        <div className="community-page-post__menu" ref={postMenuRef} onKeyDown={handlePostMenuKeyDown}>
          <button
            aria-controls={postMenuId}
            aria-expanded={isPostMenuOpen}
            aria-haspopup="menu"
            aria-label={`Open actions for ${post.author}'s post`}
            className="community-page-post__more"
            type="button"
            onClick={() => setIsPostMenuOpen((isOpen) => !isOpen)}
          >
            <MoreHorizOutlinedIcon fontSize="small" />
          </button>
          {isPostMenuOpen && (
            <div className="community-page-post__menu-popover" id={postMenuId} role="menu">
              <button
                aria-describedby={reportFeedbackId}
                className="community-page-post__menu-item"
                disabled={isReportedByCurrentUser}
                onClick={handleReportFromMenu}
                role="menuitem"
                type="button"
              >
                {isReportedByCurrentUser ? 'Reported' : 'Report post'}
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="community-page-post__content">
        <h3>{post.title}</h3>
        <p>{postBody}</p>
      </div>
      {renderAttachment()}
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
        <form className="community-comment-form" onSubmit={handleCommentSubmit}>
          <input
            aria-describedby={commentFeedbackId}
            aria-label={`Add a comment to ${post.author}'s post`}
            aria-invalid={commentFeedback?.type === 'error'}
            onChange={(event) => onCommentTextChange(event.target.value)}
            placeholder="Write a comment..."
            ref={commentInputRef}
            type="text"
            value={commentText}
          />
          <button type="submit">Reply</button>
        </form>
      )}
      {commentFeedback && (
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
