import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

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
  const { t } = useParticipantLocale();
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
            <h3 id="community-report-title">{t('reportPostTitle')}</h3>
            <p>{t('reportPostDesc')}</p>
          </div>
          <button
            aria-label={t('closeReportForm')}
            className="community-report-modal__close"
            type="button"
            onClick={onCancel}
          >
            ×
          </button>
        </header>
        <div className="community-report-modal__reasons" role="radiogroup" aria-label={t('reportReasonAria')}>
          {reasons.map((reason) => {
            const reasonValue = typeof reason === 'string' ? reason : reason.value;
            const reasonLabel = typeof reason === 'string' ? reason : t(reason.labelKey);
            return (
              <label
                className={`community-report-modal__reason${selectedReason === reasonValue ? ' is-selected' : ''}`}
                key={reasonValue}
              >
                <input
                  checked={selectedReason === reasonValue}
                  name="community-report-reason"
                  type="radio"
                  value={reasonValue}
                  onChange={() => onReasonChange(reasonValue)}
                />
                <span>{reasonLabel}</span>
              </label>
            );
          })}
        </div>
        {reasonError && (
          <p className="community-report-modal__error" role="alert">{reasonError}</p>
        )}
        <div className="community-report-modal__actions">
          <button className="community-report-modal__cancel" type="button" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button className="community-report-modal__submit" disabled={!selectedReason} type="submit">
            {t('submitReport')}
          </button>
        </div>
      </form>
    </div>
  );
}
