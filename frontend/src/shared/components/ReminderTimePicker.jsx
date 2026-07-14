import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock3, Minus, Plus } from 'lucide-react';
import {
  composeReminderTimeValue,
  DEFAULT_REMINDER_TIME_PARTS,
  formatReminderTimeDisplay,
  parseReminderTimeParts,
  REMINDER_PERIOD_OPTIONS,
  sanitizeReminderHourInput,
  sanitizeReminderMinuteInput,
  stepReminderHour,
  stepReminderMinute,
} from '../../features/participant/home/participantNotesModel';
import './ReminderTimePicker.css';
import useReminderPickerPortalPosition from './useReminderPickerPortalPosition';

function usePickerDismiss(open, setOpen, rootRef, panelRef, enabled = true) {
  useEffect(() => {
    if (!open || !enabled) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      if (panelRef?.current?.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [enabled, open, panelRef, rootRef, setOpen]);
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

/**
 * @typedef {object} ReminderTimePickerLabels
 * @property {string} selectTime
 * @property {string} hour
 * @property {string} minute
 * @property {string} period
 * @property {string} increaseHour
 * @property {string} decreaseHour
 * @property {string} increaseMinute
 * @property {string} decreaseMinute
 * @property {string} [done]
 */

/**
 * @param {{
 *   id?: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   ariaLabel: string,
 *   labels: ReminderTimePickerLabels,
 *   open?: boolean,
 *   onOpenChange?: (open: boolean) => void,
 *   pickerRef?: import('react').RefObject<HTMLDivElement|null>,
 *   embeddedInModal?: boolean,
 *   showDoneButton?: boolean,
 *   portal?: boolean,
 *   compact?: boolean,
 *   className?: string,
 *   disabled?: boolean,
 * }} props
 */
export default function ReminderTimePicker({
  id,
  value,
  onChange,
  ariaLabel,
  labels,
  open: controlledOpen,
  onOpenChange,
  pickerRef,
  embeddedInModal = false,
  showDoneButton = false,
  portal = false,
  compact = false,
  className = '',
  disabled = false,
}) {
  const hourInputId = useId();
  const minuteInputId = useId();
  const internalRef = useRef(null);
  const panelRef = useRef(null);
  const rootRef = pickerRef ?? internalRef;
  const [internalOpen, setInternalOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const isControlled = controlledOpen !== undefined && onOpenChange != null;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const isAdminEventsPicker = className.includes('admin-events-time-picker');

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

  usePickerDismiss(isOpen, setOpen, rootRef, panelRef, !embeddedInModal);

  useReminderPickerPortalPosition({
    isOpen,
    portal,
    rootRef,
    panelRef,
    setPanelStyle,
    compact,
    estimatedHeight: compact ? (showDoneButton ? 150 : 115) : (showDoneButton ? 280 : 240),
  });

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

  const handleDone = () => {
    commitSelection(draftHour, draftMinute, draftPeriod);
    setOpen(false);
  };

  const stepIconSize = compact ? 12 : 14;

  const panel = isOpen ? (
    <div
      ref={panelRef}
      className={[
        'pd-notes-time__panel',
        portal ? 'pd-notes-time__panel--portal reminder-picker-popover--portal' : '',
        compact ? 'pd-notes-time__panel--compact' : '',
        isAdminEventsPicker ? 'admin-events-time-picker-panel' : '',
      ].filter(Boolean).join(' ')}
      style={portal ? panelStyle : undefined}
      role="dialog"
      aria-label={ariaLabel}
      dir="ltr"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="pd-notes-time__steppers">
        <div className="pd-notes-time__stepper">
          <span className="pd-notes-time__column-label">{labels.hour}</span>
          <button type="button" className="pd-notes-time__step-btn" aria-label={labels.increaseHour} onClick={() => adjustHour(1)}>
            <Plus size={stepIconSize} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <TimeStepperInput id={hourInputId} label={labels.hour} value={draftHour} maxLength={2} onCommit={handleHourCommit} />
          <button type="button" className="pd-notes-time__step-btn" aria-label={labels.decreaseHour} onClick={() => adjustHour(-1)}>
            <Minus size={stepIconSize} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>

        <div className="pd-notes-time__stepper">
          <span className="pd-notes-time__column-label">{labels.minute}</span>
          <button type="button" className="pd-notes-time__step-btn" aria-label={labels.increaseMinute} onClick={() => adjustMinute(1)}>
            <Plus size={stepIconSize} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <TimeStepperInput id={minuteInputId} label={labels.minute} value={draftMinute} maxLength={2} onCommit={handleMinuteCommit} />
          <button type="button" className="pd-notes-time__step-btn" aria-label={labels.decreaseMinute} onClick={() => adjustMinute(-1)}>
            <Minus size={stepIconSize} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>

        <div className="pd-notes-time__period">
          <span className="pd-notes-time__column-label">{labels.period}</span>
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

      {showDoneButton ? (
        <button type="button" className="reminder-time-picker__done" onClick={handleDone}>
          {labels.done || 'Done'}
        </button>
      ) : null}
    </div>
  ) : null;

  return (
    <div
      className={[
        'pd-notes-picker',
        'pd-notes-time',
        isOpen ? 'is-open' : '',
        compact ? 'reminder-time-picker--compact' : '',
        disabled ? 'is-disabled' : '',
        className,
      ].filter(Boolean).join(' ')}
      ref={rootRef}
    >
      <button
        type="button"
        id={id}
        className={`pd-notes-picker__trigger${value ? ' is-filled' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
      >
        <span className={`pd-notes-picker__value${displayLabel ? '' : ' is-placeholder'}`} dir="ltr">
          {displayLabel || labels.selectTime}
        </span>
        <Clock3 size={15} strokeWidth={2} className="pd-notes-picker__icon" aria-hidden="true" />
      </button>

      {portal && typeof document !== 'undefined' ? createPortal(panel, document.body) : panel}
    </div>
  );
}
