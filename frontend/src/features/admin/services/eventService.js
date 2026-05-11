import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { logAuditEvent } from './auditService';

/**
 * Fetch all events ordered by creation time (newest first).
 */
export async function getAllEvents() {
  const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribe to published events in real time, sorted by createdAt descending.
 * Returns an unsubscribe function — call it in a useEffect cleanup.
 * @param {(events: Object[]) => void} callback
 */
export function subscribeToPublishedEvents(callback) {
  const q = query(
    collection(db, 'events'),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/**
 * Create a new event and log the action.
 * @param {Object} data The event data.
 */
export async function createEvent(data) {
  const ref = await addDoc(collection(db, 'events'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  
  await logAuditEvent({
    actionType: 'CREATE_EVENT',
    targetId: ref.id,
    details: { after: data },
  });
  
  return ref.id;
}

/**
 * Update an existing event and log the action.
 * @param {string} id The event document ID.
 * @param {Object} data The updated event data.
 */
export async function updateEvent(id, data) {
  await updateDoc(doc(db, 'events', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  
  await logAuditEvent({
    actionType: 'UPDATE_EVENT',
    targetId: id,
    details: { after: data },
  });
}

/**
 * Delete an event and log the action.
 * @param {string} id The event document ID.
 * @param {string} title The title of the event (for logging purposes).
 */
export async function deleteEvent(id, title) {
  await deleteDoc(doc(db, 'events', id));
  
  await logAuditEvent({
    actionType: 'DELETE_EVENT',
    targetId: id,
    details: { deleted: title },
  });
}
