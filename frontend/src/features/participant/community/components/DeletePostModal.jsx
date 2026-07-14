import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function DeletePostModal({
  closeLabel,
  deleteModalRef,
  description,
  title,
  titleId = 'community-delete-post-title',
  onBackdropMouseDown,
  onCancel,
  onConfirm,
  onKeyDown,
}) {
  const { t } = useParticipantLocale();
  const resolvedTitle = title ?? t('deletePost');
  const resolvedDescription = description ?? t('deletePostConfirm');
  const resolvedCloseLabel = closeLabel ?? t('closeDeleteConfirmation');
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
            <h3 id={titleId}>{resolvedTitle}</h3>
            <p>{resolvedDescription}</p>
          </div>
          <button
            aria-label={resolvedCloseLabel}
            className="community-report-modal__close"
            type="button"
            onClick={onCancel}
          >
            ×
          </button>
        </header>
        <div className="community-report-modal__actions">
          <button className="community-report-modal__cancel" type="button" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button className="community-report-modal__submit" type="button" onClick={onConfirm}>
            {t('delete')}
          </button>
        </div>
      </section>
    </div>
  );
}
