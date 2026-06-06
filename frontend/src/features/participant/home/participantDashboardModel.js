/**
 * Shared shapes and normalizers for participant dashboard home cards.
 * UI components consume normalized objects; Firestore docs map through these helpers.
 */

/** @typedef {import('firebase/firestore').Timestamp} FirestoreTimestamp */

/**
 * Raw appointment document shape (mock today, Firestore later).
 * @typedef {Object} DashboardAppointmentRaw
 * @property {string} id
 * @property {string} title
 * @property {string} therapistName
 * @property {string} [therapistRole]
 * @property {string} [initials]
 * @property {string} [photo]
 * @property {string} location
 * @property {Date|string|FirestoreTimestamp} startsAt
 */

/**
 * Normalized appointment for dashboard UI + countdown ring.
 * @typedef {Object} DashboardAppointment
 * @property {string} id
 * @property {string} title
 * @property {string} therapistName
 * @property {string} [therapistRole]
 * @property {string} [initials]
 * @property {string} [photo]
 * @property {string} location
 * @property {Date} targetDate
 * @property {string} dateLabel
 * @property {string} timeLabel
 */

/**
 * Raw event document shape (mock today, Firestore later).
 * @typedef {Object} DashboardEventRaw
 * @property {string} id
 * @property {string} title
 * @property {string} [category]
 * @property {string} location
 * @property {Date|string|FirestoreTimestamp} startsAt
 */

/**
 * Normalized event for dashboard UI + countdown ring.
 * @typedef {Object} DashboardEvent
 * @property {string} id
 * @property {string} title
 * @property {string} [category]
 * @property {string} location
 * @property {Date} targetDate
 * @property {string} dateLabel
 * @property {string} timeLabel
 */

/**
 * @param {Date|string|FirestoreTimestamp|null|undefined} value
 * @returns {Date|null}
 */
export function toStartsAtDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * @param {Date} date
 * @returns {string}
 */
export function formatDashboardDateLabel(date) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * @param {Date} date
 * @returns {string}
 */
export function formatDashboardTimeLabel(date) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * @param {DashboardAppointmentRaw|null|undefined} raw
 * @returns {DashboardAppointment|null}
 */
export function normalizeDashboardAppointment(raw) {
  if (!raw) return null;

  const targetDate = toStartsAtDate(raw.startsAt);
  if (!targetDate) return null;

  return {
    id: raw.id,
    title: raw.title,
    therapistName: raw.therapistName,
    therapistRole: raw.therapistRole,
    initials: raw.initials,
    photo: raw.photo,
    location: raw.location,
    targetDate,
    dateLabel: formatDashboardDateLabel(targetDate),
    timeLabel: formatDashboardTimeLabel(targetDate),
  };
}

/**
 * @param {DashboardEventRaw|null|undefined} raw
 * @returns {DashboardEvent|null}
 */
export function normalizeDashboardEvent(raw) {
  if (!raw) return null;

  const targetDate = toStartsAtDate(raw.startsAt);
  if (!targetDate) return null;

  return {
    id: raw.id,
    title: raw.title,
    category: raw.category,
    location: raw.location,
    targetDate,
    dateLabel: formatDashboardDateLabel(targetDate),
    timeLabel: formatDashboardTimeLabel(targetDate),
  };
}
