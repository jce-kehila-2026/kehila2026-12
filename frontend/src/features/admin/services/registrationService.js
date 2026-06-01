// Phase 2: Registrations now live in TWO mirror subcollections:
//   users/{uid}/registrations/{eventId}    — participant's own list
//   events/{eventId}/registrations/{uid}   — event's roster
// Writes use writeBatch() so both mirrors commit atomically.
// Email-only walk-in registrations (no user account) fall back to a synthetic
// key under the event roster only — they do not get a user mirror until the
// participant signs up with that email.
// Stats: bumps stats/admin_summary.registrationsThisMonth and the event's
// registeredCount on every successful registration.

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
    registration.userId ||
      registration.uid ||
      registration.participantEmail ||
      registration.userEmail ||
      registration.email ||
      registration.id ||
      '',
  ].join('__');
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
      docs.push(...snap.docs);
    } catch (error) {
      console.warn(`Could not read registrations by ${fieldName}:`, error);
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
  const [templateDocs, parentDocs] = await Promise.all([
    getRegistrationsMatchingField('eventTemplateId', ids),
    getRegistrationsMatchingField('parentEventId', ids),
  ]);

  mergeRegistrationSnapshots([...templateDocs, ...parentDocs]).forEach((registration) => {
    const templateId = registration.eventTemplateId || registration.parentEventId;
    if (!aggregateSets[templateId]) return;
    aggregateSets[templateId].add(getRegistrationUniqueKey(registration));
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
    room,
    sessionDateLabel,
    sessionTime,
    recurringSchedule,
  } = data;

  if (!eventId) throw new Error('eventId is required');

  const uid = callerUid || (await findUidByEmail(participantEmail));
  const eventRosterKey = uid || emailKey(participantEmail || `unknown_${Date.now()}`);
  const templateEventId = eventTemplateId || parentEventId || '';
  const templateRosterKey = templateEventId && templateEventId !== eventId
    ? `${eventRosterKey}__${keyPart(eventId, 'session')}`
    : eventRosterKey;

  const eventRosterRef = doc(db, 'events', eventId, 'registrations', eventRosterKey);

  const eventRosterDoc = {
    registrationKey: eventRosterKey,
    sessionRegistrationKey: eventRosterKey,
    templateRosterKey,
    userId: uid || null,
    userName: participantName || '',
    userEmail: participantEmail || '',
    userPhone: participantPhone || '',
    status: 'confirmed',
    checkedIn: false,
    registeredAt: serverTimestamp(),
    // Legacy field aliases kept so existing UI columns work unchanged.
    participantName: participantName || '',
    participantEmail: participantEmail || '',
    participantPhone: participantPhone || '',
    eventTitle: eventTitle || '',
    eventDate: eventDate || null,
    eventLocation: eventLocation || '',
    eventCoverUrl: eventCoverUrl || '',
    eventTemplateId: eventTemplateId || parentEventId || '',
    parentEventId: parentEventId || '',
    sessionEventId: eventId,
    eventType: eventType || '',
    selectedDate: selectedDate || '',
    providerId: providerId || '',
    providerName: providerName || '',
    selectedTimeSlot: selectedTimeSlot || sessionTime || '',
    room: room || eventLocation || '',
    sessionDateLabel: sessionDateLabel || '',
    sessionTime: sessionTime || '',
    recurringSchedule: recurringSchedule || '',
  };

  // Note: stats counters and events/{eventId}.registeredCount are intentionally
  // NOT updated here. Clients cannot write to shared aggregates under the new
  // rules; a Cloud Function should maintain those counts on subcollection writes.
  const batch = writeBatch(db);
  batch.set(eventRosterRef, eventRosterDoc, { merge: true });

  if (templateEventId && templateEventId !== eventId) {
    batch.set(
      doc(db, 'events', templateEventId, 'registrations', templateRosterKey),
      {
        ...eventRosterDoc,
        eventTemplateId: templateEventId,
        parentEventId: templateEventId,
      },
      { merge: true }
    );
  }

  if (uid) {
    const userMirrorRef = doc(db, 'users', uid, 'registrations', eventId);
    batch.set(
      userMirrorRef,
      {
        registrationKey: eventRosterKey,
        sessionRegistrationKey: eventRosterKey,
        templateRosterKey,
        eventId,
        eventTitle: eventTitle || '',
        eventDate: eventDate || null,
        eventLocation: eventLocation || '',
        eventCoverUrl: eventCoverUrl || '',
        eventTemplateId: eventTemplateId || parentEventId || '',
        parentEventId: parentEventId || '',
        sessionEventId: eventId,
        eventType: eventType || '',
        selectedDate: selectedDate || '',
        providerId: providerId || '',
        providerName: providerName || '',
        selectedTimeSlot: selectedTimeSlot || sessionTime || '',
        room: room || eventLocation || '',
        sessionDateLabel: sessionDateLabel || '',
        sessionTime: sessionTime || '',
        recurringSchedule: recurringSchedule || '',
        status: 'confirmed',
        checkedIn: false,
        registeredAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();

  try {
    await logAuditEvent({
      actionType: 'ADD_REGISTRATION',
      targetId: `${eventId}/${eventRosterKey}`,
      details: { eventId, participant: participantName || participantEmail },
    });
  } catch (_) {}

  return eventRosterKey;
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
  batch.delete(rosterRef);
  if (sessionEventId && sessionEventId !== eventId) {
    batch.delete(doc(db, 'events', sessionEventId, 'registrations', sessionRegistrationKey));
  }
  if (templateEventId && templateEventId !== eventId) {
    batch.delete(doc(db, 'events', templateEventId, 'registrations', templateRosterKey));
  }
  if (uid) {
    batch.delete(doc(db, 'users', uid, 'registrations', sessionEventId || eventId));
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
 * Mark a registration as checked-in. Updates both mirrors when a uid is known.
 */
export async function checkInRegistration(regId, eventId) {
  if (!eventId) throw new Error('checkInRegistration now requires eventId.');

  const rosterRef = doc(db, 'events', eventId, 'registrations', regId);
  const rosterSnap = await getDoc(rosterRef);
  const registration = rosterSnap.exists() ? rosterSnap.data() : {};
  const uid = registration.userId || null;
  const sessionEventId = registration.sessionEventId || registration.eventId || eventId;
  const templateEventId = registration.eventTemplateId || registration.parentEventId || '';
  const sessionRegistrationKey = registration.sessionRegistrationKey || registration.registrationKey || uid || regId;
  const templateRosterKey = registration.templateRosterKey || (
    templateEventId && templateEventId !== sessionEventId
      ? `${sessionRegistrationKey}__${keyPart(sessionEventId, 'session')}`
      : sessionRegistrationKey
  );

  const batch = writeBatch(db);
  batch.set(
    rosterRef,
    { checkedIn: true, checkedInAt: serverTimestamp() },
    { merge: true }
  );
  if (sessionEventId && sessionEventId !== eventId) {
    batch.set(
      doc(db, 'events', sessionEventId, 'registrations', sessionRegistrationKey),
      { checkedIn: true, checkedInAt: serverTimestamp() },
      { merge: true }
    );
  }
  if (templateEventId && templateEventId !== eventId) {
    batch.set(
      doc(db, 'events', templateEventId, 'registrations', templateRosterKey),
      { checkedIn: true, checkedInAt: serverTimestamp() },
      { merge: true }
    );
  }
  if (uid) {
    batch.set(
      doc(db, 'users', uid, 'registrations', sessionEventId || eventId),
      { checkedIn: true, checkedInAt: serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
}

/**
 * For a participant: { eventId: registrationKey } map across all their registrations.
 * Reads from the user's own subcollection — no email scan needed.
 */
export async function getUserRegisteredEventIds(emailOrUid) {
  if (!emailOrUid) return {};
  // If it looks like an email, resolve to uid first.
  const uid = emailOrUid.includes('@') ? await findUidByEmail(emailOrUid) : emailOrUid;
  if (!uid) return {};

  const snap = await getDocs(
    query(collection(db, 'users', uid, 'registrations'), limit(100))
  );
  const map = {};
  snap.docs.forEach((d) => {
    map[d.id] = uid; // value used to be regId; uid works equally as a truthy "registered" marker.
  });
  return map;
}
