// Bookings are the source of truth for workshop and appointment registrations:
//   bookings/{bookingId}
//   users/{uid}/bookings/{bookingId}
//   events/{eventId}/registrations/{bookingId} — temporary event roster mirror
// Legacy users/{uid}/registrations reads/deletes remain only for migration cleanup.

import {
  collection,
  collectionGroup,
  getCountFromServer,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  limit,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { logAuditEvent } from './auditService';

// Deterministic key for email-only walk-in registrations.
function emailKey(email) {
  return 'email_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 80);
}

function keyPart(value, fallback = 'registration') {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100) || fallback;
}

function buildBookingId({ userId, participantEmail, eventId, slotId }) {
  const participantKey = userId || emailKey(participantEmail || `unknown_${Date.now()}`);
  return [
    keyPart(participantKey, 'user'),
    keyPart(eventId, 'event'),
    keyPart(slotId || eventId, 'slot'),
  ].join('_');
}

function getDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isGeneratedSessionId(value) {
  return String(value || '').includes('__');
}

function getEventIdFromSessionId(value) {
  return String(value || '').split('__')[0] || value;
}

function resolveRegistrationTarget(data) {
  const sourceEventId = data.eventId || '';
  const realEventId =
    data.eventTemplateId ||
    data.parentEventId ||
    (isGeneratedSessionId(sourceEventId) ? getEventIdFromSessionId(sourceEventId) : sourceEventId);
  const slotId = data.slotId || (realEventId && realEventId !== sourceEventId ? sourceEventId : '');

  return { realEventId, slotId };
}

function chunk(items, size = 10) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getRegistrationPathContext(snapshot) {
  const parts = snapshot.ref.path.split('/');
  const ownerCollection = parts[0] || '';
  const ownerId = parts[1] || '';
  const registrationId = parts[3] || snapshot.id;

  if (ownerCollection === 'events') {
    return {
      source: 'event',
      eventId: ownerId,
      userId: '',
      registrationId: snapshot.id,
    };
  }

  if (ownerCollection === 'users') {
    return {
      source: 'user',
      eventId: registrationId,
      userId: ownerId,
      registrationId,
    };
  }

  return {
    source: ownerCollection,
    eventId: registrationId,
    userId: '',
    registrationId,
  };
}

function isEventRosterSnapshot(snapshot) {
  return snapshot.ref.path.startsWith('events/');
}

function normalizeRegistrationSnapshot(snapshot, fallbackEventId = '') {
  const data = snapshot.data() || {};
  const context = getRegistrationPathContext(snapshot);
  const eventId = data.eventId || context.eventId || fallbackEventId;
  const userId = data.userId || data.uid || context.userId || '';

  return {
    id: context.source === 'event' ? snapshot.id : (userId || snapshot.id),
    eventId,
    userId,
    registrationSource: context.source,
    rosterEventId: context.source === 'event' ? context.eventId : '',
    ...data,
  };
}

function getRegistrationUniqueKey(registration) {
  return [
    registration.eventId || '',
    registration.slotId || registration.bookingId || '',
    registration.userId ||
      registration.uid ||
      registration.participantEmail ||
      registration.userEmail ||
      registration.email ||
      registration.id ||
      '',
  ].join('__');
}

function isCancelledRegistration(data) {
  return String(data?.status || '').trim().toLowerCase() === 'cancelled';
}

function getUserRegistrationMapKey(data, docId = '') {
  return data?.slotId || (isGeneratedSessionId(docId) ? docId : '') || data?.eventId || docId;
}

function getUserRegistrationValue(data, docId = '', uid = '') {
  return data?.registrationKey || data?.bookingId || data?.sessionRegistrationKey || docId || data?.userId || uid;
}

