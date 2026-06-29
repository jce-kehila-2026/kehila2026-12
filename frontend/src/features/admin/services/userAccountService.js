// Admin user-account lifecycle helpers that run fully client-side (Spark plan —
// no Cloud Functions, no Admin SDK).
//
// IMPORTANT constraint: the Firebase client SDK cannot delete or disable an
// arbitrary Auth user — only the currently signed-in one. So "delete" here is a
// soft delete: we overwrite the users/{uid} profile with a minimal tombstone
// that blocks sign-in (isActive:false) and lets a later application with the
// same email REVIVE the account (see joinRequestAdminService.reviveDeletedAccount),
// and we hard-delete everything personal hanging off the uid so a revived
// account never inherits the deleted member's data.
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../firebase';

export const DELETED_STATUS = 'deleted';

// True for a tombstoned (deleted) account. The admin Users list hides these.
export function isDeletedUser(user) {
  return String(user?.status || '').toLowerCase() === DELETED_STATUS;
}

// Per-user subcollections holding this member's own data. Admins may delete all
// of these per firestore.rules. They must be cleared on delete because a revived
// account reuses the same uid.
const USER_SUBCOLLECTIONS = [
  'registrations',
  'bookings',
  'appointments',
  'calendar_notes',
  'dashboard_notes',
  'activity_notifications',
];

// Delete every document in a collection reference, batched under the 500-write cap.
async function deleteAllDocs(collRef) {
  const snap = await getDocs(collRef);
  if (snap.empty) return;

  let batch = writeBatch(db);
  let pending = 0;
  for (const docSnap of snap.docs) {
    batch.delete(docSnap.ref);
    pending += 1;
    if (pending === 400) {
      await batch.commit();
      batch = writeBatch(db);
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();
}

/**
 * Permanently remove a member account (Spark-plan soft delete).
 *
 * - Clears every per-user subcollection and the public_profiles/{uid} card so no
 *   personal data survives into a future account that reuses this uid.
 * - Overwrites users/{uid} with a "deleted" tombstone: sign-in stays blocked
 *   (isActive:false) and `emailLower` lets re-application revive it.
 *
 * @param {string} uid
 * @param {{ email?: string, deletedBy?: string|null }} [opts]
 */
export async function deleteMemberAccount(uid, { email = '', deletedBy = null } = {}) {
  if (!uid) throw new Error('deleteMemberAccount: uid is required');

  // 1. Clear per-user subcollections (best-effort, independently — a failure on
  //    one must not prevent the tombstone that actually blocks sign-in).
  for (const sub of USER_SUBCOLLECTIONS) {
    try {
      await deleteAllDocs(collection(db, 'users', uid, sub));
    } catch (err) {
      console.warn(`Failed clearing users/${uid}/${sub}:`, err);
    }
  }

  // 2. Remove the community-visible public profile card (best-effort).
  try {
    await deleteDoc(doc(db, 'public_profiles', uid));
  } catch (err) {
    console.warn(`Failed deleting public_profiles/${uid}:`, err);
  }

  // 3. Overwrite the profile with a tombstone. setDoc WITHOUT merge replaces the
  //    whole document, so all personal fields are wiped in one write. This is the
  //    critical step (it blocks sign-in), so it is NOT swallowed — if it throws,
  //    the caller surfaces the error.
  await setDoc(doc(db, 'users', uid), {
    email: email || '',
    emailLower: String(email || '').trim().toLowerCase(),
    role: 'participant',
    status: DELETED_STATUS,
    isActive: false,
    deletedAt: serverTimestamp(),
    deletedBy: deletedBy || null,
  });
}
