// Phase 2: Calendar data now reads from per-user subcollections instead of
// scanning top-level collections by userId/email.
//   - Notes:        users/{uid}/calendar_notes/{noteId}
//   - Bookings:     users/{uid}/bookings/{bookingId}
//   - Registrations: users/{uid}/registrations/{eventId} (legacy fallback)
//   - Appointments: users/{uid}/appointments/{apptId}   (mirror of /appointments)
// The top-level /events collection is still used for display details — joined
// in-memory by event id from the user's booking mirror.

import { addDoc, collection, doc, getDoc, getDocs, query, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(date) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toTimeKey(date, fallback = '09:00') {
  if (!date) return fallback;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function normalizeTime(value, fallback = '09:00') {
  if (!value) return fallback;

  if (typeof value === 'string') {
    const match = value.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    }
  }

  const date = toDate(value);
  if (date) return toTimeKey(date, fallback);

  return fallback;
}

function addMinutes(time, minutesToAdd) {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0, 0);

  return toTimeKey(date);
}

function isCancelled(data) {
  return String(data?.status || '').trim().toLowerCase() === 'cancelled';
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

function normalizeEvent(docData) {
  const date = toDate(docData.selectedDate || docData.dateKey || docData.date || docData.startAt || docData.startDate || docData.startTime || docData.eventDate);
  const startTime = normalizeTime(
    docData.selectedTime || docData.selectedTimeSlot || docData.sessionTime || docData.startAt || docData.startTime || docData.time || date,
    '10:00'
  );
  const endTime = normalizeTime(docData.endTime || docData.endAt, addMinutes(startTime, 60));

  return {
    id: docData.slotId || docData.bookingId || docData.id,
    title: docData.eventTitle || docData.title || 'She-Na Event',
    type: 'registration',
    date: docData.dateKey || docData.selectedDate || toDateKey(date),
    startTime,
    endTime,
    location: docData.eventLocation || docData.room || docData.location || '',
    description: docData.description || docData.eventDescription || docData.notes || '',
    registered: true,
  };
}

function isAppointmentBooking(docData) {
  return String(docData.eventType || docData.type || docData.category || '')
    .toLowerCase()
    .includes('appointment');
}

function normalizeBookingAppointment(docData) {
  const date = toDate(docData.selectedDate || docData.dateKey || docData.startAt || docData.eventDate);
  const startTime = normalizeTime(
    docData.selectedTime || docData.selectedTimeSlot || docData.sessionTime || docData.startAt || date,
    '09:00'
  );
  const endTime = normalizeTime(docData.endTime || docData.endAt, addMinutes(startTime, 60));
  const appointmentType = docData.appointmentType || docData.eventTitle || docData.title || 'Appointment';

  return {
    id: docData.bookingId || docData.id,
    title: docData.title || `${appointmentType} Appointment`,
    type: 'appointment',
    date: docData.dateKey || docData.selectedDate || toDateKey(date),
    startTime,
    endTime,
    location: docData.eventLocation || docData.room || docData.location || '',
    description: docData.description || docData.notes || `${docData.providerName || 'Provider'} appointment.`,
    registered: true,
  };
}

function normalizeAppointment(docData) {
  const date = toDate(docData.date || docData.startAt || docData.startDate);
  const startTime = normalizeTime(docData.startTime || docData.time || date, '09:00');
  const endTime = normalizeTime(docData.endTime || docData.endAt, addMinutes(startTime, 60));
  const appointmentType = docData.appointmentType || docData.type || 'Appointment';

  return {
    id: docData.id,
    title: docData.title || `${appointmentType} Appointment`,
    type: 'appointment',
    date: docData.dateKey || toDateKey(date),
    startTime,
    endTime,
    location: docData.location || docData.room || '',
    description: docData.description || docData.notes || `${docData.providerName || docData.therapistName || 'Provider'} appointment.`,
    registered: true,
  };
}

function normalizeNote(docData) {
  const date = toDate(docData.date || docData.startAt);
  const startTime = normalizeTime(docData.startTime || docData.time || date, '10:00');

  return {
    id: docData.id,
    title: docData.title || 'Personal Note',
    type: 'note',
    date: docData.dateKey || toDateKey(date),
    startTime,
    endTime: normalizeTime(docData.endTime, addMinutes(startTime, 30)),
    content: docData.content || docData.note || '',
    registered: false,
  };
}

async function getUserSubcollection(uid, name) {
  if (!uid) return [];
  const snap = await getDocs(
    query(collection(db, 'users', uid, name), limit(100))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getCalendarData(user) {
  const uid = user?.uid;
  if (!uid) {
    return { events: [], appointments: [], notes: [] };
  }

  const [bookings, legacyRegistrations, appointments, notes] = await Promise.all([
    getUserSubcollection(uid, 'bookings'),
    getUserSubcollection(uid, 'registrations'),
    getUserSubcollection(uid, 'appointments'),
    getUserSubcollection(uid, 'calendar_notes'),
  ]);

  const activeBookings = bookings.filter((booking) => !isCancelled(booking));
  const appointmentBookings = activeBookings.filter(isAppointmentBooking);
  const eventBookings = activeBookings.filter((booking) => !isAppointmentBooking(booking));
  const bookingIdentityKeys = new Set(
    activeBookings.flatMap((booking) => getBookingIdentityKeys(booking, booking.id))
  );
  const legacyOnlyRegistrations = legacyRegistrations
    .filter((registration) => !isCancelled(registration))
    .filter((registration) => (
      !getBookingIdentityKeys(registration, registration.id).some((key) => bookingIdentityKeys.has(key))
    ));
  const registrationSources = [...eventBookings, ...legacyOnlyRegistrations];

  // Hydrate booking mirrors with the latest event doc (in case denorm is stale).
  const eventsFromBookings = await Promise.all(
    registrationSources.map(async (booking) => {
      try {
        const eventSnap = await getDoc(doc(db, 'events', booking.eventId || booking.id));
        if (eventSnap.exists()) {
          return {
            id: eventSnap.id,
            ...eventSnap.data(),
            ...booking,
            title: booking.eventTitle || eventSnap.data().title,
          };
        }
      } catch (_) {}
      // Fallback to embedded snapshot if the source event was deleted.
      return {
        id: booking.eventId || booking.id,
        bookingId: booking.bookingId,
        slotId: booking.slotId,
        eventTitle: booking.eventTitle,
        selectedDate: booking.selectedDate,
        dateKey: booking.dateKey,
        selectedTime: booking.selectedTime,
        startAt: booking.startAt || booking.eventDate,
        endAt: booking.endAt,
        eventLocation: booking.eventLocation,
        room: booking.room,
      };
    })
  );

  return {
    events: eventsFromBookings.map(normalizeEvent).filter((event) => event.date),
    appointments: [
      ...appointmentBookings.map(normalizeBookingAppointment),
      ...appointments.filter((appointment) => !isCancelled(appointment)).map(normalizeAppointment),
    ].filter((appointment) => appointment.date),
    notes: notes.map(normalizeNote).filter((note) => note.date),
  };
}

/**
 * Create a personal calendar note under the user's subcollection.
 */
export async function createCalendarNote(user, note) {
  if (!user?.uid) throw new Error('Cannot save a note: not signed in.');

  const payload = {
    title: note.title,
    date: new Date(`${note.date}T${note.time}`),
    dateKey: note.date,
    startTime: note.time,
    endTime: addMinutes(note.time, 30),
    content: note.content,
    userId: user.uid,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'users', user.uid, 'calendar_notes'), payload);

  return normalizeNote({ id: ref.id, ...payload });
}
