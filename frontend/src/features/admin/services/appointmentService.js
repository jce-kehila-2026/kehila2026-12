// Phase 2: Admin-managed appointments now dual-write to:
//   appointments/{apptId}                  — flat, used by admin queries
//   users/{uid}/appointments/{apptId}      — user mirror for fast participant reads
// When the participantEmail does not map to an existing user, only the flat
// doc is written. Stats: bumps stats/admin_summary.upcomingAppointmentsCount.

import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, where, limit, getDoc, setDoc,
  writeBatch, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { logAuditEvent } from './auditService';

const STATS_ADMIN = doc(db, 'stats', 'admin_summary');

async function findUidByEmail(email) {
  if (!email) return null;
  const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].id;
}

// ─── Appointments ─────────────────────────────────────────────

export async function getAllAppointments() {
  const q = query(collection(db, 'appointments'), orderBy('date', 'asc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAppointmentsByEmail(email) {
  // Prefer the user mirror when we know the uid — single subcollection read.
  const uid = await findUidByEmail(email);
  if (uid) {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'appointments'), limit(20))
    );
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return docs.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
  }

  // Fallback: email-only walk-in appointments still live in the flat collection.
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
  const flatRef = doc(collection(db, 'appointments'));
  const uid = data.uid || (await findUidByEmail(data.participantEmail));

  const flatDoc = {
    ...data,
    appointmentId: flatRef.id,
    userId: uid || null,
    createdAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(flatRef, flatDoc);
  batch.set(
    STATS_ADMIN,
    { upcomingAppointmentsCount: increment(1), updatedAt: serverTimestamp() },
    { merge: true }
  );
  if (uid) {
    batch.set(doc(db, 'users', uid, 'appointments', flatRef.id), flatDoc);
  }
  await batch.commit();

  try {
    await logAuditEvent({
      actionType: 'CREATE_APPOINTMENT',
      targetId: flatRef.id,
      details: { participant: data.participantName },
    });
  } catch (_) {}
  return flatRef.id;
}

export async function updateAppointment(id, data) {
  const flatRef = doc(db, 'appointments', id);
  const existing = await getDoc(flatRef);
  const uid = existing.exists() ? existing.data().userId : null;
  const wasActive = existing.exists() && existing.data().status !== 'cancelled';
  const willBeCancelled = data.status === 'cancelled';

  const batch = writeBatch(db);
  batch.update(flatRef, { ...data, updatedAt: serverTimestamp() });
  if (uid) {
    batch.set(
      doc(db, 'users', uid, 'appointments', id),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
  if (wasActive && willBeCancelled) {
    batch.set(
      STATS_ADMIN,
      { upcomingAppointmentsCount: increment(-1), updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();

  try {
    await logAuditEvent({ actionType: 'UPDATE_APPOINTMENT', targetId: id, details: data });
  } catch (_) {}
}

export async function deleteAppointment(id) {
  const flatRef = doc(db, 'appointments', id);
  const existing = await getDoc(flatRef);
  const uid = existing.exists() ? existing.data().userId : null;
  const wasActive = existing.exists() && existing.data().status !== 'cancelled';

  const batch = writeBatch(db);
  batch.delete(flatRef);
  if (uid) {
    batch.delete(doc(db, 'users', uid, 'appointments', id));
  }
  if (wasActive) {
    batch.set(
      STATS_ADMIN,
      { upcomingAppointmentsCount: increment(-1), updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();

  try {
    await logAuditEvent({ actionType: 'DELETE_APPOINTMENT', targetId: id, details: {} });
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

// Suppress unused-import warning for addDoc / updateDoc / deleteDoc which we kept
// for backward compat in case other callers import them transitively.
export { addDoc, updateDoc, deleteDoc };
