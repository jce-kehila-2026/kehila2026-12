import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
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
    orderBy('registeredAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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

  await logAuditEvent({
    actionType: 'ADD_REGISTRATION',
    targetId: ref.id,
    details: {
      eventId: data.eventId,
      participant: data.participantName || data.participantEmail,
    },
  });

  return ref.id;
}

/**
 * Remove a registration (cancel).
 * @param {string} regId  The registration document ID.
 * @param {string} participantName  For audit log readability.
 */
export async function removeRegistration(regId, participantName) {
  await deleteDoc(doc(db, 'event_registrations', regId));

  await logAuditEvent({
    actionType: 'REMOVE_REGISTRATION',
    targetId: regId,
    details: { removed: participantName },
  });
}
