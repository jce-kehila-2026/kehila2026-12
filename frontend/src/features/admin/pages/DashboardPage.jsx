import { useEffect, useState } from 'react';
import { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import {
  CalendarDays,
  CalendarCheck,
  Clock3,
  UsersRound,
} from 'lucide-react';
import { db } from '../../../firebase';
import { useAdmin } from '../context/AdminContext';
import { useAdminLocale } from '../context/AdminLocaleContext';
import { getAdminSummary } from '../services/statsService';

import { getAllEvents } from '../services/eventService';
import { getAllAppointments } from '../services/appointmentService';
import './DashboardPage.css';

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

function MetricCard({ accent, icon, label, value, subtext }) {
  return (
    <article className={`admin-dashboard-metric admin-dashboard-metric--${accent}`}>
      <div className="admin-dashboard-metric__icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value.toLocaleString()}</strong>
        <p>{subtext}</p>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const { currentUser } = useAdmin();
  const { t } = useAdminLocale();
  const [stats, setStats] = useState({ events: 0, users: 0, bookings: 0 });
  const [bookings, setBookings] = useState([]);
  const [activity, setActivity] = useState([]);
  const [adminProfileName, setAdminProfileName] = useState('');

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
            status: item.status || 'pending',
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

  const adminName =
    adminProfileName ||
    cleanNameCandidate(currentUser?.displayName) ||
    humanizeEmailLocal(currentUser?.email) ||
    'Admin';

  const typeLabel = (type) => (type === 'Appointment' ? t('typeAppointment') : t('typeWorkshop'));
  const statusLabel = (status) => {
    const key = {
      confirmed: 'statusConfirmed',
      pending: 'statusPending',
      cancelled: 'statusCancelled',
      canceled: 'statusCancelled',
      completed: 'statusCompleted',
    }[String(status).toLowerCase()];
    return key ? t(key) : status;
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
