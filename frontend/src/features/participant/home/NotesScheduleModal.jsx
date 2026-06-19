import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import {
  buildCalendarMonthCells,
  CALENDAR_WEEKDAY_LABELS,
  composeReminderTimeValue,
  DEFAULT_REMINDER_TIME_PARTS,
  formatReminderDateDisplay,
  formatReminderDateTimeLabel,
  formatReminderTimeDisplay,
  getCalendarMonthLabel,
  getInitialCalendarView,
  isReminderDateSelectable,
  parseReminderTimeParts,
  REMINDER_PERIOD_OPTIONS,
  sanitizeReminderHourInput,
  sanitizeReminderMinuteInput,
  stepReminderHour,
  stepReminderMinute,
  toDateInputValue,
} from './participantNotesModel';
import { useParticipantLocale } from '../context/ParticipantLocaleContext';
import './ParticipantDashboardHome.css';

function usePickerDismiss(open, setOpen, rootRef, enabled = true) {
  useEffect(() => {
    if (!open || !enabled) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [enabled, open, rootRef, setOpen]);
}

function NotesDatePicker({
  id,
  value,
  onChange,
  ariaLabel,
  open: controlledOpen,
  onOpenChange,
  pickerRef,
  embeddedInModal = false,
}) {
  const { t } = useParticipantLocale();
  const internalRef = useRef(null);
  const rootRef = pickerRef ?? internalRef;
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange != null;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(isOpen) : next;
      if (isControlled) {
        onOpenChange(resolved);
      } else {
        setInternalOpen(resolved);
      }
    },
    [isControlled, isOpen, onOpenChange],
  );

  usePickerDismiss(isOpen, setOpen, rootRef, !embeddedInModal);

  const initialView = getInitialCalendarView(value);
  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);

  useEffect(() => {
    if (!isOpen) return;

    const nextView = getInitialCalendarView(value);
    setViewYear(nextView.year);
    setViewMonth(nextView.month);
  }, [isOpen, value]);

  const cells = useMemo(() => buildCalendarMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = getCalendarMonthLabel(viewYear, viewMonth);
  const displayLabel = formatReminderDateDisplay(value);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((currentYear) => currentYear - 1);
      setViewMonth(11);
      return;
    }
    setViewMonth((currentMonth) => currentMonth - 1);
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((currentYear) => currentYear + 1);
      setViewMonth(0);
      return;
    }
    setViewMonth((currentMonth) => currentMonth + 1);
  };

  const handleSelect = (nextValue, date) => {
    if (!isReminderDateSelectable(date)) return;
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div className={`pd-notes-picker pd-notes-calendar${isOpen ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`pd-notes-picker__trigger${value ? ' is-filled' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`pd-notes-picker__value${displayLabel ? '' : ' is-placeholder'}`}>
          {displayLabel || t('selectDate')}
        </span>
        <CalendarDays size={15} strokeWidth={2} className="pd-notes-picker__icon" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          className="pd-notes-calendar__panel"
          role="dialog"
          aria-label={ariaLabel}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="pd-notes-calendar__nav">
            <button type="button" className="pd-notes-calendar__nav-btn" onClick={goPrevMonth} aria-label={t('prevMonth')}>
              <ChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <span className="pd-notes-calendar__month">{monthLabel}</span>
            <button type="button" className="pd-notes-calendar__nav-btn" onClick={goNextMonth} aria-label={t('nextMonth')}>
              <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className="pd-notes-calendar__weekdays" aria-hidden="true">
            {CALENDAR_WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="pd-notes-calendar__grid" role="grid">
            {cells.map((cell) => {
              const selectable = isReminderDateSelectable(cell.date);
              const isSelected = value === cell.value;
              const isToday = cell.value === toDateInputValue(new Date());

              return (
                <button
                  key={cell.value}
                  type="button"
                  role="gridcell"
                  aria-label={cell.value}
                  aria-selected={isSelected}
                  disabled={!selectable}
                  className={[
                    'pd-notes-calendar__day',
                    cell.inMonth ? '' : 'is-outside',
                    isSelected ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleSelect(cell.value, cell.date)}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimeStepperInput({ id, label, value, onCommit, maxLength }) {
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const displayValue = String(value).padStart(2, '0');

  const handleFocus = (event) => {
    setIsEditing(true);
    setText(displayValue);
    event.target.select();
  };

  const handleChange = (event) => {
    setText(event.target.value.replace(/\D/g, '').slice(0, maxLength));
  };

  const handleBlur = () => {
    setIsEditing(false);
    onCommit(text);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className="pd-notes-time__step-value"
      value={isEditing ? text : displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-label={label}
    />
  );
}

function NotesTimePicker({
  id,
  value,
  onChange,
  ariaLabel,
  open: controlledOpen,
  onOpenChange,
  pickerRef,
  embeddedInModal = false,
}) {
  const { t } = useParticipantLocale();
  const hourInputId = useId();
  const minuteInputId = useId();
  const internalRef = useRef(null);
  const rootRef = pickerRef ?? internalRef;
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange != null;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(isOpen) : next;
      if (isControlled) {
        onOpenChange(resolved);
      } else {
        setInternalOpen(resolved);
      }
    },
    [isControlled, isOpen, onOpenChange],
  );

  usePickerDismiss(isOpen, setOpen, rootRef, !embeddedInModal);

  const parsedValue = parseReminderTimeParts(value);
  const [draftHour, setDraftHour] = useState(parsedValue.hour12 ?? DEFAULT_REMINDER_TIME_PARTS.hour12);
  const [draftMinute, setDraftMinute] = useState(
    parsedValue.minute != null ? parsedValue.minute : DEFAULT_REMINDER_TIME_PARTS.minute,
  );
  const [draftPeriod, setDraftPeriod] = useState(parsedValue.period ?? DEFAULT_REMINDER_TIME_PARTS.period);

  useEffect(() => {
    if (!isOpen) return;

    const parts = parseReminderTimeParts(value);
    if (parts.hour12 != null && parts.minute != null && parts.period) {
      setDraftHour(parts.hour12);
      setDraftMinute(parts.minute);
      setDraftPeriod(parts.period);
      return;
    }

    setDraftHour(DEFAULT_REMINDER_TIME_PARTS.hour12);
    setDraftMinute(DEFAULT_REMINDER_TIME_PARTS.minute);
    setDraftPeriod(DEFAULT_REMINDER_TIME_PARTS.period);
  }, [isOpen, value]);

  const displayLabel = formatReminderTimeDisplay(value);

  const commitSelection = (hour12, minute, period) => {
    const nextValue = composeReminderTimeValue(hour12, minute, period);
    if (nextValue) onChange(nextValue);
  };

  const adjustHour = (delta) => {
    const nextHour = stepReminderHour(draftHour, delta);
    setDraftHour(nextHour);
    commitSelection(nextHour, draftMinute, draftPeriod);
  };

  const adjustMinute = (delta) => {
    const nextMinute = stepReminderMinute(draftMinute, delta);
    setDraftMinute(nextMinute);
    commitSelection(draftHour, nextMinute, draftPeriod);
  };

  const handlePeriodSelect = (period) => {
    setDraftPeriod(period);
    commitSelection(draftHour, draftMinute, period);
    if (embeddedInModal) {
      setOpen(false);
    }
  };

  const handleHourCommit = (text) => {
    const nextHour = sanitizeReminderHourInput(text);
    if (nextHour == null) return;

    setDraftHour(nextHour);
    commitSelection(nextHour, draftMinute, draftPeriod);
  };

  const handleMinuteCommit = (text) => {
    const nextMinute = sanitizeReminderMinuteInput(text);
    if (nextMinute == null) return;

    setDraftMinute(nextMinute);
    commitSelection(draftHour, nextMinute, draftPeriod);
  };

  return (
    <div className={`pd-notes-picker pd-notes-time${isOpen ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`pd-notes-picker__trigger${value ? ' is-filled' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`pd-notes-picker__value${displayLabel ? '' : ' is-placeholder'}`}>
          {displayLabel || t('selectTime')}
        </span>
        <Clock3 size={15} strokeWidth={2} className="pd-notes-picker__icon" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          className="pd-notes-time__panel"
          role="dialog"
          aria-label={ariaLabel}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="pd-notes-time__steppers">
            <div className="pd-notes-time__stepper">
              <span className="pd-notes-time__column-label">{t('hour')}</span>
              <button type="button" className="pd-notes-time__step-btn" aria-label={t('increaseHour')} onClick={() => adjustHour(1)}>
                <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
              <TimeStepperInput id={hourInputId} label={t('hour')} value={draftHour} maxLength={2} onCommit={handleHourCommit} />
              <button type="button" className="pd-notes-time__step-btn" aria-label={t('decreaseHour')} onClick={() => adjustHour(-1)}>
                <Minus size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>

            <div className="pd-notes-time__stepper">
              <span className="pd-notes-time__column-label">{t('minute')}</span>
              <button type="button" className="pd-notes-time__step-btn" aria-label={t('increaseMinute')} onClick={() => adjustMinute(1)}>
                <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
              <TimeStepperInput id={minuteInputId} label={t('minute')} value={draftMinute} maxLength={2} onCommit={handleMinuteCommit} />
              <button type="button" className="pd-notes-time__step-btn" aria-label={t('decreaseMinute')} onClick={() => adjustMinute(-1)}>
                <Minus size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>

            <div className="pd-notes-time__period">
              <span className="pd-notes-time__column-label">{t('period')}</span>
              <div className="pd-notes-time__period-spacer" aria-hidden="true" />
              <div className="pd-notes-time__period-btns">
                {REMINDER_PERIOD_OPTIONS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={`pd-notes-time__period-btn${draftPeriod === period ? ' is-selected' : ''}`}
                    aria-pressed={draftPeriod === period}
                    onClick={() => handlePeriodSelect(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <div className="pd-notes-time__period-spacer" aria-hidden="true" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function NotesScheduleModal({
  open: isModalOpen,
  onClose,
  draftDate,
  draftTime,
  onDateChange,
  onTimeChange,
  datePickerId,
  timePickerId,
}) {
  const { t } = useParticipantLocale();
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
    <div className="pd-notes-schedule-modal" role="presentation">
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
          <NotesDatePicker
            id={datePickerId}
            value={draftDate}
            ariaLabel={t('reminderDate')}
            onChange={onDateChange}
            open={isDatePickerOpen}
            onOpenChange={(nextOpen) => {
              setIsDatePickerOpen(nextOpen);
              if (nextOpen) setIsTimePickerOpen(false);
            }}
            pickerRef={datePickerRef}
            embeddedInModal
          />
          <NotesTimePicker
            id={timePickerId}
            value={draftTime}
            ariaLabel={t('reminderTime')}
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
