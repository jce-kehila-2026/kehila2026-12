import therapistPhoto from '../../../assets/images/hero-women-support.png';

/** @typedef {import('./participantDashboardModel').DashboardAppointmentRaw} DashboardAppointmentRaw */
/** @typedef {import('./participantDashboardModel').DashboardEventRaw} DashboardEventRaw */

/**
 * Fixed mock datetimes — only the target instant is stored (never remaining duration).
 * Countdown UI derives remaining time from these on every tick via `targetDate - new Date()`.
 * TODO(Firestore): replace with real appointment/event `startsAt` from the database.
 */
export const MOCK_APPOINTMENT_STARTS_AT = '2026-06-10T14:45:00';
export const MOCK_EVENT_STARTS_AT = '2026-06-12T18:00:00';

/** * Temporary mock appointment builder — used by seeds/dev tooling only.
 * Dashboard home reads real Firestore data via participantDashboardService.
 * @returns {DashboardAppointmentRaw}
 */
export function buildMockUpcomingAppointmentRaw() {
  return {
    id: 'mock-appointment-1',
    title: 'Reflexology Session',
    therapistName: 'Dr. Maya Cohen',
    therapistRole: 'Oncology Reflexologist',
    initials: 'MC',
    photo: therapistPhoto,
    location: 'She-Na Wellness Center, Room 3',
    startsAt: MOCK_APPOINTMENT_STARTS_AT,
  };
}

/**
 * Temporary mock event builder — used by seeds/dev tooling only.
 * Dashboard home reads real Firestore data via participantDashboardService.
 * @returns {DashboardEventRaw}
 */
export function buildMockUpcomingEventRaw() {
  return {
    id: 'mock-event-1',
    title: "Women's Circle",
    category: 'Support Group',
    location: 'Community Hall, Tel Aviv',
    startsAt: MOCK_EVENT_STARTS_AT,
  };
}
