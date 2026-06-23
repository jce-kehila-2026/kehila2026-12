import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "../../../firebase";
import {
  addRegistration,
  removeRegistration,
} from "../../admin/services/registrationService";
import { APPOINTMENT_TYPE_OPTIONS } from "../appointmentTypeMeta";

const EVENTS_COLLECTION = "events";
const BOOKINGS_COLLECTION = "bookings";
const LEGACY_APPOINTMENTS_COLLECTION = "appointments";
const USERS_COLLECTION = "users";
const UPCOMING_OCCURRENCE_COUNT = 8;

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(value) {
  const date = value instanceof Date ? value : toDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeKey(value, fallback = "09:00") {
  if (!value) return fallback;
  if (typeof value === "string") {
    const match = value.match(/^(\d{1,2}):(\d{2})/);
    if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  const date = toDate(value);
  if (!date) return fallback;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function addMinutes(time, minutesToAdd) {
  const [hours, minutes] = toTimeKey(time).split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0, 0);
  return toTimeKey(date);
}

function copyTimeToDate(dateValue, timeValue) {
  const date = toDate(dateValue);
  if (!date) return null;
  const [hours, minutes] = toTimeKey(timeValue).split(":").map(Number);
  const copy = new Date(date);
  copy.setHours(hours, minutes || 0, 0, 0);
  return copy;
}

function slugifyIdentifier(value, fallback = "item") {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100) || fallback;
}

function getEventType(event) {
  return String(event?.eventType || event?.type || event?.category || "").trim().toLowerCase();
}

function isAppointmentEvent(event) {
  return getEventType(event).includes("appointment");
}

function getProviderName(provider, event, index) {
  return (
    provider?.name ||
    provider?.providerName ||
    provider?.therapistName ||
    provider?.instructorName ||
    event?.provider ||
    event?.therapist ||
    event?.instructor ||
    `Provider ${index + 1}`
  );
}

function getProviderEntries(event) {
  const entries = [
    event.providers,
    event.therapists,
    event.providerSlots,
  ].find((items) => Array.isArray(items) && items.length);

  if (entries) return entries;

  return [{
    id: event.providerId || event.therapistId || event.instructorId || "",
    name: event.provider || event.therapist || event.instructor || "Provider",
    specialty: event.category || event.title || "",
    room: event.room || event.location || "",
    slots: event.slots || event.availableSlots || event.timeSlots || [],
  }];
}

function getProviderSlots(provider, event, providerIndex) {
  const providerId = slugifyIdentifier(
    provider.id || provider.uid || provider.email || provider.name || provider.providerName,
    `provider-${providerIndex + 1}`
  );
  const providerName = getProviderName(provider, event, providerIndex);
  const rawSlots = [
    provider.slots,
    provider.timeSlots,
    provider.availableSlots,
  ].find((items) => Array.isArray(items) && items.length) || [provider];

  return rawSlots
    .map((slot, slotIndex) => {
      const startTime = toTimeKey(slot.startTime || slot.start || slot.from || provider.startTime || event.startTime || event.date, "");
      if (!startTime) return null;
      const endTime = toTimeKey(slot.endTime || slot.end || slot.to || provider.endTime || event.endTime, addMinutes(startTime, 60));
      const baseSlotId = slugifyIdentifier(
        slot.id || `${providerId}-${startTime.replace(":", "")}-${slotIndex + 1}`,
        `slot-${slotIndex + 1}`
      );
      return {
        providerId,
        providerName,
        providerSpecialty: provider.specialty || provider.role || provider.title || event.category || "",
        providerAvatar: provider.avatarUrl || provider.photoUrl || provider.imageUrl || "",
        baseSlotId,
        startTime,
        endTime,
        room: slot.room || slot.location || provider.room || provider.location || event.room || event.location || "She-Na Center",
        capacity: Number(slot.capacity || slot.maxParticipants || provider.capacity || event.maxParticipants || 1) || 1,
      };
    })
    .filter(Boolean);
}

function weekdayIndexFromName(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const index = names.indexOf(normalized);
  return index >= 0 ? index : null;
}

function getEventWeeklyDayIndex(event) {
  if (Number.isInteger(event.weeklyDayIndex)) return event.weeklyDayIndex;
  if (Number.isInteger(event.dayIndex)) return event.dayIndex;
  return weekdayIndexFromName(event.weeklyDay);
}

function getNextWeeklyDates(dayIndex, timeSource) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const offset = (dayIndex - today.getDay() + 7) % 7;
  const first = new Date(today);
  first.setDate(today.getDate() + offset);

  return Array.from({ length: UPCOMING_OCCURRENCE_COUNT }, (_, index) => {
    const next = new Date(first);
    next.setDate(first.getDate() + index * 7);
    return copyTimeToDate(next, timeSource) || next;
  });
}

