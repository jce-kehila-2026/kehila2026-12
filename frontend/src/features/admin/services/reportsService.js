// Data for the admin Reports page:
//   - Therapist Monthly Treatments: who handled how many sessions, per month.
//   - Activity Registration: how many women registered per workshop/event.
// Both reports read real Firestore data only — no synthetic/sample rows.
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../../firebase';
import { getAllEvents } from './eventService';
import { getRegistrationCounts } from './registrationService';

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isCancelled(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized === 'cancelled' || normalized === 'canceled';
}

function monthKeyOf(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Session date for a booking/appointment — when it actually happened, not
// when it was booked. Falls back through older field names for legacy data.
function sessionDate(record) {
  return (
    toDate(record.startAt) ||
    toDate(record.eventDate) ||
    toDate(record.selectedDate) ||
    toDate(record.dateKey) ||
    toDate(record.date) ||
    toDate(record.createdAt) ||
    null
  );
}

/**
 * One row per (therapist, month): how many sessions they handled, and how
 * many were cancelled. Reads `bookings` (current) + legacy `appointments`.
 * Records with no provider name are skipped — they're plain workshop
 * bookings with no individual therapist attached, not relevant here.
 */
export async function getTherapistMonthlyTreatments() {
  const [bookingsSnap, legacySnap] = await Promise.all([
    getDocs(query(collection(db, 'bookings'), limit(1000))),
    getDocs(query(collection(db, 'appointments'), limit(500))),
  ]);

  const records = [
    ...bookingsSnap.docs.map((doc) => doc.data()),
    ...legacySnap.docs.map((doc) => doc.data()),
  ];

  const buckets = new Map();

  records.forEach((record) => {
    const therapist = String(record.providerName || record.provider || '').trim();
    if (!therapist) return;

    const date = sessionDate(record);
    if (!date) return;

    const monthKey = monthKeyOf(date);
    const key = `${therapist}__${monthKey}`;
    const bucket = buckets.get(key) || { id: key, therapist, monthKey, treatments: 0, cancelled: 0 };
    if (isCancelled(record.status)) {
      bucket.cancelled += 1;
    } else {
      bucket.treatments += 1;
    }
    buckets.set(key, bucket);
  });

  return Array.from(buckets.values()).sort((a, b) => {
    if (a.monthKey !== b.monthKey) return b.monthKey.localeCompare(a.monthKey);
    return a.therapist.localeCompare(b.therapist);
  });
}

function inferActivityType(event) {
  const raw = `${event.type || ''} ${event.category || ''}`.toLowerCase();
  if (raw.includes('appointment') || raw.includes('therapy') || raw.includes('session')) {
    return 'appointment';
  }
  return 'workshop';
}

/**
 * One row per published event: how many women registered, capacity, and
 * occupancy %. Registration counts come from getRegistrationCounts() — the
 * event's own `registeredCount` field is not updated client-side (see
 * registrationService.js), so it can't be trusted for a report.
 */
export async function getActivityRegistrationReport() {
  const allEvents = await getAllEvents();
  const published = allEvents.filter(
    (event) => String(event.status || 'published').toLowerCase() === 'published'
  );

  const counts = await getRegistrationCounts(published.map((event) => event.id));

  return published
    .map((event) => {
      const date = toDate(event.startTime) || toDate(event.date);
      const capacity = Number(event.maxParticipants || event.capacity) || 0;
      const registered = counts[event.id] || 0;
      return {
        id: event.id,
        activity: event.title || '',
        type: inferActivityType(event),
        date,
        monthKey: date ? monthKeyOf(date) : null,
        registered,
        capacity,
        occupancyPct: capacity > 0 ? Math.round((registered / capacity) * 100) : null,
      };
    })
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
}

/**
 * Shared chart-row shaping, used by both the Reports page and the Dashboard
 * homepage summary cards, so the two never compute totals differently.
 * Sums treatments per therapist across whatever rows are passed in (already
 * month-filtered by the caller, or not, if an all-time summary is wanted).
 */
export function buildTherapistChartRows(therapistRows) {
  const totals = new Map();
  therapistRows.forEach((row) => {
    totals.set(row.therapist, (totals.get(row.therapist) || 0) + row.treatments);
  });
  return Array.from(totals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * One chart row per activity row passed in (already one-per-event), sorted
 * by registered count. `untitledLabel` lets each caller supply its own
 * translated fallback for an event with no title.
 */
export function buildActivityChartRows(activityRows, untitledLabel = 'Untitled event') {
  return activityRows
    .map((row) => ({ label: row.activity || untitledLabel, value: row.registered }))
    .sort((a, b) => b.value - a.value);
}
