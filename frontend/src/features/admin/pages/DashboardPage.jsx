import { useEffect, useState } from 'react';
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import {
  CalendarDays,
  CalendarCheck,
  UsersRound,
  UserPlus,
} from 'lucide-react';
import { db } from '../../../firebase';
import { useAdmin } from '../context/AdminContext';
import { useAdminLocale } from '../context/AdminLocaleContext';
import { getAdminSummary } from '../services/statsService';

import { getAllEvents } from '../services/eventService';
import { getAllAppointments } from '../services/appointmentService';
import { getBookingsAndAppointmentsInsights } from '../services/dashboardInsightsService';
import { listJoinRequests, JOIN_REQUEST_STATUS } from '../services/joinRequestAdminService';
import {
  getTherapistMonthlyTreatments,
  getActivityRegistrationReport,
  buildTherapistChartRows,
  buildActivityChartRows,
} from '../services/reportsService';
import ReportBarList from '../components/ReportBarList';
import AdminPageHeader from '../components/AdminPageHeader';
import './DashboardPage.css';

const EMPTY_FUNNEL = {
  workshop: { confirmed: 0, cancelled: 0 },
  appointment: { confirmed: 0, cancelled: 0 },
  cancellationRate: null,
  totalCount: 0,
};

function toDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'May 26, 2026';
}

function formatTime(value, fallback = '') {
  const date = toDate(value);
  if (date) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return fallback || '10:00 AM';
}

function cleanNameCandidate(value) {
  const text = String(value || '').trim();
  if (!text || text.includes('@')) return '';
  return text;
}

function humanizeEmailLocal(email) {
  const local = String(email || '').split('@')[0].trim();
  if (!local) return '';

  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\d+$/g, '')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProfileDisplayName(profile) {
  return (
    cleanNameCandidate(profile?.fullName) ||
    cleanNameCandidate(profile?.displayName) ||
    cleanNameCandidate(profile?.name) ||
    cleanNameCandidate(profile?.userName) ||
    cleanNameCandidate(profile?.username)
  );
}

function getEventType(event) {
  return String(event.eventType || event.type || event.category || '').toLowerCase();
}

function MetricCard({ accent, icon, label, value, subtext, alert = false }) {
  return (
    <article
      className={`admin-dashboard-metric admin-dashboard-metric--${accent}${alert ? ' admin-dashboard-metric--alert' : ''}`}
    >
      <div className="admin-dashboard-metric__icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value.toLocaleString()}</strong>
        <p>{subtext}</p>
      </div>
    </article>
  );
}