function getOccurrenceDates(event, slot) {
  const disabledDateKeys = new Set([
    event.disabledDates,
    event.disabledDateKeys,
    event.closedDates,
    event.blockedDates,
  ].find((items) => Array.isArray(items) && items.length) || []);
  const excludeDisabled = (dates) => dates.filter((date) => !disabledDateKeys.has(toDateKey(date)));
  const dayIndex = getEventWeeklyDayIndex(event);
  if (Number.isInteger(dayIndex) || event.isRecurringTemplate || event.recurrence === "weekly") {
    return excludeDisabled(getNextWeeklyDates(Number.isInteger(dayIndex) ? dayIndex : new Date().getDay(), slot.startTime));
  }

  const oneTimeDate = toDate(event.startTime || event.date || event.eventDate || event.startDate);
  return oneTimeDate ? excludeDisabled([copyTimeToDate(oneTimeDate, slot.startTime) || oneTimeDate]) : [];
}

function getAppointmentTypeKeys(event, provider) {
  const haystack = [
    event.appointmentType,
    event.appointmentTypeKey,
    event.typeKey,
    event.category,
    event.title,
    provider.specialty,
    provider.providerSpecialty,
  ].join(" ").toLowerCase();

  return APPOINTMENT_TYPE_OPTIONS
    .filter((option) => (
      haystack.includes(option.key.toLowerCase()) ||
      option.match.some((match) => haystack.includes(match.toLowerCase())) ||
      haystack.includes(option.label.toLowerCase())
    ))
    .map((option) => option.key);
}

function formatTimeRange(startTime, endTime) {
  return endTime && endTime !== startTime ? `${startTime} - ${endTime}` : startTime;
}

function buildSessionId(eventId, dateKey, providerId, baseSlotId) {
  return `${eventId}__${dateKey}__${providerId}__${baseSlotId}`;
}

function isBookingAppointment(row) {
  return isAppointmentEvent(row) || String(row.eventTitle || row.title || "").toLowerCase().includes("appointment");
}

function getSortTime(row) {
  return (
    toDate(row.registeredAt)?.getTime() ||
    toDate(row.createdAt)?.getTime() ||
    toDate(row.startAt || row.eventDate || row.selectedDate || row.date)?.getTime() ||
    0
  );
}

async function resolveParticipantNameForAppointment(user) {
  if (!user?.uid) return "Participant";
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, user.uid));
    if (snap.exists()) {
      const data = snap.data() || {};
      const name = data.fullName || data.name || [data.firstName, data.lastName].filter(Boolean).join(" ");
      if (String(name || "").trim()) return String(name).trim();
    }
  } catch (error) {
    console.warn("Could not read user profile for appointment name:", error);
  }
  return user.displayName || user.email?.split("@")[0] || "Participant";
}

export function appointmentProviderMatchesType(provider, selectedType) {
  if (!selectedType) return false;
  return provider.appointmentTypeKeys?.includes(selectedType);
}

export async function getAppointmentProviderOptions() {
  const snap = await getDocs(query(collection(db, EVENTS_COLLECTION), limit(100)));
  const events = snap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((event) => event.status === "published" && isAppointmentEvent(event));

  return events.flatMap((event) =>
    getProviderEntries(event).flatMap((provider, providerIndex) => {
      const providerName = getProviderName(provider, event, providerIndex);
      const slots = getProviderSlots(provider, event, providerIndex)
        .flatMap((slot) => getOccurrenceDates(event, slot)
          .map((occurrence) => {
            const dateKey = toDateKey(occurrence);
            const startAt = copyTimeToDate(occurrence, slot.startTime) || occurrence;
            const endAt = copyTimeToDate(occurrence, slot.endTime);
            const id = buildSessionId(event.id, dateKey, slot.providerId, slot.baseSlotId);
            return {
              id,
              slotId: id,
              eventId: event.id,
              eventTitle: event.title || "Appointment",
              eventType: "appointment",
              providerId: slot.providerId,
              providerName,
              providerSpecialty: slot.providerSpecialty,
              selectedDate: dateKey,
              dateKey,
              selectedTime: formatTimeRange(slot.startTime, slot.endTime),
              selectedTimeSlot: formatTimeRange(slot.startTime, slot.endTime),
              startAt,
              endAt,
              eventLocation: slot.room || event.location || "",
              room: slot.room || event.location || "",
              eventCoverUrl: event.imageUrl || event.thumbnailUrl || event.coverImageUrl || "",
              notes: "",
              capacity: slot.capacity,
            };
          }));

      return {
        id: `${event.id}__${slugifyIdentifier(provider.id || providerName, `provider-${providerIndex + 1}`)}`,
        name: providerName,
        displayName: event.title ? `${providerName} - ${event.title}` : providerName,
        specialty: provider.specialty || event.category || "",
        eventId: event.id,
        eventTitle: event.title || "Appointment",
        appointmentTypeKeys: getAppointmentTypeKeys(event, provider),
        slots,
      };
    })
  ).filter((provider) => provider.slots.length > 0);
}

