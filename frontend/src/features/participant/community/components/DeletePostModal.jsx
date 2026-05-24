export default function DeletePostModal({
  deleteModalRef,
  onBackdropMouseDown,
  onCancel,
  onConfirm,
  onKeyDown,
}) {
  return (
    <div
      className="community-report-modal"
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <section
        aria-labelledby="community-delete-post-title"
        className="community-report-modal__panel"
        onKeyDown={onKeyDown}
        ref={deleteModalRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="community-report-modal__header">
          <div>
            <h3 id="community-delete-post-title">Delete post</h3>
            <p>Are you sure you want to delete this post?</p>
          </div>
          <button
            aria-label="Close delete confirmation"
            className="community-report-modal__close"
            type="button"
            onClick={onCancel}
          >
            ×
          </button>
        </header>
        <div className="community-report-modal__actions">
          <button className="community-report-modal__cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="community-report-modal__submit" type="button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}
