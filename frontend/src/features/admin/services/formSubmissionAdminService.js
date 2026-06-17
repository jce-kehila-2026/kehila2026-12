// Admin-side access to public volunteer/donation contact-form submissions.
//
// The public website writes these to the `formSubmissions` collection via
// features/public/services/formSubmissionService.js (status: 'new', with a
// `type` of 'volunteer' | 'donation'). This service is the admin counterpart:
// it lists them for the Forms page and lets an admin mark a submission handled
// or delete it. Firestore rules grant admins read/update/delete, so no rules
// changes are needed for this path.
import { collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { logAuditEvent } from './auditService';

export const FORM_SUBMISSIONS_COLLECTION = 'formSubmissions';

export const FORM_SUBMISSION_TYPE = {
  VOLUNTEER: 'volunteer',
  DONATION: 'donation',
};

export const FORM_SUBMISSION_STATUS = {
  NEW: 'new',
  HANDLED: 'handled',
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

function normalizeSubmission(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    status: data.status || FORM_SUBMISSION_STATUS.NEW,
    type: data.type || FORM_SUBMISSION_TYPE.VOLUNTEER,
    ...data,
  };
}

/**
 * Fetch all form submissions, newest first.
 * Sorted client-side to avoid excluding docs missing `createdAt` and to keep
 * the query index-free.
 */
export async function listFormSubmissions() {
  const snap = await getDocs(query(collection(db, FORM_SUBMISSIONS_COLLECTION), limit(500)));
  return snap.docs
    .map(normalizeSubmission)
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
}

function actorLabel() {
  return auth.currentUser?.email || auth.currentUser?.uid || '';
}

/**
 * Mark a submission as handled (or move it back to 'new'). Records who/when so
 * the team can see it's been dealt with.
 */
export async function setSubmissionHandled(submission, handled = true) {
  const status = handled ? FORM_SUBMISSION_STATUS.HANDLED : FORM_SUBMISSION_STATUS.NEW;
  await updateDoc(doc(db, FORM_SUBMISSIONS_COLLECTION, submission.id), {
    status,
    handledAt: handled ? serverTimestamp() : null,
    handledBy: handled ? actorLabel() : '',
  });

  await logAuditEvent({
    actionType: handled ? 'FORM_SUBMISSION_HANDLED' : 'FORM_SUBMISSION_REOPENED',
    targetId: submission.id,
    details: { participant: submission.fullName || submission.email || submission.id, type: submission.type },
  });

  return { status };
}

/**
 * Permanently delete a submission.
 */
export async function deleteSubmission(submission) {
  await deleteDoc(doc(db, FORM_SUBMISSIONS_COLLECTION, submission.id));

  await logAuditEvent({
    actionType: 'FORM_SUBMISSION_DELETED',
    targetId: submission.id,
    details: { deleted: submission.fullName || submission.email || submission.id, type: submission.type },
  });

  return { deleted: true };
}
