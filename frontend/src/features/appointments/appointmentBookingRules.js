export const APPOINTMENT_BOOKING_CONFLICT = Object.freeze({
  DAY: 'APPOINTMENT_DAY_CONFLICT',
});

function toDate(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateKey(value) {
  const date = toDate(value);
  if (!date) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function resolveDateKey(booking) {
  const explicit = String(booking?.dateKey || booking?.selectedDate || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;
  return toDateKey(booking?.startAt || booking?.startDate || booking?.eventDate);
}

function isInactiveBooking(booking) {
  const status = String(booking?.status || '').trim().toLowerCase();
  return status === 'cancelled' || status === 'canceled' || status === 'inactive';
}

function isSameBooking(candidate, existing) {
  const candidateIds = new Set([
    candidate?.bookingId,
    candidate?.id,
    candidate?.slotId,
  ].filter(Boolean));

  return [existing?.bookingId, existing?.id, existing?.slotId]
    .filter(Boolean)
    .some((id) => candidateIds.has(id));
}

/**
 * Participants may hold only one active appointment on a calendar day.
 */
export function findAppointmentBookingConflict(candidate, activeBookings = []) {
  const candidateDateKey = resolveDateKey(candidate);
  if (!candidateDateKey) return null;

  const sameDayBooking = activeBookings.find((booking) => (
    !isInactiveBooking(booking)
    && !isSameBooking(candidate, booking)
    && resolveDateKey(booking) === candidateDateKey
  ));

  if (sameDayBooking) {
    return {
      code: APPOINTMENT_BOOKING_CONFLICT.DAY,
      booking: sameDayBooking,
    };
  }

  return null;
}

export function isAppointmentOptionBookable(option, activeBookings = [], registeredSessionIds = new Set()) {
  if (!option || registeredSessionIds.has(option.id)) return false;
  if (Number(option.capacity) > 0 && Number(option.participants) >= Number(option.capacity)) return false;
  return !findAppointmentBookingConflict(option, activeBookings);
}

export function hasBookableAppointmentOption(options = [], activeBookings = [], registeredSessionIds = new Set()) {
  return options.some((option) => isAppointmentOptionBookable(option, activeBookings, registeredSessionIds));
}

/**
 * A deterministic daily lock makes the rule race-safe in Firestore.
 */
export function buildAppointmentConstraintLocks(booking) {
  const dateKey = resolveDateKey(booking);
  if (!dateKey) return [];

  return [{
    id: `day__${dateKey}`,
    kind: 'day',
    dateKey,
  }];
}
