import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import {
  CalendarDays,
  Edit3,
  Eye,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { db } from '../../../firebase';
import { getAllAppointments } from '../services/appointmentService';
import { mergeBookingRows, paginateRows, toDateKey } from './bookingsPageUtils';
import './AppointmentsPage.css';

const PAGE_SIZE = 7;

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
  if (!date) return 'Date TBD';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeValue) {
  if (!timeValue) return 'Time TBD';
  if (timeValue?.toDate) {
    return timeValue.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (/am|pm/i.test(String(timeValue))) return timeValue;
  const match = String(timeValue).match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    const date = toDate(timeValue);
    return date
      ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'Time TBD';
  }
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]));
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatRegisteredAt(value) {
  const date = toDate(value);
  if (!date) return { date: 'Not recorded', time: '' };
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

function BookingDetailsDialog({ booking, onClose }) {
  if (!booking) return null;
  const registeredAt = formatRegisteredAt(booking.registeredAt);

  return (
    <div className="appointments-details-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="appointments-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>{booking.eventType}</span>
            <h2 id="booking-details-title">{booking.eventName}</h2>
          </div>
          <button type="button" aria-label="Close booking details" onClick={onClose}><X size={18} /></button>
        </header>
        <dl>
          <div><dt>Participant</dt><dd>{booking.participantName}</dd></div>
          <div><dt>Email</dt><dd>{booking.participantEmail}</dd></div>
          <div><dt>Provider</dt><dd>{booking.providerName}</dd></div>
          <div><dt>Event date</dt><dd>{formatDate(booking.eventDate)} at {formatTime(booking.eventTime)}</dd></div>
          <div><dt>Registered</dt><dd>{registeredAt.date} {registeredAt.time}</dd></div>
          <div><dt>Status</dt><dd>{booking.status}</dd></div>
          <div><dt>Source</dt><dd>{booking.source === 'booking' ? 'Central booking' : 'Legacy appointment'}</dd></div>
        </dl>
      </section>
    </div>
  );
}

export default function AppointmentsPage() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All Types');
  const [status, setStatus] = useState('All Statuses');
  const [provider, setProvider] = useState('All Providers');
  const [selectedDate, setSelectedDate] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const bookingSnap = await getDocs(
        query(collection(db, 'bookings'), orderBy('registeredAt', 'desc'), limit(250)),
      );
      const bookingItems = bookingSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

      let appointmentItems = [];
      try {
        appointmentItems = await getAllAppointments();
      } catch (legacyError) {
        console.warn('Legacy appointments could not be loaded:', legacyError);
      }

      setBookings(mergeBookingRows(bookingItems, appointmentItems));
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setBookings([]);
      setLoadError('Could not load bookings from Firestore.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings.filter((item) => {
      const matchesSearch = !term || `${item.participantName} ${item.participantEmail} ${item.eventName} ${item.providerName}`.toLowerCase().includes(term);
      const matchesType = type === 'All Types' || item.eventType === type;
      const matchesStatus = status === 'All Statuses' || item.status === status.toLowerCase();
      const matchesProvider = provider === 'All Providers' || item.providerName === provider;
      const matchesDate = !selectedDate || toDateKey(item.eventDate) === selectedDate;
      return matchesSearch && matchesType && matchesStatus && matchesProvider && matchesDate;
    });
  }, [bookings, provider, search, selectedDate, status, type]);

  useEffect(() => {
    setPage(1);
  }, [provider, search, selectedDate, status, type]);

  const pagination = useMemo(() => paginateRows(filtered, page, PAGE_SIZE), [filtered, page]);
  const providers = ['All Providers', ...Array.from(new Set(bookings.map((item) => item.providerName).filter(Boolean)))];
  const resultStart = filtered.length ? pagination.startIndex + 1 : 0;
  const resultEnd = Math.min(pagination.startIndex + pagination.rows.length, filtered.length);

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
                aria-expanded={calendarOpen}
                onClick={() => setCalendarOpen((current) => !current)}
              >
                <CalendarDays size={18} />
              </button>
              {calendarOpen && (
                <div className="appointments-calendar-popover appointments-date-picker-popover">
                  <label>
                    Filter by event date
                    <input
                      type="date"
                      value={selectedDate}
                      autoFocus
                      onChange={(event) => {
                        setSelectedDate(event.target.value);
                        setCalendarOpen(false);
                      }}
                    />
                  </label>
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

          <section className="appointments-table-card" aria-busy={loading}>
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
              {loading ? (
                <div className="appointments-table-state">Loading bookings...</div>
              ) : loadError ? (
                <div className="appointments-table-state appointments-table-state--error">
                  <span>{loadError}</span>
                  <button type="button" onClick={loadBookings}>Retry</button>
                </div>
              ) : pagination.rows.length === 0 ? (
                <div className="appointments-table-state">
                  {bookings.length ? 'No bookings match the selected filters.' : 'No bookings have been created yet.'}
                </div>
              ) : pagination.rows.map((item) => {
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
                      <button type="button" aria-label="View booking" title="View booking" onClick={() => setSelectedBooking(item)}><Eye size={15} /></button>
                      <button type="button" aria-label="Edit booking unavailable" title="Edit is not available yet" disabled><Edit3 size={15} /></button>
                      <button type="button" aria-label="Reschedule booking unavailable" title="Reschedule is not available yet" disabled><CalendarDays size={15} /></button>
                      <button type="button" aria-label="Delete booking unavailable" title="Delete is not available yet" disabled><Trash2 size={15} /></button>
                    </span>
                  </div>
                );
              })}
            </div>
            <footer className="appointments-table-footer">
              <span>Showing {resultStart} to {resultEnd} of {filtered.length} results</span>
              <div>
                <button type="button" aria-label="Previous page" disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>&lt;</button>
                {Array.from({ length: pagination.pageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    type="button"
                    className={pageNumber === pagination.page ? 'is-active' : ''}
                    aria-label={`Page ${pageNumber}`}
                    onClick={() => setPage(pageNumber)}
                    key={pageNumber}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button type="button" aria-label="Next page" disabled={pagination.page >= pagination.pageCount} onClick={() => setPage((current) => Math.min(pagination.pageCount, current + 1))}>&gt;</button>
              </div>
            </footer>
          </section>
        </main>
      </div>

      <BookingDetailsDialog booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </section>
  );
}
