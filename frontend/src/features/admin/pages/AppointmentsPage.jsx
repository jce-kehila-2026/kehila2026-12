import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import Pagination from '@mui/material/Pagination';
import {
  Download,
  Eye,
  UserRound,
  X,
} from 'lucide-react';
import { db } from '../../../firebase';
import { getAllAppointments } from '../services/appointmentService';
import { mergeBookingRows, paginateRows, toDateKey } from './bookingsPageUtils';
import { useAdminLocale } from '../context/AdminLocaleContext';
import AdminPageHeader from '../components/AdminPageHeader';
import './AppointmentsPage.css';

const PAGE_SIZE = 10;

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en-US' };

const STATUS_LABEL_KEYS = {
  confirmed: 'bkStatusConfirmed',
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

function formatNumericDate(dateValue, intlLocale, tbd) {
  const date = toDate(dateValue);
  if (!date) return tbd;
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
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

function formatTime24(timeValue, tbd) {
  if (!timeValue) return tbd;
  if (timeValue?.toDate) {
    const date = timeValue.toDate();
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  const value = String(timeValue).trim();
  const rangeParts = value.split(/\s*[-–]\s*/);
  if (rangeParts.length === 2 && rangeParts.every((part) => /\d{1,2}:\d{2}/.test(part))) {
    return rangeParts.map((part) => formatTime24(part, tbd)).join(' - ');
  }

  const meridiemMatch = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = meridiemMatch[2];
    const meridiem = meridiemMatch[3].toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const timeMatch = value.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;

  const date = toDate(timeValue);
  if (!date) return tbd;
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatNumericDateTime(dateValue, tbd) {
  const date = toDate(dateValue);
  if (!date) return { date: tbd, time: '' };
  return {
    date: formatNumericDate(date, 'en-US', tbd),
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
  };
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

function getCsvTitle(filters, t, intlLocale) {
  const typeTitle = filters.type === 'All Types' ? t('apAllTypes') : t(TYPE_LABEL_KEYS[filters.type]);
  const activeFilters = [];

  if (filters.search.trim()) activeFilters.push(`Search: ${filters.search.trim()}`);
  if (filters.status !== 'All Statuses') {
    activeFilters.push(`${t('apColStatus')}: ${t(STATUS_LABEL_KEYS[filters.status.toLowerCase()] || 'apAllStatuses')}`);
  }
  if (filters.dateFrom) {
    activeFilters.push(`${t('apEventDateFilter')}: ${formatNumericDate(filters.dateFrom, intlLocale, filters.dateFrom)}`);
  }
  if (filters.provider !== 'All Providers') activeFilters.push(`${t('apColProvider')}: ${filters.provider}`);

  return `${typeTitle} Bookings${activeFilters.length ? ` (${activeFilters.join(', ')})` : ''}`;
}

function joinDateTime(date, time) {
  return [date, time].filter(Boolean).join(' at ');
}

function sanitizeFileName(value) {
  return String(value)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function downloadCsv(rows, t, intlLocale, filters) {
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

  const csvTitle = getCsvTitle(filters, t, intlLocale);
  const csvRows = [headers.map(escapeCsvValue).join(',')];

  for (const item of rows) {
    const eventDate = formatNumericDate(item.eventDate, intlLocale, '');
    const eventTime = formatTime24(item.eventTime, '');
    const eventDateTime = joinDateTime(eventDate, eventTime);
    const reg = formatNumericDateTime(item.registeredAt, '');
    const registeredAt = joinDateTime(reg.date, reg.time);

    csvRows.push(
      [
        item.participantName,
        item.participantEmail,
        item.eventType,
        item.eventName,
        item.providerName,
        eventDateTime,
        registeredAt,
        STATUS_LABEL_KEYS[item.status] ? t(STATUS_LABEL_KEYS[item.status]) : item.status,
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
  link.download = `${sanitizeFileName(csvTitle)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function BookingDetailsDialog({ booking, onClose, t, intlLocale }) {
  if (!booking) return null;
  const registeredAt = formatNumericDateTime(booking.registeredAt, t('apNotRecorded'));
  const typeLabel = TYPE_LABEL_KEYS[booking.eventType] ? t(TYPE_LABEL_KEYS[booking.eventType]) : booking.eventType;
  const statusLabel = STATUS_LABEL_KEYS[booking.status] ? t(STATUS_LABEL_KEYS[booking.status]) : booking.status;
  const sourceLabel = booking.source === 'booking' ? t('apSourceCentral') : t('apSourceLegacy');
  const eventDateLabel = t('apEventDateAt')
    .replace('{date}', formatNumericDate(booking.eventDate, intlLocale, t('apDateTBD')))
    .replace('{time}', formatTime24(booking.eventTime, t('apTimeTBD')));

  return (
    <div
      className="appointments-details-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="appointments-details-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="appointments-details-close" type="button" aria-label={t('apCloseDetails')} onClick={onClose}>
          <X size={20} />
        </button>

        <header className="appointments-details-header">
          <span className={`appointments-details-chip appointments-details-chip--${booking.eventType.toLowerCase()}`}>
            {typeLabel}
          </span>
          <h2 id="booking-details-title">{booking.eventName}</h2>
        </header>

        <div className="appointments-details-body">
          <section className="appointments-details-section">
            <h3>{t('auditSummaryHeading')}</h3>
            <p>{booking.participantName} - {booking.eventName}</p>
          </section>

          <section className="appointments-details-section">
            <h3>{t('auditDetailsAria')}</h3>
            <div className="appointments-details-grid">
              <DetailLine label={t('apDetailParticipant')} value={booking.participantName} />
              <DetailLine label={t('apDetailEmail')} value={booking.participantEmail} />
              <DetailLine label={t('apDetailProvider')} value={booking.providerName} />
              <DetailLine label={t('apDetailEventDate')} value={eventDateLabel} />
              <DetailLine
                label={t('apDetailRegistered')}
                value={[registeredAt.date, registeredAt.time].filter(Boolean).join(' at ')}
              />
              <DetailLine label={t('apDetailStatus')} value={statusLabel} />
              <DetailLine label={t('apDetailSource')} value={sourceLabel} />
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function DetailLine({ label, value }) {
  return (
    <div className="appointments-detail-line">
      <span>{label}</span>
      <strong>{value}</strong>
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
  const [dateFrom, setDateFrom] = useState('');
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
      const eventDateKey = toDateKey(item.eventDate);
      const matchesDate = !dateFrom || eventDateKey === dateFrom;
      return matchesSearch && matchesType && matchesStatus && matchesProvider && matchesDate;
    });
  }, [bookings, dateFrom, provider, search, status, type]);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, provider, search, status, type]);

  const pagination = useMemo(() => paginateRows(filtered, page, PAGE_SIZE), [filtered, page]);
  const providers = ['All Providers', ...Array.from(new Set(bookings.map((item) => item.providerName).filter(Boolean)))];
  const clearFilters = () => {
    setSearch('');
    setType('All Types');
    setStatus('All Statuses');
    setDateFrom('');
    setProvider('All Providers');
  };

  return (
    <section className="appointments-admin-page" dir={direction}>
      <AdminPageHeader
        title={t('apTitle')}
        className="admin-page-header--no-clip"
        actions={(
          <button
            type="button"
            className="appointments-export-csv-btn"
            onClick={() => downloadCsv(filtered, t, intlLocale, { type, search, status, dateFrom, provider })}
            disabled={loading || filtered.length === 0}
            title={t('apExportCsv')}
          >
            <Download size={17} />
            {t('apExportCsv')}
          </button>
        )}
      />
      <header className="appointments-admin-header">
        <div className="appointments-type-tabs" role="tablist" aria-label={t('apColEventType')}>
          {[
            { value: 'All Types', label: t('apAllTypes') },
            { value: 'Workshop', label: t('apTypeWorkshop') },
            { value: 'Appointment', label: t('apTypeAppointment') },
          ].map((tab) => (
            <button
              type="button"
              role="tab"
              aria-selected={type === tab.value}
              className={type === tab.value ? 'is-active' : ''}
              onClick={() => setType(tab.value)}
              key={tab.value}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="appointments-admin-layout">
        <main className="appointments-admin-main">
          <section className="appointments-filter-card" aria-label={t('apFiltersAria')}>
            <label className="appointments-search-field">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('apSearchPlaceholder')} />
            </label>
            <label className="appointments-filter-field">
              <span>{t('apColStatus')}</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="All Statuses">{t('apAllStatuses')}</option>
                <option value="Confirmed">{t('bkStatusConfirmed')}</option>
                <option value="Cancelled">{t('bkStatusCancelled')}</option>
              </select>
            </label>
            <label className="appointments-filter-field">
              <span>{t('apEventDateFilter')}</span>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </label>
            <label className="appointments-filter-field">
              <span>{t('apColProvider')}</span>
              <select value={provider} onChange={(event) => setProvider(event.target.value)}>
                {providers.map((name) => (
                  <option key={name} value={name}>{name === 'All Providers' ? t('apAllProviders') : name}</option>
                ))}
              </select>
            </label>
            <button type="button" className="appointments-filter-clear-btn" onClick={clearFilters}>
              {t('auditClear')}
            </button>
          </section>

          <section className="appointments-table-card" aria-busy={loading}>
            <div className="appointments-table appointments-table--head">
              <span>{t('apColParticipant')}</span>
              <span>{t('apColEventType')}</span>
              <span>{t('apColEventName')}</span>
              <span>{t('apColProvider')}</span>
              <span>{t('apColEventDateTime')}</span>
              <span>{t('apColStatus')}</span>
              <span>{t('apColDetails')}</span>
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
                return (
                  <div className="appointments-table appointments-table--row" key={item.id}>
                    <div className="appointments-participant-cell">
                      <span className="appointments-avatar">{getInitials(item.participantName)}</span>
                      <div><strong>{item.participantName}</strong></div>
                    </div>
                    <span className={`appointments-event-type appointments-event-type--${item.eventType.toLowerCase()}`}>
                      {typeLabel(item.eventType)}
                    </span>
                    <span className="appointments-event-name">{item.eventName}</span>
                    <span className="appointments-provider"><UserRound size={18} /> {item.providerName}</span>
                    <span className="appointments-date-time"><strong>{formatNumericDate(item.eventDate, intlLocale, t('apDateTBD'))}</strong><small>{formatTime24(item.eventTime, t('apTimeTBD'))}</small></span>
                    <span className={`appointments-status appointments-status--${item.status}`}>{statusLabel(item.status)}</span>
                    <span className="appointments-actions">
                      <button type="button" aria-label={t('apViewBooking')} title={t('apViewBooking')} onClick={() => setSelectedBooking(item)}><Eye size={15} /></button>
                    </span>
                  </div>
                );
              })}
            </div>
            <footer className="appointments-table-footer">
              <Pagination
                count={pagination.pageCount}
                page={pagination.page}
                onChange={(event, value) => setPage(value)}
                siblingCount={1}
                boundaryCount={1}
                shape="rounded"
              />
            </footer>
          </section>
        </main>
      </div>

      <BookingDetailsDialog booking={selectedBooking} onClose={() => setSelectedBooking(null)} t={t} intlLocale={intlLocale} />
    </section>
  );
}
