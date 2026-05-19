import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Category from '@mui/icons-material/Category';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Close from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditOutlined from '@mui/icons-material/EditOutlined';
import EventAvailable from '@mui/icons-material/EventAvailable';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import FilterList from '@mui/icons-material/FilterList';
import Groups from '@mui/icons-material/Groups';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import PersonRemoveOutlined from '@mui/icons-material/PersonRemoveOutlined';
import Refresh from '@mui/icons-material/Refresh';
import SendOutlined from '@mui/icons-material/SendOutlined';
import Schedule from '@mui/icons-material/Schedule';
import Search from '@mui/icons-material/Search';
import Tune from '@mui/icons-material/Tune';
import WhatsApp from '@mui/icons-material/WhatsApp';
import { createEvent, deleteEvent, getAllEvents, updateEvent } from '../services/eventService';
import {
  checkInRegistration,
  getRegistrationCounts,
  getRegistrationsByEvent,
  removeRegistration,
} from '../services/registrationService';
import './EventsPage.css';

const EVENT_CATEGORIES = [
  'Workshop',
  'Support Group',
  'Therapy Session',
  'Community Activity',
  'Awareness Event',
  'Appointment',
  'Other',
];

const STATUS_OPTIONS = ['published', 'draft', 'cancelled'];

const initialForm = {
  title: '',
  type: 'workshop',
  category: 'Workshop',
  description: '',
  imageUrl: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  maxParticipants: '',
  status: 'published',
};

function toDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function dateInputValue(value) {
  const date = toDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeInputValue(value) {
  const date = toDate(value);
  if (!date) return '';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function composeDateTime(date, time) {
  if (!date || !time) return null;
  return new Date(`${date}T${time}`);
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return 'Date TBD';
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(date);
}

function formatTimeRange(startValue, endValue) {
  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start) return 'Time TBD';
  const formatter = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false });
  return end ? `${formatter.format(start)} - ${formatter.format(end)}` : formatter.format(start);
}

function inferType(event) {
  const raw = `${event.type || ''} ${event.category || ''}`.toLowerCase();
  if (raw.includes('appointment') || raw.includes('therapy') || raw.includes('session')) {
    return 'appointment';
  }
  return 'workshop';
}

function normalizeStatus(status) {
  const nextStatus = String(status || 'published').toLowerCase();
  return STATUS_OPTIONS.includes(nextStatus) ? nextStatus : 'published';
}

function eventToForm(event) {
  return {
    title: event.title || '',
    type: inferType(event),
    category: event.category || 'Workshop',
    description: event.description || '',
    imageUrl: event.imageUrl || event.thumbnailUrl || event.coverImageUrl || '',
    date: dateInputValue(event.startTime || event.date),
    startTime: timeInputValue(event.startTime || event.date),
    endTime: timeInputValue(event.endTime),
    location: event.location || '',
    maxParticipants: event.maxParticipants || event.capacity || '',
    status: normalizeStatus(event.status),
  };
}

function getEventImage(event) {
  return event.imageUrl || event.thumbnailUrl || event.coverImageUrl || '';
}

function getParticipantName(registration) {
  return registration.participantName || registration.userName || registration.name || 'Unknown participant';
}

function getParticipantEmail(registration) {
  return registration.participantEmail || registration.userEmail || registration.email || '';
}

function getParticipantPhone(registration) {
  return registration.participantPhone || registration.userPhone || registration.phone || '';
}

function getParticipantStatus(registration) {
  if (registration.checkedIn) return 'checked-in';
  const status = String(registration.status || 'confirmed').toLowerCase();
  if (status === 'checked_in' || status === 'checked-in') return 'checked-in';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  if (status === 'pending' || status === 'waitlist') return status;
  return 'confirmed';
}

function getInitials(nameOrEmail) {
  const source = String(nameOrEmail || 'Unknown participant').trim();
  const parts = source.includes('@') ? [source[0]] : source.split(/\s+/);
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'UP';
}

