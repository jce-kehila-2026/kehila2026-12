export default function ReportPostModal({
  onBackdropMouseDown,
  onCancel,
  onKeyDown,
  onReasonChange,
  onSubmit,
  reasonError = '',
  reasons = [],
  reportModalRef,
  selectedReason = '',
}) {
  return (
    <div
      className="community-report-modal"
      role="presentation"
      onMouseDown={onBackdropMouseDown}
    >
      <form
        aria-labelledby="community-report-title"
        className="community-report-modal__panel"
        onKeyDown={onKeyDown}
        onSubmit={onSubmit}
        ref={reportModalRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="community-report-modal__header">
          <div>
            <h3 id="community-report-title">Report post</h3>
            <p>Choose a reason for reporting this post.</p>
          </div>
          <button
            aria-label="Close report form"
            className="community-report-modal__close"
            type="button"
            onClick={onCancel}
          >
            ×
          </button>
        </header>
        <div className="community-report-modal__reasons" role="radiogroup" aria-label="Report reason">
          {reasons.map((reason) => (
            <label
              className={`community-report-modal__reason${selectedReason === reason ? ' is-selected' : ''}`}
              key={reason}
            >
              <input
                checked={selectedReason === reason}
                name="community-report-reason"
                type="radio"
                value={reason}
                onChange={() => onReasonChange(reason)}
              />
              <span>{reason}</span>
            </label>
          ))}
        </div>
        {reasonError && (
          <p className="community-report-modal__error" role="alert">{reasonError}</p>
        )}
        <div className="community-report-modal__actions">
          <button className="community-report-modal__cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="community-report-modal__submit" disabled={!selectedReason} type="submit">
            Submit report
          </button>
        </div>
      </form>
    </div>
  );
}
