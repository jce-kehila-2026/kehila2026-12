import { collection, doc, getDoc, getDocs, limit, query } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import {
  normalizeDashboardAppointment,
  normalizeDashboardEvent,
  toStartsAtDate,
} from './participantDashboardModel';

/** @typedef {import('./participantDashboardModel').DashboardAppointment} DashboardAppointment */
/** @typedef {import('./participantDashboardModel').DashboardEvent} DashboardEvent */

const USERS_COLLECTION = 'users';

function isCancelled(data) {
  const status = String(data?.status || '').trim().toLowerCase();
  return status === 'cancelled' || status === 'canceled';
}

function isAppointmentBooking(row) {
  const eventType = String(row?.eventType || row?.type || row?.category || '').trim().toLowerCase();
  return eventType.includes('appointment') || String(row?.eventTitle || row?.title || '').toLowerCase().includes('appointment');
}

function isGeneratedSessionId(value) {
  return String(value || '').includes('__');
}

function getBookingIdentityKeys(data, docId = '') {
  const slotKey = data?.slotId || (isGeneratedSessionId(docId) ? docId : '');
  const keys = [
    data?.bookingId,
    data?.registrationKey,
    data?.sessionRegistrationKey,
    slotKey,
    docId,
  ].filter(Boolean);

  if (!slotKey && data?.eventId) {
    keys.push(data.eventId);
  }

  return [...new Set(keys)];
}

function normalizeTimeString(value, fallback = '09:00') {
  if (!value) return fallback;

  if (typeof value === 'string') {
    const match = value.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    }
  }

  const date = toStartsAtDate(value);
  if (date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  return fallback;
}

function resolveStartAt(row) {
  const direct = toStartsAtDate(row?.startAt || row?.eventDate);
  if (direct) return direct;

  const dateKey = row?.dateKey || row?.selectedDate || row?.date;
  if (dateKey) {
    const timeStr =
      row?.selectedTime || row?.selectedTimeSlot || row?.sessionTime || row?.time || row?.startTime;

    if (timeStr) {
      const [hours, minutes] = normalizeTimeString(timeStr).split(':').map(Number);
      const dateOnly = toStartsAtDate(dateKey);

      if (dateOnly) {
        const combined = new Date(dateOnly);
        combined.setHours(hours, minutes || 0, 0, 0);
        return combined;
      }

      const isoAttempt = toStartsAtDate(`${dateKey}T${normalizeTimeString(timeStr)}`);
      if (isoAttempt) return isoAttempt;
    }

    return toStartsAtDate(dateKey);
  }

  return toStartsAtDate(row?.startTime || row?.startDate);
}

function isUpcomingRow(row, nowMs) {
  if (isCancelled(row)) return false;
  const startsAt = resolveStartAt(row);
  return Boolean(startsAt && startsAt.getTime() > nowMs);
}

