import { useEffect, useState } from 'react';
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import {
  CalendarDays,
  CalendarCheck,
  Clock3,
  UsersRound,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';
import { db } from '../../../firebase';
import { useAdmin } from '../context/AdminContext';
import { useAdminLocale } from '../context/AdminLocaleContext';
import { getAdminSummary } from '../services/statsService';

import { getAllEvents } from '../services/eventService';
import { getAllAppointments } from '../services/appointmentService';
import { getBookingsAndAppointmentsInsights, getRegistrationsPerWeek } from '../services/dashboardInsightsService';
import { getReportedPosts } from '../services/communityModerationService';
import { listJoinRequests, JOIN_REQUEST_STATUS } from '../services/joinRequestAdminService';
import {
  getTherapistMonthlyTreatments,
  getActivityRegistrationReport,
  buildTherapistChartRows,
  buildActivityChartRows,
} from '../services/reportsService';
import ReportBarList from '../components/ReportBarList';
import './DashboardPage.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY_FUNNEL = {
  workshop: { confirmed: 0, cancelled: 0 },
  appointment: { confirmed: 0, cancelled: 0 },
  cancellationRate: null,
  totalCount: 0,
};

const FALLBACK_ACTIVITY = [
  {
    id: 'activity-1',
    timestampLabel: '17:04:59, 26/05/2026',
    admin: 'talajabaren12@gmail.com',
    action: 'UPDATE',
    target: 'Public Home Partner',
    details: 'Updated content and settings',
  },
  {
    id: 'activity-2',
    timestampLabel: '16:52:03, 26/05/2026',
    admin: 'talajabaren12@gmail.com',
    action: 'UPDATE',
    target: 'Public Home Hero',
    details: 'Updated hero section',
  },
  {
    id: 'activity-3',
    timestampLabel: '15:29:45, 26/05/2026',
    admin: 'talajabaren12@gmail.com',
    action: 'UPDATE',
    target: 'Public Home Hero',
    details: 'Updated hero section',
  },
  {
    id: 'activity-4',
    timestampLabel: '15:24:54, 26/05/2026',
    admin: 'talajabaren12@gmail.com',
    action: 'CREATE',
    target: 'Public Home Partner',
    details: 'Created new partner',
  },
  {
    id: 'activity-5',
    timestampLabel: '13:42:52, 26/05/2026',
    admin: 'talajabaren12@gmail.com',
    action: 'REORDER',
    target: 'Team Members',
    details: 'Reordered team members',
  },
];

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

