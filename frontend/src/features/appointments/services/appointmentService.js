// Phase 2: Participant bookings now also write to users/{uid}/appointments/{apptId}
// so the calendar/dashboard can read the user's appointments without a top-level scan.
// Stats: bumps stats/admin_summary.upcomingAppointmentsCount.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  limit,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";

import { auth, db } from "../../../firebase";

const APPOINTMENTS_COLLECTION = "appointments";
const USERS_COLLECTION = "users";
const STATS_ADMIN = doc(db, "stats", "admin_summary");

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
 * Loads `users/{uid}` and derives a display name for admin-facing data.
 */
async function resolveParticipantNameForAppointment(user) {
  const uid = user?.uid;
  if (!uid) return "Participant";

  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const fromDoc = buildParticipantNameFromProfileData(snap.data());
      if (fromDoc) return fromDoc;
    }
  } catch (e) {
    console.warn("Could not read user profile for appointment name:", e);
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
    userId: participantId,
    participantName,
    participantEmail: user.email || "",
    createdAt: serverTimestamp(),
    /** Participant bookings require admin approval before they are confirmed. */
    status: "pending",
  };

  // Stats counters are NOT bumped here — clients can't write to stats under the
  // new rules. A Cloud Function should maintain that aggregate.
  const batch = writeBatch(db);
  batch.set(ref, payload);
  batch.set(doc(db, "users", participantId, "appointments", ref.id), payload);
  await batch.commit();

  return ref.id;
}

/** Returns this participant's appointments, newest first (by `createdAt`).
 *  Reads from the user mirror subcollection — one targeted read, no global scan. */
export async function getParticipantAppointments(participantId) {
  if (!participantId) {
    return [];
  }

  const snap = await getDocs(
    query(collection(db, "users", participantId, "appointments"), limit(50))
  );
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

/** Sets `status` to `"cancelled"` on both the flat doc and the user mirror. */
export async function cancelAppointment(appointmentId) {
  if (!appointmentId) {
    throw new Error("Missing appointment id");
  }

  const flatRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
  const existing = await getDoc(flatRef);
  const uid = existing.exists() ? (existing.data().userId || existing.data().participantId) : null;
  const wasActive = existing.exists() && existing.data().status !== "cancelled";

  const batch = writeBatch(db);
  batch.update(flatRef, { status: "cancelled" });
  if (uid) {
    batch.set(
      doc(db, "users", uid, "appointments", appointmentId),
      { status: "cancelled" },
      { merge: true }
    );
  }
  await batch.commit();
  void wasActive; // stats counters are not maintained from the client.
}

/**
 * True if a non-cancelled appointment exists for the same date, time, and therapist.
 *
 * The participant security rule on /appointments only permits reading docs the
 * participant owns. A cross-user duplicate check therefore fails with
 * "missing or insufficient permissions" for non-admin users. We catch that case
 * and return false — admin approval is the authoritative conflict gate.
 */
export async function checkDuplicateAppointment(date, time, therapistName) {
  try {
    const q = query(
      collection(db, APPOINTMENTS_COLLECTION),
      where("therapistName", "==", therapistName),
      where("date", "==", date),
      where("time", "==", time)
    );
    const snap = await getDocs(q);
    return snap.docs.some((d) => d.data().status !== "cancelled");
  } catch (err) {
    if (err?.code === "permission-denied") {
      console.warn("Skipping client-side duplicate check (permission denied — admin will validate on approval).");
      return false;
    }
    throw err;
  }
}
