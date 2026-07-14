import { useEffect, useRef } from 'react';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function CommentComposer({
  commentFeedback,
  commentFeedbackId,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  postAuthor,
}) {
  const { t } = useParticipantLocale();
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
        aria-label={t('addCommentAria').replace('{author}', postAuthor)}
        aria-invalid={commentFeedback?.type === 'error'}
        onChange={(event) => onCommentTextChange(event.target.value)}
        placeholder={t('commentPlaceholder')}
        ref={commentInputRef}
        type="text"
        value={commentText}
      />
      <button type="submit">{t('reply')}</button>
    </form>
  );
}