export async function createAppointment(appointmentData = {}) {
  const user = auth.currentUser;
  if (!user?.uid) throw new Error("Not authenticated");
  if (!appointmentData.eventId || !appointmentData.slotId) {
    throw new Error("Missing appointment event slot");
  }

  const participantName = await resolveParticipantNameForAppointment(user);
  return addRegistration({
    eventId: appointmentData.eventId,
    slotId: appointmentData.slotId,
    // A 1:1 therapy slot holds exactly one participant; respect a higher
    // explicit capacity if a slot defines one (e.g. shared/group sessions).
    capacity: Number(appointmentData.capacity) || 1,
    uid: user.uid,
    participantName,
    participantEmail: user.email || "",
    participantPhone: user.phoneNumber || "",
    eventTitle: appointmentData.eventTitle || "Appointment",
    eventDate: appointmentData.startAt || null,
    dateKey: appointmentData.dateKey || appointmentData.selectedDate || "",
    startAt: appointmentData.startAt || null,
    endAt: appointmentData.endAt || null,
    eventLocation: appointmentData.eventLocation || appointmentData.room || "",
    eventCoverUrl: appointmentData.eventCoverUrl || "",
    eventTemplateId: appointmentData.eventId,
    parentEventId: appointmentData.eventId,
    eventType: "appointment",
    selectedDate: appointmentData.selectedDate || appointmentData.dateKey || "",
    selectedTime: appointmentData.selectedTime || appointmentData.selectedTimeSlot || "",
    selectedTimeSlot: appointmentData.selectedTimeSlot || appointmentData.selectedTime || "",
    providerId: appointmentData.providerId || "",
    providerName: appointmentData.providerName || "",
    room: appointmentData.room || appointmentData.eventLocation || "",
    sessionDateLabel: appointmentData.selectedDate || appointmentData.dateKey || "",
    sessionTime: appointmentData.selectedTime || appointmentData.selectedTimeSlot || "",
    status: appointmentData.status || "confirmed",
    notes: appointmentData.notes || "",
  });
}

export async function getParticipantAppointments(participantId) {
  if (!participantId) return [];

  const [bookingSnap, legacySnap] = await Promise.all([
    getDocs(query(collection(db, USERS_COLLECTION, participantId, "bookings"), limit(100))).catch(() => ({ docs: [] })),
    getDocs(query(collection(db, USERS_COLLECTION, participantId, "appointments"), limit(50))).catch(() => ({ docs: [] })),
  ]);

  const bookingRows = bookingSnap.docs
    .map((docSnap) => ({ id: docSnap.id, source: "booking", ...docSnap.data() }))
    .filter(isBookingAppointment);

  const bookingIds = new Set(bookingRows.flatMap((row) => [row.id, row.bookingId, row.appointmentId].filter(Boolean)));
  const legacyRows = legacySnap.docs
    .map((docSnap) => ({ id: docSnap.id, source: "legacyAppointment", ...docSnap.data() }))
    .filter((row) => !bookingIds.has(row.id) && !bookingIds.has(row.bookingId) && !bookingIds.has(row.appointmentId));

  return [...bookingRows, ...legacyRows].sort((a, b) => getSortTime(b) - getSortTime(a));
}

export async function cancelAppointment(appointmentId) {
  if (!appointmentId) throw new Error("Missing appointment id");

  const bookingRef = doc(db, BOOKINGS_COLLECTION, appointmentId);
  const bookingSnap = await getDoc(bookingRef);

  if (bookingSnap.exists()) {
    const booking = bookingSnap.data() || {};
    const bookingId = booking.bookingId || appointmentId;
    const uid = booking.userId || auth.currentUser?.uid;
    const cancellationPatch = { status: "cancelled", cancelledAt: serverTimestamp() };

    if (booking.eventId) {
      await removeRegistration(
        bookingId,
        booking.userName || booking.userEmail || "Participant",
        booking.eventId
      );
    }

    const batch = writeBatch(db);
    batch.set(bookingRef, cancellationPatch, { merge: true });
    if (uid) {
      batch.set(doc(db, USERS_COLLECTION, uid, "bookings", bookingId), cancellationPatch, { merge: true });
      batch.set(
        doc(db, USERS_COLLECTION, uid, "appointments", appointmentId),
        cancellationPatch,
        { merge: true }
      );
    }
    await batch.commit();
    return;
  }

  const flatRef = doc(db, LEGACY_APPOINTMENTS_COLLECTION, appointmentId);
  const existing = await getDoc(flatRef);
  const uid = existing.exists() ? (existing.data().userId || existing.data().participantId) : auth.currentUser?.uid;

  const batch = writeBatch(db);
  if (existing.exists()) {
    batch.set(flatRef, { status: "cancelled", cancelledAt: serverTimestamp() }, { merge: true });
  }
  if (uid) {
    batch.set(
      doc(db, USERS_COLLECTION, uid, "appointments", appointmentId),
      { status: "cancelled", cancelledAt: serverTimestamp() },
      { merge: true }
    );
  }
  await batch.commit();
}
