/**

 * Dashboard notes & reminders — shared shapes and helpers.

 * Calendar sync uses createCalendarNote() when date + time are present.

 */



/** @typedef {Object} DashboardNote

 * @property {string} id

 * @property {string} title

 * @property {string} date - YYYY-MM-DD or empty

 * @property {string} time - HH:mm or empty

 * @property {boolean} done

 * @property {boolean} syncToCalendar

 * @property {string} [calendarNoteId]

 */



export const SYNC_VALIDATION_MESSAGE =
  'Please select a date and time to add this note to your calendar.';



export const CALENDAR_WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];



export function hasValidReminderDateTime(date, time) {

  return Boolean(String(date || '').trim()) && Boolean(String(time || '').trim());

}



/**

 * @param {boolean} syncEnabled

 * @param {string} date

 * @param {string} time

 * @returns {boolean}

 */

export function shouldSyncToCalendar(syncEnabled, date, time) {

  return syncEnabled && hasValidReminderDateTime(date, time);

}



/**

 * Returns a validation message when sync is on but date/time are incomplete.

 * @param {boolean} syncEnabled

 * @param {string} date

 * @param {string} time

 * @returns {string|null}

 */

export function getSyncValidationError(syncEnabled, date, time) {

  if (!syncEnabled) return null;

  if (hasValidReminderDateTime(date, time)) return null;

  return SYNC_VALIDATION_MESSAGE;

}



/**

 * @param {string} date - YYYY-MM-DD

 * @param {string} time - HH:mm

 * @returns {string|null}

 */

export function formatReminderDateTimeLabel(date, time) {

  if (!hasValidReminderDateTime(date, time)) return null;



  const parsed = new Date(`${date}T${time}`);

  if (Number.isNaN(parsed.getTime())) return null;



  return new Intl.DateTimeFormat('en', {

    weekday: 'short',

    month: 'short',

    day: 'numeric',

    hour: 'numeric',

    minute: '2-digit',

  }).format(parsed);

}



export function toDateInputValue(date) {

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;

}



export function parseReminderDateValue(value) {

  if (!value) return null;



  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) return null;



  const date = new Date(year, month - 1, day);

  if (

    date.getFullYear() !== year ||

    date.getMonth() !== month - 1 ||

    date.getDate() !== day

  ) {

    return null;

  }



  return date;

}



export function formatReminderDateDisplay(value) {

  const date = parseReminderDateValue(value);

  if (!date) return null;



  return new Intl.DateTimeFormat('en', {

    month: 'short',

    day: 'numeric',

    year: 'numeric',

  }).format(date);

}



export function getTodayAtMidnight() {

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today;

}



export function isReminderDateSelectable(date) {

  const today = getTodayAtMidnight();

  const candidate = new Date(date);

  candidate.setHours(0, 0, 0, 0);

  return candidate >= today;

}



export function getInitialCalendarView(selectedValue) {

  const parsed = parseReminderDateValue(selectedValue);

  if (parsed) {

    return { year: parsed.getFullYear(), month: parsed.getMonth() };

  }



  const today = new Date();

  return { year: today.getFullYear(), month: today.getMonth() };

}



export function getCalendarMonthLabel(viewYear, viewMonth) {

  return new Intl.DateTimeFormat('en', {

    month: 'long',

    year: 'numeric',

  }).format(new Date(viewYear, viewMonth, 1));

}



/** @returns {{ date: Date, value: string, inMonth: boolean }[]} */

export function buildCalendarMonthCells(viewYear, viewMonth) {

  const firstOfMonth = new Date(viewYear, viewMonth, 1);

  const startOffset = firstOfMonth.getDay();

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];



  for (let index = 0; index < 42; index += 1) {

    let dayNumber;

    let cellMonth = viewMonth;

    let cellYear = viewYear;

    let inMonth = true;



    if (index < startOffset) {

      dayNumber = daysInPrevMonth - startOffset + index + 1;

      cellMonth = viewMonth - 1;

      if (cellMonth < 0) {

        cellMonth = 11;

        cellYear -= 1;

      }

      inMonth = false;

    } else if (index >= startOffset + daysInMonth) {

      dayNumber = index - startOffset - daysInMonth + 1;

      cellMonth = viewMonth + 1;

      if (cellMonth > 11) {

        cellMonth = 0;

        cellYear += 1;

      }

      inMonth = false;

    } else {

      dayNumber = index - startOffset + 1;

    }



    const date = new Date(cellYear, cellMonth, dayNumber);

    cells.push({ date, value: toDateInputValue(date), inMonth });

  }



  return cells;
}

export const REMINDER_PERIOD_OPTIONS = ['AM', 'PM'];

export const DEFAULT_REMINDER_TIME_PARTS = { hour12: 9, minute: 0, period: 'AM' };

export function stepReminderHour(hour12, delta) {
  const current = hour12 ?? DEFAULT_REMINDER_TIME_PARTS.hour12;
  let next = current + delta;

  if (next > 12) next = 1;
  if (next < 1) next = 12;

  return next;
}

export function stepReminderMinute(minute, delta) {
  const current = minute ?? DEFAULT_REMINDER_TIME_PARTS.minute;
  let next = current + delta;

  if (next > 59) next = 0;
  if (next < 0) next = 59;

  return next;
}

/**
 * @param {string|number} input
 * @returns {number|null}
 */
export function sanitizeReminderHourInput(input) {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;

  return Math.min(12, Math.max(1, Math.round(parsed)));
}

/**
 * @param {string|number} input
 * @returns {number|null}
 */
export function sanitizeReminderMinuteInput(input) {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;

  return Math.min(59, Math.max(0, Math.round(parsed)));
}

/**
 * @param {string} value - HH:mm (24h)
 * @returns {{ hour12: number|null, minute: number|null, period: 'AM'|'PM'|null }}
 */
export function parseReminderTimeParts(value) {
  if (!value) {
    return { hour12: null, minute: null, period: null };
  }

  const match = String(value).trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return { hour12: null, minute: null, period: null };
  }

  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  if (hour24 > 23 || minute > 59) {
    return { hour12: null, minute: null, period: null };
  }

  const period = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  return { hour12, minute, period };
}

/**
 * @param {number|null} hour12
 * @param {number|null} minute
 * @param {'AM'|'PM'|null} period
 * @returns {string}
 */
export function composeReminderTimeValue(hour12, minute, period) {
  if (!hour12 || minute == null || !period) return '';

  let hour24 = hour12 % 12;
  if (period === 'PM') hour24 += 12;

  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * @param {string} value - HH:mm (24h)
 * @returns {string|null}
 */
export function formatReminderTimeDisplay(value) {
  const parts = parseReminderTimeParts(value);
  if (parts.hour12 == null || parts.minute == null || !parts.period) return null;

  const hourLabel = String(parts.hour12).padStart(2, '0');
  const minuteLabel = String(parts.minute).padStart(2, '0');
  return `${hourLabel}:${minuteLabel} ${parts.period}`;
}
