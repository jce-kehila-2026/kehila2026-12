import { useEffect, useRef } from 'react';
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
  isReportedByCurrentUser,
  isReportConfirming,
  onCancelReport,
  onCommentTextChange,
  onConfirmReport,
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
  const reportConfirmButtonRef = useRef(null);
  const commentInputRef = useRef(null);
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

  useEffect(() => {
    if (isReportConfirming) {
      reportConfirmButtonRef.current?.focus();
    }
  }, [isReportConfirming]);

  useEffect(() => {
    if (isCommentComposerOpen) {
      commentInputRef.current?.focus();
    }
  }, [isCommentComposerOpen]);

  const renderAttachment = () => {
    if (!post.attachment) return null;

    if (post.attachment.type === 'image') {
      return (
        <figure className="community-page-post__attachment">
          <img src={post.attachment.url} alt={post.attachment.name || 'Community post attachment'} />
        </figure>
      );
    }

    if (post.attachment.type === 'gif') {
      return (
        <div className="community-page-post__attachment community-page-post__attachment--gif">
          <div className="community-gif-preview" aria-label={post.attachment.label}>
            <span>{post.attachment.emoji}</span>
            <strong>{post.attachment.label}</strong>
          </div>
        </div>
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

  const handleReportConfirmationKeyDown = (event) => {
    if (event.key === 'Escape') {
      onCancelReport();
    }
  };

  return (
    <article className={`community-page-post community-page-post--${post.tone}`}>
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
            {!post.isAnonymous && (
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
        <span className="community-page-post__more" aria-hidden="true">
          <MoreHorizOutlinedIcon fontSize="small" />
        </span>
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
            aria-label={`${post.isSupported ? 'Remove support from' : 'Support'} ${post.author}'s post. ${supportCount} support reactions`}
            onClick={() => onToggleSupport(post.id)}
          >
            <VolunteerActivismOutlinedIcon fontSize="small" />
            Support
            <span>{supportCount}</span>
          </button>
        </div>
        <button
          aria-describedby={reportFeedbackId}
          className="community-page-post__report-button"
          disabled={isReportedByCurrentUser}
          onClick={onReportPost}
          type="button"
        >
          {isReportedByCurrentUser ? 'Reported' : 'Report'}
        </button>
      </footer>
      {isReportConfirming && (
        <div
          className="community-page-post__report-confirmation"
          role="group"
          aria-label="Confirm report"
          onKeyDown={handleReportConfirmationKeyDown}
        >
          <p>Report this post to the community team?</p>
          <div>
            <button type="button" ref={reportConfirmButtonRef} onClick={onConfirmReport}>Confirm</button>
            <button type="button" onClick={onCancelReport}>Cancel</button>
          </div>
        </div>
      )}
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
      <CommentsPreview
        comments={comments}
        isExpanded={isCommentsExpanded}
        onToggleExpanded={onToggleCommentsExpanded}
      />
      {isCommentComposerOpen && (
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