function formatActivityTime(value) {
  const date = toDate(value);
  if (!date) return '26/05/2026';
  return date.toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function titleFromAction(actionType = '') {
  if (actionType.includes('CREATE')) return 'CREATE';
  if (actionType.includes('DELETE') || actionType.includes('REMOVE')) return 'DELETE';
  if (actionType.includes('REORDER')) return 'REORDER';
  return 'UPDATE';
}

function humanizeTarget(log) {
  const raw = log.summary || log.targetId || '';
  if (!raw) return 'Dashboard';
  return String(raw)
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .slice(0, 34);
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

// Most recent report timestamp on a community post, falling back to the
// post's own timestamps when `reports` entries are missing one.
function mostRecentReportDate(post) {
  const reportDates = Array.isArray(post.reports)
    ? post.reports.map((report) => toDate(report.createdAt)).filter(Boolean)
    : [];
  if (reportDates.length) {
    return new Date(Math.max(...reportDates.map((date) => date.getTime())));
  }
  return toDate(post.updatedAt) || toDate(post.createdAt);
}

function formatRelativeAge(date) {
  if (!date) return '';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function daysSince(value) {
  const date = toDate(value);
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / DAY_MS));
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
  const [activity, setActivity] = useState([]);
  const [adminProfileName, setAdminProfileName] = useState('');

  // Today/this-week snapshot + funnel + moderation queue + growth data.
  // Loaded independently of the section above so a failure here never
  // breaks the existing metrics/bookings/activity sections.
  const [snapshot, setSnapshot] = useState({
    bookingsToday: 0,
    pendingJoinRequests: 0,
    reportedPosts: 0,
    upcomingAppointments48h: 0,
  });
  const [funnel, setFunnel] = useState(EMPTY_FUNNEL);
  const [reportedPosts, setReportedPosts] = useState([]);
  const [registrationsPerWeek, setRegistrationsPerWeek] = useState([]);
  const [overdueJoinRequests, setOverdueJoinRequests] = useState([]);

  // Report summary cards — same reportsService data/aggregation as the
  // Reports page, just the top 5 of each (all-time, no month filter here).
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

        const logsSnap = await getDocs(
          query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(5))
        );

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
          setActivity(
            logsSnap.docs.length
              ? logsSnap.docs.map((docSnap) => {
                  const log = { id: docSnap.id, ...docSnap.data() };
                  return {
                    id: log.id,
                    timestampLabel: formatActivityTime(log.timestamp),
                    admin: log.adminEmail || log.actorEmail || log.adminId || 'admin',
                    action: titleFromAction(log.actionType),
                    target: humanizeTarget(log),
                    details: log.summary || 'Updated dashboard data',
                  };
                })
              : FALLBACK_ACTIVITY
          );
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
          setActivity(FALLBACK_ACTIVITY);
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
        const [insights, weeklyRegistrations, reportedPostsList, joinRequests] = await Promise.all([
          getBookingsAndAppointmentsInsights(),
          getRegistrationsPerWeek(6),
          getReportedPosts(),
          listJoinRequests(),
        ]);

        if (ignore) return;

        const pendingJoinRequests = joinRequests.filter((request) => request.status === JOIN_REQUEST_STATUS.NEW);
        const overdue = pendingJoinRequests
          .filter((request) => daysSince(request.createdAt) >= 3)
          .sort((a, b) => daysSince(b.createdAt) - daysSince(a.createdAt));

        setSnapshot({
          bookingsToday: insights.bookingsToday,
          pendingJoinRequests: pendingJoinRequests.length,
          reportedPosts: reportedPostsList.length,
          upcomingAppointments48h: insights.upcomingAppointments48h,
        });
        setFunnel({
          workshop: insights.funnel.workshop,
          appointment: insights.funnel.appointment,
          cancellationRate: insights.cancellationRate,
          totalCount: insights.totalCount,
        });
        setReportedPosts(reportedPostsList);
        setRegistrationsPerWeek(weeklyRegistrations);
        setOverdueJoinRequests(overdue);
      } catch (error) {
        console.error('Failed to load dashboard insights:', error);
        // Safe empty states — never show fabricated numbers on failure.
        if (!ignore) {
          setSnapshot({ bookingsToday: 0, pendingJoinRequests: 0, reportedPosts: 0, upcomingAppointments48h: 0 });
          setFunnel(EMPTY_FUNNEL);
          setReportedPosts([]);
          setRegistrationsPerWeek([]);
          setOverdueJoinRequests([]);
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

  const maxWeekCount = Math.max(1, ...registrationsPerWeek.map((week) => week.count));

  const adminName =
    adminProfileName ||
    cleanNameCandidate(currentUser?.displayName) ||
    humanizeEmailLocal(currentUser?.email) ||
    'Admin';

  const typeLabel = (type) => (type === 'Appointment' ? t('typeAppointment') : t('typeWorkshop'));
  const statusLabel = (status) => {
    const normalized = String(status).toLowerCase();
    const key = normalized === 'cancelled' || normalized === 'canceled' ? 'statusCancelled' : 'statusConfirmed';
    return t(key);
  };
  const actionLabel = (action) => {
    const key = {
      CREATE: 'actionCreate',
      UPDATE: 'actionUpdate',
      DELETE: 'actionDelete',
      REORDER: 'actionReorder',
    }[action];
    return key ? t(key) : action;
  };

  return (
    <section className="admin-dashboard-page">
      <header className="admin-dashboard-hero">
        <div>
          <h1>{t('dashWelcome').replace('{name}', adminName)}</h1>
        </div>
      </header>

      {/* Today / This Week Snapshot — always renders all 4 cards; a 0 is a
          safe empty state, not a missing feature. */}
      <section className="admin-dashboard-snapshot" aria-label={t('dashSnapshotAria')}>
        <MetricCard
          accent="purple"
          icon={<CalendarCheck size={22} />}
          label={t('dashBookingsToday')}
          value={snapshot.bookingsToday}
          subtext={t('dashBookingsTodaySub')}
        />
        <MetricCard
          accent="pink"
          alert={snapshot.pendingJoinRequests > 0}
          icon={<UserPlus size={22} />}
          label={t('dashPendingJoinRequests')}
          value={snapshot.pendingJoinRequests}
          subtext={t('dashPendingJoinRequestsSub')}
        />
        <MetricCard
          accent="pink"
          alert={snapshot.reportedPosts > 0}
          icon={<ShieldAlert size={22} />}
          label={t('dashReportedPosts')}
          value={snapshot.reportedPosts}
          subtext={t('dashReportedPostsSub')}
        />
        <MetricCard
          accent="peach"
          icon={<Clock3 size={22} />}
          label={t('dashUpcomingAppts48h')}
          value={snapshot.upcomingAppointments48h}
          subtext={t('dashUpcomingAppts48hSub')}
        />
      </section>

      <section className="admin-dashboard-metrics" aria-label={t('dashMetricsAria')}>
        <MetricCard
          accent="purple"
          icon={<CalendarDays size={25} />}
          label={t('dashTotalEvents')}
          value={stats.events}
          subtext={t('dashActivePlatformEvents')}
        />
        <MetricCard
          accent="pink"
          icon={<UsersRound size={25} />}
          label={t('dashRegisteredUsers')}
          value={stats.users}
          subtext={t('dashCommunityMembers')}
        />
        <MetricCard
          accent="peach"
          icon={<CalendarCheck size={25} />}
          label={t('dashTotalBookings')}
          value={stats.bookings}
          subtext={t('dashBookingsSubtext')}
        />
      </section>

      <section className="admin-dashboard-insights-grid">
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

        {/* Community Moderation Queue — per spec, only rendered when there are
            reported posts to review; otherwise the section doesn't appear. */}
        {reportedPosts.length > 0 && (
          <article className="admin-dashboard-card admin-dashboard-moderation">
            <div className="admin-dashboard-card__header">
              <h2>{t('dashModerationTitle')}</h2>
              <a href="/admin/community">{t('dashModerationViewAll')}</a>
            </div>
            <div className="admin-dashboard-moderation__list">
              {reportedPosts.slice(0, 5).map((post) => {
                const reportsCount = post.reportsCount ?? post.reportedBy?.length ?? 0;
                const reportsLabel = (reportsCount === 1 ? t('dashModerationReportsCountOne') : t('dashModerationReportsCount')).replace(
                  '{n}',
                  reportsCount
                );
                return (
                  <div className="admin-dashboard-moderation__row" key={post.id}>
                    <p className="admin-dashboard-moderation__content">
                      <strong>{post.isAnonymous ? t('dashModerationAnonymous') : post.authorDisplayName || t('dashModerationAnonymous')}</strong>
                      {' — '}
                      {String(post.content || '').slice(0, 80)}
                    </p>
                    <span className="admin-dashboard-moderation__reports">{reportsLabel}</span>
                    <span className="admin-dashboard-moderation__age">{formatRelativeAge(mostRecentReportDate(post))}</span>
                  </div>
                );
              })}
            </div>
          </article>
        )}
      </section>

      {/* Report summaries — same data/aggregation as services/reportsService.js,
          top 5 of each. There is no separate Reports page; the detailed,
          row-level data behind these charts lives on the Bookings page. */}
      <section className="admin-dashboard-insights-grid">
        <article className="admin-dashboard-card admin-dashboard-reports-summary">
          <div className="admin-dashboard-card__header">
            <h2>{t('rptTherapistChartLabel')}</h2>
            <a href="/admin/appointments">{t('dashViewBookingDetails')}</a>
          </div>
          {reportsSummaryLoading ? (
            <p className="admin-dashboard-empty">{t('dashReportsLoading')}</p>
          ) : (
            <ReportBarList rows={therapistChartRows} emptyLabel={t('rptTherapistEmpty')} maxRows={5} />
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
            <ReportBarList rows={activityChartRows} emptyLabel={t('rptActivityEmpty')} maxRows={5} />
          )}
        </article>
      </section>

      <article className="admin-dashboard-card admin-dashboard-growth">
        <div className="admin-dashboard-card__header">
          <h2>{t('dashGrowthTitle')}</h2>
          <a href="/admin/users">{t('dashViewAllRequests')}</a>
        </div>
        <div className="admin-dashboard-growth__body">
          <div className="admin-dashboard-growth__chart">
            <span className="admin-dashboard-growth__chart-label">{t('dashGrowthChartLabel')}</span>
            {registrationsPerWeek.every((week) => week.count === 0) ? (
              <p className="admin-dashboard-empty">{t('dashGrowthEmpty')}</p>
            ) : (
              <div className="admin-dashboard-growth__bars">
                {registrationsPerWeek.map((week) => (
                  <div className="admin-dashboard-growth__bar-col" key={week.label}>
                    <div
                      className="admin-dashboard-growth__bar"
                      style={{ height: `${(week.count / maxWeekCount) * 100}%` }}
                    />
                    <span>{week.count}</span>
                    <small>{week.label}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="admin-dashboard-growth__overdue">
            <h3>{t('dashOverdueRequestsTitle')}</h3>
            {overdueJoinRequests.length === 0 ? (
              <p className="admin-dashboard-empty">{t('dashOverdueRequestsEmpty')}</p>
            ) : (
              <div className="admin-dashboard-overdue-list">
                {overdueJoinRequests.slice(0, 5).map((request) => (
                  <div className="admin-dashboard-overdue-row" key={request.id}>
                    <span>{request.fullName || request.email || t('umUnnamedUser')}</span>
                    <span className="admin-dashboard-overdue-days">
                      {t('dashDaysPending').replace('{n}', daysSince(request.createdAt))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>

      <section className="admin-dashboard-main-grid">
        <article className="admin-dashboard-card admin-dashboard-bookings">
          <div className="admin-dashboard-card__header">
            <h2>{t('dashRecentBookings')}</h2>
            <a href="/admin/appointments">{t('dashViewAllBookings')}</a>
          </div>
          <div className="admin-dashboard-booking-list">
            {bookings.map((booking) => (
              <div className="admin-dashboard-booking" key={booking.id}>
                <div className="admin-dashboard-booking__avatar">
                  {booking.participant.slice(0, 1).toUpperCase()}
                </div>
                <div className="admin-dashboard-booking__main">
                  <strong>{booking.title}</strong>
                  <span>{booking.participant}</span>
                </div>
                <span className={`admin-dashboard-type admin-dashboard-type--${booking.type.toLowerCase()}`}>
                  {typeLabel(booking.type)}
                </span>
                <div className="admin-dashboard-booking__date">
                  <CalendarDays size={17} />
                  <span>{booking.date}</span>
                  <Clock3 size={14} />
                  <small>{booking.time}</small>
                </div>
                <span className={`admin-dashboard-status admin-dashboard-status--${String(booking.status).toLowerCase()}`}>
                  {statusLabel(booking.status)}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="admin-dashboard-card admin-dashboard-activity">
        <div className="admin-dashboard-card__header">
          <h2>{t('dashRecentActivity')}</h2>
          <a href="/admin/audit-log">{t('dashViewAllActivity')}</a>
        </div>
        <div className="admin-dashboard-activity__table">
          <div className="admin-dashboard-activity__head">
            <span>{t('colTime')}</span>
            <span>{t('colAdmin')}</span>
            <span>{t('colAction')}</span>
            <span>{t('colTarget')}</span>
            <span>{t('colDetails')}</span>
          </div>
          {activity.map((item) => (
            <div className="admin-dashboard-activity__row" key={item.id}>
              <span>{item.timestampLabel}</span>
              <span className="admin-dashboard-admin-cell">
                <i>{item.admin.slice(0, 2).toUpperCase()}</i>
                {item.admin}
              </span>
              <span>
                <b className={`admin-dashboard-action admin-dashboard-action--${item.action.toLowerCase()}`}>
                  {actionLabel(item.action)}
                </b>
              </span>
              <span>{item.target}</span>
              <span>{item.details}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