function formatRegistrationDate(value) {
  const date = toDate(value);
  if (!date) return 'Registration date TBD';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState(searchParams.get('type') === 'appointments' ? 'appointment' : 'workshop');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [participantsDrawerOpen, setParticipantsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantFilter, setParticipantFilter] = useState('all');
  const [participantSort, setParticipantSort] = useState('newest');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllEvents();
      setEvents(data);
      if (data.length) {
        const countsData = await getRegistrationCounts(data.map((event) => event.id));
        setCounts(countsData);
      } else {
        setCounts({});
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setToast('Could not load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setActiveTab(searchParams.get('type') === 'appointments' ? 'appointment' : 'workshop');
  }, [searchParams]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const typedEvents = useMemo(
    () => events.map((event) => ({ ...event, eventType: inferType(event), status: normalizeStatus(event.status) })),
    [events]
  );

  const workshopsCount = typedEvents.filter((event) => event.eventType === 'workshop').length;
  const appointmentsCount = typedEvents.filter((event) => event.eventType === 'appointment').length;
  const selectedEventCapacity = Number(selectedEvent?.maxParticipants || selectedEvent?.capacity) || 0;
  const selectedEventRegistered = selectedEvent ? (counts[selectedEvent.id] ?? registrations.length) : 0;
  const selectedEventProgress = selectedEventCapacity ? Math.min(100, (selectedEventRegistered / selectedEventCapacity) * 100) : 0;

  const filteredEvents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return typedEvents
      .filter((event) => event.eventType === activeTab)
      .filter((event) => (statusFilter === 'all' ? true : event.status === statusFilter))
      .filter((event) => {
        if (!search) return true;
        return [event.title, event.category, event.location, event.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((left, right) => {
        if (sortBy === 'title') return String(left.title || '').localeCompare(String(right.title || ''));
        const leftDate = toDate(left.startTime)?.getTime() || 0;
        const rightDate = toDate(right.startTime)?.getTime() || 0;
        return sortBy === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
      });
  }, [activeTab, searchTerm, sortBy, statusFilter, typedEvents]);

  const participantStats = useMemo(() => {
    const registered = registrations.length;
    const checkedIn = registrations.filter((registration) => getParticipantStatus(registration) === 'checked-in').length;
    const waitlist = registrations.filter((registration) => getParticipantStatus(registration) === 'waitlist').length;
    const remaining = selectedEventCapacity ? Math.max(0, selectedEventCapacity - registered) : 0;
    return { checkedIn, registered, remaining, waitlist };
  }, [registrations, selectedEventCapacity]);

  const filteredRegistrations = useMemo(() => {
    const search = participantSearch.trim().toLowerCase();
    return registrations
      .filter((registration) => {
        const status = getParticipantStatus(registration);
        return participantFilter === 'all' ? true : status === participantFilter;
      })
      .filter((registration) => {
        if (!search) return true;
        return [getParticipantName(registration), getParticipantEmail(registration)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((left, right) => {
        if (participantSort === 'name') return getParticipantName(left).localeCompare(getParticipantName(right));
        const leftTime = toDate(left.registeredAt)?.getTime() || 0;
        const rightTime = toDate(right.registeredAt)?.getTime() || 0;
        return participantSort === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
      });
  }, [participantFilter, participantSearch, participantSort, registrations]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function changeTab(nextTab) {
    setActiveTab(nextTab);
    setSearchParams(nextTab === 'appointment' ? { type: 'appointments' } : { type: 'workshops' });
  }

  function openCreate() {
    const type = activeTab;
    setParticipantsDrawerOpen(false);
    setEditingEvent(null);
    setForm({
      ...initialForm,
      type,
      category: type === 'appointment' ? 'Appointment' : 'Workshop',
    });
    setDrawerOpen(true);
  }

  function openEdit(event) {
    setParticipantsDrawerOpen(false);
    setEditingEvent(event);
    setForm(eventToForm(event));
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingEvent(null);
    setForm(initialForm);
  }

  async function openParticipants(event) {
    setDrawerOpen(false);
    setSelectedEvent(event);
    setParticipantsDrawerOpen(true);
    setParticipantSearch('');
    setParticipantFilter('all');
    setParticipantSort('newest');
    setRegistrationsLoading(true);
    try {
      const data = await getRegistrationsByEvent(event.id);
      setRegistrations(data);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setRegistrations([]);
      setToast('Could not load participants.');
    } finally {
      setRegistrationsLoading(false);
    }
  }

  function closeParticipantsDrawer() {
    setParticipantsDrawerOpen(false);
    setSelectedEvent(null);
    setRegistrations([]);
  }

  async function handleSave(event) {
    event.preventDefault();
    const startDate = composeDateTime(form.date, form.startTime);
    const endDate = composeDateTime(form.date, form.endTime);

    if (!startDate) {
      setToast('Please add a valid date and start time.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      category: form.category,
      startTime: startDate,
      endTime: endDate,
      location: form.location.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      maxParticipants: Number(form.maxParticipants) || 0,
      status: form.status,
    };

    setSaving(true);
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
        setToast('Event updated.');
      } else {
        await createEvent(payload);
        setToast('Event created.');
      }
      closeDrawer();
      fetchEvents();
    } catch (err) {
      console.error('Save event failed:', err);
      setToast('Could not save event.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this event'}"?`)) return;
    try {
      await deleteEvent(id, title);
      setToast('Event deleted.');
      fetchEvents();
    } catch (err) {
      console.error('Delete event failed:', err);
      setToast('Could not delete event.');
    }
  }

  async function handleCheckIn(registration) {
    if (!selectedEvent) return;
    try {
      await checkInRegistration(registration.id, selectedEvent.id);
      setRegistrations((current) =>
        current.map((item) => (item.id === registration.id ? { ...item, checkedIn: true, status: 'checked-in' } : item))
      );
      setToast('Participant checked in.');
    } catch (err) {
      console.error('Check-in failed:', err);
      setToast('Could not check in participant.');
    }
  }

  async function handleRemoveParticipant(registration) {
    if (!selectedEvent) return;
    const name = getParticipantName(registration);
    if (!window.confirm(`Remove "${name}" from this event?`)) return;
    try {
      await removeRegistration(registration.id, name, selectedEvent.id);
      setRegistrations((current) => current.filter((item) => item.id !== registration.id));
      setCounts((current) => ({
        ...current,
        [selectedEvent.id]: Math.max(0, (current[selectedEvent.id] ?? registrations.length) - 1),
      }));
      setToast('Participant removed.');
    } catch (err) {
      console.error('Remove participant failed:', err);
      setToast('Could not remove participant.');
    }
  }

  function handleReminder(registration) {
    const phone = getParticipantPhone(registration);
    const email = getParticipantEmail(registration);
    const message = encodeURIComponent(`Reminder for ${selectedEvent?.title || 'your She-Na event'}.`);
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank', 'noopener,noreferrer');
      return;
    }
    if (email) {
      window.location.href = `mailto:${email}?subject=${encodeURIComponent('She-Na event reminder')}&body=${message}`;
    }
  }

  function handleSendReminderAll() {
    const emails = filteredRegistrations.map(getParticipantEmail).filter(Boolean).join(',');
    if (emails) {
      window.location.href = `mailto:${emails}?subject=${encodeURIComponent('She-Na event reminder')}`;
    } else {
      setToast('No participant emails available.');
    }
  }

  function handleExportCsv() {
    const header = ['Name', 'Email', 'Phone', 'Status', 'Registered At'];
    const rows = filteredRegistrations.map((registration) => [
      getParticipantName(registration),
      getParticipantEmail(registration),
      getParticipantPhone(registration),
      getParticipantStatus(registration),
      formatRegistrationDate(registration.registeredAt),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEvent?.title || 'event'}-participants.csv`.replace(/[^a-z0-9._-]/gi, '_');
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="admin-events-page" dir="ltr">
      <div className={`admin-events-shell${drawerOpen || participantsDrawerOpen ? ' has-drawer' : ''}${participantsDrawerOpen ? ' has-participants-drawer' : ''}`}>
        <main className="admin-events-main">
          <header className="admin-events-header">
            <div>
              <h1>Events Management</h1>
              <p>Create, update, and manage platform events.</p>
            </div>
          </header>

          <section className="admin-events-stats" aria-label="Event summary">
            <article className="admin-events-stat admin-events-stat--pink">
              <header>
                <span className="admin-events-stat__icon"><Groups /></span>
                <span className="admin-events-stat__menu">...</span>
              </header>
              <p>Workshops</p>
              <strong>{workshopsCount}</strong>
              <span className="admin-events-stat__bar"><i style={{ width: `${typedEvents.length ? (workshopsCount / typedEvents.length) * 100 : 0}%` }} /></span>
              <small>{workshopsCount} {workshopsCount === 1 ? 'event' : 'events'}</small>
            </article>
            <article className="admin-events-stat admin-events-stat--purple">
              <header>
                <span className="admin-events-stat__icon"><EventAvailable /></span>
                <span className="admin-events-stat__menu">...</span>
              </header>
              <p>Appointments</p>
              <strong>{appointmentsCount}</strong>
              <span className="admin-events-stat__bar"><i style={{ width: `${typedEvents.length ? (appointmentsCount / typedEvents.length) * 100 : 0}%` }} /></span>
              <small>{appointmentsCount} {appointmentsCount === 1 ? 'event' : 'events'}</small>
            </article>
          </section>

          <div className="admin-events-tabs-row">
            <div className="admin-events-tabs" aria-label="Event type tabs">
              <button
                className={activeTab === 'workshop' ? 'is-active' : ''}
                type="button"
                onClick={() => changeTab('workshop')}
              >
                <span><Groups fontSize="small" /></span>
                Workshops
              </button>
              <button
                className={activeTab === 'appointment' ? 'is-active' : ''}
                type="button"
                onClick={() => changeTab('appointment')}
              >
                <span><CalendarMonth fontSize="small" /></span>
                Appointments
              </button>
            </div>
            <button className="admin-events-primary-btn" type="button" onClick={openCreate} id="btn-create-event">
              <span className="admin-events-primary-btn__label">Add New Event</span>
              <span className="admin-events-primary-btn__plus">+</span>
            </button>
          </div>

          <section className="admin-events-filterbar" aria-label="Search and filter events">
            <label className="admin-events-search">
              <Search />
              <input
                type="search"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Sort by</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">Start Date (Newest)</option>
                <option value="oldest">Start Date (Oldest)</option>
                <option value="title">Title</option>
              </select>
            </label>
            <button className="admin-events-icon-btn admin-events-filter-btn" type="button" aria-label="Open advanced filters">
              <FilterList />
            </button>
            <button className="admin-events-icon-btn" type="button" onClick={fetchEvents} aria-label="Refresh events">
              <Refresh />
            </button>
          </section>

          <section className="admin-events-table-card">
            <div className="admin-events-table-wrap">
              <table className="admin-events-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date &amp; Time</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <tr className="admin-events-skeleton-row" key={index}>
                        <td colSpan="6"><span /></td>
                      </tr>
                    ))
                  ) : filteredEvents.length ? (
                    filteredEvents.map((event) => {
                      const registered = counts[event.id] ?? 0;
                      const capacity = Number(event.maxParticipants || event.capacity) || 0;
                      const progress = capacity ? Math.min(100, (registered / capacity) * 100) : 0;
                      const imageUrl = getEventImage(event);

                      return (
                        <tr key={event.id}>
                          <td>
                            <div className="admin-events-event-cell">
                              {imageUrl ? (
                                <img src={imageUrl} alt="" />
                              ) : (
                                <span className="admin-events-thumb-fallback"><Category /></span>
                              )}
                              <div>
                                <strong>{event.title || 'Untitled Event'}</strong>
                                <span>{event.category || (event.eventType === 'appointment' ? 'Appointment' : 'Workshop')}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="admin-events-meta">
                              <span><CalendarMonth /> {formatDate(event.startTime || event.date)}</span>
                              <span><Schedule /> {formatTimeRange(event.startTime || event.date, event.endTime)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="admin-events-location">
                              <LocationOnOutlined />
                              {event.location || 'She-Na Center'}
                            </div>
                          </td>
                          <td>
                            <div className="admin-events-capacity">
                              <strong>{registered} / {capacity || '-'}</strong>
                              <span><i style={{ width: `${progress}%` }} /></span>
                            </div>
                          </td>
                          <td>
                            <span className={`admin-events-status admin-events-status--${event.status}`}>
                              {event.status}
                            </span>
                          </td>
                          <td>
                            <div className="admin-events-actions">
                              <button type="button" onClick={() => openEdit(event)} aria-label="Edit event">
                                <EditOutlined />
                              </button>
                              <button type="button" onClick={() => openParticipants(event)} aria-label="View participants">
                                <Groups />
                              </button>
                              <button type="button" onClick={() => handleDelete(event.id, event.title)} aria-label="Delete event">
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <div className="admin-events-empty">
                          <Tune />
                          <strong>No {activeTab === 'workshop' ? 'workshops' : 'appointments'} found</strong>
                          <p>Adjust your filters or add a new event.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="admin-events-table-footer">
              <span>Showing {filteredEvents.length ? `1 to ${filteredEvents.length}` : '0'} of {filteredEvents.length} {activeTab}s</span>
              <span>Rows per page: 10</span>
            </footer>
          </section>
        </main>

        <aside className={`admin-events-drawer${drawerOpen ? ' is-open' : ''}`} aria-label="Edit event drawer">
          <form onSubmit={handleSave}>
            <header>
              <h2>{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
              <button type="button" onClick={closeDrawer} aria-label="Close event drawer">
                <Close />
              </button>
            </header>

            <div className="admin-events-form-grid">
              <label>
                Event Title <b>*</b>
                <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} required />
              </label>
              <label>
                Type <b>*</b>
                <select value={form.type} onChange={(event) => updateForm('type', event.target.value)} required>
                  <option value="workshop">Workshop</option>
                  <option value="appointment">Appointment</option>
                </select>
              </label>
              <label>
                Category
                <select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                  {EVENT_CATEGORIES.map((categoryName) => (
                    <option key={categoryName} value={categoryName}>{categoryName}</option>
                  ))}
                </select>
              </label>
              <label className="admin-events-span-2">
                Description
                <textarea
                  rows="5"
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                />
              </label>
              <section className="admin-events-image-section admin-events-span-2">
                <div>
                  <label>
                    Event Image URL
                    <input
                      type="url"
                      placeholder="https://example.com/event-photo.jpg"
                      value={form.imageUrl}
                      onChange={(event) => updateForm('imageUrl', event.target.value)}
                    />
                  </label>
                  <p>This image appears on the event card and public event pages.</p>
                </div>
                <div className="admin-events-image-preview">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Event preview" />
                  ) : (
                    <span><Category /> Image preview</span>
                  )}
                </div>
              </section>
              <label>
                Date
                <input type="date" value={form.date} onChange={(event) => updateForm('date', event.target.value)} required />
              </label>
              <label>
                Start Time
                <input type="time" value={form.startTime} onChange={(event) => updateForm('startTime', event.target.value)} required />
              </label>
              <label>
                End Time
                <input type="time" value={form.endTime} onChange={(event) => updateForm('endTime', event.target.value)} />
              </label>
              <label>
                Location
                <input value={form.location} onChange={(event) => updateForm('location', event.target.value)} required />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  min="1"
                  value={form.maxParticipants}
                  onChange={(event) => updateForm('maxParticipants', event.target.value)}
                  required
                />
              </label>
              <label>
                Status
                <select value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </label>
            </div>

            <footer>
              <button className="admin-events-cancel-btn" type="button" onClick={closeDrawer}>Cancel</button>
              <button className="admin-events-save-btn" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </footer>
          </form>
        </aside>

        <aside className={`admin-events-participants-drawer${participantsDrawerOpen ? ' is-open' : ''}`} aria-label="Participants drawer">
          <header className="admin-events-participants-header">
            <div>
              <h2>Participants</h2>
              <p>Event Registrations</p>
            </div>
            <button type="button" onClick={closeParticipantsDrawer} aria-label="Close participants drawer">
              <Close />
            </button>
          </header>

          {selectedEvent ? (
            <div className="admin-events-participants-body">
              <section className="admin-events-participant-summary">
                {getEventImage(selectedEvent) ? (
                  <img src={getEventImage(selectedEvent)} alt="" />
                ) : (
                  <span className="admin-events-participant-summary__fallback"><Category /></span>
                )}
                <div>
                  <div className="admin-events-participant-summary__title-row">
                    <h3>{selectedEvent.title || 'Untitled Event'}</h3>
                    <span className={`admin-events-status admin-events-status--${normalizeStatus(selectedEvent.status)}`}>
                      {normalizeStatus(selectedEvent.status)}
                    </span>
                  </div>
                  <div className="admin-events-participant-summary__meta">
                    <span><CalendarMonth /> {formatDate(selectedEvent.startTime || selectedEvent.date)}</span>
                    <span><Schedule /> {formatTimeRange(selectedEvent.startTime || selectedEvent.date, selectedEvent.endTime)}</span>
                  </div>
                  <div className="admin-events-participant-summary__capacity">
                    <strong>{selectedEventRegistered} / {selectedEventCapacity || '-'}</strong>
                    <span><i style={{ width: `${selectedEventProgress}%` }} /></span>
                  </div>
                </div>
              </section>

              <section className="admin-events-participant-stats" aria-label="Participant stats">
                <article><Groups /><strong>{participantStats.registered}</strong><span>Registered</span></article>
                <article><EventAvailable /><strong>{participantStats.remaining}</strong><span>Remaining</span></article>
                <article><CheckCircle /><strong>{participantStats.checkedIn}</strong><span>Checked-In</span></article>
                <article><Schedule /><strong>{participantStats.waitlist}</strong><span>Waitlist</span></article>
              </section>

              <section className="admin-events-participant-controls">
                <label className="admin-events-search">
                  <Search />
                  <input
                    type="search"
                    placeholder="Search participant..."
                    value={participantSearch}
                    onChange={(event) => setParticipantSearch(event.target.value)}
                  />
                </label>
                <select value={participantFilter} onChange={(event) => setParticipantFilter(event.target.value)}>
                  <option value="all">Filter</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="waitlist">Waitlist</option>
                </select>
                <select value={participantSort} onChange={(event) => setParticipantSort(event.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </section>

              <p className="admin-events-participant-count">{filteredRegistrations.length} Participants</p>

              <section className="admin-events-participant-list">
                {registrationsLoading ? (
                  Array.from({ length: 5 }).map((_, index) => <span className="admin-events-participant-skeleton" key={index} />)
                ) : filteredRegistrations.length ? (
                  filteredRegistrations.map((registration) => {
                    const name = getParticipantName(registration);
                    const email = getParticipantEmail(registration);
                    const status = getParticipantStatus(registration);
                    const canReminder = Boolean(getParticipantPhone(registration) || email);

                    return (
                      <article className="admin-events-participant-row" key={registration.id}>
                        <span className="admin-events-participant-avatar">{getInitials(name || email)}</span>
                        <div className="admin-events-participant-person">
                          <strong>{name}</strong>
                          <span>{email || 'No email available'}</span>
                        </div>
                        <time>{formatRegistrationDate(registration.registeredAt)}</time>
                        <span className={`admin-events-participant-chip admin-events-participant-chip--${status}`}>
                          {status === 'checked-in' ? 'Checked-In' : status}
                        </span>
                        <div className="admin-events-participant-actions">
                          <button
                            type="button"
                            disabled={status === 'checked-in'}
                            onClick={() => handleCheckIn(registration)}
                            aria-label="Check in participant"
                          >
                            <CheckCircle />
                          </button>
                          <button
                            type="button"
                            disabled={!canReminder}
                            onClick={() => handleReminder(registration)}
                            aria-label="Send reminder"
                          >
                            <WhatsApp />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(registration)}
                            aria-label="Remove participant"
                          >
                            <PersonRemoveOutlined />
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="admin-events-empty">
                    <Groups />
                    <strong>No participants found</strong>
                    <p>Registrations will appear here when participants join this event.</p>
                  </div>
                )}
              </section>
            </div>
          ) : null}

          <footer className="admin-events-participants-footer">
            <button type="button" onClick={handleExportCsv} disabled={!filteredRegistrations.length}>
              <FileDownloadOutlined />
              Export CSV
            </button>
            <button type="button" onClick={handleSendReminderAll} disabled={!filteredRegistrations.length}>
              <SendOutlined />
              Send Reminder
            </button>
            <button type="button" onClick={closeParticipantsDrawer}>Close</button>
          </footer>
        </aside>
      </div>

      {drawerOpen ? <button className="admin-events-backdrop" type="button" onClick={closeDrawer} aria-label="Close edit drawer" /> : null}
      {participantsDrawerOpen ? <button className="admin-events-backdrop" type="button" onClick={closeParticipantsDrawer} aria-label="Close participants drawer" /> : null}
      {toast ? <div className="admin-events-toast" role="status">{toast}</div> : null}
    </section>
  );
}
