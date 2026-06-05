import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase';

const UPDATES_COL = 'updates';

/**
 * Publish a new announcement.
 * @param {{ title: string, body: string, type: string }} data
 * @param {{ uid: string, displayName: string }} adminUser
 */
export async function createUpdate(data, adminUser) {
  return addDoc(collection(db, UPDATES_COL), {
    title: data.title,
    body: data.body,
    type: data.type,
    createdAt: serverTimestamp(),
    createdBy: adminUser.uid,
    createdByName: adminUser.displayName || adminUser.email || 'Admin',
    active: true,
  });
}

/**
 * Fetch all updates, most recent first.
 * Active filtering is done client-side to avoid a composite index requirement.
 * @param {boolean} onlyActive – if true, filters out archived (active === false) docs
 */
export async function fetchUpdates(onlyActive = true) {
  const snap = await getDocs(query(collection(db, UPDATES_COL), orderBy('createdAt', 'desc')));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return onlyActive ? all.filter((u) => u.active !== false) : all;
}

/**
 * Soft-delete (archive) an update by setting active = false.
 */
export async function archiveUpdate(updateId) {
  return updateDoc(doc(db, UPDATES_COL, updateId), { active: false });
}

/**
 * Hard-delete an update document.
 */
export async function deleteUpdate(updateId) {
  return deleteDoc(doc(db, UPDATES_COL, updateId));
}

/**
 * Calculate the number of unread updates for a participant.
 * Uses client-side filtering against a pre-fetched updates list for zero extra reads.
 *
 * @param {import('firebase/firestore').Timestamp|null} lastSeenAt
 * @param {Array} updates – already-fetched list from fetchUpdates()
 */
export function countUnread(lastSeenAt, updates) {
  if (!lastSeenAt) return updates.filter((u) => u.active !== false).length;
  const seenMs = lastSeenAt.toMillis ? lastSeenAt.toMillis() : lastSeenAt;
  return updates.filter((u) => u.active !== false && u.createdAt?.toMillis?.() > seenMs).length;
}

/**
 * Read the lastSeenUpdatesAt timestamp from the participant's user document.
 * Returns null if the field doesn't exist yet.
 */
export async function getLastSeenAt(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data().lastSeenUpdatesAt ?? null) : null;
}

/**
 * Stamp the participant's user document with the current server time,
 * marking all current updates as "seen".
 */
export async function markAllAsRead(uid) {
  return updateDoc(doc(db, 'users', uid), {
    lastSeenUpdatesAt: serverTimestamp(),
  });
}
