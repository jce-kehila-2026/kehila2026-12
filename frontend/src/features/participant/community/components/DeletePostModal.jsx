export default function DeletePostModal({
  closeLabel = 'Close delete confirmation',
  deleteModalRef,
  description = 'Are you sure you want to delete this post?',
  title = 'Delete post',
  titleId = 'community-delete-post-title',
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
        aria-labelledby={titleId}
        className="community-report-modal__panel"
        onKeyDown={onKeyDown}
        ref={deleteModalRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="community-report-modal__header">
          <div>
            <h3 id={titleId}>{title}</h3>
            <p>{description}</p>
          </div>
          <button
            aria-label={closeLabel}
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
