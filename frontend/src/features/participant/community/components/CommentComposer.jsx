import { useEffect, useRef } from 'react';

export default function CommentComposer({
  commentFeedback,
  commentFeedbackId,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  postAuthor,
}) {
  const commentInputRef = useRef(null);

  useEffect(() => {
    commentInputRef.current?.focus();
  }, []);

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    onSubmitComment();
  };

  return (
    <form className="community-comment-form" onSubmit={handleCommentSubmit}>
      <input
        aria-describedby={commentFeedbackId}
        aria-label={`Add a comment to ${postAuthor}'s post`}
        aria-invalid={commentFeedback?.type === 'error'}
        onChange={(event) => onCommentTextChange(event.target.value)}
        placeholder="Write a comment..."
        ref={commentInputRef}
        type="text"
        value={commentText}
      />
      <button type="submit">Reply</button>
    </form>
  );
}
