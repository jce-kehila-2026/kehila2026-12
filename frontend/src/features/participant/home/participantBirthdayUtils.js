const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

function parseYyyyMmDdToLocalDate(str) {
  if (typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!YYYY_MM_DD.test(trimmed)) return null;

  const [y, m, d] = trimmed.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    Number.isNaN(dt.getTime())
    || dt.getFullYear() !== y
    || dt.getMonth() !== m - 1
    || dt.getDate() !== d
  ) {
    return null;
  }

  return dt;
}

function formatDateToYyyyMmDd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

/**
 * Normalize birthDate from Firestore profile (Timestamp, Date, seconds object, or string).
 * @param {*} raw
 * @returns {string} YYYY-MM-DD or ""
 */
export function normalizeBirthDateFromProfile(raw) {
  if (raw == null || raw === '') return '';

  if (typeof raw?.toDate === 'function') {
    return formatDateToYyyyMmDd(raw.toDate());
  }

  if (raw instanceof Date) {
    return formatDateToYyyyMmDd(raw);
  }

  if (typeof raw === 'object' && typeof raw.seconds === 'number') {
    const ms = raw.seconds * 1000 + (typeof raw.nanoseconds === 'number' ? raw.nanoseconds / 1e6 : 0);
    return formatDateToYyyyMmDd(new Date(ms));
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (YYYY_MM_DD.test(trimmed) && parseYyyyMmDdToLocalDate(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateToYyyyMmDd(parsed);
    }
    return '';
  }

  return '';
}

/**
 * Compare birth date day/month with today (local time). Ignores year.
 * @param {*} birthDateRaw
 * @returns {boolean}
 */
export function isBirthdayToday(birthDateRaw) {
  const normalized = normalizeBirthDateFromProfile(birthDateRaw);
  if (!normalized) return false;

  const birth = parseYyyyMmDdToLocalDate(normalized);
  if (!birth) return false;

  const today = new Date();
  return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
}