function sortByNearestStart(rows) {
  return [...rows].sort((a, b) => {
    const aTime = resolveStartAt(a)?.getTime() || Number.MAX_SAFE_INTEGER;
    const bTime = resolveStartAt(b)?.getTime() || Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

function resolveParticipantId(userId) {
  return userId || auth.currentUser?.uid || null;
}

async function getParticipantAppointmentRows(participantId) {
  const [bookingSnap, legacySnap] = await Promise.all([
    getDocs(query(collection(db, USERS_COLLECTION, participantId, 'bookings'), limit(100))),
    getDocs(query(collection(db, USERS_COLLECTION, participantId, 'appointments'), limit(50))),
  ]);

  const bookingRows = bookingSnap.docs
    .map((docSnap) => ({ id: docSnap.id, source: 'booking', ...docSnap.data() }))
    .filter(isAppointmentBooking);

  const bookingIds = new Set(
    bookingRows.flatMap((row) => [row.id, row.bookingId, row.appointmentId].filter(Boolean)),
  );

  const legacyRows = legacySnap.docs
    .map((docSnap) => ({ id: docSnap.id, source: 'legacyAppointment', ...docSnap.data() }))
    .filter(
      (row) =>
        !bookingIds.has(row.id) && !bookingIds.has(row.bookingId) && !bookingIds.has(row.appointmentId),
    );

  return [...bookingRows, ...legacyRows];
}

async function getParticipantEventRegistrationRows(participantId) {
  const [bookingSnap, legacySnap] = await Promise.all([
    getDocs(query(collection(db, USERS_COLLECTION, participantId, 'bookings'), limit(200))),
    getDocs(query(collection(db, USERS_COLLECTION, participantId, 'registrations'), limit(100))),
  ]);

  const eventBookings = bookingSnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((row) => !isCancelled(row) && !isAppointmentBooking(row));

  const bookingIdentityKeys = new Set(
    eventBookings.flatMap((booking) => getBookingIdentityKeys(booking, booking.id)),
  );

  const legacyRegistrations = legacySnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((registration) => !isCancelled(registration))
    .filter(
      (registration) =>
        !getBookingIdentityKeys(registration, registration.id).some((key) =>
          bookingIdentityKeys.has(key),
        ),
    );

  return [...eventBookings, ...legacyRegistrations];
}

function mapAppointmentRowToRaw(row) {
  const startsAt = resolveStartAt(row);
  if (!startsAt) return null;

  const rawTitle = row.eventTitle || row.appointmentType || row.type || row.title || 'Appointment';

  return {
    id: row.bookingId || row.id,
    title: rawTitle,
    therapistName: row.providerName || row.therapistName || 'Provider',
    therapistRole: row.providerSpecialty || row.therapistRole,
    location: row.eventLocation || row.room || row.location || '',
    startsAt,
  };
}

async function mapEventRowToRaw(row) {
  const startsAt = resolveStartAt(row);
  if (!startsAt) return null;

  let category = row.category || row.eventType || row.type;
  let title = row.eventTitle || row.title || 'Event';
  let location = row.eventLocation || row.room || row.location || '';
  let translations = row.translations || null;

  if (row.eventId) {
    try {
      const eventSnap = await getDoc(doc(db, 'events', row.eventId));
      if (eventSnap.exists()) {
        const eventData = eventSnap.data() || {};
        if (!category || category === 'registration') {
          category = eventData.category || eventData.type || category;
        }
        // Pull the canonical title/location + stored translations from the event
        // doc so the dashboard card can render in the participant's language.
        title = eventData.title || title;
        location = eventData.location || location;
        translations = eventData.translations || translations;
      }
    } catch (error) {
      console.warn('[Dashboard] Could not hydrate event:', error);
    }
  }

  return {
    id: row.bookingId || row.id,
    title,
    category: category || 'Event',
    location,
    translations,
    startsAt,
  };
}

/**
 * Fetch the participant's nearest upcoming appointment for the dashboard home card.
 *
 * @param {string|null|undefined} userId
 * @returns {Promise<DashboardAppointment|null>}
 */
export async function fetchUpcomingAppointment(userId) {
  const participantId = resolveParticipantId(userId);
  if (!participantId) return null;

  const rows = await getParticipantAppointmentRows(participantId);
  const nowMs = Date.now();
  const nearest = sortByNearestStart(rows.filter((row) => isUpcomingRow(row, nowMs)))[0];

  if (!nearest) return null;

  const raw = mapAppointmentRowToRaw(nearest);
  return normalizeDashboardAppointment(raw);
}

/**
 * Fetch the participant's nearest upcoming registered event for the dashboard home card.
 *
 * @param {string|null|undefined} userId
 * @returns {Promise<DashboardEvent|null>}
 */
export async function fetchUpcomingEvent(userId) {
  const participantId = resolveParticipantId(userId);
  if (!participantId) return null;

  const rows = await getParticipantEventRegistrationRows(participantId);
  const nowMs = Date.now();
  const nearest = sortByNearestStart(rows.filter((row) => isUpcomingRow(row, nowMs)))[0];

  if (!nearest) return null;

  const raw = await mapEventRowToRaw(nearest);
  return normalizeDashboardEvent(raw);
}