// One row of the bookings/appointments funnel: a proportional stacked bar
// (confirmed/cancelled) plus a numeric legend underneath.
function FunnelRow({ label, stats, t }) {
  const total = stats.confirmed + stats.cancelled;
  return (
    <div className="admin-dashboard-funnel__row">
      <div className="admin-dashboard-funnel__row-head">
        <span>{label}</span>
        <strong>{total}</strong>
      </div>
      <div className="admin-dashboard-funnel__bar">
        {total > 0 && (
          <>
            <span
              className="admin-dashboard-funnel__segment admin-dashboard-funnel__segment--confirmed"
              style={{ width: `${(stats.confirmed / total) * 100}%` }}
            />
            <span
              className="admin-dashboard-funnel__segment admin-dashboard-funnel__segment--cancelled"
              style={{ width: `${(stats.cancelled / total) * 100}%` }}
            />
          </>
        )}
      </div>
      <div className="admin-dashboard-funnel__legend">
        <span>
          <i className="admin-dashboard-funnel__dot admin-dashboard-funnel__dot--confirmed" />
          {t('statusConfirmed')} {stats.confirmed}
        </span>
        <span>
          <i className="admin-dashboard-funnel__dot admin-dashboard-funnel__dot--cancelled" />
          {t('statusCancelled')} {stats.cancelled}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useAdmin();
  const { t } = useAdminLocale();
  const [stats, setStats] = useState({ events: 0, users: 0, bookings: 0 });
  const [bookings, setBookings] = useState([]);
  const [adminProfileName, setAdminProfileName] = useState('');

  // Loaded independently of the section above so a failure here never
  // breaks the existing metrics/bookings sections.
  const [snapshot, setSnapshot] = useState({
    bookingsToday: 0,
    pendingJoinRequests: 0,
  });
  const [funnel, setFunnel] = useState(EMPTY_FUNNEL);

  // Report summary cards reuse the same reportsService aggregation, limited
  // to the top 5 of each list for the dashboard overview.
  const [therapistChartRows, setTherapistChartRows] = useState([]);
  const [activityChartRows, setActivityChartRows] = useState([]);
  const [reportsSummaryLoading, setReportsSummaryLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        let profileName = '';
        if (currentUser?.uid) {
          const profileRefs = [
            doc(db, 'users', currentUser.uid),
            doc(db, 'admins', currentUser.uid),
          ];
          if (currentUser.email) {
            profileRefs.push(doc(db, 'admins', currentUser.email));
            profileRefs.push(doc(db, 'admins', currentUser.email.toLowerCase()));
          }

          const profileResults = await Promise.allSettled(profileRefs.map((profileRef) => getDoc(profileRef)));
          profileName = profileResults.reduce((resolvedName, result) => {
            if (resolvedName || result.status !== 'fulfilled' || !result.value.exists()) return resolvedName;
            return getProfileDisplayName(result.value.data());
          }, '');
        }

        const [summary, allEvents, legacyAppointments] = await Promise.all([
          getAdminSummary(),
          getAllEvents(),
          getAllAppointments(),
        ]);

        let centralBookings = [];
        let centralBookingsCount = 0;
        try {
          const countSnap = await getCountFromServer(collection(db, 'bookings'));
          centralBookingsCount = countSnap.data().count || 0;
          const bookingsSnap = await getDocs(
            query(collection(db, 'bookings'), orderBy('registeredAt', 'desc'), limit(50))
          );
          centralBookings = bookingsSnap.docs
            .slice(0, 8)
            .map((docSnap) => ({
              id: docSnap.id,
              source: 'booking',
              ...docSnap.data(),
            }));
        } catch (error) {
          console.warn('Recent bookings are unavailable for dashboard:', error);
        }

        const bookingRows = [
          ...centralBookings.map((item) => ({
            id: `booking-${item.bookingId || item.id}`,
            title: item.eventTitle || item.title || 'Workshop Booking',
            participant: item.userName || item.participantName || item.userEmail || item.participantEmail || 'Community member',
            type: getEventType(item).includes('appointment') ? 'Appointment' : 'Workshop',
            date: formatDate(item.startAt || item.eventDate || item.selectedDate || item.dateKey || item.registeredAt),
            time: item.selectedTime || item.selectedTimeSlot || item.sessionTime || formatTime(item.startAt || item.registeredAt),
            status: item.status || 'confirmed',
            sortDate: toDate(item.registeredAt) || new Date(0),
          })),
          ...legacyAppointments.map((item) => ({
            id: `appointment-${item.id}`,
            title: item.typeName || item.appointmentType || item.title || 'Appointment',
            participant: item.participantName || item.participantEmail || 'Community member',
            type: 'Appointment',
            date: formatDate(item.date || item.createdAt),
            time: item.time || item.selectedTimeSlot || formatTime(item.date || item.createdAt),
            status: item.status || 'confirmed',
            sortDate: toDate(item.createdAt || item.date) || new Date(0),
          })),
        ]
          .sort((a, b) => b.sortDate - a.sortDate)
          .slice(0, 4);

        if (!ignore) {
          setAdminProfileName(profileName);
          setBookings(bookingRows);
          setStats({
            events: summary.publishedEvents ?? allEvents.length,
            users: summary.totalUsers ?? 0,
            bookings:
              summary.totalBookings ??
              summary.bookingsCount ??
              centralBookingsCount,
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        if (!ignore) {
          setAdminProfileName('');
          setBookings([]);
        }
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [currentUser?.email, currentUser?.uid]);

  useEffect(() => {
    let ignore = false;

    async function loadInsights() {
      try {
        const [insights, joinRequests] = await Promise.all([
          getBookingsAndAppointmentsInsights(),
          listJoinRequests(),
        ]);

        if (ignore) return;

        const pendingJoinRequests = joinRequests.filter((request) => request.status === JOIN_REQUEST_STATUS.NEW);

        setSnapshot({
          bookingsToday: insights.bookingsToday,
          pendingJoinRequests: pendingJoinRequests.length,
        });
        setFunnel({
          workshop: insights.funnel.workshop,
          appointment: insights.funnel.appointment,
          cancellationRate: insights.cancellationRate,
          totalCount: insights.totalCount,
        });
      } catch (error) {
        console.error('Failed to load dashboard insights:', error);
        // Safe empty states — never show fabricated numbers on failure.
        if (!ignore) {
          setSnapshot({ bookingsToday: 0, pendingJoinRequests: 0 });
          setFunnel(EMPTY_FUNNEL);
        }
      }
    }

    loadInsights();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadReportSummaries() {
      try {
        const [therapistRows, activityRows] = await Promise.all([
          getTherapistMonthlyTreatments(),
          getActivityRegistrationReport(),
        ]);
        if (ignore) return;
        setTherapistChartRows(buildTherapistChartRows(therapistRows));
        setActivityChartRows(buildActivityChartRows(activityRows, t('evUntitledEvent')));
      } catch (error) {
        console.error('Failed to load report summaries:', error);
        if (!ignore) {
          setTherapistChartRows([]);
          setActivityChartRows([]);
        }
      } finally {
        if (!ignore) setReportsSummaryLoading(false);
      }
    }

    loadReportSummaries();
    return () => {
      ignore = true;
    };
  }, [t]);

  const adminName =
    adminProfileName ||
    cleanNameCandidate(currentUser?.displayName) ||
    humanizeEmailLocal(currentUser?.email) ||
    'Admin';

  const statusLabel = (status) => {
    const normalized = String(status).toLowerCase();
    const key = normalized === 'cancelled' || normalized === 'canceled' ? 'statusCancelled' : 'statusConfirmed';
    return t(key);
  };
  return (
    <section className="admin-dashboard-page">
      <AdminPageHeader title={t('dashWelcome').replace('{name}', adminName)} />

      {/* Today / This Week Snapshot — always renders all 4 cards; a 0 is a
          safe empty state, not a missing feature. */}
      <section className="admin-dashboard-snapshot" aria-label={t('dashMetricsAria')}>
        <MetricCard
          accent="pink"
          icon={<UsersRound size={22} />}
          label={t('dashRegisteredUsers')}
          value={stats.users}
          subtext={t('dashCommunityMembers')}
        />
        <MetricCard
          accent="purple"
          icon={<CalendarDays size={22} />}
          label={t('dashTotalEvents')}
          value={stats.events}
          subtext={t('dashActivePlatformEvents')}
        />
        <MetricCard
          accent="lavender"
          icon={<CalendarCheck size={22} />}
          label={t('dashBookingsToday')}
          value={snapshot.bookingsToday}
          subtext={t('dashBookingsTodaySub')}
        />
        <MetricCard
          accent="peach"
          alert={snapshot.pendingJoinRequests > 0}
          icon={<UserPlus size={22} />}
          label={t('dashPendingJoinRequests')}
          value={snapshot.pendingJoinRequests}
          subtext={t('dashPendingJoinRequestsSub')}
        />
      </section>

      <section className="admin-dashboard-overview-grid">
        <article className="admin-dashboard-card admin-dashboard-funnel">
          <div className="admin-dashboard-card__header">
            <h2>{t('dashFunnelTitle')}</h2>
          </div>
          {funnel.totalCount === 0 ? (
            <p className="admin-dashboard-empty">{t('dashFunnelEmpty')}</p>
          ) : (
            <div className="admin-dashboard-funnel__body">
              <FunnelRow label={t('dashFunnelWorkshops')} stats={funnel.workshop} t={t} />
              <FunnelRow label={t('dashFunnelAppointments')} stats={funnel.appointment} t={t} />
              {funnel.cancellationRate !== null && (
                <div className="admin-dashboard-funnel__rate">
                  <span>{t('dashFunnelCancellationRate')}</span>
                  <strong>{Math.round(funnel.cancellationRate * 100)}%</strong>
                </div>
              )}
            </div>
          )}
        </article>

        <article className="admin-dashboard-card admin-dashboard-reports-summary">
          <div className="admin-dashboard-card__header">
            <h2>{t('rptTherapistChartLabel')}</h2>
            <a href="/admin/appointments">{t('dashViewBookingDetails')}</a>
          </div>
          {reportsSummaryLoading ? (
            <p className="admin-dashboard-empty">{t('dashReportsLoading')}</p>
          ) : (
            <ReportBarList rows={therapistChartRows} emptyLabel={t('rptTherapistEmpty')} maxRows={5} tone="purple" />
          )}
        </article>

        <article className="admin-dashboard-card admin-dashboard-reports-summary">
          <div className="admin-dashboard-card__header">
            <h2>{t('rptActivityChartLabel')}</h2>
            <a href="/admin/appointments">{t('dashViewBookingDetails')}</a>
          </div>
          {reportsSummaryLoading ? (
            <p className="admin-dashboard-empty">{t('dashReportsLoading')}</p>
          ) : (
            <ReportBarList rows={activityChartRows} emptyLabel={t('rptActivityEmpty')} maxRows={5} tone="pink" />
          )}
        </article>
        <article className="admin-dashboard-card admin-dashboard-bookings">
          <div className="admin-dashboard-card__header">
            <h2>{t('dashRecentBookings')}</h2>
            <a href="/admin/appointments">{t('dashViewAllBookings')}</a>
          </div>
          <div className="admin-dashboard-booking-table">
            <div className="admin-dashboard-booking admin-dashboard-booking--head">
              <span>{t('apColParticipant')}</span>
              <span>{t('apColEventName')}</span>
              <span>{t('apColStatus')}</span>
            </div>
            {bookings.map((booking) => (
              <div className="admin-dashboard-booking" key={booking.id}>
                <div className="admin-dashboard-booking__participant">
                  <span className="admin-dashboard-booking__avatar">
                    {booking.participant.slice(0, 1).toUpperCase()}
                  </span>
                  <span>{booking.participant}</span>
                </div>
                <div className="admin-dashboard-booking__event">
                  <strong>{booking.title}</strong>
                </div>
                <span className={`admin-dashboard-status admin-dashboard-status--${String(booking.status).toLowerCase()}`}>
                  {statusLabel(booking.status)}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

    </section>
  );
}
