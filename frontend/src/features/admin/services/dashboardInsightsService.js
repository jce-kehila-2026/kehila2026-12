// Dashboard-only aggregations that don't belong to one existing service:
//   - bookings/appointments funnel + "today" / "next 48h" snapshot counts
//   - registrations-per-week growth trend
// Reported posts and join requests are read via their existing services
// (communityModerationService, joinRequestAdminService) and just filtered
// here — no need to duplicate those queries.
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase';

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function bookingDate(record) {
  return (
    toDate(record.startAt) ||
    toDate(record.eventDate) ||
    toDate(record.selectedDate) ||
    toDate(record.dateKey) ||
    toDate(record.date) ||
    null
  );
}

function statusBucket(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized === 'cancelled' || normalized === 'canceled' ? 'cancelled' : 'confirmed';
}

function typeBucket(record) {
  const raw = String(record.eventType || record.type || record.category || '').toLowerCase();
  return raw.includes('appointment') ? 'appointment' : 'workshop';
}

/**
 * One read of `bookings` + legacy `appointments`, used to derive both the
 * "Today / next 48h" snapshot counts and the bookings/appointments funnel.
 */
export async function getBookingsAndAppointmentsInsights() {
  const [bookingsSnap, legacyAppointmentsSnap] = await Promise.all([
    getDocs(query(collection(db, 'bookings'), limit(1000))),
    getDocs(query(collection(db, 'appointments'), limit(500))),
  ]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + DAY_MS);
  const in48h = new Date(now.getTime() + 2 * DAY_MS);

  const funnel = {
    workshop: { confirmed: 0, cancelled: 0 },
    appointment: { confirmed: 0, cancelled: 0 },
  };
  let bookingsToday = 0;
  let upcomingAppointments48h = 0;
  let totalCount = 0;
  let cancelledCount = 0;

  const records = [
    ...bookingsSnap.docs.map((d) => ({ ...d.data(), _type: typeBucket(d.data()) })),
    // Legacy appointments predate the eventType field — they're always appointments.
    ...legacyAppointmentsSnap.docs.map((d) => ({ ...d.data(), _type: 'appointment' })),
  ];

  records.forEach((record) => {
    const bucket = statusBucket(record.status);
    funnel[record._type][bucket] += 1;
    totalCount += 1;
    if (bucket === 'cancelled') cancelledCount += 1;

    const date = bookingDate(record);
    if (!date || bucket === 'cancelled') return;

    if (date >= todayStart && date < todayEnd) bookingsToday += 1;
    if (record._type === 'appointment' && date >= now && date <= in48h) {
      upcomingAppointments48h += 1;
    }
  });

  return {
    bookingsToday,
    upcomingAppointments48h,
    funnel,
    cancellationRate: totalCount > 0 ? cancelledCount / totalCount : null,
    totalCount,
  };
}

/**
 * Participant registrations bucketed into `weeksBack` trailing 7-day windows,
 * oldest first. Docs without a `createdAt` (pre-migration users) are skipped
 * rather than guessed at.
 */
export async function getRegistrationsPerWeek(weeksBack = 6) {
  const snap = await getDocs(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(300))
  );

  const now = new Date();
  const weekMs = 7 * DAY_MS;
  const earliestStart = new Date(now.getTime() - weeksBack * weekMs);

  const buckets = Array.from({ length: weeksBack }, (_, index) => ({
    weekStart: new Date(now.getTime() - (weeksBack - index) * weekMs),
    count: 0,
  }));

  snap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.role && data.role !== 'participant') return;

    const createdAt = toDate(data.createdAt);
    if (!createdAt || createdAt < earliestStart) return;

    for (let index = buckets.length - 1; index >= 0; index -= 1) {
      if (createdAt >= buckets[index].weekStart) {
        buckets[index].count += 1;
        break;
      }
    }
  });

  return buckets.map(({ weekStart, count }) => ({
    weekStart,
    label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count,
  }));
}
