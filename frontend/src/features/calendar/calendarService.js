import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
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

function normalizeEvent(docData, registeredEventIds) {
  const date = toDate(docData.date || docData.startAt || docData.startDate || docData.startTime);
  const startTime = normalizeTime(docData.startTime || docData.time || date, '10:00');
  const endTime = normalizeTime(docData.endTime || docData.endAt, addMinutes(startTime, 60));

  return {
    id: docData.id,
    title: docData.title || 'She-Na Event',
    type: registeredEventIds.has(docData.id) ? 'registration' : 'event',
    date: docData.dateKey || toDateKey(date),
    startTime,
    endTime,
    location: docData.location || '',
    description: docData.description || '',
    registered: registeredEventIds.has(docData.id),
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
    description: docData.description || docData.notes || `${docData.providerName || 'Provider'} appointment.`,
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

async function getCollection(name, constraints = []) {
  const ref = constraints.length > 0 ? query(collection(db, name), ...constraints) : collection(db, name);
  const snap = await getDocs(ref);
  return snap.docs.map((document) => ({ id: document.id, ...document.data() }));
}

async function getUserCollection(name, user) {
  if (!user?.uid) return [];

  return getCollection(name, [where('userId', '==', user.uid)]);
}

async function getUserCollectionByEmail(name, user, emailField = 'participantEmail') {
  if (!user?.email) return [];

  return getCollection(name, [where(emailField, '==', user.email)]);
}

export async function getCalendarData(user) {
  const [events, registrations, appointments, notes] = await Promise.all([
    getCollection('events'),
    getUserCollectionByEmail('event_registrations', user),
    getUserCollectionByEmail('appointments', user),
    getUserCollection('calendar_notes', user),
  ]);

  const registeredEventIds = new Set(
    registrations
      .map((registration) => registration.eventId || registration.eventID || registration.eventRef?.id)
      .filter(Boolean),
  );

  return {
    events: events
      .filter((event) => !event.status || event.status === 'published')
      .filter((event) => registeredEventIds.has(event.id))
      .map((event) => normalizeEvent(event, registeredEventIds))
      .filter((event) => event.date),
    appointments: appointments.map(normalizeAppointment).filter((appointment) => appointment.date),
    notes: notes.map(normalizeNote).filter((note) => note.date),
  };
}

export async function createCalendarNote(user, note) {
  const payload = {
    title: note.title,
    date: new Date(`${note.date}T${note.time}`),
    dateKey: note.date,
    startTime: note.time,
    endTime: addMinutes(note.time, 30),
    content: note.content,
    userId: user?.uid || null,
    uid: user?.uid || null,
    userEmail: user?.email || null,
    email: user?.email || null,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'calendar_notes'), payload);

  return normalizeNote({ id: ref.id, ...payload });
}
