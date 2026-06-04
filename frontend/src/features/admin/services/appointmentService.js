import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase';

/**
 * Legacy compatibility reader for appointments created before bookings became
 * the source of truth. New appointment bookings should come from /bookings.
 */
export async function getAllAppointments() {
  const q = query(collection(db, 'appointments'), orderBy('date', 'asc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, source: 'legacyAppointment', ...d.data() }));
}
