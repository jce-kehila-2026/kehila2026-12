import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  formatReminderDateTimeLabel,
} from './participantNotesModel';
import { useParticipantLocale } from '../context/ParticipantLocaleContext';
import ReminderDatePicker from '../../../shared/components/ReminderDatePicker';
import ReminderTimePicker from '../../../shared/components/ReminderTimePicker';
import '../../../shared/components/ReminderTimePicker.css';
import './ParticipantDashboardHome.css';

export default function NotesScheduleModal({
  open: isModalOpen,
  onClose,
  draftDate,
  draftTime,
  onDateChange,
  onTimeChange,
  datePickerId,
  timePickerId,
  darkMode = false,
}) {
  const { t } = useParticipantLocale();
  const datePickerLabels = useMemo(
    () => ({
      selectDate: t('selectDate'),
      prevMonth: t('prevMonth'),
      nextMonth: t('nextMonth'),
    }),
    [t],
  );
  const timePickerLabels = useMemo(
    () => ({
      selectTime: t('selectTime'),
      hour: t('hour'),
      minute: t('minute'),
      period: t('period'),
      increaseHour: t('increaseHour'),
      decreaseHour: t('decreaseHour'),
      increaseMinute: t('increaseMinute'),
      decreaseMinute: t('decreaseMinute'),
      done: t('done'),
    }),
    [t],
  );
  const titleId = useId();
  const panelRef = useRef(null);
  const datePickerRef = useRef(null);
  const timePickerRef = useRef(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const closeModal = useCallback(() => {
    setIsDatePickerOpen(false);
    setIsTimePickerOpen(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isModalOpen) return undefined;
    setIsDatePickerOpen(false);
    setIsTimePickerOpen(false);
    return undefined;
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      event.stopPropagation();

      if (isDatePickerOpen) {
        setIsDatePickerOpen(false);
        return;
      }

      if (isTimePickerOpen) {
        setIsTimePickerOpen(false);
        return;
      }

      closeModal();
    };

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!panelRef.current?.contains(target)) return;

      if (isDatePickerOpen && datePickerRef.current && !datePickerRef.current.contains(target)) {
        setIsDatePickerOpen(false);
      }

      if (isTimePickerOpen && timePickerRef.current && !timePickerRef.current.contains(target)) {
        setIsTimePickerOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [closeModal, isDatePickerOpen, isModalOpen, isTimePickerOpen]);

  if (!isModalOpen) return null;

  const scheduleSummary = formatReminderDateTimeLabel(draftDate, draftTime);

  const modalContent = (
    <div
      className={`pd-notes-schedule-modal${darkMode ? ' participant-home--dark' : ''}`}
      role="presentation"
    >
      <div
        className="pd-notes-schedule-modal__backdrop"
        aria-hidden="true"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeModal();
          }
        }}
      />
      <div
        ref={panelRef}
        className="pd-notes-schedule-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir="ltr"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pd-notes-schedule-modal__header">
          <h4 id={titleId}>{t('reminderSchedule')}</h4>
          <button type="button" className="pd-notes-schedule-modal__close" aria-label={t('close')} onClick={closeModal}>
            <X size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <p className="pd-notes-schedule-modal__hint">{t('reminderScheduleHint')}</p>

        <div className="pd-notes__datetime pd-notes__datetime--modal">
          <ReminderDatePicker
            id={datePickerId}
            value={draftDate}
            ariaLabel={t('reminderDate')}
            labels={datePickerLabels}
            onChange={onDateChange}
            open={isDatePickerOpen}
            onOpenChange={(nextOpen) => {
              setIsDatePickerOpen(nextOpen);
              if (nextOpen) setIsTimePickerOpen(false);
            }}
            pickerRef={datePickerRef}
            embeddedInModal
          />
          <ReminderTimePicker
            id={timePickerId}
            value={draftTime}
            ariaLabel={t('reminderTime')}
            labels={timePickerLabels}
            onChange={onTimeChange}
            open={isTimePickerOpen}
            onOpenChange={(nextOpen) => {
              setIsTimePickerOpen(nextOpen);
              if (nextOpen) setIsDatePickerOpen(false);
            }}
            pickerRef={timePickerRef}
            embeddedInModal
          />
        </div>

        {scheduleSummary ? (
          <p className="pd-notes-schedule-modal__summary" role="status">
            {scheduleSummary}
          </p>
        ) : null}

        <button type="button" className="pd-btn pd-btn--soft pd-notes-schedule-modal__done" onClick={closeModal}>
          {t('done')}
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
