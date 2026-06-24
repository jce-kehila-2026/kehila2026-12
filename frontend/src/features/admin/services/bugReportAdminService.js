// Admin-side access to in-app bug / problem reports.
//
// Participants write these to the `bugReports` collection via
// features/participant/services/bugReportService.js (status: 'new'). This is the
// admin counterpart: it lists reports for the Bug Reports page and lets an admin
// mark one handled (or reopen it) and delete it. Mirrors formSubmissionAdminService
// so the two review screens behave identically. Firestore rules grant admins
// read/update/delete, so no extra rules are needed for this path.
import { collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { logAuditEvent } from './auditService';

export const BUG_REPORTS_COLLECTION = 'bugReports';

export const BUG_REPORT_STATUS = {
  NEW: 'new',
  HANDLED: 'handled',
};

// Firestore Timestamp | ISO string | {seconds} -> millis (0 when missing), so we
// can sort newest-first on the client without requiring a composite index.
function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value === 'object' && typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function actorLabel() {
  return auth.currentUser?.email || auth.currentUser?.uid || '';
}

function normalizeReport(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    status: data.status || BUG_REPORT_STATUS.NEW,
    category: data.category || 'other',
    ...data,
  };
}

/**
 * Fetch all bug reports, newest first. Sorted client-side to stay index-free
 * and to keep reports that are missing `createdAt`.
 */
export async function listBugReports() {
  const snap = await getDocs(query(collection(db, BUG_REPORTS_COLLECTION), limit(500)));
  return snap.docs
    .map(normalizeReport)
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
}

/** Mark a report handled (or reopen it), recording who/when. */
export async function setBugReportHandled(report, handled = true) {
  const status = handled ? BUG_REPORT_STATUS.HANDLED : BUG_REPORT_STATUS.NEW;
  await updateDoc(doc(db, BUG_REPORTS_COLLECTION, report.id), {
    status,
    handledAt: handled ? serverTimestamp() : null,
    handledBy: handled ? actorLabel() : '',
  });

  await logAuditEvent({
    actionType: handled ? 'BUG_REPORT_HANDLED' : 'BUG_REPORT_REOPENED',
    targetId: report.id,
    details: { reporter: report.reporterEmail || report.reporterUid || report.id },
  });

  return { status };
}

/** Permanently delete a bug report. */
export async function deleteBugReport(report) {
  await deleteDoc(doc(db, BUG_REPORTS_COLLECTION, report.id));

  await logAuditEvent({
    actionType: 'BUG_REPORT_DELETED',
    targetId: report.id,
    details: { reporter: report.reporterEmail || report.reporterUid || report.id },
  });

  return { deleted: true };
}
