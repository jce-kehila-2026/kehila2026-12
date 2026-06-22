import { useEffect, useMemo, useState, useCallback, useId } from 'react';
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
import { useAdminLocale } from '../context/AdminLocaleContext';
import ReminderTimePicker from '../../../shared/components/ReminderTimePicker';
import ReminderDatePicker from '../../../shared/components/ReminderDatePicker';
import CitySelect from '../../../shared/components/CitySelect';
import '../../../shared/components/ReminderTimePicker.css';
import '../../../shared/styles/public-cta-button.css';
import './EventsPage.css';

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en' };

const STATUS_OPTIONS = ['published', 'draft', 'hidden', 'archived', 'cancelled'];

const EV_STATUS_LABEL_KEYS = {
  published: 'evStatusPublished',
  draft: 'evStatusDraft',
  hidden: 'evStatusHidden',
  archived: 'evStatusArchived',
  cancelled: 'evStatusCancelled',
};

const PARTICIPANT_STATUS_LABEL_KEYS = {
  confirmed: 'pStatusConfirmed',
  pending: 'pStatusPending',
  cancelled: 'pStatusCancelled',
  completed: 'pStatusCompleted',
  waitlist: 'pStatusWaitlist',
};

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
  { titleKey: 'evStepBasicTitle', descKey: 'evStepBasicDesc' },
  { titleKey: 'evStepSchedulingTitle', descKey: 'evStepSchedulingDesc' },
  { titleKey: 'evStepSetupTitle', descKey: 'evStepSetupDesc' },
  { titleKey: 'evStepReviewTitle', descKey: 'evStepReviewDesc' },
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

function formatDate(value, intlLocale = 'en', tbd = 'Date TBD') {
  const date = toDate(value);
  if (!date) return tbd;
  return new Intl.DateTimeFormat(intlLocale, { month: 'short', day: '2-digit', year: 'numeric' }).format(date);
}

