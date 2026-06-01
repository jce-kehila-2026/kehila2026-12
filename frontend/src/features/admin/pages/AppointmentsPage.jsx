import { useEffect, useMemo, useState } from 'react';
import { collectionGroup, getDocs, limit, orderBy, query } from 'firebase/firestore';
import {
  CalendarDays,
  Edit3,
  Eye,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react';
import { db } from '../../../firebase';
import { getAllAppointments } from '../services/appointmentService';
import './AppointmentsPage.css';

const FALLBACK_BOOKINGS = [
  { id: '1', participantName: 'Dema Dabbagh', participantEmail: 'demadabbagh84@gmail.com', eventType: 'Appointment', eventName: 'Reflexology', providerName: 'Michal', eventDate: '2026-05-26', eventTime: '10:00', registeredAt: '2026-05-20T14:14:00', status: 'approved' },
  { id: '2', participantName: 'Nour Rawashdeh', participantEmail: 'nour.rw98@gmail.com', eventType: 'Workshop', eventName: 'Yoga', providerName: 'She-Na Team', eventDate: '2026-05-26', eventTime: '12:30', registeredAt: '2026-05-21T09:30:00', status: 'pending' },
  { id: '3', participantName: 'Sara Al Omari', participantEmail: 'sara.omari@gmail.com', eventType: 'Workshop', eventName: 'Qi Gong', providerName: 'Margarita', eventDate: '2026-05-26', eventTime: '17:00', registeredAt: '2026-05-22T11:05:00', status: 'approved' },
  { id: '4', participantName: 'Lina Eddin', participantEmail: 'lina.eddin@gmail.com', eventType: 'Appointment', eventName: 'Recovery Check-in', providerName: 'Stav', eventDate: '2026-05-27', eventTime: '11:00', registeredAt: '2026-05-23T16:44:00', status: 'completed' },
  { id: '5', participantName: 'Maya Abed', participantEmail: 'maya.abed@gmail.com', eventType: 'Workshop', eventName: "Women's Circle", providerName: 'She-Na Team', eventDate: '2026-05-27', eventTime: '14:00', registeredAt: '2026-05-24T08:10:00', status: 'pending' },
  { id: '6', participantName: 'Joud Odeh', participantEmail: 'joud.odeh@gmail.com', eventType: 'Appointment', eventName: 'Wellness Support', providerName: 'Margarita', eventDate: '2026-05-27', eventTime: '16:30', registeredAt: '2026-05-24T18:21:00', status: 'cancelled' },
  { id: '7', participantName: 'Reem Khoury', participantEmail: 'reem.khoury@gmail.com', eventType: 'Workshop', eventName: 'Qi Gong', providerName: 'She-Na Team', eventDate: '2026-05-28', eventTime: '09:30', registeredAt: '2026-05-25T12:02:00', status: 'approved' },
];

function getInitials(name = 'Participant') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PA';
}

function toDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(dateValue) {
  const date = toDate(dateValue);
  if (!date) return 'May 26, 2026';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeValue) {
  if (!timeValue) return '10:00 AM';
  if (timeValue?.toDate) {
    return timeValue.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (/am|pm/i.test(String(timeValue))) return timeValue;
  const [hours, minutes = '00'] = String(timeValue).split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatRegisteredAt(value) {
  const date = toDate(value);
  if (!date) return { date: 'May 20, 2026', time: '02:14 PM' };
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

function normalizeStatus(status) {
  return String(status || 'pending').toLowerCase().replace('confirmed', 'approved');
}

function normalizeAppointment(item) {
  return {
    id: `appointment-${item.id}`,
    participantName: item.participantName || item.name || 'Community Participant',
    participantEmail: item.participantEmail || item.email || 'participant@she-na.org',
    eventType: 'Appointment',
    eventName: item.type || item.appointmentType || item.typeName || item.title || 'Appointment',
    providerName: item.providerName || item.provider || 'Michal',
    eventDate: item.date || item.createdAt || '2026-05-26',
    eventTime: item.time || item.selectedTimeSlot || '10:00',
    registeredAt: item.createdAt || item.registeredAt || item.date || '2026-05-20T14:14:00',
    status: normalizeStatus(item.status),
  };
}

function normalizeRegistration(item, index) {
  const eventType = String(item.eventType || item.type || '').toLowerCase().includes('appointment')
    ? 'Appointment'
    : 'Workshop';
  return {
    id: `registration-${item.id || index}`,
    participantName: item.participantName || item.userName || item.name || 'Community Participant',
    participantEmail: item.participantEmail || item.userEmail || item.email || 'participant@she-na.org',
    eventType,
    eventName: item.eventTitle || item.title || item.appointmentType || (eventType === 'Workshop' ? 'Workshop' : 'Appointment'),
    providerName: item.providerName || item.provider || (eventType === 'Workshop' ? 'She-Na Team' : 'Michal'),
    eventDate: item.eventDate || item.selectedDate || item.date || item.registeredAt || '2026-05-26',
    eventTime: item.sessionTime || item.selectedTimeSlot || item.time || '10:00',
    registeredAt: item.registeredAt || item.createdAt || '2026-05-20T14:14:00',
    status: normalizeStatus(item.status || 'approved'),
  };
}

function MiniCalendar({ onSelectDate }) {
  const days = [
    ['27', 'muted'], ['28', 'muted'], ['29', 'muted'], ['30', 'muted'], ['1'], ['2'], ['3'],
    ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['10'],
    ['11'], ['12'], ['13'], ['14'], ['15'], ['16'], ['17'],
    ['18'], ['19'], ['20'], ['21'], ['22', 'dot'], ['23'], ['24'],
    ['25'], ['26', 'selected'], ['27'], ['28'], ['29'], ['30'], ['31'],
    ['1', 'muted'], ['2', 'muted'], ['3', 'muted'], ['4', 'muted'], ['5', 'muted'], ['6', 'muted'],
  ];

  return (
    <article className="appointments-panel-card appointments-calendar-card">
      <header>
        <button type="button" aria-label="Previous month">‹</button>
        <strong>May 2026</strong>
        <button type="button" aria-label="Next month">›</button>
      </header>
      <div className="appointments-calendar-weekdays">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="appointments-calendar-grid">
        {days.map(([day, state], index) => (
          <button
            type="button"
            className={state ? `is-${state}` : ''}
            key={`${day}-${index}`}
            onClick={() => onSelectDate(`2026-05-${String(day).padStart(2, '0')}`)}
          >
            {day}
          </button>
        ))}
      </div>
    </article>
  );
}

export default function AppointmentsPage() {
  const [bookings, setBookings] = useState(FALLBACK_BOOKINGS);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All Types');
  const [status, setStatus] = useState('All Statuses');
  const [provider, setProvider] = useState('All Providers');
  const [selectedDate, setSelectedDate] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getAllAppointments().catch(() => []),
      getDocs(query(collectionGroup(db, 'registrations'), orderBy('registeredAt', 'desc'), limit(100)))
        .then((snap) => snap.docs.map((docSnap, index) => ({ id: docSnap.id || index, ...docSnap.data() })))
        .catch(() => []),
    ])
      .then(([appointmentItems, registrationItems]) => {
        if (ignore) return;
        const rows = [
          ...registrationItems.map(normalizeRegistration),
          ...appointmentItems.map(normalizeAppointment),
        ];
        if (rows.length) setBookings(rows);
      })
      .catch((error) => console.error('Failed to load bookings:', error));
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings.filter((item) => {
      const matchesSearch = !term || `${item.participantName} ${item.participantEmail} ${item.eventName} ${item.providerName}`.toLowerCase().includes(term);
      const matchesType = type === 'All Types' || item.eventType === type;
      const matchesStatus = status === 'All Statuses' || item.status === status.toLowerCase();
      const matchesProvider = provider === 'All Providers' || item.providerName === provider;
      const matchesDate = !selectedDate || String(item.eventDate).includes(selectedDate);
      return matchesSearch && matchesType && matchesStatus && matchesProvider && matchesDate;
    });
  }, [bookings, provider, search, selectedDate, status, type]);

  const providers = ['All Providers', ...Array.from(new Set(bookings.map((item) => item.providerName).filter(Boolean)))];

  return (
    <section className={`appointments-admin-page${selectedDate ? ' has-date-filter' : ''}`}>
      <header className="appointments-admin-header">
        <div>
          <h1>Bookings Management</h1>
          <p>Manage all participant bookings for workshops and appointments.</p>
        </div>
      </header>

      <div className="appointments-admin-layout">
        <main className="appointments-admin-main">
          <section className="appointments-filter-card" aria-label="Booking filters">
            <label className="appointments-search-field">
              <Search size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search participant, event, or provider..." />
            </label>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option>All Types</option>
              <option>Workshop</option>
              <option>Appointment</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All Statuses</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
            <div className="appointments-calendar-popover-wrap appointments-calendar-filter">
              <button
                className="appointments-calendar-icon-btn"
                type="button"
                aria-label="Open calendar date filter"
                onClick={() => setCalendarOpen((current) => !current)}
              >
                <CalendarDays size={18} />
              </button>
              {calendarOpen && (
                <div className="appointments-calendar-popover">
                  <MiniCalendar
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }}
                  />
                </div>
              )}
            </div>
            <select value={provider} onChange={(event) => setProvider(event.target.value)}>
              {providers.map((name) => <option key={name}>{name}</option>)}
            </select>
          </section>

          {selectedDate && (
            <div className="appointments-active-filter-pill">
              <span>{formatDate(selectedDate)}</span>
              <button type="button" aria-label="Clear selected date" onClick={() => setSelectedDate('')}>x</button>
            </div>
          )}

          <section className="appointments-table-card">
            <div className="appointments-table appointments-table--head">
              <span>Participant</span>
              <span>Event Type</span>
              <span>Event Name</span>
              <span>Provider</span>
              <span>Event Date & Time</span>
              <span>Registered At</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            <div className="appointments-table-body appointments-table-wrapper">
              {filtered.slice(0, 7).map((item) => {
                const registeredAt = formatRegisteredAt(item.registeredAt);
                return (
                  <div className="appointments-table appointments-table--row" key={item.id}>
                    <div className="appointments-participant-cell">
                      <span className="appointments-avatar">{getInitials(item.participantName)}</span>
                      <div><strong>{item.participantName}</strong><small>{item.participantEmail}</small></div>
                    </div>
                    <span className={`appointments-event-type appointments-event-type--${item.eventType.toLowerCase()}`}>
                      {item.eventType}
                    </span>
                    <span className="appointments-event-name">{item.eventName}</span>
                    <span className="appointments-provider"><UserRound size={18} /> {item.providerName}</span>
                    <span className="appointments-date-time"><strong>{formatDate(item.eventDate)}</strong><small>{formatTime(item.eventTime)}</small></span>
                    <span className="appointments-date-time"><strong>{registeredAt.date}</strong><small>{registeredAt.time}</small></span>
                    <span className={`appointments-status appointments-status--${item.status}`}>{item.status}</span>
                    <span className="appointments-actions">
                      <button aria-label="View"><Eye size={15} /></button>
                      <button aria-label="Edit"><Edit3 size={15} /></button>
                      <button aria-label="Reschedule"><CalendarDays size={15} /></button>
                      <button aria-label="Delete"><Trash2 size={15} /></button>
                    </span>
                  </div>
                );
              })}
            </div>
            <footer className="appointments-table-footer">
              <span>Showing 1 to {Math.min(filtered.length, 7)} of {bookings.length} results</span>
              <div><button>‹</button><button className="is-active">1</button><button>2</button><button>3</button><span>...</span><button>18</button><button>›</button></div>
            </footer>
          </section>
        </main>

      </div>
    </section>
  );
}
