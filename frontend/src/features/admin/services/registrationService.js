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
  getDocs,
  getDoc,
  doc,
  query,
  where,
  limit,
  writeBatch,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { logAuditEvent } from './auditService';

const STATS_ADMIN = doc(db, 'stats', 'admin_summary');

// Deterministic key for email-only walk-in registrations.
function emailKey(email) {
  return 'email_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 80);
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
  const snap = await getDocs(
    query(collection(db, 'events', eventId, 'registrations'), limit(200))
  );
  const docs = snap.docs.map((d) => ({
    id: d.id,
    eventId,
    ...d.data(),
  }));
  return docs.sort((a, b) => {
    const aTime = a.registeredAt?.toDate?.() ?? new Date(0);
    const bTime = b.registeredAt?.toDate?.() ?? new Date(0);
    return bTime - aTime;
  });
}

/**
 * Count registrations across many events in one collectionGroup query.
 * Returns: { eventId: count }
 */
export async function getRegistrationCounts(eventIds) {
  if (!eventIds.length) return {};
  const counts = {};
  eventIds.forEach((id) => (counts[id] = 0));

  // collectionGroup catches every events/*/registrations subcollection at once.
  const snap = await getDocs(query(collectionGroup(db, 'registrations'), limit(1000)));
  snap.docs.forEach((d) => {
    // d.ref.path: events/{eventId}/registrations/{key}
    const parent = d.ref.parent.parent;
    if (parent && parent.parent && parent.parent.id === 'events') {
      const eid = parent.id;
      if (counts[eid] !== undefined) counts[eid]++;
    }
  });
  return counts;
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
  } = data;

  if (!eventId) throw new Error('eventId is required');

  const uid = callerUid || (await findUidByEmail(participantEmail));
  const eventRosterKey = uid || emailKey(participantEmail || `unknown_${Date.now()}`);

  const eventRosterRef = doc(db, 'events', eventId, 'registrations', eventRosterKey);
  const eventDocRef = doc(db, 'events', eventId);

  const eventRosterDoc = {
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
  };

  const batch = writeBatch(db);
  batch.set(eventRosterRef, eventRosterDoc, { merge: true });
  batch.set(eventDocRef, { registeredCount: increment(1) }, { merge: true });
  batch.set(
    STATS_ADMIN,
    { registrationsThisMonth: increment(1), updatedAt: serverTimestamp() },
    { merge: true }
  );

  if (uid) {
    const userMirrorRef = doc(db, 'users', uid, 'registrations', eventId);
    batch.set(
      userMirrorRef,
      {
        eventId,
        eventTitle: eventTitle || '',
        eventDate: eventDate || null,
        eventLocation: eventLocation || '',
        eventCoverUrl: eventCoverUrl || '',
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
  const uid = rosterSnap.exists() ? rosterSnap.data().userId : null;

  const batch = writeBatch(db);
  batch.delete(rosterRef);
  batch.set(doc(db, 'events', eventId), { registeredCount: increment(-1) }, { merge: true });
  batch.set(
    STATS_ADMIN,
    { registrationsThisMonth: increment(-1), updatedAt: serverTimestamp() },
    { merge: true }
  );
  if (uid) {
    batch.delete(doc(db, 'users', uid, 'registrations', eventId));
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
  const uid = rosterSnap.exists() ? rosterSnap.data().userId : null;

  const batch = writeBatch(db);
  batch.set(
    rosterRef,
    { checkedIn: true, checkedInAt: serverTimestamp() },
    { merge: true }
  );
  if (uid) {
    batch.set(
      doc(db, 'users', uid, 'registrations', eventId),
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
