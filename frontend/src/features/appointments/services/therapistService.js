import { collection, getDocs } from "firebase/firestore";

import { db } from "../../../firebase";

const THERAPISTS_COLLECTION = "therapists";

/** Firestore `type` values (UI booking grid uses `massage`; Firestore uses `massageTherapy`). */
export const VALID_FIRESTORE_THERAPIST_TYPES = [
  "psychologist",
  "therapist",
  "reflexology",
  "acupuncture",
  "massageTherapy",
  "nlp",
  "touchTherapy",
];

/** Maps UI appointment type key from the grid to the value stored in `therapists.type`. */
const UI_APPOINTMENT_KEY_TO_THERAPIST_TYPE = {
  massage: "massageTherapy",
};

/**
 * Value to compare against `therapist.type` for the current UI selection (strict equality).
 */
export function therapistTypeForFilter(selectedAppointmentTypeKey) {
  if (selectedAppointmentTypeKey == null || selectedAppointmentTypeKey === "") {
    return null;
  }
  return (
    UI_APPOINTMENT_KEY_TO_THERAPIST_TYPE[selectedAppointmentTypeKey] ??
    selectedAppointmentTypeKey
  );
}

/**
 * Normalizes `availableTimes` from Firestore (strings or `{ time }` objects) to sorted unique "HH:mm" strings.
 */
export function normalizeAvailableTimes(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const s = item.trim();
      if (s) out.push(s);
    } else if (item && typeof item === "object" && typeof item.time === "string") {
      const s = item.time.trim();
      if (s) out.push(s);
    }
  }
  return [...new Set(out)].sort((a, b) => a.localeCompare(b));
}

function isAvailableStatus(statusRaw) {
  return String(statusRaw ?? "").trim().toLowerCase() === "available";
}

function mapTherapistDoc(docSnap) {
  const data = docSnap.data() ?? {};
  const typeRaw = data.type;
  const type =
    typeof typeRaw === "string"
      ? typeRaw.trim()
      : typeRaw != null
        ? String(typeRaw).trim()
        : "";

  return {
    id: docSnap.id,
    name: typeof data.name === "string" ? data.name.trim() : "",
    specialty: typeof data.specialty === "string" ? data.specialty.trim() : "",
    type,
    status: typeof data.status === "string" ? data.status.trim() : "",
    availableTimes: normalizeAvailableTimes(data.availableTimes),
  };
}

/**
 * Loads all documents from the `therapists` collection and returns only those with
 * `status` equal to `"available"` (case-insensitive).
 */
export async function getAvailableTherapists() {
  const snap = await getDocs(collection(db, THERAPISTS_COLLECTION));
  return snap.docs
    .map(mapTherapistDoc)
    .filter((t) => isAvailableStatus(t.status));
}
