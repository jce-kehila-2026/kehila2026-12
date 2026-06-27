// Phase 2: Calendar data now reads from per-user subcollections instead of
// scanning top-level collections by userId/email.
//   - Notes:        users/{uid}/calendar_notes/{noteId}
//   - Bookings:     users/{uid}/bookings/{bookingId}
//   - Registrations: users/{uid}/registrations/{eventId} (legacy fallback)
//   - Appointments: users/{uid}/appointments/{apptId}   (mirror of /appointments)
// The top-level /events collection is still used for display details — joined
// in-memory by event id from the user's booking mirror.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  limit,
  serverTimestamp,
  where,
} from 'firebase/firestore';
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
    location: docData.room || docData.eventLocation || docData.location || '',
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
    location: docData.room || docData.location || '',
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
  const title = String(note?.title ?? '').trim();
  const dateKey = String(note?.date ?? '').trim();
  const startTime = String(note?.time ?? '').trim();
  const content = String(note?.content ?? title).trim();

  if (!title) {
    throw new Error('Cannot save a note: title is required.');
  }
  if (!dateKey || !startTime) {
    throw new Error('Cannot save a note: date and time are required.');
  }
  if (!content) {
    throw new Error('Cannot save a note: content is required.');
  }

  const payload = {
    title,
    date: new Date(`${dateKey}T${startTime}`),
    dateKey,
    startTime,
    endTime: addMinutes(startTime, 30),
    content,
    userId: user.uid,
    type: 'note',
    source: String(note?.source ?? 'calendar-note').trim(),
    dashboardNoteId: String(note?.dashboardNoteId ?? '').trim(),
    createdAt: serverTimestamp(),
  };
  if (Number.isNaN(payload.date.getTime())) {
    throw new Error('Cannot save a note: invalid date or time.');
  }

  const ref = await addDoc(collection(db, 'users', user.uid, 'calendar_notes'), payload);

  return normalizeNote({ id: ref.id, ...payload });
}

/**
 * Delete an exact calendar note by id from users/{uid}/calendar_notes/{noteId}.
 *
 * @param {{ uid: string }} user
 * @param {string} noteId
 */
export async function deleteCalendarNoteById(user, noteId) {
  const uid = user?.uid;
  const id = String(noteId ?? '').trim();
  if (!uid) throw new Error('Cannot delete a calendar note: not signed in.');
  if (!id) throw new Error('Cannot delete a calendar note: missing note id.');
  await deleteDoc(doc(db, 'users', uid, 'calendar_notes', id));
}

/**
 * Delete synced calendar note documents for a dashboard note.
 * Strategy order:
 * 1) linked calendarNoteId
 * 2) dashboardNoteId linkage (plus legacy sourceNoteId linkage)
 * 3) strict fallback by userId + title + dateKey + startTime
 *
 * @param {{ uid: string }} user
 * @param {{ id?: string, title?: string, date?: string, time?: string, calendarNoteId?: string }} dashboardNote
 * @returns {Promise<{ deletedIds: string[], failedIds: string[] }>}
 */
