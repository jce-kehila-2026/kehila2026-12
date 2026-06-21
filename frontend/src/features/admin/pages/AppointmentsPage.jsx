import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import {
  CalendarDays,
  Download,
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
import { useAdminLocale } from '../context/AdminLocaleContext';
import './AppointmentsPage.css';

const PAGE_SIZE = 7;

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en-US' };

const STATUS_LABEL_KEYS = {
  approved: 'bkStatusApproved',
  pending: 'bkStatusPending',
  completed: 'bkStatusCompleted',
  cancelled: 'bkStatusCancelled',
};

const TYPE_LABEL_KEYS = {
  Workshop: 'apTypeWorkshop',
  Appointment: 'apTypeAppointment',
};

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

function formatDate(dateValue, intlLocale, tbd) {
  const date = toDate(dateValue);
  if (!date) return tbd;
  return date.toLocaleDateString(intlLocale, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(timeValue, intlLocale, tbd) {
  if (!timeValue) return tbd;
  if (timeValue?.toDate) {
    return timeValue.toDate().toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' });
  }
  if (/am|pm/i.test(String(timeValue))) return timeValue;
  const match = String(timeValue).match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    const date = toDate(timeValue);
    return date
      ? date.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' })
      : tbd;
  }
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]));
  return date.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' });
}

