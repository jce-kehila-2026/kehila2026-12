// Phase 1 changes: added limit() to bounded list queries.
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { logAuditEvent } from './auditService';

/**
 * Fetch all registrations for a specific event.
 * @param {string} eventId
 */
export async function getRegistrationsByEvent(eventId) {
  const q = query(
    collection(db, 'event_registrations'),
    where('eventId', '==', eventId),
    limit(200)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort client-side to avoid requiring a composite Firestore index
  return docs.sort((a, b) => {
    const aTime = a.registeredAt?.toDate?.() ?? new Date(0);
    const bTime = b.registeredAt?.toDate?.() ?? new Date(0);
    return bTime - aTime;
  });
}

/**
 * Fetch registration counts for multiple events at once.
 * Returns a map: { eventId: count }
 * @param {string[]} eventIds
 */
export async function getRegistrationCounts(eventIds) {
  if (!eventIds.length) return {};

  const snap = await getDocs(collection(db, 'event_registrations'));
  const counts = {};
  eventIds.forEach((id) => (counts[id] = 0));

  snap.docs.forEach((d) => {
    const eid = d.data().eventId;
    if (counts[eid] !== undefined) {
      counts[eid]++;
    }
  });

  return counts;
}

/**
 * Register a participant for an event.
 * @param {Object} data  { eventId, participantName, participantEmail, participantPhone? }
 */
export async function addRegistration(data) {
  const ref = await addDoc(collection(db, 'event_registrations'), {
    ...data,
    registeredAt: serverTimestamp(),
  });

  // Audit log is admin-only — participants don't have write access to audit_logs.
  // Fail silently so a permission error here never blocks the registration itself.
  try {
    await logAuditEvent({
      actionType: 'ADD_REGISTRATION',
      targetId: ref.id,
      details: {
        eventId: data.eventId,
        participant: data.participantName || data.participantEmail,
      },
    });
  } catch (_) {}

  return ref.id;
}

/**
 * Remove a registration (cancel).
 * @param {string} regId  The registration document ID.
 * @param {string} participantName  For audit log readability.
 */
export async function removeRegistration(regId, participantName) {
  await deleteDoc(doc(db, 'event_registrations', regId));

  try {
    await logAuditEvent({
      actionType: 'REMOVE_REGISTRATION',
      targetId: regId,
      details: { removed: participantName },
    });
  } catch (_) {}
}

/**
 * Mark a registration as checked-in.
 * Requires isAdmin() update permission on event_registrations in Firestore rules.
 * @param {string} regId
 */
export async function checkInRegistration(regId) {
  await updateDoc(doc(db, 'event_registrations', regId), { checkedIn: true });
}

/**
 * Get a map of eventId → registrationDocId for all events a user is registered for.
 * Used by the participant to know which workshops they've already joined.
 * @param {string} email
 * @returns {Promise<Record<string, string>>}
 */
export async function getUserRegisteredEventIds(email) {
  const q = query(
    collection(db, 'event_registrations'),
    where('participantEmail', '==', email),
    limit(50)
  );
  const snap = await getDocs(q);
  const map = {};
  snap.docs.forEach((d) => {
    map[d.data().eventId] = d.id;
  });
  return map;
}
