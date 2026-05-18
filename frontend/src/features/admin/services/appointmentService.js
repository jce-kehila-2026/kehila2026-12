// Phase 1 changes: added limit() to bounded list queries.
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, where, limit, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { logAuditEvent } from './auditService';

// ─── Appointments ─────────────────────────────────────────────

export async function getAllAppointments() {
  const q = query(collection(db, 'appointments'), orderBy('date', 'asc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAppointmentsByEmail(email) {
  const q = query(
    collection(db, 'appointments'),
    where('participantEmail', '==', email),
    limit(20)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
}

export async function createAppointment(data) {
  const ref = await addDoc(collection(db, 'appointments'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  try {
    await logAuditEvent({
      actionType: 'CREATE_APPOINTMENT',
      targetId: ref.id,
      details: { participant: data.participantName },
    });
  } catch (_) {}
  return ref.id;
}

export async function updateAppointment(id, data) {
  await updateDoc(doc(db, 'appointments', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  try {
    await logAuditEvent({
      actionType: 'UPDATE_APPOINTMENT',
      targetId: id,
      details: data,
    });
  } catch (_) {}
}

export async function deleteAppointment(id) {
  await deleteDoc(doc(db, 'appointments', id));
  try {
    await logAuditEvent({
      actionType: 'DELETE_APPOINTMENT',
      targetId: id,
      details: {},
    });
  } catch (_) {}
}

// ─── Settings (stored in appt_settings collection) ────────────

const SETTINGS = 'appt_settings';

export async function getAvailabilitySettings() {
  const snap = await getDoc(doc(db, SETTINGS, 'availability'));
  return snap.exists() ? snap.data() : null;
}

export async function saveAvailabilitySettings(data) {
  await setDoc(doc(db, SETTINGS, 'availability'), data, { merge: true });
}

export async function getAppointmentTypes() {
  const snap = await getDoc(doc(db, SETTINGS, 'appointment_types'));
  return snap.exists() ? snap.data() : null;
}

export async function saveAppointmentTypes(data) {
  await setDoc(doc(db, SETTINGS, 'appointment_types'), data, { merge: true });
}

export async function getBlockoutDates() {
  const snap = await getDoc(doc(db, SETTINGS, 'blockout_dates'));
  return snap.exists() ? snap.data() : null;
}

export async function saveBlockoutDates(data) {
  await setDoc(doc(db, SETTINGS, 'blockout_dates'), data, { merge: true });
}