function formatTimeRange(startValue, endValue, intlLocale = 'en', tbd = 'Time TBD') {
  const startTime = typeof startValue === 'string' ? normalizeTimeString(startValue) : '';
  const endTime = typeof endValue === 'string' ? normalizeTimeString(endValue) : '';
  if (startTime) return endTime ? `${startTime} - ${endTime}` : startTime;

  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start) return tbd;
  const formatter = new Intl.DateTimeFormat(intlLocale, { hour: '2-digit', minute: '2-digit', hour12: false });
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
  const type = inferType(event);
  const providers = normalizeProvidersForForm(event);
  const workshopSlotTime = providers[0]?.slots?.[0]?.startTime;

  return {
    title: event.title || '',
    type,
    description: event.description || '',
    imageUrl: event.imageUrl || event.thumbnailUrl || event.coverImageUrl || '',
    recurrence: isRecurring ? 'weekly' : 'one-time',
    weeklyDayIndex: recurringDayIndex,
    registrationOpen: event.registrationOpen !== false,
    disabledDates: Array.isArray(event.disabledDates) ? event.disabledDates.join(', ') : '',
    date: dateInputValue(event.date) || dateInputValue(event.startTime || event.date),
    startTime: type === 'workshop'
      ? timeInputValue(workshopSlotTime || event.startTime)
      : timeInputValue(event.startTime || event.date),
    endTime: timeInputValue(event.endTime),
    location: event.location || '',
    maxParticipants: event.maxParticipants || event.capacity || '',
    status: normalizeStatus(event.status),
    providers,
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

function getWorkshopStartTime(form) {
  const slotTime = form.providers?.[0]?.slots?.[0]?.startTime;
  const rawTime = form.startTime || slotTime || '';
  if (typeof rawTime !== 'string') return timeInputValue(rawTime);
  return rawTime;
}

function syncWorkshopFormForSave(form) {
  if (form.type !== 'workshop') return form;

  const provider = form.providers?.[0] || createEmptyProvider();
  const slot = provider.slots?.[0] || createEmptySlot();
  const startTime = normalizeTimeString(getWorkshopStartTime(form) || slot.startTime);

  return {
    ...form,
    startTime,
    providers: [{
      ...provider,
      slots: [{
        ...slot,
        startTime,
        capacity: slot.capacity || String(form.maxParticipants || '1'),
      }],
    }],
  };
}

function getFirstProviderSlot(providers) {
  return providers.flatMap((provider) => provider.slots || []).find((slot) => slot.startTime) || null;
}

function getLastProviderSlot(providers) {
  return [...providers.flatMap((provider) => provider.slots || [])].reverse().find((slot) => slot.endTime || slot.startTime) || null;
}

function formatScheduleDate(event, t, intlLocale) {
  if (event?.isRecurringTemplate || event?.recurrence === 'weekly') {
    const idx = getWeekdayIndex(event.weeklyDayIndex ?? event.weeklyDay);
    const dayName = idx !== '' ? t(`wd${idx}`) : '';
    return dayName ? t('evEveryDay').replace('{day}', dayName) : t('evWeeklySchedule');
  }
  return formatDate(event.startTime || event.date, intlLocale, t('evDateTBD'));
}

function formatScheduleTime(event, intlLocale, tbd) {
  return formatTimeRange(event.startTime || event.date, event.endTime, intlLocale, tbd);
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

function formatRegistrationDate(value, intlLocale = 'en', tbd = 'Registration date TBD') {
  const date = toDate(value);
  if (!date) return tbd;
  return new Intl.DateTimeFormat(intlLocale, {
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

function formatScheduleTimeOnly(value, intlLocale = 'en', tbd = 'Time TBD') {
  const normalized = typeof value === 'string' ? normalizeTimeString(value) : '';
  if (normalized) {
    const [hour, minute] = normalized.split(':');
    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);
    return new Intl.DateTimeFormat(intlLocale, { hour: '2-digit', minute: '2-digit' }).format(date);
  }
  const date = toDate(value);
  return date ? new Intl.DateTimeFormat(intlLocale, { hour: '2-digit', minute: '2-digit' }).format(date) : tbd;
}

function getAppointmentTime(registration, intlLocale, tbd) {
  return formatScheduleTimeOnly(registration.selectedTime || registration.startAt || registration.startTime || registration.time, intlLocale, tbd);
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

function formatDateLabel(dateKey, intlLocale = 'en', fallback = 'Selected date') {
  const date = toDate(dateKey);
  if (!date) return dateKey || fallback;
  return new Intl.DateTimeFormat(intlLocale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
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
  const { t, lang, direction } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en';
  const evStatusLabel = (s) => (EV_STATUS_LABEL_KEYS[s] ? t(EV_STATUS_LABEL_KEYS[s]) : s);
  const pStatusLabel = (s) => (PARTICIPANT_STATUS_LABEL_KEYS[s] ? t(PARTICIPANT_STATUS_LABEL_KEYS[s]) : s);
  const typeLabel = (type) => (type === 'appointment' ? t('apTypeAppointment') : t('apTypeWorkshop'));
  const weekdayLabel = (idx) => (idx === '' || idx === null || idx === undefined ? '' : t(`wd${idx}`));
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
      setToast(t('evToastCouldNotLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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

  const workshopProvider = form.providers?.[0] || createEmptyProvider();
  const workshopStartTime = getWorkshopStartTime(form);
  const isWeeklyWorkshopSchedule = form.type === 'workshop' && form.recurrence === 'weekly';
  const workshopStartTimePickerId = useId();
  const workshopDatePickerId = useId();

  const datePickerLabels = useMemo(
    () => ({
      selectDate: t('evSelectDate'),
      prevMonth: t('evPrevMonth'),
      nextMonth: t('evNextMonth'),
    }),
    [t],
  );

  const timePickerLabels = useMemo(
    () => ({
      selectTime: t('evSelectTime'),
      hour: t('evTimeHour'),
      minute: t('evTimeMinute'),
      period: t('evTimePeriod'),
      increaseHour: t('evIncreaseHour'),
      decreaseHour: t('evDecreaseHour'),
      increaseMinute: t('evIncreaseMinute'),
      decreaseMinute: t('evDecreaseMinute'),
      done: t('evTimePickerDone'),
    }),
    [t],
  );

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

  function updateWorkshopScheduling(field, value) {
    if (field === 'recurrence') {
      setForm((current) => ({
        ...current,
        recurrence: value,
        weeklyDayIndex: value === 'weekly' ? current.weeklyDayIndex : '',
      }));
      return;
    }

    if (field === 'startTime') {
      const nextTime = String(value ?? '');
      setForm((current) => {
        const providers = (current.providers?.length ? current.providers : [createEmptyProvider()]).map(
          (provider, providerIndex) => {
            if (providerIndex !== 0) return provider;
            const slots = provider.slots?.length ? [...provider.slots] : [createEmptySlot()];
            slots[0] = { ...(slots[0] || createEmptySlot()), startTime: nextTime };
            return { ...provider, slots };
          }
        );
        return {
          ...current,
          startTime: nextTime,
          providers,
        };
      });
      return;
    }

    updateForm(field, value);
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
    setForm(createInitialForm(activeTab));
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
      setRegistrationsError(t('evToastCouldNotLoadParticipants'));
      setToast(t('evToastCouldNotLoadParticipants'));
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
    const preparedForm = syncWorkshopFormForSave(form);
    const isRecurring = preparedForm.recurrence === 'weekly';
    const providersPayload = buildProvidersPayload(preparedForm.providers);
    const firstSlot = getFirstProviderSlot(providersPayload);
    const lastSlot = getLastProviderSlot(providersPayload);
    const startDate = isRecurring ? null : composeDateTime(preparedForm.date, preparedForm.startTime);
    const endDate = isRecurring ? null : composeDateTime(preparedForm.date, preparedForm.endTime);

    if (!preparedForm.title.trim()) {
      setToast(t('evToastAddTitle'));
      return;
    }

    if (preparedForm.type === 'workshop') {
      if (!preparedForm.providers?.[0]?.name?.trim()) {
        setToast(t('evToastSelectProvider'));
        return;
      }
      if (!preparedForm.date?.trim()) {
        setToast(t('evToastAddDate'));
        return;
      }
      if (!normalizeTimeString(getWorkshopStartTime(preparedForm) || firstSlot?.startTime)) {
        setToast(t('evToastAddStartTime'));
        return;
      }
      if (isRecurring) {
        if (preparedForm.weeklyDayIndex === '' || preparedForm.weeklyDayIndex === null || preparedForm.weeklyDayIndex === undefined) {
          setToast(t('evToastChooseDay'));
          return;
        }
        if (!firstSlot) {
          setToast(t('evToastAddSlot'));
          return;
        }
      } else if (!startDate) {
        setToast(t('evToastAddDateTime'));
        return;
      }
    } else if (isRecurring && preparedForm.weeklyDayIndex === '') {
      setToast(t('evToastChooseDay'));
      return;
    } else if (isRecurring && !firstSlot) {
      setToast(t('evToastAddSlot'));
      return;
    } else if (!isRecurring && !startDate) {
      setToast(t('evToastAddDateTime'));
      return;
    }

    const payload = {
      title: preparedForm.title.trim(),
      type: preparedForm.type,
      recurrence: preparedForm.recurrence,
      isRecurringTemplate: isRecurring,
      weeklyDay: isRecurring ? getWeekdayName(preparedForm.weeklyDayIndex) : '',
      weeklyDayIndex: isRecurring ? Number(preparedForm.weeklyDayIndex) : null,
      date: preparedForm.date || null,
      startTime: isRecurring ? firstSlot.startTime : startDate,
      endTime: isRecurring ? (lastSlot.endTime || lastSlot.startTime) : endDate,
      location: preparedForm.location.trim(),
      description: preparedForm.description.trim(),
      imageUrl: preparedForm.imageUrl.trim(),
      maxParticipants: Number(preparedForm.maxParticipants) || 0,
      registrationOpen: preparedForm.registrationOpen,
      disabledDates: parseDisabledDates(preparedForm.disabledDates),
      providers: providersPayload,
      status: preparedForm.status,
    };

    setSaving(true);
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
        setToast(t('evToastUpdated'));
      } else {
        await createEvent(payload);
        setToast(t('evToastCreated'));
      }
      closeDrawer();
      fetchEvents();
    } catch (err) {
      console.error('Save event failed:', err);
      setToast(t('evToastCouldNotSave'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(t('evConfirmDelete').replace('{title}', title || t('evThisEvent')))) return;
    try {
      await deleteEvent(id, title);
      setToast(t('evToastDeleted'));
      fetchEvents();
    } catch (err) {
      console.error('Delete event failed:', err);
      setToast(t('evToastCouldNotDelete'));
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
      setToast(t('evToastStatusUpdated'));
    } catch (err) {
      console.error('Status update failed:', err);
      setToast(t('evToastCouldNotUpdateStatus'));
    }
  }

  function handleParticipantsRetry() {
    if (selectedEvent) openParticipants(selectedEvent);
  }

  async function handleRemoveParticipant(registration) {
    if (!selectedEvent) return;
    const name = getParticipantName(registration);
    if (!window.confirm(t('evConfirmRemoveParticipant').replace('{name}', name))) return;
    try {
      await removeRegistration(registration.id, name, selectedEvent.id);
      setRegistrations((current) => current.filter((item) => item.id !== registration.id));
      setCounts((current) => ({
        ...current,
        [selectedEvent.id]: Math.max(0, (current[selectedEvent.id] ?? registrations.length) - 1),
      }));
      setToast(t('evToastParticipantRemoved'));
    } catch (err) {
      console.error('Remove participant failed:', err);
      setToast(t('evToastCouldNotRemove'));
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
      window.location.href = `mailto:${emails}?subject=${encodeURIComponent(t('evReminderSubject'))}`;
    } else {
      setToast(t('evToastNoEmails'));
    }
  }

  function handleExportCsv() {
    const header = selectedEventIsAppointment
      ? [t('csvTime'), t('csvName'), t('csvEmail'), t('csvPhone'), t('csvProvider'), t('csvStatus'), t('csvNotes')]
      : [t('csvName'), t('csvEmail'), t('csvPhone'), t('csvStatus'), t('csvRegisteredAt')];
    const rows = visibleParticipantRows.map((registration) => (
      selectedEventIsAppointment
        ? [
          getAppointmentTime(registration, intlLocale, t('evTimeTBD')),
          getParticipantName(registration),
          getParticipantEmail(registration),
          getParticipantPhone(registration),
          getRegistrationProviderName(registration),
          pStatusLabel(getAppointmentStatus(registration)),
          registration.notes || registration.adminNotes || registration.specialRequests || '',
        ]
        : [
          getParticipantName(registration),
          getParticipantEmail(registration),
          getParticipantPhone(registration),
          pStatusLabel(getParticipantStatus(registration)),
          formatRegistrationDate(registration.registeredAt, intlLocale, t('pdRegistrationDateTBD')),
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
    <section className="admin-events-page public-cta-scope" dir={direction}>
      <div className="admin-events-page-title-slot">
        <h1 className="admin-events-page-title">{t('evTitle')}</h1>
      </div>

      <div className={`admin-events-shell${drawerOpen || participantsDrawerOpen ? ' has-drawer' : ''}${participantsDrawerOpen ? ' has-participants-drawer' : ''}`}>
        <main className="admin-events-main">

          <section className="admin-events-stats" aria-label={t('evSummaryAria')}>
            <article className="admin-events-stat admin-events-stat--pink">
              <header>
                <span className="admin-events-stat__icon"><Groups /></span>
                <span className="admin-events-stat__menu">...</span>
              </header>
              <p>{t('evWorkshops')}</p>
              <strong>{workshopsCount}</strong>
              <span className="admin-events-stat__bar"><i style={{ width: `${typedEvents.length ? (workshopsCount / typedEvents.length) * 100 : 0}%` }} /></span>
              <small>{workshopsCount} {workshopsCount === 1 ? t('evEventOne') : t('evEventMany')}</small>
            </article>
            <article className="admin-events-stat admin-events-stat--purple">
              <header>
                <span className="admin-events-stat__icon"><EventAvailable /></span>
                <span className="admin-events-stat__menu">...</span>
              </header>
              <p>{t('evAppointments')}</p>
              <strong>{appointmentsCount}</strong>
              <span className="admin-events-stat__bar"><i style={{ width: `${typedEvents.length ? (appointmentsCount / typedEvents.length) * 100 : 0}%` }} /></span>
              <small>{appointmentsCount} {appointmentsCount === 1 ? t('evEventOne') : t('evEventMany')}</small>
            </article>
          </section>

          <div className="admin-events-tabs-row">
            <div className="admin-events-tabs" aria-label={t('evTypeTabsAria')}>
              <button
                className={activeTab === 'workshop' ? 'is-active public-cta-highlight' : 'public-cta-interaction'}
                type="button"
                onClick={() => changeTab('workshop')}
              >
                <span><Groups fontSize="small" /></span>
                {t('evWorkshops')}
              </button>
              <button
                className={activeTab === 'appointment' ? 'is-active public-cta-highlight' : 'public-cta-interaction'}
                type="button"
                onClick={() => changeTab('appointment')}
              >
                <span><CalendarMonth fontSize="small" /></span>
                {t('evAppointments')}
              </button>
            </div>
            <button className="admin-events-primary-btn public-cta-highlight" type="button" onClick={openCreate} id="btn-create-event">
              <span className="admin-events-primary-btn__label">
                {activeTab === 'workshop' ? t('evAddWorkshop') : t('evAddAppointment')}
              </span>
              <span className="admin-events-primary-btn__plus">+</span>
            </button>
          </div>

          <section className="admin-events-filterbar" aria-label={t('evSearchFilterAria')}>
            <label className="admin-events-search">
              <Search />
              <input
                type="search"
                placeholder={t('evSearchByTitle')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <label>
              <span>{t('evStatusLabel')}</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">{t('evAllStatuses')}</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{evStatusLabel(status)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('evSortBy')}</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">{t('evSortNewest')}</option>
                <option value="oldest">{t('evSortOldest')}</option>
                <option value="title">{t('evSortTitle')}</option>
              </select>
            </label>
            <button className="admin-events-icon-btn admin-events-filter-btn public-cta-interaction" type="button" aria-label={t('evAdvancedFilters')}>
              <FilterList />
            </button>
            <button className="admin-events-icon-btn public-cta-interaction" type="button" onClick={fetchEvents} aria-label={t('evRefresh')}>
              <Refresh />
            </button>
          </section>

          <section className="admin-events-table-card">
            <div className="admin-events-table-wrap">
              <table className="admin-events-table">
                <thead>
                  <tr>
                    <th>{t('evColEvent')}</th>
                    <th>{t('evColDateTime')}</th>
                    <th>{t('evColLocation')}</th>
                    <th>{t('evColCapacity')}</th>
                    <th>{t('evColStatus')}</th>
                    <th>{t('evColActions')}</th>
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
                                <strong>{event.title || t('evUntitledEvent')}</strong>
                                <span>{event.category || typeLabel(event.eventType)}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="admin-events-meta">
                              <span><CalendarMonth /> {formatScheduleDate(event, t, intlLocale)}</span>
                              <span><Schedule /> {formatScheduleTime(event, intlLocale, t('evTimeTBD'))}</span>
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
                              {evStatusLabel(event.status)}
                            </span>
                          </td>
                          <td>
                            <div className="admin-events-actions">
                              <button className="public-cta-interaction" type="button" onClick={() => openEdit(event)} aria-label={t('evEditEvent')}>
                                <EditOutlined />
                              </button>
                              <button className="public-cta-interaction" type="button" onClick={() => openParticipants(event)} aria-label={t('evViewParticipants')}>
                                <Groups />
                              </button>
                              <button className="public-cta-interaction" type="button" onClick={() => handleDelete(event.id, event.title)} aria-label={t('evDeleteEvent')}>
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
                          <strong>{activeTab === 'workshop' ? t('evNoWorkshopsFound') : t('evNoAppointmentsFound')}</strong>
                          <p>{t('evEmptyHint')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="admin-events-table-footer">
              <span>{(activeTab === 'workshop' ? t('evShowingWorkshops') : t('evShowingAppointments')).replace('{shown}', filteredEvents.length).replace('{total}', filteredEvents.length)}</span>
              <span>{t('evRowsPerPage')}</span>
            </footer>
          </section>
        </main>

        <aside className={`admin-events-drawer${drawerOpen ? ' is-open' : ''}`} aria-label={t('evWizardAria')} dir={direction}>
          <form onSubmit={handleSave}>
            <header className="admin-events-modal-header">
              <div>
                <h2>{editingEvent ? t('evEditEventTitle') : t('evAddNewEvent')}</h2>
                <p>{editingEvent ? t('evEditEventSub') : t('evAddEventSub')}</p>
              </div>
              <button type="button" onClick={closeDrawer} aria-label={t('evCloseModal')}>
                <Close />
              </button>
            </header>

            <div className="admin-events-modal-body">
              <aside className="admin-events-modal-sidebar" aria-label={t('evFormStepsAria')}>
                <ol className="admin-events-stepper">
                  {EVENT_FORM_STEPS.map((step, index) => (
                    <li className={index === activeFormStep ? 'is-active' : ''} key={step.titleKey}>
                      <button type="button" onClick={() => setActiveFormStep(index)}>
                        <span>{index + 1}</span>
                        <strong>{t(step.titleKey)}</strong>
                        <small>{t(step.descKey)}</small>
                      </button>
                    </li>
                  ))}
                </ol>

                <div className="admin-events-modal-tip-card">
                  <CalendarMonth />
                  <strong>{t('evTipAllSet')}</strong>
                  <p>{t('evTipSaveDraft')}</p>
                </div>
              </aside>

              <section className="admin-events-modal-content">
                <section className="admin-events-wizard-card">
                  <header className="admin-events-wizard-heading">
                    <span>{activeFormStep + 1}</span>
                    <div>
                      <h3>{t(currentFormStep.titleKey)}</h3>
                      <p>
                        {activeFormStep === 0
                          ? t('evStep0Intro')
                          : t(currentFormStep.descKey)}
                      </p>
                    </div>
                  </header>

                  {activeFormStep === 0 && (
                    <div className="admin-events-wizard-fields admin-events-wizard-fields--basic">
                      <label>
                        <span className="admin-events-field-label">{t('evEventTitleLabel')} <b>*</b></span>
                        <input
                          value={form.title}
                          onChange={(event) => updateForm('title', event.target.value)}
                          placeholder={t('evEnterTitle')}
                          required
                        />
                      </label>

                      <label>
                        <span className="admin-events-field-label">{t('evShortDescLabel')} <b>*</b></span>
                        <textarea
                          rows="4"
                          maxLength="120"
                          value={form.description}
                          onChange={(event) => updateForm('description', event.target.value)}
                          placeholder={t('evShortDescPlaceholder')}
                        />
                        <small>{descriptionCount}/120</small>
                      </label>

                      <div className="admin-events-wizard-tip">
                        <Tune fontSize="small" />
                        <span>{t('evTipBasic')}</span>
                      </div>
                    </div>
                  )}

                  {activeFormStep === 1 && form.type === 'workshop' && (
                    <div className="admin-events-wizard-fields admin-events-wizard-fields--workshop-schedule">
                      <div className="admin-events-workshop-schedule-grid admin-events-workshop-schedule-grid--type-row">
                        <label className={isWeeklyWorkshopSchedule ? undefined : 'admin-events-workshop-schedule-field--solo'}>
                          <span className="admin-events-field-label">{t('evScheduleType')} <b>*</b></span>
                          <select
                            value={form.recurrence}
                            onChange={(event) => updateWorkshopScheduling('recurrence', event.target.value)}
                            required
                          >
                            <option value="weekly">{t('evWeeklyRecurring')}</option>
                            <option value="one-time">{t('evOneTime')}</option>
                          </select>
                        </label>

                        {isWeeklyWorkshopSchedule ? (
                          <label>
                            <span className="admin-events-field-label">{t('evWeeklyDay')} <b>*</b></span>
                            <select
                              value={form.weeklyDayIndex}
                              onChange={(event) => updateWorkshopScheduling('weeklyDayIndex', event.target.value)}
                              required
                            >
                              <option value="">{t('evChooseDay')}</option>
                              {WEEKDAY_OPTIONS.map((day) => (
                                <option key={day.value} value={day.value}>{t(`wd${day.value}`)}</option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                      </div>

                      <div className="admin-events-workshop-schedule-grid admin-events-workshop-schedule-grid--datetime-row">
                        <label>
                          <span className="admin-events-field-label">{t('evDate')} <b>*</b></span>
                          <ReminderDatePicker
                            id={workshopDatePickerId}
                            className="admin-events-date-picker"
                            value={form.date}
                            ariaLabel={t('evDate')}
                            labels={datePickerLabels}
                            onChange={(nextDate) => updateWorkshopScheduling('date', nextDate)}
                            portal
                            compact
                          />
                        </label>

                        <label>
                          <span className="admin-events-field-label">{t('evStartTime')} <b>*</b></span>
                          <ReminderTimePicker
                            id={workshopStartTimePickerId}
                            className="admin-events-time-picker"
                            value={workshopStartTime}
                            ariaLabel={t('evStartTime')}
                            labels={timePickerLabels}
                            onChange={(nextTime) => updateWorkshopScheduling('startTime', nextTime)}
                            portal
                            compact
                            showDoneButton
                          />
                        </label>
                      </div>

                      <section className="admin-events-provider-section admin-events-workshop-schedule-provider">
                        <header>
                          <div>
                            <h3>{t('evWorkshopProviderTitle')}</h3>
                            <p>{t('evProvidersDesc')}</p>
                          </div>
                        </header>
                        <div className="admin-events-provider-list">
                          <article className="admin-events-provider-card">
                            <div className="admin-events-provider-fields">
                              <label>
                                <span className="admin-events-field-label">{t('evProviderName')} <b>*</b></span>
                                <input
                                  value={workshopProvider.name}
                                  onChange={(event) => updateProvider(0, 'name', event.target.value)}
                                  placeholder={t('evProviderNamePlaceholder')}
                                />
                              </label>
                              <label>
                                {t('evSpecialty')}
                                <input
                                  value={workshopProvider.specialty}
                                  onChange={(event) => updateProvider(0, 'specialty', event.target.value)}
                                  placeholder={t('evSpecialtyPlaceholder')}
                                />
                              </label>
                              <label>
                                {t('evDefaultRoom')}
                                <input
                                  value={workshopProvider.room}
                                  onChange={(event) => updateProvider(0, 'room', event.target.value)}
                                  placeholder={t('evRoomPlaceholder')}
                                />
                              </label>
                              <label>
                                {t('evAvatarUrl')}
                                <input
                                  type="url"
                                  value={workshopProvider.avatarUrl}
                                  onChange={(event) => updateProvider(0, 'avatarUrl', event.target.value)}
                                  placeholder="https://example.com/avatar.jpg"
                                />
                              </label>
                            </div>
                            {workshopProvider.avatarUrl ? (
                              <div className="admin-events-provider-avatar-preview">
                                <img src={workshopProvider.avatarUrl} alt="" />
                              </div>
                            ) : null}
                          </article>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeFormStep === 1 && form.type !== 'workshop' && (
                    <div className="admin-events-wizard-fields">
                      <label>
                        {t('evScheduleType')}
                        <select value={form.recurrence} onChange={(event) => updateForm('recurrence', event.target.value)}>
                          <option value="weekly">{t('evWeeklyRecurring')}</option>
                          <option value="one-time">{t('evOneTime')}</option>
                        </select>
                      </label>
                      <label>
                        <span className="admin-events-field-label">
                          {t('evWeeklyDay')} {form.recurrence === 'weekly' ? <b>*</b> : null}
                        </span>
                        <select
                          value={form.weeklyDayIndex}
                          onChange={(event) => updateForm('weeklyDayIndex', event.target.value)}
                          required={form.recurrence === 'weekly'}
                          disabled={form.recurrence !== 'weekly'}
                        >
                          <option value="">{t('evChooseDay')}</option>
                          {WEEKDAY_OPTIONS.map((day) => (
                            <option key={day.value} value={day.value}>{t(`wd${day.value}`)}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="admin-events-field-label">
                          {t('evDate')} {form.recurrence !== 'weekly' ? <b>*</b> : null}
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
                          {t('evStartTime')} {form.recurrence !== 'weekly' ? <b>*</b> : null}
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
                            <h3>{t('evProvidersTitle')}</h3>
                            <p>{t('evProvidersDesc')}</p>
                          </div>
                          <button type="button" onClick={addProvider}>{t('evAddProvider')}</button>
                        </header>
                        <div className="admin-events-provider-list">
                          {form.providers.map((provider, providerIndex) => (
                            <article className="admin-events-provider-card" key={`${providerIndex}-${provider.id || 'provider'}`}>
                              <div className="admin-events-provider-card__header">
                                <strong>{t('evProviderN').replace('{n}', providerIndex + 1)}</strong>
                                <button type="button" onClick={() => removeProvider(providerIndex)}>{t('evRemove')}</button>
                              </div>
                              <div className="admin-events-provider-fields">
                                <label>
                                  <span className="admin-events-field-label">{t('evProviderName')} <b>*</b></span>
                                  <input
                                    value={provider.name}
                                    onChange={(event) => updateProvider(providerIndex, 'name', event.target.value)}
                                    placeholder={t('evProviderNamePlaceholder')}
                                  />
                                </label>
                                <label>
                                  {t('evSpecialty')}
                                  <input
                                    value={provider.specialty}
                                    onChange={(event) => updateProvider(providerIndex, 'specialty', event.target.value)}
                                    placeholder={t('evSpecialtyPlaceholder')}
                                  />
                                </label>
                                <label>
                                  {t('evDefaultRoom')}
                                  <input
                                    value={provider.room}
                                    onChange={(event) => updateProvider(providerIndex, 'room', event.target.value)}
                                    placeholder={t('evRoomPlaceholder')}
                                  />
                                </label>
                                <label>
                                  {t('evAvatarUrl')}
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
                                  <span>{t('evTimeSlots')}</span>
                                  <button type="button" onClick={() => addProviderSlot(providerIndex)}>{t('evAddSlot')}</button>
                                </div>
                                {provider.slots.map((slot, slotIndex) => (
                                  <div className="admin-events-slot-row" key={`${slotIndex}-${slot.id || 'slot'}`}>
                                    <label>
                                      <span className="admin-events-field-label">{t('evStart')} <b>*</b></span>
                                      <input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(event) => updateProviderSlot(providerIndex, slotIndex, 'startTime', event.target.value)}
                                      />
                                    </label>
                                    <label>
                                      {t('evEnd')}
                                      <input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(event) => updateProviderSlot(providerIndex, slotIndex, 'endTime', event.target.value)}
                                      />
                                    </label>
                                    <label>
                                      {t('evRoom')}
                                      <input
                                        value={slot.room}
                                        onChange={(event) => updateProviderSlot(providerIndex, slotIndex, 'room', event.target.value)}
                                        placeholder={provider.room || t('evRoom')}
                                      />
                                    </label>
                                    <label>
                                      {t('evCapacity')}
                                      <input
                                        type="number"
                                        min="1"
                                        value={slot.capacity}
                                        onChange={(event) => updateProviderSlot(providerIndex, slotIndex, 'capacity', event.target.value)}
                                      />
                                    </label>
                                    <button type="button" onClick={() => removeProviderSlot(providerIndex, slotIndex)}>{t('evRemove')}</button>
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
                        <span className="admin-events-field-label">{t('evLocationLabel')} <b>*</b></span>
                        <CitySelect
                          value={form.location}
                          onChange={(city) => updateForm('location', city)}
                          placeholder={t('evLocationPlaceholder')}
                          required
                          size="small"
                        />
                      </label>
                      <label>
                        {t('evCapacity')}
                        <input
                          type="number"
                          min="1"
                          value={form.maxParticipants}
                          onChange={(event) => updateForm('maxParticipants', event.target.value)}
                          placeholder="20"
                        />
                      </label>
                      <label className="admin-events-span-2">
                        {t('evDisabledDates')}
                        <input
                          placeholder="2026-06-03, 2026-06-10"
                          value={form.disabledDates}
                          onChange={(event) => updateForm('disabledDates', event.target.value)}
                        />
                        <small>{t('evDisabledDatesHint')}</small>
                      </label>
                      <section className="admin-events-image-section admin-events-span-2">
                        <div>
                          <label>
                            {t('evEventImageUrl')}
                            <input
                              type="url"
                              placeholder="https://example.com/event-photo.jpg"
                              value={form.imageUrl}
                              onChange={(event) => updateForm('imageUrl', event.target.value)}
                            />
                          </label>
                          <p>{t('evImageHint')}</p>
                        </div>
                        <div className="admin-events-image-preview">
                          {form.imageUrl ? (
                            <img src={form.imageUrl} alt={t('evImagePreviewAlt')} />
                          ) : (
                            <span><Category /> {t('evImagePreview')}</span>
                          )}
                        </div>
                      </section>
                      <label>
                        {t('evRegistration')}
                        <select
                          value={form.registrationOpen ? 'open' : 'closed'}
                          onChange={(event) => updateForm('registrationOpen', event.target.value === 'open')}
                        >
                          <option value="open">{t('evOpen')}</option>
                          <option value="closed">{t('evClosed')}</option>
                        </select>
                      </label>
                      <label>
                        {t('evStatusLabel')}
                        <select value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{evStatusLabel(status)}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}

                  {activeFormStep === 3 && (
                    <div className="admin-events-review-grid">
                      <article><span>{t('evReviewTitle')}</span><strong>{form.title || t('evUntitledEventLower')}</strong></article>
                      <article><span>{t('evReviewType')}</span><strong>{typeLabel(form.type)}</strong></article>
                      <article><span>{t('evReviewSchedule')}</span><strong>{form.recurrence === 'weekly' ? [t('evEveryDay').replace('{day}', weekdayLabel(form.weeklyDayIndex) || t('evTBD')), form.date].filter(Boolean).join(' · ') : (form.date || t('evDateTBD'))}</strong></article>
                      <article><span>{t('evReviewRegistration')}</span><strong>{form.registrationOpen ? t('evOpen') : t('evClosed')}</strong></article>
                      <article><span>{t('evReviewStatus')}</span><strong>{evStatusLabel(form.status)}</strong></article>
                      <article className="admin-events-span-2">
                        <span>{t('evReviewProviders')}</span>
                        <strong>{form.providers.map((provider) => provider.name).filter(Boolean).join(', ') || t('evNoProviders')}</strong>
                      </article>
                    </div>
                  )}
                </section>

                <footer className="admin-events-wizard-footer">
                  <div className="admin-events-progress-dots" aria-label={t('evFormProgressAria')}>
                    {EVENT_FORM_STEPS.map((step, index) => (
                      <button
                        className={index === activeFormStep ? 'is-active' : ''}
                        type="button"
                        onClick={() => setActiveFormStep(index)}
                        aria-label={t(step.titleKey)}
                        key={step.titleKey}
                      />
                    ))}
                  </div>
                  <div className="admin-events-wizard-actions">
                    <button className="admin-events-cancel-btn" type="button" onClick={activeFormStep === 0 ? closeDrawer : goToPreviousFormStep}>
                      {activeFormStep === 0 ? t('evCancel') : t('evBack')}
                    </button>
                    {isLastFormStep ? (
                      <button className="admin-events-save-btn" type="submit" disabled={saving}>
                        {saving ? t('evSaving') : editingEvent ? t('evSaveChanges') : t('evPublishEvent')}
                      </button>
                    ) : (
                      <button className="admin-events-save-btn" type="button" onClick={goToNextFormStep}>
                        {t('evNextStep')}
                        <ArrowForward fontSize="small" />
                      </button>
                    )}
                  </div>
                </footer>
              </section>
            </div>
          </form>
        </aside>

        <aside className={`admin-events-participants-drawer${participantsDrawerOpen ? ' is-open' : ''}`} aria-label={t('pdAria')} dir={direction}>
          <header className="admin-events-participants-header">
            <div>
              <h2>{t('pdTitle')}</h2>
              <p>{t('pdSubtitle')}</p>
            </div>
            <button type="button" onClick={closeParticipantsDrawer} aria-label={t('pdClose')}>
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
                    <h3>{selectedEvent.title || t('evUntitledEvent')}</h3>
                    <span className={`admin-events-status admin-events-status--${normalizeStatus(selectedEvent.status)}`}>
                      {evStatusLabel(normalizeStatus(selectedEvent.status))}
                    </span>
                  </div>
                  <div className="admin-events-participant-summary__meta">
                    <span><CalendarMonth /> {formatScheduleDate(selectedEvent, t, intlLocale)}</span>
                    <span><Schedule /> {formatScheduleTime(selectedEvent, intlLocale, t('evTimeTBD'))}</span>
                  </div>
                  <div className="admin-events-participant-summary__capacity">
                    <strong>{selectedEventRegistered} / {selectedEventCapacity || '-'}</strong>
                    <span><i style={{ width: `${selectedEventProgress}%` }} /></span>
                  </div>
                </div>
              </section>

              {selectedEventIsAppointment ? (
                <>
                  <section className="admin-events-provider-tabs" aria-label={t('pdProvidersAria')}>
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
                            <small>{provider.specialty || t('pdAppointmentProvider')}</small>
                          </div>
                          <em>{(provider.count === 1 ? t('pdBookingOne') : t('pdBookingMany')).replace('{n}', provider.count)}</em>
                        </button>
                      ))
                    ) : (
                      <div className="admin-events-empty admin-events-empty--compact">
                        <Groups />
                        <strong>{t('pdSelectProvider')}</strong>
                        <p>{t('pdNoProvidersConnected')}</p>
                      </div>
                    )}
                  </section>

                  <section className="admin-events-schedule-toolbar">
                    <label>
                      <span>{t('pdBookedDates')}</span>
                      <select
                        value={selectedParticipantDate}
                        disabled={!appointmentBookedDates.length}
                        onChange={(event) => setSelectedParticipantDate(event.target.value)}
                      >
                        {appointmentBookedDates.length ? (
                          appointmentBookedDates.map((item) => (
                            <option value={item.dateKey} key={item.dateKey}>
                              {formatDateLabel(item.dateKey, intlLocale, t('pdSelectedDate'))} ({item.count})
                            </option>
                          ))
                        ) : (
                          <option value="">{t('pdNoBookedDatesOption')}</option>
                        )}
                      </select>
                    </label>
                    <p>
                      {appointmentBookedDates.length
                        ? t('pdOnlyDatesSelectable')
                        : t('pdNoBookedDatesProvider')}
                    </p>
                  </section>

                  <section className="admin-events-schedule-card" aria-label={t('pdScheduleAria')}>
                    <header>
                      <strong>{selectedParticipantDate ? formatDateLabel(selectedParticipantDate, intlLocale, t('pdSelectedDate')) : t('pdNoBookedDatesOption')}</strong>
                      <span>{(appointmentScheduleRows.length === 1 ? t('pdBookingOne') : t('pdBookingMany')).replace('{n}', appointmentScheduleRows.length)}</span>
                    </header>
                    <div className="admin-events-schedule-table">
                      <div className="admin-events-schedule-head">
                        <span>{t('pdColTime')}</span>
                        <span>{t('pdColParticipant')}</span>
                        <span>{t('pdColContact')}</span>
                        <span>{t('pdColStatus')}</span>
                      </div>
                      {registrationsLoading ? (
                        Array.from({ length: 5 }).map((_, index) => <span className="admin-events-participant-skeleton" key={index} />)
                      ) : registrationsError ? (
                        <div className="admin-events-empty">
                          <Tune />
                          <strong>{t('pdCouldNotLoadBookings')}</strong>
                          <p>{registrationsError}</p>
                          <button type="button" onClick={handleParticipantsRetry}>{t('pdRetry')}</button>
                        </div>
                      ) : !selectedProviderId ? (
                        <div className="admin-events-empty">
                          <Groups />
                          <strong>{t('pdSelectProvider')}</strong>
                          <p>{t('pdChooseProviderAbove')}</p>
                        </div>
                      ) : !appointmentBookedDates.length ? (
                        <div className="admin-events-empty">
                          <CalendarMonth />
                          <strong>{t('pdNoBookedDatesProvider')}</strong>
                          <p>{t('pdBookingsAppearAfter')}</p>
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
                              <time>{getAppointmentTime(registration, intlLocale, t('evTimeTBD'))}</time>
                              <div className="admin-events-participant-person">
                                <strong>{name}</strong>
                              </div>
                              <div className="admin-events-schedule-contact">
                                {phone ? <span>{phone}</span> : null}
                                {email ? <a href={`mailto:${email}`}>{email}</a> : <span>{t('pdNoEmailAvailable')}</span>}
                                {registration.notes || registration.adminNotes || registration.specialRequests ? (
                                  <small>{registration.notes || registration.adminNotes || registration.specialRequests}</small>
                                ) : null}
                              </div>
                              <div className="admin-events-schedule-status-cell">
                                <label className={`admin-events-status-select admin-events-participant-chip--${status}`}>
                                  <span>{pStatusLabel(status)}</span>
                                  <select value={status} onChange={(event) => handleStatusUpdate(registration, event.target.value)}>
                                    <option value="confirmed">{t('pStatusConfirmed')}</option>
                                    <option value="pending">{t('pStatusPending')}</option>
                                    <option value="cancelled">{t('pStatusCancelled')}</option>
                                    <option value="completed">{t('pStatusCompleted')}</option>
                                  </select>
                                </label>
                                <div className="admin-events-participant-actions">
                                  <button
                                    type="button"
                                    title={t('pdViewDetailsTitle')}
                                    onClick={() => setSelectedBookingDetails(registration)}
                                    aria-label={t('pdViewDetailsAria')}
                                  >
                                    <VisibilityOutlined />
                                  </button>
                                  <button
                                    className="is-email"
                                    type="button"
                                    title={t('pdEmailParticipantTitle')}
                                    disabled={!canEmail}
                                    onClick={() => handleEmailParticipant(registration)}
                                    aria-label={t('pdEmailParticipantAria')}
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
                          <strong>{t('pdNoBookingsForDate')}</strong>
                          <p>{t('pdTryAnother')}</p>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <section className="admin-events-participant-stats" aria-label={t('pdSubtitle')}>
                    <article><Groups /><strong>{participantStats.registered}</strong><span>{t('pdRegistered')}</span></article>
                    <article><EventAvailable /><strong>{participantStats.remaining}</strong><span>{t('pdRemaining')}</span></article>
                    <article><Schedule /><strong>{participantStats.waitlist}</strong><span>{t('pdWaitlist')}</span></article>
                  </section>

                  <section className="admin-events-participant-controls">
                    <label className="admin-events-search">
                      <Search />
                      <input
                        type="search"
                        placeholder={t('pdSearchParticipant')}
                        value={participantSearch}
                        onChange={(event) => setParticipantSearch(event.target.value)}
                      />
                    </label>
                    <select value={participantFilter} onChange={(event) => setParticipantFilter(event.target.value)}>
                      <option value="all">{t('pdFilter')}</option>
                      <option value="confirmed">{t('pStatusConfirmed')}</option>
                      <option value="cancelled">{t('pStatusCancelled')}</option>
                      <option value="waitlist">{t('pStatusWaitlist')}</option>
                    </select>
                    <select value={participantSort} onChange={(event) => setParticipantSort(event.target.value)}>
                      <option value="newest">{t('sortNewest')}</option>
                      <option value="oldest">{t('sortOldest')}</option>
                    </select>
                  </section>

                  <p className="admin-events-participant-count">{t('pdParticipantsCount').replace('{n}', filteredRegistrations.length)}</p>

                  <section className="admin-events-participant-list">
                    {registrationsLoading ? (
                      Array.from({ length: 5 }).map((_, index) => <span className="admin-events-participant-skeleton" key={index} />)
                    ) : registrationsError ? (
                      <div className="admin-events-empty">
                        <Tune />
                        <strong>{t('pdCouldNotLoadParticipants')}</strong>
                        <p>{registrationsError}</p>
                        <button type="button" onClick={handleParticipantsRetry}>{t('pdRetry')}</button>
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
                              <span>{email || t('pdNoEmailAvailable')}</span>
                            </div>
                            <time>{formatRegistrationDate(registration.registeredAt, intlLocale, t('pdRegistrationDateTBD'))}</time>
                            <span className={`admin-events-participant-chip admin-events-participant-chip--${status}`}>
                              {pStatusLabel(status)}
                            </span>
                            <div className="admin-events-participant-actions">
                              <button
                                className="is-email"
                                type="button"
                                title={t('pdEmailParticipantTitle')}
                                disabled={!canEmail}
                                onClick={() => handleEmailParticipant(registration)}
                                aria-label={t('pdEmailParticipantAria')}
                              >
                                <MailOutlineOutlinedIcon />
                              </button>
                              <button
                                className="is-remove"
                                type="button"
                                onClick={() => handleRemoveParticipant(registration)}
                                aria-label={t('pdRemoveParticipant')}
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
                        <strong>{t('pdNoParticipantsFound')}</strong>
                        <p>{t('pdRegistrationsAppear')}</p>
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
              {t('pdExportCsv')}
            </button>
            <button type="button" onClick={handleSendReminderAll} disabled={!visibleParticipantRows.length}>
              <SendOutlined />
              {t('pdSendReminder')}
            </button>
            <button type="button" onClick={closeParticipantsDrawer}>{t('pdCloseBtn')}</button>
          </footer>

          {selectedBookingDetails ? (
            <section className="admin-events-booking-details" aria-label={t('pdBookingDetails')}>
              <header>
                <strong>{t('pdBookingDetails')}</strong>
                <button type="button" onClick={() => setSelectedBookingDetails(null)} aria-label={t('pdCloseBookingDetails')}>
                  <Close fontSize="small" />
                </button>
              </header>
              <dl>
                <div><dt>{t('pdColParticipant')}</dt><dd>{getParticipantName(selectedBookingDetails)}</dd></div>
                <div><dt>{t('apDetailEmail')}</dt><dd>{getParticipantEmail(selectedBookingDetails) || t('pdNoEmailAvailable')}</dd></div>
                <div><dt>{t('apDetailProvider')}</dt><dd>{getRegistrationProviderName(selectedBookingDetails)}</dd></div>
                <div><dt>{t('pdDetailDate')}</dt><dd>{formatDateLabel(getBookingDateKey(selectedBookingDetails), intlLocale, t('pdSelectedDate'))}</dd></div>
                <div><dt>{t('pdDetailTime')}</dt><dd>{getAppointmentTime(selectedBookingDetails, intlLocale, t('evTimeTBD'))}</dd></div>
                <div><dt>{t('pdColStatus')}</dt><dd>{pStatusLabel(getAppointmentStatus(selectedBookingDetails))}</dd></div>
                <div><dt>{t('pdDetailNotes')}</dt><dd>{selectedBookingDetails.notes || selectedBookingDetails.adminNotes || selectedBookingDetails.specialRequests || '-'}</dd></div>
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
          aria-label={t('evCloseModal')}
        />
      ) : null}
      {participantsDrawerOpen ? (
        <button
          className="admin-events-backdrop admin-events-backdrop--participants"
          type="button"
          onClick={closeParticipantsDrawer}
          aria-label={t('pdClose')}
        />
      ) : null}
      {toast ? <div className="admin-events-toast" role="status">{toast}</div> : null}
    </section>
  );
}
