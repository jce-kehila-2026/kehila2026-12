import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../../firebase";

const APPOINTMENTS_COLLECTION = "appointments";

/**
 * @param {Omit<import("firebase/firestore").DocumentData, "appointmentId" | "participantId" | "createdAt"> & {
 *   type: string;
 *   therapistName: string;
 *   date: string;
 *   time: string;
 *   notes: string;
 *   status: "confirmed" | "pending" | "cancelled";
 * }} appointmentData
 */
export async function createAppointment(appointmentData) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("Not authenticated");
  }

  const ref = doc(collection(db, APPOINTMENTS_COLLECTION));

  await setDoc(ref, {
    ...appointmentData,
    appointmentId: ref.id,
    participantId: uid,
    createdAt: serverTimestamp(),
  });

  return ref.id;
}

/**
 * @param {string} participantId
 * @returns {Promise<Array<Record<string, unknown> & { id: string }>>}
 */
export async function getParticipantAppointments(participantId) {
  if (!participantId) {
    return [];
  }

  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where("participantId", "==", participantId)
  );

  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  rows.sort((a, b) => {
    const ta =
      typeof a.createdAt?.toMillis === "function"
        ? a.createdAt.toMillis()
        : 0;
    const tb =
      typeof b.createdAt?.toMillis === "function"
        ? b.createdAt.toMillis()
        : 0;
    return tb - ta;
  });

  return rows;
}

/**
 * Soft-cancel: sets status to "cancelled" only.
 * @param {string} appointmentId Firestore document id
 */
export async function cancelAppointment(appointmentId) {
  if (!appointmentId) {
    throw new Error("Missing appointment id");
  }

  const ref = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(ref, { status: "cancelled" });
}

/**
 * True if an active (non-cancelled) appointment exists for the same slot and therapist.
 * @param {string} date ISO date string YYYY-MM-DD
 * @param {string} time e.g. "10:00"
 * @param {string} therapistName
 */
export async function checkDuplicateAppointment(date, time, therapistName) {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where("therapistName", "==", therapistName),
    where("date", "==", date),
    where("time", "==", time)
  );

  const snap = await getDocs(q);
  return snap.docs.some((d) => {
    const status = d.data().status;
    return status !== "cancelled";
  });
}
