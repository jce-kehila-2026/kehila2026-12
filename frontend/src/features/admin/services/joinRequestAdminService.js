// Admin-side access to public membership applications ("טופס הצטרפות לעמותה").
//
// The public website writes these documents to the `joinRequests` collection
// via features/public/services/joinRequestService.js (status: 'new'). This
// service is the admin counterpart: it reads them so the Users page can show
// who applied. Accept/reject actions are added in a later phase.
//
// Firestore rules already grant admins read/update/delete on `joinRequests`,
// so no rules changes are needed for this read path.
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../../firebase';

export const JOIN_REQUESTS_COLLECTION = 'joinRequests';

export const JOIN_REQUEST_STATUS = {
  NEW: 'new',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Firestore Timestamp | ISO string | {seconds} -> millis (0 when missing), so
// we can sort newest-first on the client without requiring a composite index.
function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value === 'object' && typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeJoinRequest(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    status: data.status || JOIN_REQUEST_STATUS.NEW,
    ...data,
  };
}

/**
 * Fetch all membership applications, newest first.
 * Sorted client-side to avoid excluding docs missing `createdAt` and to keep
 * the query index-free.
 */
export async function listJoinRequests() {
  const snap = await getDocs(query(collection(db, JOIN_REQUESTS_COLLECTION), limit(500)));
  return snap.docs
    .map(normalizeJoinRequest)
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
}