function getUserRegistrationIdentityKeys(data, docId = '') {
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

export function getLegacyUserRegistrationIds(registration = {}, eventId = '') {
  return [...new Set([
    registration.userMirrorId,
    registration.slotId,
    registration.sessionEventId,
    registration.eventId,
    eventId,
  ].filter(Boolean))];
}

async function getRegistrationsMatchingField(fieldName, values) {
  if (!values.length) return [];

  const docs = [];
  const groups = chunk([...new Set(values.filter(Boolean))]);

  for (const group of groups) {
    try {
      const snap = await getDocs(
        query(collectionGroup(db, 'registrations'), where(fieldName, 'in', group), limit(500))
      );
      docs.push(...snap.docs.filter(isEventRosterSnapshot));
    } catch (error) {
      console.warn(`Could not read registrations by ${fieldName}:`, error);
    }
  }

  return docs;
}

async function getBookingsMatchingField(fieldName, values) {
  if (!values.length) return [];

  const docs = [];
  const groups = chunk([...new Set(values.filter(Boolean))]);

  for (const group of groups) {
    try {
      const snap = await getDocs(
        query(collection(db, 'bookings'), where(fieldName, 'in', group), limit(500))
      );
      docs.push(...snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
    } catch (error) {
      console.warn(`Could not read bookings by ${fieldName}:`, error);
    }
  }

  return docs;
}

function mergeRegistrationSnapshots(snapshots, fallbackEventId = '') {
  const map = new Map();

  snapshots.forEach((snapshot) => {
    const registration = normalizeRegistrationSnapshot(snapshot, fallbackEventId);
    const key = getRegistrationUniqueKey(registration);
    const existing = map.get(key) || {};
    const keepExistingRosterId = existing.rosterEventId && existing.rosterEventId === fallbackEventId;
    map.set(key, {
      ...existing,
      ...registration,
      id: keepExistingRosterId ? existing.id : registration.id,
      registrationSource: keepExistingRosterId ? existing.registrationSource : registration.registrationSource,
      rosterEventId: keepExistingRosterId ? existing.rosterEventId : (registration.rosterEventId || existing.rosterEventId),
      userId: existing.userId || registration.userId || null,
      participantName: existing.participantName || registration.participantName || registration.userName || '',
      participantEmail: existing.participantEmail || registration.participantEmail || registration.userEmail || '',
      participantPhone: existing.participantPhone || registration.participantPhone || registration.userPhone || '',
    });
  });

  return Array.from(map.values());
}

// Look up a user UID by email. Returns null if no account exists.
async function findUidByEmail(email) {
  if (!email) return null;
  const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].id;
}

/**
 * Read all registrations for one event from the event roster.
 * Returns the same shape as before: { id, eventId, participantName, participantEmail, registeredAt, checkedIn, ... }
 */
export async function getRegistrationsByEvent(eventId) {
  const [directSnap, templateDocs, parentDocs] = await Promise.all([
    getDocs(query(collection(db, 'events', eventId, 'registrations'), limit(200))),
    getRegistrationsMatchingField('eventTemplateId', [eventId]),
    getRegistrationsMatchingField('parentEventId', [eventId]),
  ]);

  const docs = mergeRegistrationSnapshots(
    [...directSnap.docs, ...templateDocs, ...parentDocs],
    eventId
  );

  return docs.sort((a, b) => {
    const aTime = a.registeredAt?.toDate?.() ?? new Date(0);
    const bTime = b.registeredAt?.toDate?.() ?? new Date(0);
    return bTime - aTime;
  });
}

/**
 * Count registrations per event. Uses one getCountFromServer() call per event,
 * which is cheap (server-side aggregation, doesn't return docs) and only requires
 * read permission on that specific event roster.
 * Returns: { eventId: count }
 */
export async function getRegistrationCounts(eventIds) {
  if (!eventIds.length) return {};
  const ids = [...new Set(eventIds.filter(Boolean))];
  const aggregateSets = Object.fromEntries(ids.map((id) => [id, new Set()]));

  const directEntries = await Promise.all(
    ids.map(async (eid) => {
      try {
        const snap = await getCountFromServer(
          collection(db, 'events', eid, 'registrations')
        );
        return [eid, snap.data().count];
      } catch (_) {
        return [eid, 0];
      }
    })
  );

  const directCounts = Object.fromEntries(directEntries);
  const [bookingEventDocs, bookingSlotDocs, templateDocs, parentDocs, slotDocs] = await Promise.all([
    getBookingsMatchingField('eventId', ids),
    getBookingsMatchingField('slotId', ids),
    getRegistrationsMatchingField('eventTemplateId', ids),
    getRegistrationsMatchingField('parentEventId', ids),
    getRegistrationsMatchingField('slotId', ids),
  ]);

  bookingEventDocs.forEach((booking) => {
    if (String(booking.status || '').toLowerCase() === 'cancelled') return;
    if (!aggregateSets[booking.eventId]) return;
    aggregateSets[booking.eventId].add(getRegistrationUniqueKey(booking));
  });

  bookingSlotDocs.forEach((booking) => {
    if (String(booking.status || '').toLowerCase() === 'cancelled') return;
    if (!booking.slotId || !aggregateSets[booking.slotId]) return;
    aggregateSets[booking.slotId].add(getRegistrationUniqueKey(booking));
  });

  mergeRegistrationSnapshots([...templateDocs, ...parentDocs]).forEach((registration) => {
    const templateId = registration.eventTemplateId || registration.parentEventId;
    if (!aggregateSets[templateId]) return;
    aggregateSets[templateId].add(getRegistrationUniqueKey(registration));
  });

  mergeRegistrationSnapshots(slotDocs).forEach((registration) => {
    if (!registration.slotId || !aggregateSets[registration.slotId]) return;
    aggregateSets[registration.slotId].add(getRegistrationUniqueKey(registration));
  });

  return Object.fromEntries(
    ids.map((eventId) => [
      eventId,
      Math.max(directCounts[eventId] || 0, aggregateSets[eventId]?.size || 0),
    ])
  );
}

/**
 * Register a participant for an event.
 * - If `data.uid` is provided OR the email matches an existing user, writes to
 *   both mirrors atomically.
 * - Otherwise writes only the event-roster entry (walk-in / no-account flow).
 *
 * @param {{ eventId, uid?, participantName, participantEmail, participantPhone? }} data
 * @returns {Promise<string>} the registration key (uid or synthetic email key)
 */
export async function addRegistration(data) {
  const {
    eventId,
    uid: callerUid,
    participantName,
    participantEmail,
    participantPhone,
    eventTitle,
    eventDate,
    eventLocation,
    eventCoverUrl,
    eventTemplateId,
    parentEventId,
    eventType,
    selectedDate,
    providerId,
    providerName,
    selectedTimeSlot,
    selectedTime,
    dateKey: callerDateKey,
    startAt,
    endAt,
    slotId: callerSlotId,
    room,
    status: requestedStatus,
    notes,
    sessionDateLabel,
    sessionTime,
    recurringSchedule,
  } = data;

  if (!eventId) throw new Error('eventId is required');

  const { realEventId, slotId } = resolveRegistrationTarget({
    eventId,
    eventTemplateId,
    parentEventId,
    slotId: callerSlotId,
  });
  if (!realEventId) throw new Error('real eventId is required');

  const eventSnap = await getDoc(doc(db, 'events', realEventId));
  if (!eventSnap.exists()) {
    throw new Error(`Cannot register for missing event document: ${realEventId}`);
  }

  const uid = callerUid || (await findUidByEmail(participantEmail));
  const bookingId = buildBookingId({
    userId: uid,
    participantEmail,
    eventId: realEventId,
    slotId: slotId || realEventId,
  });
  const eventRosterKey = bookingId;
  const templateEventId = eventTemplateId || parentEventId || realEventId;

  const eventRosterRef = doc(db, 'events', realEventId, 'registrations', eventRosterKey);
  const bookingRef = doc(db, 'bookings', bookingId);
  const resolvedSelectedTime = selectedTime || selectedTimeSlot || sessionTime || '';
  const resolvedStartAt = startAt || eventDate || null;
  const resolvedEndAt = endAt || null;
  const resolvedDateKey = callerDateKey || selectedDate || getDateKey(resolvedStartAt);

  const resolvedStatus = requestedStatus || 'confirmed';
  const bookingDoc = {
    bookingId,
    registrationKey: eventRosterKey,
    sessionRegistrationKey: eventRosterKey,
    templateRosterKey: eventRosterKey,
    userId: uid || null,
    userName: participantName || '',
    userEmail: participantEmail || '',
    userPhone: participantPhone || '',
    status: resolvedStatus,
    checkedIn: false,
    registeredAt: serverTimestamp(),
    cancelledAt: null,
    eventId: realEventId,
    eventType: eventType || '',
    eventTitle: eventTitle || '',
    slotId: slotId || '',
    providerId: providerId || '',
    providerName: providerName || '',
    dateKey: resolvedDateKey,
    startAt: resolvedStartAt,
    endAt: resolvedEndAt,
    selectedDate: selectedDate || resolvedDateKey,
    selectedTime: resolvedSelectedTime,
    selectedTimeSlot: resolvedSelectedTime,
    eventDate: eventDate || resolvedStartAt,
    eventLocation: eventLocation || '',
    eventCoverUrl: eventCoverUrl || '',
    // Legacy field aliases kept so existing UI columns work unchanged.
    participantName: participantName || '',
    participantEmail: participantEmail || '',
    participantPhone: participantPhone || '',
    eventTemplateId: templateEventId,
    parentEventId: parentEventId || templateEventId,
    sessionEventId: realEventId,
    room: room || eventLocation || '',
    notes: notes || '',
    sessionDateLabel: sessionDateLabel || '',
    sessionTime: sessionTime || '',
    recurringSchedule: recurringSchedule || '',
  };

  const eventRosterDoc = {
    ...bookingDoc,
    registrationSource: 'event',
  };

  // Note: stats counters and events/{eventId}.registeredCount are intentionally
  // NOT updated here. Clients cannot write to shared aggregates under the new
  // rules; a Cloud Function should maintain those counts on subcollection writes.
  const batch = writeBatch(db);
  batch.set(bookingRef, bookingDoc, { merge: true });
  batch.set(eventRosterRef, eventRosterDoc, { merge: true });

  if (uid) {
    batch.set(doc(db, 'users', uid, 'bookings', bookingId), bookingDoc, { merge: true });
  }

  await batch.commit();

  try {
    await logAuditEvent({
      actionType: 'ADD_REGISTRATION',
      targetId: bookingId,
      details: { bookingId, eventId: realEventId, slotId: slotId || '', participant: participantName || participantEmail },
    });
  } catch (_) {}

  return bookingId;
}

/**
 * Remove a registration. `regId` is the key under events/{eventId}/registrations/ —
 * either a uid (for account holders) or a synthetic emailKey.
 */
export async function removeRegistration(regId, participantName, eventId) {
  if (!eventId) {
    // Legacy callers pass only regId. Best-effort: scan event_registrations is gone,
    // so callers must pass eventId. Fail loudly so the bug surfaces.
    throw new Error('removeRegistration now requires eventId as the third argument.');
  }

  const rosterRef = doc(db, 'events', eventId, 'registrations', regId);
  const rosterSnap = await getDoc(rosterRef);
  const registration = rosterSnap.exists() ? rosterSnap.data() : {};
  const uid = registration.userId || null;
  const bookingId = registration.bookingId || '';
  const sessionEventId = registration.sessionEventId || registration.eventId || eventId;
  const templateEventId = registration.eventTemplateId || registration.parentEventId || '';
  const sessionRegistrationKey = registration.sessionRegistrationKey || registration.registrationKey || uid || regId;
  const templateRosterKey = registration.templateRosterKey || (
    templateEventId && templateEventId !== sessionEventId
      ? `${sessionRegistrationKey}__${keyPart(sessionEventId, 'session')}`
      : sessionRegistrationKey
  );

  // Counters are not maintained from the client (see note in addRegistration).
  const batch = writeBatch(db);
  if (bookingId) {
    const cancellationPatch = {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
    };
    batch.set(doc(db, 'bookings', bookingId), cancellationPatch, { merge: true });
    if (uid) {
      batch.set(doc(db, 'users', uid, 'bookings', bookingId), cancellationPatch, { merge: true });
    }
  }
  batch.delete(rosterRef);
  if (sessionEventId && sessionEventId !== eventId) {
    batch.delete(doc(db, 'events', sessionEventId, 'registrations', sessionRegistrationKey));
  }
  if (templateEventId && templateEventId !== eventId) {
    batch.delete(doc(db, 'events', templateEventId, 'registrations', templateRosterKey));
  }
  if (uid) {
    getLegacyUserRegistrationIds(registration, eventId).forEach((legacyRegistrationId) => {
      batch.delete(doc(db, 'users', uid, 'registrations', legacyRegistrationId));
    });
  }
  await batch.commit();

  try {
    await logAuditEvent({
      actionType: 'REMOVE_REGISTRATION',
      targetId: `${eventId}/${regId}`,
      details: { removed: participantName },
    });
  } catch (_) {}
}

/**
 * Mark a registration as checked-in. Updates the central booking and event roster mirrors.
 */
export async function checkInRegistration(regId, eventId) {
  if (!eventId) throw new Error('checkInRegistration now requires eventId.');

  const rosterRef = doc(db, 'events', eventId, 'registrations', regId);
  const rosterSnap = await getDoc(rosterRef);
  const registration = rosterSnap.exists() ? rosterSnap.data() : {};
  const uid = registration.userId || null;
  const bookingId = registration.bookingId || '';
  const sessionEventId = registration.sessionEventId || registration.eventId || eventId;
  const templateEventId = registration.eventTemplateId || registration.parentEventId || '';
  const sessionRegistrationKey = registration.sessionRegistrationKey || registration.registrationKey || uid || regId;
  const templateRosterKey = registration.templateRosterKey || (
    templateEventId && templateEventId !== sessionEventId
      ? `${sessionRegistrationKey}__${keyPart(sessionEventId, 'session')}`
      : sessionRegistrationKey
  );

  const batch = writeBatch(db);
  const checkInPatch = { checkedIn: true, checkedInAt: serverTimestamp() };
  if (bookingId) {
    batch.set(doc(db, 'bookings', bookingId), checkInPatch, { merge: true });
    if (uid) {
      batch.set(doc(db, 'users', uid, 'bookings', bookingId), checkInPatch, { merge: true });
    }
  }
  batch.set(
    rosterRef,
    checkInPatch,
    { merge: true }
  );
  if (sessionEventId && sessionEventId !== eventId) {
    batch.set(
      doc(db, 'events', sessionEventId, 'registrations', sessionRegistrationKey),
      checkInPatch,
      { merge: true }
    );
  }
  if (templateEventId && templateEventId !== eventId) {
    batch.set(
      doc(db, 'events', templateEventId, 'registrations', templateRosterKey),
      checkInPatch,
      { merge: true }
    );
  }
  await batch.commit();
}

/**
 * For a participant: { slotId|eventId: bookingId } map across active bookings.
 * Falls back to users/{uid}/registrations only for legacy data.
 */
export async function getUserRegisteredEventIds(emailOrUid) {
  if (!emailOrUid) return {};
  // If it looks like an email, resolve to uid first.
  const uid = emailOrUid.includes('@') ? await findUidByEmail(emailOrUid) : emailOrUid;
  if (!uid) return {};

  const bookingsSnap = await getDocs(
    query(collection(db, 'users', uid, 'bookings'), limit(200))
  );
  const map = {};
  const bookingIdentityKeys = new Set();

  bookingsSnap.docs.forEach((d) => {
    const data = d.data() || {};
    if (isCancelledRegistration(data)) return;

    getUserRegistrationIdentityKeys(data, d.id).forEach((key) => bookingIdentityKeys.add(key));

    const mapKey = getUserRegistrationMapKey(data, d.id);
    const registrationKey = getUserRegistrationValue(data, d.id, uid);
    if (mapKey && registrationKey) {
      map[mapKey] = registrationKey;
    }
  });

  const legacySnap = await getDocs(
    query(collection(db, 'users', uid, 'registrations'), limit(100))
  );
  legacySnap.docs.forEach((d) => {
    const data = d.data() || {};
    if (isCancelledRegistration(data)) return;

    const legacyKeys = getUserRegistrationIdentityKeys(data, d.id);
    if (legacyKeys.some((key) => bookingIdentityKeys.has(key))) return;

    const mapKey = getUserRegistrationMapKey(data, d.id);
    const registrationKey = getUserRegistrationValue(data, d.id, uid);
    if (mapKey && registrationKey && !map[mapKey]) {
      map[mapKey] = registrationKey;
    }
  });
  return map;
}
