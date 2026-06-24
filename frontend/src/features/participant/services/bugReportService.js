// Participant-side writer for in-app bug / problem reports.
//
// Signed-in participants submit these from the header "Report a problem" button.
// Reports land in the `bugReports` collection and are triaged by admins on the
// Bug Reports page (features/admin/pages/BugReportsPage.jsx).
//
// Mirrors the constrained-create pattern used by joinRequestService /
// formSubmissionService, but authenticated: the matching firestore.rules block
// pins the field set, sizes, status and source so the endpoint can't be abused.
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

export const BUG_REPORTS_COLLECTION = 'bugReports';

export const BUG_REPORT_CATEGORIES = ['bug', 'visual', 'content', 'performance', 'other'];

/**
 * Create a bug report attributed to the current signed-in user. Auto-captures
 * the context that makes a report actionable (route, locale, user agent) so the
 * reporter doesn't have to describe "where" it happened.
 *
 * @param {{ message: string, category?: string, route?: string, locale?: string, reporterName?: string }} input
 */
export async function createBugReport({ message, category, route, locale, reporterName } = {}) {
  const user = auth.currentUser;
  if (!user?.uid) throw new Error('Not authenticated');

  const cleanMessage = String(message || '').trim();
  if (!cleanMessage) throw new Error('Message is required');

  const cleanCategory = BUG_REPORT_CATEGORIES.includes(category) ? category : 'bug';
  const userAgent = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';

  const payload = {
    message: cleanMessage.slice(0, 5000),
    category: cleanCategory,
    route: String(route || '').slice(0, 600),
    locale: String(locale || '').slice(0, 10),
    userAgent: userAgent.slice(0, 1000),
    appVersion: String(import.meta.env?.VITE_APP_VERSION || '').slice(0, 50),
    reporterUid: user.uid,
    reporterEmail: String(user.email || '').slice(0, 320),
    reporterName: String(reporterName || user.displayName || '').slice(0, 200),
    status: 'new',
    source: 'participant-app',
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, BUG_REPORTS_COLLECTION), payload);
  return { id: ref.id, ...payload };
}
