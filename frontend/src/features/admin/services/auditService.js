import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

/**
 * Write an immutable audit log entry.
 *
 * @param {{ actionType: string, targetId: string, details: object }} data
 */
export async function logAuditEvent({ actionType, targetId, details }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Cannot write audit log: no authenticated user');

  await addDoc(collection(db, 'audit_logs'), {
    timestamp: serverTimestamp(),
    adminId: user.uid,
    adminEmail: user.email || '',
    actionType,
    targetId: targetId || '',
    details: details || {},
  });
}