export async function deleteCalendarNoteForDashboardNote(user, dashboardNote) {
  const uid = user?.uid;
  if (!uid) throw new Error('Cannot delete a calendar note: not signed in.');
  const noteId = String(dashboardNote?.id ?? '').trim();
  const calendarNoteId = String(dashboardNote?.calendarNoteId ?? '').trim();
  const title = String(dashboardNote?.title ?? '').trim();
  const dateKey = String(dashboardNote?.date ?? '').trim();
  const startTime = String(dashboardNote?.time ?? '').trim();
  const idsToDelete = new Set();
  const failedIds = [];

  const isNoteType = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase();
    return !normalized || normalized === 'note';
  };

  const isNoteSource = (value) => {
    const normalized = String(value ?? '').trim().toLowerCase();
    return !normalized || normalized === 'dashboard-note' || normalized === 'dashboard_home' || normalized === 'calendar-note' || normalized === 'note';
  };

  const isTaggedNoteEntry = (data) => {
    return isNoteType(data?.type) && isNoteSource(data?.source);
  };
  const normalizeKey = (value) => String(value ?? '').trim();
  const deriveDateKey = (data) => {
    const directDateKey = normalizeKey(data?.dateKey);
    if (directDateKey) return directDateKey;
    const parsed = toDate(data?.date || data?.startAt || data?.eventDate);
    return parsed ? toDateKey(parsed) : '';
  };
  const deriveStartTime = (data) => normalizeTime(data?.startTime || data?.time || data?.date, '');
  const matchesExactFallback = (data) => {
    return normalizeKey(data?.title) === title
      && deriveDateKey(data) === dateKey
      && deriveStartTime(data) === startTime;
  };

  // 1) Linked calendar id from dashboard note.
  if (calendarNoteId) {
    try {
      const linkedDoc = await getDoc(doc(db, 'users', uid, 'calendar_notes', calendarNoteId));
      if (linkedDoc.exists() && (isTaggedNoteEntry(linkedDoc.data()) || matchesExactFallback(linkedDoc.data()))) {
        idsToDelete.add(linkedDoc.id);
      }
    } catch (error) {
      failedIds.push(`linked:${calendarNoteId}:${error?.code || error?.message || 'unknown'}`);
    }
  }

  // 2) Link query by dashboardNoteId.
  if (noteId) {
    try {
      const dashboardMatches = await getDocs(
        query(
          collection(db, 'users', uid, 'calendar_notes'),
          where('dashboardNoteId', '==', noteId),
          limit(20),
        ),
      );
      dashboardMatches.forEach((entry) => {
        if (isTaggedNoteEntry(entry.data()) || matchesExactFallback(entry.data())) {
          idsToDelete.add(entry.id);
        }
      });
    } catch (error) {
      failedIds.push(`dashboardNoteId:${noteId}:${error?.code || error?.message || 'unknown'}`);
    }

    // Legacy link query by sourceNoteId.
    try {
      const legacySourceMatches = await getDocs(
        query(
          collection(db, 'users', uid, 'calendar_notes'),
          where('sourceNoteId', '==', noteId),
          limit(20),
        ),
      );
      legacySourceMatches.forEach((entry) => {
        if (isTaggedNoteEntry(entry.data()) || matchesExactFallback(entry.data())) {
          idsToDelete.add(entry.id);
        }
      });
    } catch (error) {
      failedIds.push(`sourceNoteId:${noteId}:${error?.code || error?.message || 'unknown'}`);
    }
  }

  // 3) Fallback strict match for old notes without linkage.
  if (title && dateKey && startTime) {
    try {
      const fallbackMatches = await getDocs(
        query(
          collection(db, 'users', uid, 'calendar_notes'),
          where('userId', '==', uid),
          where('title', '==', title),
          where('dateKey', '==', dateKey),
          where('startTime', '==', startTime),
          limit(20),
        ),
      );

      fallbackMatches.forEach((entry) => {
        const data = entry.data() || {};
        if (matchesExactFallback(data) || isTaggedNoteEntry(data)) {
          idsToDelete.add(entry.id);
        }
      });
    } catch (error) {
      failedIds.push(`fallback:${title}:${dateKey}:${startTime}:${error?.code || error?.message || 'unknown'}`);
    }

    // Legacy fallback query for notes that only store `time` (without `startTime`).
    try {
      const legacyTimeMatches = await getDocs(
        query(
          collection(db, 'users', uid, 'calendar_notes'),
          where('userId', '==', uid),
          where('title', '==', title),
          where('time', '==', startTime),
          limit(20),
        ),
      );
      legacyTimeMatches.forEach((entry) => {
        const data = entry.data() || {};
        if (matchesExactFallback(data) || isTaggedNoteEntry(data)) {
          idsToDelete.add(entry.id);
        }
      });
    } catch (error) {
      failedIds.push(`legacyTimeFallback:${title}:${dateKey}:${startTime}:${error?.code || error?.message || 'unknown'}`);
    }
  }

  const idsToDeleteList = Array.from(idsToDelete);
  const deletionResults = await Promise.allSettled(
    idsToDeleteList.map(async (id) => {
      await deleteDoc(doc(db, 'users', uid, 'calendar_notes', id));
      return id;
    }),
  );
  const deletedIds = [];
  deletionResults.forEach((result, index) => {
    const id = idsToDeleteList[index];
    if (result.status === 'fulfilled') {
      deletedIds.push(id);
    } else {
      failedIds.push(`delete:${id}:${result.reason?.code || result.reason?.message || 'unknown'}`);
    }
  });

  if (!deletedIds.length && failedIds.length) {
    console.error('[Calendar notes] No calendar note deleted for dashboard note', {
      dashboardNoteId: noteId,
      calendarNoteId,
      title,
      dateKey,
      startTime,
      failedIds,
    });
  }

  return { deletedIds, failedIds };
}
