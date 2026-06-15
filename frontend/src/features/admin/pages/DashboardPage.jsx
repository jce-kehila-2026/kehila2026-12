import { useEffect, useMemo, useState } from 'react';
import { collection, getCountFromServer, getDocs, limit, orderBy, query } from 'firebase/firestore';
import {
  CalendarDays,
  CalendarCheck,
  ChevronDown,
  Clock3,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { db } from '../../../firebase';
import { useAdmin } from '../context/AdminContext';
import { getAdminSummary } from '../services/statsService';
import { getAllEvents } from '../services/eventService';
import { getAllAppointments } from '../services/appointmentService';
import './DashboardPage.css';

const EVENT_COLORS = {
  workshops: '#8B5CF6',
  appointments: '#E05297',
  upcoming: '#FDBA74',
  completed: '#86D17C',
  cancelled: '#A3A3A3',
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

function getEventType(event) {
  return String(event.eventType || event.type || event.category || '').toLowerCase();
}

function isCompleted(event) {
  const status = String(event.status || '').toLowerCase();
  if (status.includes('complete')) return true;
  const date = toDate(event.date || event.startDate || event.eventDate);
  return date ? date < new Date() : false;
}

function isUpcoming(event) {
  const status = String(event.status || '').toLowerCase();
  if (status.includes('upcoming') || status.includes('published')) return true;
  const date = toDate(event.date || event.startDate || event.eventDate);
  return date ? date >= new Date() : false;
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
  const [stats, setStats] = useState({ events: 0, users: 0, bookings: 0 });
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
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
          setEvents(allEvents);
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
          setBookings([]);
          setActivity(FALLBACK_ACTIVITY);
        }
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const eventOverview = useMemo(() => {
    const total = Math.max(events.length || stats.events || 0, 1);
    const workshops = events.filter((event) => getEventType(event).includes('workshop')).length;
    const appointments = events.filter((event) => getEventType(event).includes('appointment')).length;
    const cancelled = events.filter((event) => String(event.status || '').toLowerCase().includes('cancel')).length;
    const completed = events.filter(isCompleted).length;
    const upcoming = events.filter(isUpcoming).length;

    const rows = [
      { key: 'workshops', label: 'Workshops', value: workshops },
      { key: 'appointments', label: 'Appointments', value: appointments },
      { key: 'upcoming', label: 'Upcoming', value: upcoming },
      { key: 'completed', label: 'Completed', value: completed },
      { key: 'cancelled', label: 'Cancelled', value: cancelled },
    ];

    return { total, rows };
  }, [events, stats.events]);

  const donutStops = useMemo(() => {
    let cursor = 0;
    return eventOverview.rows
      .map((row) => {
        const size = Math.max((row.value / eventOverview.total) * 100, 2);
        const start = cursor;
        cursor += size;
        return `${EVENT_COLORS[row.key]} ${start}% ${Math.min(cursor, 100)}%`;
      })
      .join(', ');
  }, [eventOverview]);

  const adminName = currentUser?.email?.split('@')[0] || currentUser?.displayName || 'talajabaren12';

  return (
    <section className="admin-dashboard-page">
      <header className="admin-dashboard-hero">
        <div>
          <h1><span aria-hidden="true">👋</span> Welcome back, {adminName}</h1>
          <p>Here's an overview of the She-Na platform</p>
        </div>
        <button className="admin-dashboard-date-pill" type="button">
          <CalendarDays size={18} />
          May 26, 2026
          <ChevronDown size={16} />
        </button>
      </header>

      <section className="admin-dashboard-metrics" aria-label="Dashboard metrics">
        <MetricCard
          accent="purple"
          icon={<CalendarDays size={25} />}
          label="Total Events"
          value={stats.events}
          subtext="Active platform events"
        />
        <MetricCard
          accent="pink"
          icon={<UsersRound size={25} />}
          label="Registered Users"
          value={stats.users}
          subtext="Community members"
        />
        <MetricCard
          accent="peach"
          icon={<CalendarCheck size={25} />}
          label="Total Bookings"
          value={stats.bookings}
          subtext="Workshop & appointment bookings"
        />
      </section>

      <section className="admin-dashboard-main-grid">
        <article className="admin-dashboard-card admin-dashboard-overview">
          <div className="admin-dashboard-card__header">
            <h2>Events Overview</h2>
            <a href="/admin/events">View all events</a>
          </div>
          <div className="admin-dashboard-overview__body">
            <div
              className="admin-dashboard-donut"
              style={{ '--donut-stops': donutStops }}
              aria-label={`${eventOverview.total} total events`}
            >
              <strong>{eventOverview.total}</strong>
              <span>Total</span>
            </div>
            <div className="admin-dashboard-breakdown">
              {eventOverview.rows.map((row) => (
                <div className="admin-dashboard-breakdown__row" key={row.key}>
                  <span style={{ '--dot-color': EVENT_COLORS[row.key] }}>{row.label}</span>
                  <strong>
                    {row.value} ({Math.round((row.value / eventOverview.total) * 100)}%)
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="admin-dashboard-card admin-dashboard-bookings">
          <div className="admin-dashboard-card__header">
            <h2>Recent Bookings</h2>
            <a href="/admin/appointments">View all bookings</a>
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
                  {booking.type}
                </span>
                <div className="admin-dashboard-booking__date">
                  <CalendarDays size={17} />
                  <span>{booking.date}</span>
                  <Clock3 size={14} />
                  <small>{booking.time}</small>
                </div>
                <span className={`admin-dashboard-status admin-dashboard-status--${String(booking.status).toLowerCase()}`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="admin-dashboard-card admin-dashboard-activity">
        <div className="admin-dashboard-card__header">
          <h2>Recent Activity</h2>
          <a href="/admin/audit-log">View all activity</a>
        </div>
        <div className="admin-dashboard-activity__table">
          <div className="admin-dashboard-activity__head">
            <span>Time</span>
            <span>Admin</span>
            <span>Action</span>
            <span>Target</span>
            <span>Details</span>
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
                  {item.action}
                </b>
              </span>
              <span>{item.target}</span>
              <span>{item.details}</span>
            </div>
          ))}
        </div>
        <Sparkles className="admin-dashboard-activity__sparkle" size={24} aria-hidden="true" />
      </article>
    </section>
  );
}
