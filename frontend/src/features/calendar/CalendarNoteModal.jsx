import { useCallback, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, X } from 'lucide-react';
import PublicCtaButton from '../../shared/components/PublicCtaButton';
import NotesScheduleModal from '../participant/home/NotesScheduleModal';
import { formatReminderDateTimeLabel } from '../participant/home/participantNotesModel';

export default function CalendarNoteModal({
  open,
  onClose,
  noteForm,
  onFormChange,
  onSubmit,
  savingNote,
  scheduleOpen,
  onScheduleOpenChange,
  onDateChange,
  onTimeChange,
  datePickerId,
  timePickerId,
  errorMessage = '',
}) {
  const titleId = useId();
  const scheduleLabel = formatReminderDateTimeLabel(noteForm.date, noteForm.time);

  const closeModal = useCallback(() => {
    onScheduleOpenChange(false);
    onClose();
  }, [onClose, onScheduleOpenChange]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || scheduleOpen) return;

      event.preventDefault();
      closeModal();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeModal, open, scheduleOpen]);

  if (!open) return null;

  const modalContent = (
    <div className="calendar-note-modal" role="presentation">
      <div
        className="calendar-note-modal__backdrop"
        aria-hidden="true"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeModal();
          }
        }}
      />
      <div
        className="calendar-note-modal__panel public-cta-scope"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir="ltr"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="calendar-note-modal__header">
          <h4 id={titleId}>Add a note</h4>
          <button type="button" className="calendar-note-modal__close" aria-label="Close" onClick={closeModal}>
            <X size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <p className="calendar-note-modal__hint">Private reminder for your calendar.</p>

        <form onSubmit={onSubmit} className="calendar-note-form">
          <label>
            Title
            <input
              name="title"
              value={noteForm.title}
              onChange={onFormChange}
              placeholder="Personal Note"
              autoComplete="off"
            />
          </label>

          <div className="calendar-note-form__schedule">
            <span className="calendar-note-form__schedule-label">Reminder</span>
            <div className="calendar-note-form__schedule-row">
              <button
                type="button"
                className={`pd-notes__schedule-btn${noteForm.date || noteForm.time ? ' has-schedule' : ''}`}
                aria-label="Set reminder date and time"
                aria-haspopup="dialog"
                aria-expanded={scheduleOpen}
                onClick={() => onScheduleOpenChange(true)}
              >
                <CalendarDays size={17} strokeWidth={2} aria-hidden="true" />
              </button>
              <span className={`calendar-note-form__schedule-value${scheduleLabel ? '' : ' is-placeholder'}`}>
                {scheduleLabel || 'Optional date and time'}
              </span>
            </div>
          </div>

          <label>
            Note content
            <textarea
              name="content"
              value={noteForm.content}
              onChange={onFormChange}
              placeholder="Write a reminder for yourself..."
              rows="4"
            />
          </label>

          {errorMessage ? (
            <p className="calendar-note-form__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <PublicCtaButton
            type="submit"
            className="calendar-note-form__submit"
            showArrow={false}
            block
            disabled={savingNote}
          >
            {savingNote ? 'Saving...' : 'Add note'}
          </PublicCtaButton>
        </form>
      </div>

      <NotesScheduleModal
        open={scheduleOpen}
        onClose={() => onScheduleOpenChange(false)}
        draftDate={noteForm.date}
        draftTime={noteForm.time}
        onDateChange={onDateChange}
        onTimeChange={onTimeChange}
        datePickerId={datePickerId}
        timePickerId={timePickerId}
      />
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
