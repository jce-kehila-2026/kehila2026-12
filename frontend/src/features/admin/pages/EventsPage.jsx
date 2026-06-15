import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ArrowForward from '@mui/icons-material/ArrowForward';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Category from '@mui/icons-material/Category';
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
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined';
import { createEvent, deleteEvent, getAllEvents, updateEvent } from '../services/eventService';
import {
  getBookingsByEvent,
  getRegistrationCounts,
  getRegistrationsByEvent,
  removeRegistration,
  updateRegistrationStatus,
} from '../services/registrationService';
import './EventsPage.css';

const STATUS_OPTIONS = ['published', 'draft', 'hidden', 'archived', 'cancelled'];

const WEEKDAY_OPTIONS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const EVENT_FORM_STEPS = [
  {
    title: 'Basic Information',
    description: 'Event title, type and summary',
  },
  {
    title: 'Scheduling',
    description: 'Date, time and recurring options',
  },
  {
    title: 'Event Setup',
    description: 'Location, capacity, image and settings',
  },
  {
    title: 'Review & Publish',
    description: 'Review and publish your event',
  },
];

function createEmptySlot() {
  return {
    id: '',
    startTime: '',
    endTime: '',
    room: '',
    capacity: '1',
  };
}

function createEmptyProvider() {
  return {
    id: '',
    name: '',
    specialty: '',
    room: '',
    avatarUrl: '',
    slots: [createEmptySlot()],
  };
}

function createInitialForm(type = 'workshop') {
  return {
    title: '',
    type,
    description: '',
    imageUrl: '',
    recurrence: 'weekly',
    weeklyDayIndex: '',
    registrationOpen: true,
    disabledDates: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: '',
    status: 'published',
    providers: [createEmptyProvider()],
  };
}

const initialForm = createInitialForm();

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

function parseTimeString(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
}

function normalizeTimeString(value) {
  const time = parseTimeString(value);
  if (!time) return '';
  return `${pad(time.hours)}:${pad(time.minutes)}`;
}

function dateInputValue(value) {
  const date = toDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeInputValue(value) {
  if (typeof value === 'string') return normalizeTimeString(value);
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
  const startTime = typeof startValue === 'string' ? normalizeTimeString(startValue) : '';
  const endTime = typeof endValue === 'string' ? normalizeTimeString(endValue) : '';
  if (startTime) return endTime ? `${startTime} - ${endTime}` : startTime;

  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start) return 'Time TBD';
  const formatter = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false });
  return end ? `${formatter.format(start)} - ${formatter.format(end)}` : formatter.format(start);
}

function getWeekdayName(value) {
  const day = WEEKDAY_OPTIONS.find((option) => option.value === Number(value));
  return day?.label || '';
}

function getWeekdayIndex(value) {
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 6) return String(numeric);
  const normalized = String(value || '').trim().toLowerCase();
  const option = WEEKDAY_OPTIONS.find((day) => day.label.toLowerCase() === normalized);
  return option ? String(option.value) : '';
}

function slugifyIdentifier(value, fallback = 'item') {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || fallback;
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
  const recurringDayIndex = getWeekdayIndex(
    event.weeklyDayIndex ?? event.dayIndex ?? event.recurringDayIndex ?? event.dayOfWeekIndex ?? event.weeklyDay
  );
  const isRecurring = event.isRecurringTemplate || event.recurrence === 'weekly' || recurringDayIndex !== '';

  return {
    title: event.title || '',
    type: inferType(event),
    description: event.description || '',
    imageUrl: event.imageUrl || event.thumbnailUrl || event.coverImageUrl || '',
    recurrence: isRecurring ? 'weekly' : 'one-time',
    weeklyDayIndex: recurringDayIndex,
    registrationOpen: event.registrationOpen !== false,
    disabledDates: Array.isArray(event.disabledDates) ? event.disabledDates.join(', ') : '',
    date: dateInputValue(event.startTime || event.date),
    startTime: timeInputValue(event.startTime || event.date),
    endTime: timeInputValue(event.endTime),
    location: event.location || '',
    maxParticipants: event.maxParticipants || event.capacity || '',
    status: normalizeStatus(event.status),
    providers: normalizeProvidersForForm(event),
  };
}

function getEventImage(event) {
  return event.imageUrl || event.thumbnailUrl || event.coverImageUrl || '';
}

function normalizeSlotForForm(slot = {}, provider = {}, event = {}, index = 0) {
  const startTime = timeInputValue(slot.startTime || slot.start || slot.from || provider.startTime || event.startTime || event.date);
  const endTime = timeInputValue(slot.endTime || slot.end || slot.to || provider.endTime || event.endTime);
  const room = slot.room || slot.location || provider.room || provider.location || event.room || event.location || '';
  return {
    id: slot.id || `${slugifyIdentifier(provider.id || provider.name || provider.providerName, 'provider')}-${startTime || `slot-${index + 1}`}`,
    startTime,
    endTime,
    room,
    capacity: String(slot.capacity || slot.maxParticipants || slot.availableSpots || provider.capacity || event.maxParticipants || event.capacity || 1),
  };
}

