import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  buildCalendarMonthCells,
  CALENDAR_WEEKDAY_LABELS,
  formatReminderDateDisplay,
  getCalendarMonthLabel,
  getInitialCalendarView,
  isReminderDateSelectable,
  toDateInputValue,
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

/**
 * @typedef {object} ReminderDatePickerLabels
 * @property {string} selectDate
 * @property {string} prevMonth
 * @property {string} nextMonth
 */

/**
 * @param {{
 *   id?: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   ariaLabel: string,
 *   labels: ReminderDatePickerLabels,
 *   open?: boolean,
 *   onOpenChange?: (open: boolean) => void,
 *   pickerRef?: import('react').RefObject<HTMLDivElement|null>,
 *   embeddedInModal?: boolean,
 *   portal?: boolean,
 *   compact?: boolean,
 *   className?: string,
 *   disabled?: boolean,
 *   isDateSelectable?: (date: Date) => boolean,
 * }} props
 */
export default function ReminderDatePicker({
  id,
  value,
  onChange,
  ariaLabel,
  labels,
  open: controlledOpen,
  onOpenChange,
  pickerRef,
  embeddedInModal = false,
  portal = false,
  compact = false,
  className = '',
  disabled = false,
  isDateSelectable,
  multiple = false,
}) {
  // In multiple mode `value` is an array of "YYYY-MM-DD" strings and the calendar
  // stays open so several dates can be toggled in one go.
  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : [];
  const viewSeedValue = multiple ? (selectedValues[0] || '') : value;
  const internalRef = useRef(null);
  const panelRef = useRef(null);
  const rootRef = pickerRef ?? internalRef;
  const [internalOpen, setInternalOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
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

  usePickerDismiss(isOpen, setOpen, rootRef, panelRef, !embeddedInModal);

  useReminderPickerPortalPosition({
    isOpen,
    portal,
    rootRef,
    panelRef,
    setPanelStyle,
    compact,
    estimatedHeight: compact ? 290 : 320,
  });

  const initialView = getInitialCalendarView(viewSeedValue);
  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);

  useEffect(() => {
    if (!isOpen) return;

    const nextView = getInitialCalendarView(viewSeedValue);
    setViewYear(nextView.year);
    setViewMonth(nextView.month);
  }, [isOpen, viewSeedValue]);

  const cells = useMemo(() => buildCalendarMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = getCalendarMonthLabel(viewYear, viewMonth);
  const displayLabel = multiple ? '' : formatReminderDateDisplay(value);
  const hasValue = multiple ? selectedValues.length > 0 : Boolean(value);

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

  const canSelectDate = useCallback(
    (date) => isReminderDateSelectable(date) && (!isDateSelectable || isDateSelectable(date)),
    [isDateSelectable],
  );

  const handleSelect = (nextValue, date) => {
    if (!canSelectDate(date)) return;
    if (multiple) {
      // Toggle the date in/out of the selection and keep the calendar open.
      const next = selectedValues.includes(nextValue)
        ? selectedValues.filter((item) => item !== nextValue)
        : [...selectedValues, nextValue].sort();
      onChange(next);
      return;
    }
    onChange(nextValue);
    setOpen(false);
  };

  const panel = isOpen ? (
    <div
      ref={panelRef}
      className={[
        'pd-notes-calendar__panel',
        portal ? 'pd-notes-calendar__panel--portal reminder-picker-popover--portal' : '',
        compact ? 'pd-notes-calendar__panel--compact' : '',
      ].filter(Boolean).join(' ')}
      style={portal ? panelStyle : undefined}
      role="dialog"
      aria-label={ariaLabel}
      dir="ltr"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="pd-notes-calendar__nav">
        <button type="button" className="pd-notes-calendar__nav-btn" onClick={goPrevMonth} aria-label={labels.prevMonth}>
          <ChevronLeft size={compact ? 14 : 16} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <span className="pd-notes-calendar__month">{monthLabel}</span>
        <button type="button" className="pd-notes-calendar__nav-btn" onClick={goNextMonth} aria-label={labels.nextMonth}>
          <ChevronRight size={compact ? 14 : 16} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <div className="pd-notes-calendar__weekdays" aria-hidden="true">
        {CALENDAR_WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="pd-notes-calendar__grid" role="grid">
        {cells.map((cell) => {
          const selectable = canSelectDate(cell.date);
          const isSelected = multiple ? selectedValues.includes(cell.value) : value === cell.value;
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
  ) : null;

  return (
    <div
      className={[
        'pd-notes-picker',
        'pd-notes-calendar',
        isOpen ? 'is-open' : '',
        compact ? 'reminder-date-picker--compact' : '',
        disabled ? 'is-disabled' : '',
        className,
      ].filter(Boolean).join(' ')}
      ref={rootRef}
    >
      <button
        type="button"
        id={id}
        className={`pd-notes-picker__trigger${hasValue ? ' is-filled' : ''}`}
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
          {displayLabel || labels.selectDate}
        </span>
        <CalendarDays size={15} strokeWidth={2} className="pd-notes-picker__icon" aria-hidden="true" />
      </button>

      {portal && typeof document !== 'undefined' ? createPortal(panel, document.body) : panel}
    </div>
  );
}
