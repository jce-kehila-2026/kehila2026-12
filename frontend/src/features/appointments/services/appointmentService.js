import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../../firebase";

const APPOINTMENTS_COLLECTION = "appointments";
const PARTICIPANTS_COLLECTION = "participants";

function buildParticipantNameFromProfileData(data) {
  if (!data || typeof data !== "object") return "";

  const fullName =
    typeof data.fullName === "string" ? data.fullName.trim() : "";
  if (fullName) return fullName;

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (name) return name;

  const first =
    typeof data.firstName === "string" ? data.firstName.trim() : "";
  const last =
    typeof data.lastName === "string" ? data.lastName.trim() : "";
  const combined = [first, last].filter(Boolean).join(" ").trim();
  if (combined) return combined;

  return "";
}

/**
 * Loads `participants/{uid}` and derives a display name for admin-facing data.
 */
async function resolveParticipantNameForAppointment(user) {
  const uid = user?.uid;
  if (!uid) return "Participant";

  try {
    const participantRef = doc(db, PARTICIPANTS_COLLECTION, uid);
    const snap = await getDoc(participantRef);
    if (snap.exists()) {
      const fromDoc = buildParticipantNameFromProfileData(snap.data());
      if (fromDoc) return fromDoc;
    }
  } catch (e) {
    console.warn("Could not read participant profile for appointment name:", e);
  }

  const display = typeof user.displayName === "string" ? user.displayName.trim() : "";
  if (display) return display;

  return "Participant";
}

/**
 * Persists a new appointment. Always sets `participantId` to `auth.currentUser.uid`
 * (field name exactly `participantId`). Strips legacy fields if passed by mistake.
 */
export async function createAppointment(appointmentData = {}) {
  const user = auth.currentUser;
  if (!user?.uid) {
    throw new Error("Not authenticated");
  }
  const participantId = user.uid;

  const participantName = await resolveParticipantNameForAppointment(user);

  const {
    participantEmail: _legacyEmail,
    participantName: _ignoreCallerParticipantName,
    participantId: _ignoredParticipantId,
    appointmentId: _ignoredAppointmentId,
    createdAt: _ignoredCreatedAt,
    ...rest
  } = appointmentData;

  const ref = doc(collection(db, APPOINTMENTS_COLLECTION));

  const payload = {
    ...rest,
    appointmentId: ref.id,
    participantId,
    participantName,
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, payload);

  return ref.id;
}

/** Returns this participant’s appointments, newest first (by `createdAt`). */
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

/** Sets `status` to `"cancelled"` (document is not deleted). */
export async function cancelAppointment(appointmentId) {
  if (!appointmentId) {
    throw new Error("Missing appointment id");
  }

  const ref = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  await updateDoc(ref, { status: "cancelled" });
}

/** True if a non-cancelled appointment exists for the same date, time, and therapist. */
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