function normalizeProvidersForForm(event) {
  const providerEntries = [
    event.providers,
    event.therapists,
    event.providerSlots,
    event.sessionProviders,
  ].find((items) => Array.isArray(items) && items.length) || [];

  if (providerEntries.length) {
    return providerEntries.map((provider, providerIndex) => {
      const name = provider.name || provider.providerName || provider.therapistName || provider.instructorName || provider.therapist || provider.instructor || '';
      const providerSlots = [
        provider.slots,
        provider.timeSlots,
        provider.availableSlots,
      ].find((items) => Array.isArray(items) && items.length) || [provider];

      return {
        id: provider.id || provider.uid || slugifyIdentifier(name, `provider-${providerIndex + 1}`),
        name,
        specialty: provider.specialty || provider.role || provider.title || provider.category || event.category || '',
        room: provider.room || provider.location || event.room || event.location || '',
        avatarUrl: provider.avatarUrl || provider.photoUrl || provider.imageUrl || provider.profileImage || '',
        slots: providerSlots.map((slot, slotIndex) => normalizeSlotForForm(slot, provider, event, slotIndex)),
      };
    });
  }

  const looseSlots = [
    event.timeSlots,
    event.slots,
    event.availableSlots,
  ].find((items) => Array.isArray(items) && items.length) || [];

  if (looseSlots.length) {
    return [{
      ...createEmptyProvider(),
      name: event.provider || event.therapist || event.instructor || event.facilitator || '',
      specialty: event.category || '',
      room: event.room || event.location || '',
      slots: looseSlots.map((slot, slotIndex) => normalizeSlotForForm(slot, {}, event, slotIndex)),
    }];
  }

  return [{
    ...createEmptyProvider(),
    name: event.provider || event.therapist || event.instructor || event.facilitator || '',
    specialty: event.category || '',
    room: event.room || event.location || '',
    slots: [normalizeSlotForForm({}, {}, event, 0)],
  }];
}

