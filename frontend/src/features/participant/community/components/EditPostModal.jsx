export default function EditPostModal({
  editModalRef,
  error = '',
  feedback,
  isSaveDisabled = false,
  onBackdropMouseDown,
  onCancel,
  onChange,
  onKeyDown,
  onSubmit,
  postText = '',
}) {
  return (
    <div
      className="community-report-modal"
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <form
        aria-labelledby="community-edit-post-title"
        className="community-report-modal__panel"
        onKeyDown={onKeyDown}
        onSubmit={onSubmit}
        ref={editModalRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="community-report-modal__header">
          <div>
            <h3 id="community-edit-post-title">Edit post</h3>
            <p>Update the text of your post.</p>
          </div>
          <button
            aria-label="Close edit form"
            className="community-report-modal__close"
            type="button"
            onClick={onCancel}
          >
            ×
          </button>
        </header>
        <textarea
          aria-label="Edit post text"
          aria-invalid={Boolean(error)}
          className="birthday-card__textarea"
          onChange={(event) => onChange(event.target.value)}
          rows="5"
          value={postText}
        />
        {error && (
          <p className="community-report-modal__error" role="alert">{error}</p>
        )}
        {feedback && (
          <p
            className={`community-report-modal__feedback community-report-modal__feedback--${feedback.type}`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
            aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
          >
            {feedback.message}
          </p>
        )}
        <div className="community-report-modal__actions">
          <button className="community-report-modal__cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="community-report-modal__submit" disabled={isSaveDisabled} type="submit">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