function formatRegisteredAt(value, intlLocale, notRecorded) {
  const date = toDate(value);
  if (!date) return { date: notRecorded, time: '' };
  return {
    date: date.toLocaleDateString(intlLocale, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' }),
  };
}

function escapeCsvValue(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsv(rows, t, intlLocale) {
  const headers = [
    t('apColParticipant'),
    t('apDetailEmail'),
    t('apColEventType'),
    t('apColEventName'),
    t('apColProvider'),
    t('apColEventDateTime'),
    t('apColRegisteredAt'),
    t('apColStatus'),
  ];

  const csvRows = [headers.map(escapeCsvValue).join(',')];

  for (const item of rows) {
    const eventDate = formatDate(item.eventDate, intlLocale, '');
    const eventTime = formatTime(item.eventTime, intlLocale, '');
    const eventDateTime = [eventDate, eventTime].filter(Boolean).join(' ');
    const reg = formatRegisteredAt(item.registeredAt, intlLocale, '');
    const registeredAt = [reg.date, reg.time].filter(Boolean).join(' ');

    csvRows.push(
      [
        item.participantName,
        item.participantEmail,
        item.eventType,
        item.eventName,
        item.providerName,
        eventDateTime,
        registeredAt,
        item.status,
      ]
        .map(escapeCsvValue)
        .join(',')
    );
  }

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function BookingDetailsDialog({ booking, onClose, t, intlLocale }) {
  if (!booking) return null;
  const registeredAt = formatRegisteredAt(booking.registeredAt, intlLocale, t('apNotRecorded'));
  const typeLabel = TYPE_LABEL_KEYS[booking.eventType] ? t(TYPE_LABEL_KEYS[booking.eventType]) : booking.eventType;
  const statusLabel = STATUS_LABEL_KEYS[booking.status] ? t(STATUS_LABEL_KEYS[booking.status]) : booking.status;

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
            <span>{typeLabel}</span>
            <h2 id="booking-details-title">{booking.eventName}</h2>
          </div>
          <button type="button" aria-label={t('apCloseDetails')} onClick={onClose}><X size={18} /></button>
        </header>
        <dl>
          <div><dt>{t('apDetailParticipant')}</dt><dd>{booking.participantName}</dd></div>
          <div><dt>{t('apDetailEmail')}</dt><dd>{booking.participantEmail}</dd></div>
          <div><dt>{t('apDetailProvider')}</dt><dd>{booking.providerName}</dd></div>
          <div><dt>{t('apDetailEventDate')}</dt><dd>{t('apEventDateAt').replace('{date}', formatDate(booking.eventDate, intlLocale, t('apDateTBD'))).replace('{time}', formatTime(booking.eventTime, intlLocale, t('apTimeTBD')))}</dd></div>
          <div><dt>{t('apDetailRegistered')}</dt><dd>{registeredAt.date} {registeredAt.time}</dd></div>
          <div><dt>{t('apDetailStatus')}</dt><dd>{statusLabel}</dd></div>
          <div><dt>{t('apDetailSource')}</dt><dd>{booking.source === 'booking' ? t('apSourceCentral') : t('apSourceLegacy')}</dd></div>
        </dl>
      </section>
    </div>
  );
}

export default function AppointmentsPage() {
  const { t, lang, direction } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en-US';
  const typeLabel = (val) => (TYPE_LABEL_KEYS[val] ? t(TYPE_LABEL_KEYS[val]) : val);
  const statusLabel = (val) => (STATUS_LABEL_KEYS[val] ? t(STATUS_LABEL_KEYS[val]) : val);
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
      setLoadError(t('apLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
    <section className={`appointments-admin-page${selectedDate ? ' has-date-filter' : ''}`} dir={direction}>
      <header className="appointments-admin-header">
        <div>
          <h1>{t('apTitle')}</h1>
          <p>{t('apSubtitle')}</p>
        </div>
        <button
          type="button"
          className="appointments-export-csv-btn"
          onClick={() => downloadCsv(filtered, t, intlLocale)}
          disabled={loading || filtered.length === 0}
          title={t('apExportCsv')}
        >
          <Download size={17} />
          {t('apExportCsv')}
        </button>
      </header>

      <div className="appointments-admin-layout">
        <main className="appointments-admin-main">
          <section className="appointments-filter-card" aria-label={t('apFiltersAria')}>
            <label className="appointments-search-field">
              <Search size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('apSearchPlaceholder')} />
            </label>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="All Types">{t('apAllTypes')}</option>
              <option value="Workshop">{t('apTypeWorkshop')}</option>
              <option value="Appointment">{t('apTypeAppointment')}</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="All Statuses">{t('apAllStatuses')}</option>
              <option value="Approved">{t('bkStatusApproved')}</option>
              <option value="Pending">{t('bkStatusPending')}</option>
              <option value="Completed">{t('bkStatusCompleted')}</option>
              <option value="Cancelled">{t('bkStatusCancelled')}</option>
            </select>
            <div className="appointments-calendar-popover-wrap appointments-calendar-filter">
              <button
                className="appointments-calendar-icon-btn"
                type="button"
                aria-label={t('apOpenCalendar')}
                aria-expanded={calendarOpen}
                onClick={() => setCalendarOpen((current) => !current)}
              >
                <CalendarDays size={18} />
              </button>
              {calendarOpen && (
                <div className="appointments-calendar-popover appointments-date-picker-popover">
                  <label>
                    {t('apFilterByDate')}
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
              {providers.map((name) => (
                <option key={name} value={name}>{name === 'All Providers' ? t('apAllProviders') : name}</option>
              ))}
            </select>
          </section>

          {selectedDate && (
            <div className="appointments-active-filter-pill">
              <span>{formatDate(selectedDate, intlLocale, t('apDateTBD'))}</span>
              <button type="button" aria-label={t('apClearDate')} onClick={() => setSelectedDate('')}>x</button>
            </div>
          )}

          <section className="appointments-table-card" aria-busy={loading}>
            <div className="appointments-table appointments-table--head">
              <span>{t('apColParticipant')}</span>
              <span>{t('apColEventType')}</span>
              <span>{t('apColEventName')}</span>
              <span>{t('apColProvider')}</span>
              <span>{t('apColEventDateTime')}</span>
              <span>{t('apColRegisteredAt')}</span>
              <span>{t('apColStatus')}</span>
              <span>{t('apColActions')}</span>
            </div>
            <div className="appointments-table-body appointments-table-wrapper">
              {loading ? (
                <div className="appointments-table-state">{t('apLoading')}</div>
              ) : loadError ? (
                <div className="appointments-table-state appointments-table-state--error">
                  <span>{loadError}</span>
                  <button type="button" onClick={loadBookings}>{t('apRetry')}</button>
                </div>
              ) : pagination.rows.length === 0 ? (
                <div className="appointments-table-state">
                  {bookings.length ? t('apNoMatch') : t('apNoBookings')}
                </div>
              ) : pagination.rows.map((item) => {
                const registeredAt = formatRegisteredAt(item.registeredAt, intlLocale, t('apNotRecorded'));
                return (
                  <div className="appointments-table appointments-table--row" key={item.id}>
                    <div className="appointments-participant-cell">
                      <span className="appointments-avatar">{getInitials(item.participantName)}</span>
                      <div><strong>{item.participantName}</strong><small>{item.participantEmail}</small></div>
                    </div>
                    <span className={`appointments-event-type appointments-event-type--${item.eventType.toLowerCase()}`}>
                      {typeLabel(item.eventType)}
                    </span>
                    <span className="appointments-event-name">{item.eventName}</span>
                    <span className="appointments-provider"><UserRound size={18} /> {item.providerName}</span>
                    <span className="appointments-date-time"><strong>{formatDate(item.eventDate, intlLocale, t('apDateTBD'))}</strong><small>{formatTime(item.eventTime, intlLocale, t('apTimeTBD'))}</small></span>
                    <span className="appointments-date-time"><strong>{registeredAt.date}</strong><small>{registeredAt.time}</small></span>
                    <span className={`appointments-status appointments-status--${item.status}`}>{statusLabel(item.status)}</span>
                    <span className="appointments-actions">
                      <button type="button" aria-label={t('apViewBooking')} title={t('apViewBooking')} onClick={() => setSelectedBooking(item)}><Eye size={15} /></button>
                      <button type="button" aria-label={t('apEditUnavailableAria')} title={t('apEditUnavailableTitle')} disabled><Edit3 size={15} /></button>
                      <button type="button" aria-label={t('apRescheduleUnavailableAria')} title={t('apRescheduleUnavailableTitle')} disabled><CalendarDays size={15} /></button>
                      <button type="button" aria-label={t('apDeleteUnavailableAria')} title={t('apDeleteUnavailableTitle')} disabled><Trash2 size={15} /></button>
                    </span>
                  </div>
                );
              })}
            </div>
            <footer className="appointments-table-footer">
              <span>{t('apShowingResults').replace('{start}', resultStart).replace('{end}', resultEnd).replace('{total}', filtered.length)}</span>
              <div>
                <button type="button" aria-label={t('apPrevPage')} disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>&lt;</button>
                {Array.from({ length: pagination.pageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    type="button"
                    className={pageNumber === pagination.page ? 'is-active' : ''}
                    aria-label={t('apPageAria').replace('{n}', pageNumber)}
                    onClick={() => setPage(pageNumber)}
                    key={pageNumber}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button type="button" aria-label={t('apNextPage')} disabled={pagination.page >= pagination.pageCount} onClick={() => setPage((current) => Math.min(pagination.pageCount, current + 1))}>&gt;</button>
              </div>
            </footer>
          </section>
        </main>
      </div>

      <BookingDetailsDialog booking={selectedBooking} onClose={() => setSelectedBooking(null)} t={t} intlLocale={intlLocale} />
    </section>
  );
}
