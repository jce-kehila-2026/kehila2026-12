import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

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
  const { t } = useParticipantLocale();
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
            <h3 id="community-edit-post-title">{t('editPostTitle')}</h3>
            <p>{t('editPostDesc')}</p>
          </div>
          <button
            aria-label={t('closeEditForm')}
            className="community-report-modal__close"
            type="button"
            onClick={onCancel}
          >
            ×
          </button>
        </header>
        <textarea
          aria-label={t('editPostTextAria')}
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
            {t('cancel')}
          </button>
          <button className="community-report-modal__submit" disabled={isSaveDisabled} type="submit">
            {t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
