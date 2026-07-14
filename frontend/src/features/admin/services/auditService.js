// Audit log writer.
// Phase 1 changes:
//   - Added expiresAt (90 days from createdAt) so Firestore TTL can prune old logs.
//   - Embedded actorName + actorEmail so list views don't need to join users/.
//   - Added a plain-text summary field for fast scanning.
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

const RETENTION_DAYS = 90;

function buildSummary(actionType, targetId, details) {
  const subject = details?.participant || details?.deleted || details?.removed || details?.title;
  if (subject) return `${actionType} — ${subject}`;
  if (targetId) return `${actionType} — ${targetId.slice(0, 8)}`;
  return actionType;
}

/**
 * Write an immutable audit log entry.
 *
 * @param {{ actionType: string, targetId?: string, details?: object, summary?: string }} data
 */
export async function logAuditEvent({ actionType, targetId, details, summary }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Cannot write audit log: no authenticated user');

  const expiresAt = Timestamp.fromMillis(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000);

  await addDoc(collection(db, 'audit_logs'), {
    timestamp: serverTimestamp(),
    adminId: user.uid,
    adminEmail: user.email || '',
    actorEmail: user.email || '',
    actorName: user.displayName || (user.email ? user.email.split('@')[0] : 'admin'),
    actionType,
    targetId: targetId || '',
    details: details || {},
    summary: summary || buildSummary(actionType, targetId, details),
    expiresAt,
  });
}