function parseDisabledDates(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildProvidersPayload(providers) {
  return providers
    .map((provider, providerIndex) => {
      const name = String(provider.name || '').trim();
      const providerId = slugifyIdentifier(provider.id || name, `provider-${providerIndex + 1}`);
      const slots = (provider.slots || [])
        .map((slot, slotIndex) => {
          const startTime = normalizeTimeString(slot.startTime);
          const endTime = normalizeTimeString(slot.endTime);
          if (!startTime) return null;

          return {
            id: String(slot.id || '').trim() || `${providerId}-${startTime.replace(':', '')}`,
            startTime,
            endTime,
            room: String(slot.room || '').trim() || String(provider.room || '').trim(),
            capacity: Number(slot.capacity) || 1,
          };
        })
        .filter(Boolean);

      if (!name && slots.length === 0) return null;

      return {
        id: providerId,
        name: name || `Provider ${providerIndex + 1}`,
        specialty: String(provider.specialty || '').trim(),
        room: String(provider.room || '').trim(),
        avatarUrl: String(provider.avatarUrl || '').trim(),
        slots,
      };
    })
    .filter(Boolean);
}

function getFirstProviderSlot(providers) {
  return providers.flatMap((provider) => provider.slots || []).find((slot) => slot.startTime) || null;
}

function getLastProviderSlot(providers) {
  return [...providers.flatMap((provider) => provider.slots || [])].reverse().find((slot) => slot.endTime || slot.startTime) || null;
}

function formatScheduleDate(event) {
  if (event?.isRecurringTemplate || event?.recurrence === 'weekly') {
    const dayName = event.weeklyDay || getWeekdayName(event.weeklyDayIndex);
    return dayName ? `Every ${dayName}` : 'Weekly schedule';
  }
  return formatDate(event.startTime || event.date);
}

function formatScheduleTime(event) {
  return formatTimeRange(event.startTime || event.date, event.endTime);
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
  const status = String(registration.status || 'confirmed').toLowerCase();
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  if (status === 'pending' || status === 'waitlist') return status;
  if (status === 'completed') return 'completed';
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

function toLocalDateKey(value) {
  const date = value ? toDate(value) : null;
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getBookingDateKey(registration) {
  return registration.dateKey || toLocalDateKey(registration.selectedDate || registration.startAt || registration.date);
}

function formatScheduleTimeOnly(value) {
  const normalized = typeof value === 'string' ? normalizeTimeString(value) : '';
  if (normalized) {
    const [hour, minute] = normalized.split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);
    return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  const date = toDate(value);
  return date ? new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(date) : 'Time TBD';
}

function getAppointmentTime(registration) {
  return formatScheduleTimeOnly(registration.selectedTime || registration.startAt || registration.startTime || registration.time);
}

function getAppointmentSortTime(registration) {
  const explicitTime = normalizeTimeString(registration.selectedTime || registration.startTime || registration.time);
  if (explicitTime) return explicitTime;
  const date = toDate(registration.startAt || registration.selectedDate);
  return date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : '99:99';
}

function getRegistrationProviderId(registration) {
  return String(registration.providerId || registration.providerUid || slugifyIdentifier(registration.providerName || 'unassigned')).trim();
}

function getRegistrationProviderName(registration) {
  return registration.providerName || registration.provider || registration.therapistName || registration.instructorName || 'Provider not assigned';
}

function getAppointmentStatus(registration) {
  const status = getParticipantStatus(registration);
  return status === 'waitlist' ? 'pending' : status;
}

function formatDateLabel(dateKey) {
  const date = toDate(dateKey);
  if (!date) return dateKey || 'Selected date';
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

function getNearestUpcomingDateKey(dateKeys) {
  if (!dateKeys.length) return '';
  const todayKey = toLocalDateKey(new Date());
  return dateKeys.find((dateKey) => dateKey >= todayKey) || dateKeys[dateKeys.length - 1];
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
  const [activeFormStep, setActiveFormStep] = useState(0);
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
  const [registrationsError, setRegistrationsError] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedParticipantDate, setSelectedParticipantDate] = useState(() => toLocalDateKey(new Date()));
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);

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

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const originalBodyOverflow = document.body.style.overflow;
    const originalDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeDrawer();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocumentOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

  const typedEvents = useMemo(
    () => events.map((event) => ({ ...event, eventType: inferType(event), status: normalizeStatus(event.status) })),
    [events]
  );

  const workshopsCount = typedEvents.filter((event) => event.eventType === 'workshop').length;
  const appointmentsCount = typedEvents.filter((event) => event.eventType === 'appointment').length;
  const selectedEventCapacity = Number(selectedEvent?.maxParticipants || selectedEvent?.capacity) || 0;
  const selectedEventRegistered = selectedEvent ? (counts[selectedEvent.id] ?? registrations.length) : 0;
  const selectedEventProgress = selectedEventCapacity ? Math.min(100, (selectedEventRegistered / selectedEventCapacity) * 100) : 0;
  const currentFormStep = EVENT_FORM_STEPS[activeFormStep];
  const isLastFormStep = activeFormStep === EVENT_FORM_STEPS.length - 1;
  const descriptionCount = form.description.length;

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
    const waitlist = registrations.filter((registration) => getParticipantStatus(registration) === 'waitlist').length;
    const remaining = selectedEventCapacity ? Math.max(0, selectedEventCapacity - registered) : 0;
    return { registered, remaining, waitlist };
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

  const selectedEventIsAppointment = selectedEvent ? inferType(selectedEvent) === 'appointment' : false;

  const appointmentProviders = useMemo(() => {
    if (!selectedEventIsAppointment || !selectedEvent) return [];

    const providers = new Map();
    normalizeProvidersForForm(selectedEvent).forEach((provider, index) => {
      const name = provider.name || `Provider ${index + 1}`;
      const id = String(provider.id || slugifyIdentifier(name, `provider-${index + 1}`));
      providers.set(id, {
        id,
        name,
        specialty: provider.specialty || selectedEvent.category || '',
        avatarUrl: provider.avatarUrl || '',
        count: 0,
      });
    });

    registrations.forEach((registration) => {
      const providerName = getRegistrationProviderName(registration);
      const providerId = getRegistrationProviderId(registration);
      if (!providers.has(providerId)) {
        providers.set(providerId, {
          id: providerId,
          name: providerName,
          specialty: registration.providerSpecialty || registration.specialty || selectedEvent.category || '',
          avatarUrl: registration.providerAvatarUrl || registration.providerPhotoUrl || '',
          count: 0,
        });
      }
      providers.get(providerId).count += 1;
    });

    return Array.from(providers.values()).filter((provider) => provider.name || provider.count);
  }, [registrations, selectedEvent, selectedEventIsAppointment]);

  const appointmentBookedDates = useMemo(() => {
    if (!selectedEventIsAppointment || !selectedProviderId) return [];

    const dateCounts = new Map();
    registrations
      .filter((registration) => getRegistrationProviderId(registration) === selectedProviderId)
      .forEach((registration) => {
        const dateKey = getBookingDateKey(registration);
        if (!dateKey) return;
        dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1);
      });

    return Array.from(dateCounts.entries())
      .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
      .map(([dateKey, count]) => ({ dateKey, count }));
  }, [registrations, selectedEventIsAppointment, selectedProviderId]);

  const appointmentScheduleRows = useMemo(() => {
    if (!selectedEventIsAppointment || !selectedProviderId) return [];
    return registrations
      .filter((registration) => getRegistrationProviderId(registration) === selectedProviderId)
      .filter((registration) => getBookingDateKey(registration) === selectedParticipantDate)
      .sort((left, right) => getAppointmentSortTime(left).localeCompare(getAppointmentSortTime(right)));
  }, [registrations, selectedEventIsAppointment, selectedParticipantDate, selectedProviderId]);

  const visibleParticipantRows = selectedEventIsAppointment ? appointmentScheduleRows : filteredRegistrations;

  useEffect(() => {
    if (!selectedEventIsAppointment) return;
    if (selectedProviderId && appointmentProviders.some((provider) => provider.id === selectedProviderId)) return;
    setSelectedProviderId(appointmentProviders[0]?.id || '');
  }, [appointmentProviders, selectedEventIsAppointment, selectedProviderId]);

  useEffect(() => {
    if (!selectedEventIsAppointment) return;
    const dateKeys = appointmentBookedDates.map((item) => item.dateKey);

    if (!dateKeys.length) {
      if (selectedParticipantDate) setSelectedParticipantDate('');
      return;
    }

    if (!dateKeys.includes(selectedParticipantDate)) {
      setSelectedParticipantDate(getNearestUpcomingDateKey(dateKeys));
    }
  }, [appointmentBookedDates, selectedEventIsAppointment, selectedParticipantDate]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function goToNextFormStep() {
    setActiveFormStep((current) => Math.min(EVENT_FORM_STEPS.length - 1, current + 1));
  }

  function goToPreviousFormStep() {
    setActiveFormStep((current) => Math.max(0, current - 1));
  }

  function updateProvider(providerIndex, field, value) {
    setForm((current) => ({
      ...current,
      providers: current.providers.map((provider, index) =>
        index === providerIndex ? { ...provider, [field]: value } : provider
      ),
    }));
  }

  function addProvider() {
    setForm((current) => ({
      ...current,
      providers: [...current.providers, createEmptyProvider()],
    }));
  }

  function removeProvider(providerIndex) {
    setForm((current) => ({
      ...current,
      providers: current.providers.length > 1
        ? current.providers.filter((_, index) => index !== providerIndex)
        : [createEmptyProvider()],
    }));
  }

  function updateProviderSlot(providerIndex, slotIndex, field, value) {
    setForm((current) => ({
      ...current,
      providers: current.providers.map((provider, index) => {
        if (index !== providerIndex) return provider;
        return {
          ...provider,
          slots: provider.slots.map((slot, nextSlotIndex) =>
            nextSlotIndex === slotIndex ? { ...slot, [field]: value } : slot
          ),
        };
      }),
    }));
  }

  function addProviderSlot(providerIndex) {
    setForm((current) => ({
      ...current,
      providers: current.providers.map((provider, index) =>
        index === providerIndex
          ? { ...provider, slots: [...provider.slots, createEmptySlot()] }
          : provider
      ),
    }));
  }

  function removeProviderSlot(providerIndex, slotIndex) {
    setForm((current) => ({
      ...current,
      providers: current.providers.map((provider, index) => {
        if (index !== providerIndex) return provider;
        const nextSlots = provider.slots.length > 1
          ? provider.slots.filter((_, nextSlotIndex) => nextSlotIndex !== slotIndex)
          : [createEmptySlot()];
        return { ...provider, slots: nextSlots };
      }),
    }));
  }

  function changeTab(nextTab) {
    setActiveTab(nextTab);
    setSearchParams(nextTab === 'appointment' ? { type: 'appointments' } : { type: 'workshops' });
  }

  function openCreate() {
    const type = activeTab;
    setParticipantsDrawerOpen(false);
    setEditingEvent(null);
    setForm(createInitialForm(type));
    setActiveFormStep(0);
    setDrawerOpen(true);
  }

  function openEdit(event) {
    setParticipantsDrawerOpen(false);
    setEditingEvent(event);
    setForm(eventToForm(event));
    setActiveFormStep(0);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingEvent(null);
    setForm(createInitialForm());
    setActiveFormStep(0);
  }

  async function openParticipants(event) {
    setDrawerOpen(false);
    setSelectedEvent(event);
    setParticipantsDrawerOpen(true);
    setParticipantSearch('');
    setParticipantFilter('all');
    setParticipantSort('newest');
    setRegistrationsError('');
    setSelectedProviderId('');
    setSelectedParticipantDate('');
    setSelectedBookingDetails(null);
    setRegistrationsLoading(true);
    try {
      const data = inferType(event) === 'appointment'
        ? await getBookingsByEvent(event.id)
        : await getRegistrationsByEvent(event.id);
      setRegistrations(data);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setRegistrations([]);
      setRegistrationsError('Could not load participants.');
      setToast('Could not load participants.');
    } finally {
      setRegistrationsLoading(false);
    }
  }

  function closeParticipantsDrawer() {
    setParticipantsDrawerOpen(false);
    setSelectedEvent(null);
    setRegistrations([]);
    setRegistrationsError('');
    setSelectedProviderId('');
    setSelectedBookingDetails(null);
  }

  async function handleSave(event) {
    event.preventDefault();
    const isRecurring = form.recurrence === 'weekly';
    const providersPayload = buildProvidersPayload(form.providers);
    const firstSlot = getFirstProviderSlot(providersPayload);
    const lastSlot = getLastProviderSlot(providersPayload);
    const startDate = isRecurring ? null : composeDateTime(form.date, form.startTime);
    const endDate = isRecurring ? null : composeDateTime(form.date, form.endTime);

    if (!form.title.trim()) {
      setToast('Please add an event title.');
      return;
    }

    if (isRecurring && form.weeklyDayIndex === '') {
      setToast('Please choose the weekly day.');
      return;
    }

    if (isRecurring && !firstSlot) {
      setToast('Please add at least one provider time slot.');
      return;
    }

    if (!isRecurring && !startDate) {
      setToast('Please add a valid date and start time.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      type: form.type,
      recurrence: form.recurrence,
      isRecurringTemplate: isRecurring,
      weeklyDay: isRecurring ? getWeekdayName(form.weeklyDayIndex) : '',
      weeklyDayIndex: isRecurring ? Number(form.weeklyDayIndex) : null,
      startTime: isRecurring ? firstSlot.startTime : startDate,
      endTime: isRecurring ? (lastSlot.endTime || lastSlot.startTime) : endDate,
      location: form.location.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      maxParticipants: Number(form.maxParticipants) || 0,
      registrationOpen: form.registrationOpen,
      disabledDates: parseDisabledDates(form.disabledDates),
      providers: providersPayload,
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

  async function handleStatusUpdate(registration, status) {
    if (!selectedEvent) return;
    try {
      await updateRegistrationStatus(registration.id, selectedEvent.id, status);
      setRegistrations((current) =>
        current.map((item) => (
          item.id === registration.id
            ? { ...item, status }
            : item
        ))
      );
      setToast('Booking status updated.');
    } catch (err) {
      console.error('Status update failed:', err);
      setToast('Could not update booking status.');
    }
  }

  function handleParticipantsRetry() {
    if (selectedEvent) openParticipants(selectedEvent);
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

  function handleEmailParticipant(registration) {
    const email = getParticipantEmail(registration);
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  }

  function handleSendReminderAll() {
    const emails = visibleParticipantRows.map(getParticipantEmail).filter(Boolean).join(',');
    if (emails) {
      window.location.href = `mailto:${emails}?subject=${encodeURIComponent('She-Na event reminder')}`;
    } else {
      setToast('No participant emails available.');
    }
  }

  function handleExportCsv() {
    const header = selectedEventIsAppointment
      ? ['Time', 'Name', 'Email', 'Phone', 'Provider', 'Status', 'Notes']
      : ['Name', 'Email', 'Phone', 'Status', 'Registered At'];
    const rows = visibleParticipantRows.map((registration) => (
      selectedEventIsAppointment
        ? [
          getAppointmentTime(registration),
          getParticipantName(registration),
          getParticipantEmail(registration),
          getParticipantPhone(registration),
          getRegistrationProviderName(registration),
          getAppointmentStatus(registration),
          registration.notes || registration.adminNotes || registration.specialRequests || '',
        ]
        : [
          getParticipantName(registration),
          getParticipantEmail(registration),
          getParticipantPhone(registration),
          getParticipantStatus(registration),
          formatRegistrationDate(registration.registeredAt),
        ]
    ));
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
                              <span><CalendarMonth /> {formatScheduleDate(event)}</span>
                              <span><Schedule /> {formatScheduleTime(event)}</span>
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

        <aside className={`admin-events-drawer${drawerOpen ? ' is-open' : ''}`} aria-label="Event wizard modal">
          <form onSubmit={handleSave}>
            <header className="admin-events-modal-header">
              <div>
                <h2>{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
                <p>{editingEvent ? 'Update this workshop or appointment' : 'Create a new workshop or appointment'}</p>
              </div>
              <button type="button" onClick={closeDrawer} aria-label="Close event modal">
                <Close />
              </button>
            </header>

            <div className="admin-events-modal-body">
              <aside className="admin-events-modal-sidebar" aria-label="Event form steps">
                <ol className="admin-events-stepper">
                  {EVENT_FORM_STEPS.map((step, index) => (
                    <li className={index === activeFormStep ? 'is-active' : ''} key={step.title}>
                      <button type="button" onClick={() => setActiveFormStep(index)}>
                        <span>{index + 1}</span>
                        <strong>{step.title}</strong>
                        <small>{step.description}</small>
                      </button>
                    </li>
                  ))}
                </ol>

                <div className="admin-events-modal-tip-card">
                  <CalendarMonth />
                  <strong>All set?</strong>
                  <p>You can save as draft and publish later.</p>
                </div>
              </aside>

              <section className="admin-events-modal-content">
                <section className="admin-events-wizard-card">
                  <header className="admin-events-wizard-heading">
                    <span>{activeFormStep + 1}</span>
                    <div>
                      <h3>{currentFormStep.title}</h3>
                      <p>
                        {activeFormStep === 0
                          ? "Let's start with the basics about your event."
                          : currentFormStep.description}
                      </p>
                    </div>
                  </header>

                  {activeFormStep === 0 && (
                    <div className="admin-events-wizard-fields admin-events-wizard-fields--basic">
                      <label>
                        <span className="admin-events-field-label">Event Title <b>*</b></span>
                        <input
                          value={form.title}
                          onChange={(event) => updateForm('title', event.target.value)}
                          placeholder="Enter event title"
                          required
                        />
                      </label>

                      <div className="admin-events-type-field">
                        <span className="admin-events-field-label">Event Type <b>*</b></span>
                        <div className="admin-events-type-cards" role="group" aria-label="Event Type">
                          {[
                            { value: 'workshop', label: 'Workshop', icon: Groups },
                            { value: 'appointment', label: 'Appointment', icon: CalendarMonth },
                          ].map((typeOption) => {
                            const Icon = typeOption.icon;
                            return (
                              <button
                                className={form.type === typeOption.value ? 'is-selected' : ''}
                                type="button"
                                onClick={() => updateForm('type', typeOption.value)}
                                key={typeOption.value}
                              >
                                <Icon fontSize="small" />
                                {typeOption.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <label className="admin-events-span-2">
                        <span className="admin-events-field-label">Short Description <b>*</b></span>
                        <textarea
                          rows="4"
                          maxLength="120"
                          value={form.description}
                          onChange={(event) => updateForm('description', event.target.value)}
                          placeholder="A short summary about your event..."
                        />
                        <small>{descriptionCount}/120</small>
                      </label>

                      <div className="admin-events-wizard-tip admin-events-span-2">
                        <Tune fontSize="small" />
                        <span>Tip: A clear title and description help more people discover your event.</span>
                      </div>
                    </div>
                  )}

                  {activeFormStep === 1 && (
                    <div className="admin-events-wizard-fields">
                      <label>
                        Schedule Type
                        <select value={form.recurrence} onChange={(event) => updateForm('recurrence', event.target.value)}>
                          <option value="weekly">Weekly recurring</option>
                          <option value="one-time">One-time event</option>
                        </select>
                      </label>
                      <label>
                        <span className="admin-events-field-label">
                          Weekly Day {form.recurrence === 'weekly' ? <b>*</b> : null}
                        </span>
                        <select
                          value={form.weeklyDayIndex}
                          onChange={(event) => updateForm('weeklyDayIndex', event.target.value)}
                          required={form.recurrence === 'weekly'}
                          disabled={form.recurrence !== 'weekly'}
                        >
                          <option value="">Choose day</option>
                          {WEEKDAY_OPTIONS.map((day) => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="admin-events-field-label">
                          Date {form.recurrence !== 'weekly' ? <b>*</b> : null}
                        </span>
                        <input
                          type="date"
                          value={form.date}
                          onChange={(event) => updateForm('date', event.target.value)}
                          required={form.recurrence !== 'weekly'}
                          disabled={form.recurrence === 'weekly'}
                        />
                      </label>
                      <label>
                        <span className="admin-events-field-label">
                          Start Time {form.recurrence !== 'weekly' ? <b>*</b> : null}
                        </span>
                        <input
                          type="time"
                          value={form.startTime}
                          onChange={(event) => updateForm('startTime', event.target.value)}
                          required={form.recurrence !== 'weekly'}
                          disabled={form.recurrence === 'weekly'}
                        />
                      </label>
                      <section className="admin-events-provider-section admin-events-span-2">
                        <header>
                          <div>
                            <h3>Providers & Time Slots</h3>
                            <p>These slots control the participant booking calendar.</p>
                          </div>
                          <button type="button" onClick={addProvider}>Add Provider</button>
                        </header>
                        <div className="admin-events-provider-list">
                          {form.providers.map((provider, providerIndex) => (
                            <article className="admin-events-provider-card" key={`${providerIndex}-${provider.id || 'provider'}`}>
                              <div className="admin-events-provider-card__header">
                                <strong>Provider {providerIndex + 1}</strong>
                                <button type="button" onClick={() => removeProvider(providerIndex)}>Remove</button>
                              </div>
                              <div className="admin-events-provider-fields">
                                <label>
                                  <span className="admin-events-field-label">Provider Name <b>*</b></span>
                                  <input
                                    value={provider.name}
                                    onChange={(event) => updateProvider(providerIndex, 'name', event.target.value)}
                                    placeholder="Margarita"
                                  />
                                </label>
                                <label>
                                  Specialty
                                  <input
                                    value={provider.specialty}
                                    onChange={(event) => updateProvider(providerIndex, 'specialty', event.target.value)}
                                    placeholder="Reflexology Therapist"
                                  />
                                </label>
                                <label>
                                  Default Room
                                  <input
                                    value={provider.room}
                                    onChange={(event) => updateProvider(providerIndex, 'room', event.target.value)}
                                    placeholder="Treatment Room #1"
                                  />
                                </label>
                                <label>
                                  Avatar URL
                                  <input
                                    type="url"
                                    value={provider.avatarUrl}
                                    onChange={(event) => updateProvider(providerIndex, 'avatarUrl', event.target.value)}
                                    placeholder="https://example.com/avatar.jpg"
                                  />
                                </label>
                              </div>
                              <div className="admin-events-slot-list">
                                <div className="admin-events-slot-list__title">
                                  <span>Time slots</span>
                                  <button type="button" onClick={() => addProviderSlot(providerIndex)}>Add Slot</button>
                                </div>
                                {provider.slots.map((slot, slotIndex) => (
                                  <div className="admin-events-slot-row" key={`${slotIndex}-${slot.id || 'slot'}`}>
                                    <label>
                                      <span className="admin-events-field-label">Start <b>*</b></span>
                                      <input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(event) => updateProviderSlot(providerIndex, slotIndex, 'startTime', event.target.value)}
                                      />
                                    </label>
                                    <label>
                                      End
                                      <input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(event) => updateProviderSlot(providerIndex, slotIndex, 'endTime', event.target.value)}
                                      />
                                    </label>
                                    <label>
                                      Room
                                      <input
                                        value={slot.room}
                                        onChange={(event) => updateProviderSlot(providerIndex, slotIndex, 'room', event.target.value)}
                                        placeholder={provider.room || 'Room'}
                                      />
                                    </label>
                                    <label>
                                      Capacity
                                      <input
                                        type="number"
                                        min="1"
                                        value={slot.capacity}
                                        onChange={(event) => updateProviderSlot(providerIndex, slotIndex, 'capacity', event.target.value)}
                                      />
                                    </label>
                                    <button type="button" onClick={() => removeProviderSlot(providerIndex, slotIndex)}>Remove</button>
                                  </div>
                                ))}
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {activeFormStep === 2 && (
                    <div className="admin-events-wizard-fields">
                      <label>
                        <span className="admin-events-field-label">Location <b>*</b></span>
                        <input value={form.location} onChange={(event) => updateForm('location', event.target.value)} placeholder="She-Na Center" required />
                      </label>
                      <label>
                        Capacity
                        <input
                          type="number"
                          min="1"
                          value={form.maxParticipants}
                          onChange={(event) => updateForm('maxParticipants', event.target.value)}
                          placeholder="20"
                        />
                      </label>
                      <label className="admin-events-span-2">
                        Disabled Dates
                        <input
                          placeholder="2026-06-03, 2026-06-10"
                          value={form.disabledDates}
                          onChange={(event) => updateForm('disabledDates', event.target.value)}
                        />
                        <small>Comma-separated dates that should not appear in the participant booking calendar.</small>
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
                        Registration
                        <select
                          value={form.registrationOpen ? 'open' : 'closed'}
                          onChange={(event) => updateForm('registrationOpen', event.target.value === 'open')}
                        >
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                        </select>
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
                  )}

                  {activeFormStep === 3 && (
                    <div className="admin-events-review-grid">
                      <article><span>Title</span><strong>{form.title || 'Untitled event'}</strong></article>
                      <article><span>Type</span><strong>{form.type}</strong></article>
                      <article><span>Schedule</span><strong>{form.recurrence === 'weekly' ? `Every ${getWeekdayName(form.weeklyDayIndex) || 'TBD'}` : form.date || 'Date TBD'}</strong></article>
                      <article><span>Registration</span><strong>{form.registrationOpen ? 'Open' : 'Closed'}</strong></article>
                      <article><span>Status</span><strong>{form.status}</strong></article>
                      <article className="admin-events-span-2">
                        <span>Providers</span>
                        <strong>{form.providers.map((provider) => provider.name).filter(Boolean).join(', ') || 'No providers added'}</strong>
                      </article>
                    </div>
                  )}
                </section>

                <footer className="admin-events-wizard-footer">
                  <div className="admin-events-progress-dots" aria-label="Form progress">
                    {EVENT_FORM_STEPS.map((step, index) => (
                      <button
                        className={index === activeFormStep ? 'is-active' : ''}
                        type="button"
                        onClick={() => setActiveFormStep(index)}
                        aria-label={step.title}
                        key={step.title}
                      />
                    ))}
                  </div>
                  <div className="admin-events-wizard-actions">
                    <button className="admin-events-cancel-btn" type="button" onClick={activeFormStep === 0 ? closeDrawer : goToPreviousFormStep}>
                      {activeFormStep === 0 ? 'Cancel' : 'Back'}
                    </button>
                    {isLastFormStep ? (
                      <button className="admin-events-save-btn" type="submit" disabled={saving}>
                        {saving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Publish Event'}
                      </button>
                    ) : (
                      <button className="admin-events-save-btn" type="button" onClick={goToNextFormStep}>
                        Next Step
                        <ArrowForward fontSize="small" />
                      </button>
                    )}
                  </div>
                </footer>
              </section>
            </div>
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
                    <span><CalendarMonth /> {formatScheduleDate(selectedEvent)}</span>
                    <span><Schedule /> {formatScheduleTime(selectedEvent)}</span>
                  </div>
                  <div className="admin-events-participant-summary__capacity">
                    <strong>{selectedEventRegistered} / {selectedEventCapacity || '-'}</strong>
                    <span><i style={{ width: `${selectedEventProgress}%` }} /></span>
                  </div>
                </div>
              </section>

              {selectedEventIsAppointment ? (
                <>
                  <section className="admin-events-provider-tabs" aria-label="Appointment providers">
                    {registrationsLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <span className="admin-events-provider-skeleton" key={index} />
                      ))
                    ) : appointmentProviders.length ? (
                      appointmentProviders.map((provider) => (
                        <button
                          className={provider.id === selectedProviderId ? 'is-active' : ''}
                          type="button"
                          onClick={() => setSelectedProviderId(provider.id)}
                          key={provider.id}
                        >
                          {provider.avatarUrl ? (
                            <img src={provider.avatarUrl} alt="" />
                          ) : (
                            <span>{getInitials(provider.name)}</span>
                          )}
                          <div>
                            <strong>{provider.name}</strong>
                            <small>{provider.specialty || 'Appointment provider'}</small>
                          </div>
                          <em>{provider.count} booking{provider.count === 1 ? '' : 's'}</em>
                        </button>
                      ))
                    ) : (
                      <div className="admin-events-empty admin-events-empty--compact">
                        <Groups />
                        <strong>Select a provider</strong>
                        <p>No providers are connected to this appointment yet.</p>
                      </div>
                    )}
                  </section>

                  <section className="admin-events-schedule-toolbar">
                    <label>
                      <span>Booked dates</span>
                      <select
                        value={selectedParticipantDate}
                        disabled={!appointmentBookedDates.length}
                        onChange={(event) => setSelectedParticipantDate(event.target.value)}
                      >
                        {appointmentBookedDates.length ? (
                          appointmentBookedDates.map((item) => (
                            <option value={item.dateKey} key={item.dateKey}>
                              {formatDateLabel(item.dateKey)} ({item.count})
                            </option>
                          ))
                        ) : (
                          <option value="">No booked dates</option>
                        )}
                      </select>
                    </label>
                    <p>
                      {appointmentBookedDates.length
                        ? 'Only dates with bookings are selectable'
                        : 'No booked dates for this provider.'}
                    </p>
                  </section>

                  <section className="admin-events-schedule-card" aria-label="Appointment schedule">
                    <header>
                      <strong>{selectedParticipantDate ? formatDateLabel(selectedParticipantDate) : 'No booked dates'}</strong>
                      <span>{appointmentScheduleRows.length} booking{appointmentScheduleRows.length === 1 ? '' : 's'}</span>
                    </header>
                    <div className="admin-events-schedule-table">
                      <div className="admin-events-schedule-head">
                        <span>Time</span>
                        <span>Participant</span>
                        <span>Contact</span>
                        <span>Status</span>
                      </div>
                      {registrationsLoading ? (
                        Array.from({ length: 5 }).map((_, index) => <span className="admin-events-participant-skeleton" key={index} />)
                      ) : registrationsError ? (
                        <div className="admin-events-empty">
                          <Tune />
                          <strong>Could not load bookings</strong>
                          <p>{registrationsError}</p>
                          <button type="button" onClick={handleParticipantsRetry}>Retry</button>
                        </div>
                      ) : !selectedProviderId ? (
                        <div className="admin-events-empty">
                          <Groups />
                          <strong>Select a provider</strong>
                          <p>Choose a provider above to view the appointment schedule.</p>
                        </div>
                      ) : !appointmentBookedDates.length ? (
                        <div className="admin-events-empty">
                          <CalendarMonth />
                          <strong>No booked dates for this provider.</strong>
                          <p>Bookings will appear here after participants reserve a slot.</p>
                        </div>
                      ) : appointmentScheduleRows.length ? (
                        appointmentScheduleRows.map((registration) => {
                          const name = getParticipantName(registration);
                          const email = getParticipantEmail(registration);
                          const phone = getParticipantPhone(registration);
                          const status = getAppointmentStatus(registration);
                          const canEmail = Boolean(email);

                          return (
                            <article className="admin-events-schedule-row" key={registration.id}>
                              <time>{getAppointmentTime(registration)}</time>
                              <div className="admin-events-participant-person">
                                <strong>{name}</strong>
                              </div>
                              <div className="admin-events-schedule-contact">
                                {phone ? <span>{phone}</span> : null}
                                {email ? <a href={`mailto:${email}`}>{email}</a> : <span>No email available</span>}
                                {registration.notes || registration.adminNotes || registration.specialRequests ? (
                                  <small>{registration.notes || registration.adminNotes || registration.specialRequests}</small>
                                ) : null}
                              </div>
                              <div className="admin-events-schedule-status-cell">
                                <label className={`admin-events-status-select admin-events-participant-chip--${status}`}>
                                  <span>{status}</span>
                                  <select value={status} onChange={(event) => handleStatusUpdate(registration, event.target.value)}>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="pending">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </label>
                                <div className="admin-events-participant-actions">
                                  <button
                                    type="button"
                                    title="View Details"
                                    onClick={() => setSelectedBookingDetails(registration)}
                                    aria-label="View details"
                                  >
                                    <VisibilityOutlined />
                                  </button>
                                  <button
                                    className="is-email"
                                    type="button"
                                    title="Email Participant"
                                    disabled={!canEmail}
                                    onClick={() => handleEmailParticipant(registration)}
                                    aria-label="Email participant"
                                  >
                                    <MailOutlineOutlinedIcon />
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div className="admin-events-empty">
                          <CalendarMonth />
                          <strong>No bookings for this date</strong>
                          <p>Try another provider or date.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <section className="admin-events-participant-stats" aria-label="Participant stats">
                    <article><Groups /><strong>{participantStats.registered}</strong><span>Registered</span></article>
                    <article><EventAvailable /><strong>{participantStats.remaining}</strong><span>Remaining</span></article>
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
                    ) : registrationsError ? (
                      <div className="admin-events-empty">
                        <Tune />
                        <strong>Could not load participants</strong>
                        <p>{registrationsError}</p>
                        <button type="button" onClick={handleParticipantsRetry}>Retry</button>
                      </div>
                    ) : filteredRegistrations.length ? (
                      filteredRegistrations.map((registration) => {
                        const name = getParticipantName(registration);
                        const email = getParticipantEmail(registration);
                        const status = getParticipantStatus(registration);
                        const canEmail = Boolean(email);

                        return (
                          <article className="admin-events-participant-row" key={registration.id}>
                            <span className="admin-events-participant-avatar">{getInitials(name || email)}</span>
                            <div className="admin-events-participant-person">
                              <strong>{name}</strong>
                              <span>{email || 'No email available'}</span>
                            </div>
                            <time>{formatRegistrationDate(registration.registeredAt)}</time>
                            <span className={`admin-events-participant-chip admin-events-participant-chip--${status}`}>
                              {status}
                            </span>
                            <div className="admin-events-participant-actions">
                              <button
                                className="is-email"
                                type="button"
                                title="Email Participant"
                                disabled={!canEmail}
                                onClick={() => handleEmailParticipant(registration)}
                                aria-label="Email participant"
                              >
                                <MailOutlineOutlinedIcon />
                              </button>
                              <button
                                className="is-remove"
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
                </>
              )}
            </div>
          ) : null}

          <footer className="admin-events-participants-footer">
            <button type="button" onClick={handleExportCsv} disabled={!visibleParticipantRows.length}>
              <FileDownloadOutlined />
              Export CSV
            </button>
            <button type="button" onClick={handleSendReminderAll} disabled={!visibleParticipantRows.length}>
              <SendOutlined />
              Send Reminder
            </button>
            <button type="button" onClick={closeParticipantsDrawer}>Close</button>
          </footer>

          {selectedBookingDetails ? (
            <section className="admin-events-booking-details" aria-label="Booking details">
              <header>
                <strong>Booking Details</strong>
                <button type="button" onClick={() => setSelectedBookingDetails(null)} aria-label="Close booking details">
                  <Close fontSize="small" />
                </button>
              </header>
              <dl>
                <div><dt>Participant</dt><dd>{getParticipantName(selectedBookingDetails)}</dd></div>
                <div><dt>Email</dt><dd>{getParticipantEmail(selectedBookingDetails) || 'No email available'}</dd></div>
                <div><dt>Provider</dt><dd>{getRegistrationProviderName(selectedBookingDetails)}</dd></div>
                <div><dt>Date</dt><dd>{formatDateLabel(getBookingDateKey(selectedBookingDetails))}</dd></div>
                <div><dt>Time</dt><dd>{getAppointmentTime(selectedBookingDetails)}</dd></div>
                <div><dt>Status</dt><dd>{getAppointmentStatus(selectedBookingDetails)}</dd></div>
                <div><dt>Notes</dt><dd>{selectedBookingDetails.notes || selectedBookingDetails.adminNotes || selectedBookingDetails.specialRequests || '-'}</dd></div>
              </dl>
            </section>
          ) : null}
        </aside>
      </div>

      {drawerOpen ? (
        <button
          className="admin-events-backdrop admin-events-backdrop--modal"
          type="button"
          onClick={closeDrawer}
          aria-label="Close event modal"
        />
      ) : null}
      {participantsDrawerOpen ? (
        <button
          className="admin-events-backdrop admin-events-backdrop--participants"
          type="button"
          onClick={closeParticipantsDrawer}
          aria-label="Close participants drawer"
        />
      ) : null}
      {toast ? <div className="admin-events-toast" role="status">{toast}</div> : null}
    </section>
  );
}
