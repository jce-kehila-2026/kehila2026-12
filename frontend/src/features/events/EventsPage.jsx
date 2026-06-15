import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { useNavigate } from 'react-router-dom';
import appointmentsHero from '../../assets/appointments-hero.png';
import eventsHeroBanner from '../../assets/lasteventBanner.png';
import { useAdmin } from '../admin/context/AdminContext';
import { getPublishedEvents } from '../admin/services/eventService';
import { localizeField } from '../../i18n/localizeField';
import {
  addRegistration,
  getRegistrationCounts,
  getUserRegisteredEventIds,
  removeRegistration,
} from '../admin/services/registrationService';
import { createWorkshopSuggestion } from './workshopSuggestionService';
import './EventsPage.css';

const VIEW_WORKSHOPS = 'workshops';
const VIEW_APPOINTMENTS = 'appointments';
const VIEW_REGISTERED = 'registered';
const UPCOMING_SESSION_COUNT = 4;
const CALENDAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const suggestionCategories = [
  'Anxiety Support',
  'Meditation',
  'Yoga',
  'Art Therapy',
  'Journaling',
  'Self Confidence',
  'Women Circle',
  'Breathing Sessions',
  'Career Support',
  'Emotional Healing',
];

const emptySuggestionForm = {
  title: '',
  category: '',
  description: '',
  reason: '',
  anonymous: false,
};

const participantNavItems = [
  { key: 'home', label: 'Home', icon: HomeRoundedIcon, path: '/home' },
  { key: 'calendar', label: 'Calendar', icon: CalendarMonthIcon, path: '/calendar' },
  { key: 'events', label: 'Events', icon: EventAvailableIcon, path: '/events' },
  { key: 'community', label: 'Community', icon: Diversity3Icon, path: '/home' },
  { key: 'messages', label: 'Messages', icon: ChatBubbleOutlineIcon, path: '/home', badge: 3 },
  { key: 'settings', label: 'Settings', icon: SettingsIcon, path: '/home' },
];

function toDate(value) {
  if (!value) return null;
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const CANCELLATION_WINDOW_MS = 48 * 60 * 60 * 1000;
const CANCELLATION_CLOSED_MESSAGE = 'Booking can no longer be cancelled (less than 48h remaining)';

function canCancelSessionBooking(session, now = new Date()) {
  const startDate = toDate(session?.startDate || session?.eventDate);
  return Boolean(startDate && startDate.getTime() - now.getTime() > CANCELLATION_WINDOW_MS);
}

function formatEventDate(value) {
  const date = toDate(value);
  if (!date) return 'To be scheduled';

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatEventTime(startValue, endValue) {
  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start) return 'Time TBD';

  const formatter = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return end ? `${formatter.format(start)} - ${formatter.format(end)}` : formatter.format(start);
}

function toDateKey(date) {
  if (!date) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatWeekday(value) {
  const date = toDate(value);
  if (!date) return 'Schedule TBD';

  return new Intl.DateTimeFormat('en', { weekday: 'long' }).format(date);
}

function formatWeeklySchedule(value) {
  const weekday = formatWeekday(value);
  return weekday === 'Schedule TBD' ? weekday : `Every ${weekday}`;
}

function formatWeeklyScheduleFromDay(dayIndex) {
  if (!Number.isInteger(dayIndex)) return 'Schedule TBD';
  return `Every ${CALENDAR_WEEKDAYS[dayIndex]}`;
}

function formatSessionDate(value) {
  const date = toDate(value);
  if (!date) return 'Date TBD';

  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatSessionTabDate(value) {
  const date = toDate(value);
  if (!date) return 'Date TBD';

  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatAvailableSpots(availableSpots) {
  if (availableSpots === null) return 'Spots available';
  if (availableSpots === 1) return '1 spot left';
  return `${availableSpots} spots left`;
}

function getCalendarTitle(sessions) {
  const dates = sessions.map((session) => toDate(session.startDate)).filter(Boolean);
  if (!dates.length) return 'Upcoming dates';

  const firstDate = dates[0];
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(firstDate);
}

function buildBookingCalendar(sessions) {
  const dates = sessions.map((session) => toDate(session.startDate)).filter(Boolean);
  if (!dates.length) return { title: 'Upcoming dates', days: [] };

  const firstDate = new Date(dates[0]);
  const lastDate = new Date(dates[dates.length - 1]);
  const startDate = new Date(firstDate);
  startDate.setDate(firstDate.getDate() - firstDate.getDay());
  startDate.setHours(12, 0, 0, 0);

  const endDate = new Date(lastDate);
  endDate.setDate(lastDate.getDate() + (6 - lastDate.getDay()));
  endDate.setHours(12, 0, 0, 0);

  const days = [];
  const cursor = new Date(startDate);
  while (cursor.getTime() <= endDate.getTime()) {
    days.push({
      id: toDateKey(cursor),
      dateKey: toDateKey(cursor),
      dayNumber: cursor.getDate(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    title: getCalendarTitle(sessions),
    days,
  };
}

function copyTimeToDate(dateValue, timeSource) {
  const date = toDate(dateValue);
  const time = getTimeParts(timeSource);
  if (!date || !time) return date;

  const nextDate = new Date(date);
  nextDate.setHours(time.hours, time.minutes, 0, 0);
  return nextDate;
}

function getTimeParts(value) {
  if (!value) return null;

  if (value?.toDate || value instanceof Date) {
    const date = toDate(value);
    return date ? { hours: date.getHours(), minutes: date.getMinutes() } : null;
  }

  if (typeof value === 'string') {
    const timeMatch = value.trim().match(/^(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      return { hours: Number(timeMatch[1]), minutes: Number(timeMatch[2]) };
    }
  }

  const date = toDate(value);
  return date ? { hours: date.getHours(), minutes: date.getMinutes() } : null;
}

function getTimeKey(value) {
  const time = getTimeParts(value);
  if (!time) return 'time-tbd';

  return `${String(time.hours).padStart(2, '0')}${String(time.minutes).padStart(2, '0')}`;
}

function slugifyIdentifier(value) {
  return String(value || 'item')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

function getNextWeeklySessionStarts(startValue, count = UPCOMING_SESSION_COUNT) {
  const templateStart = toDate(startValue);
  if (!templateStart) return [];

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const firstDate = new Date(today);
  const daysUntilTemplateDay = (templateStart.getDay() - today.getDay() + 7) % 7;
  firstDate.setDate(today.getDate() + daysUntilTemplateDay);

  let firstSessionStart = copyTimeToDate(firstDate, templateStart);
  if (firstSessionStart && firstSessionStart.getTime() <= now.getTime()) {
    firstDate.setDate(firstDate.getDate() + 7);
    firstSessionStart = copyTimeToDate(firstDate, templateStart);
  }

  return Array.from({ length: count }, (_, index) => {
    const sessionDate = new Date(firstDate);
    sessionDate.setDate(firstDate.getDate() + index * 7);
    return copyTimeToDate(sessionDate, templateStart);
  }).filter(Boolean);
}

function getNextWeeklySessionStartsByDay(dayIndex, timeSource, count = UPCOMING_SESSION_COUNT) {
  if (!Number.isInteger(dayIndex)) return [];

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const firstDate = new Date(today);
  const daysUntilTemplateDay = (dayIndex - today.getDay() + 7) % 7;
  firstDate.setDate(today.getDate() + daysUntilTemplateDay);

  let firstSessionStart = copyTimeToDate(firstDate, timeSource) || firstDate;
  if (firstSessionStart.getTime() <= now.getTime()) {
    firstDate.setDate(firstDate.getDate() + 7);
    firstSessionStart = copyTimeToDate(firstDate, timeSource) || firstDate;
  }

  return Array.from({ length: count }, (_, index) => {
    const sessionDate = new Date(firstDate);
    sessionDate.setDate(firstDate.getDate() + index * 7);
    return copyTimeToDate(sessionDate, timeSource) || sessionDate;
  }).filter(Boolean);
}

function buildSessionId(templateId, sessionStart, providerId, slotId) {
  return `${templateId}__${toDateKey(sessionStart)}__${providerId}__${slotId}`;
}

function getFirstProviderSlotStartSource(providerSlots, fallbackStart) {
  const firstProviderSlot = providerSlots?.find((slot) => slot.startSource);
  return firstProviderSlot?.startSource || fallbackStart;
}

function getEventWeeklyDayIndex(event) {
  const rawDayIndex = event.weeklyDayIndex ?? event.dayIndex ?? event.recurringDayIndex ?? event.dayOfWeekIndex;
  const dayIndex = Number(rawDayIndex);
  if (Number.isInteger(dayIndex) && dayIndex >= 0 && dayIndex <= 6) return dayIndex;
  return null;
}

function getSessionStartsForEvent(event, providerSlots = null) {
  const fallbackStart = event.startTime || event.date;
  const eventDayIndex = getEventWeeklyDayIndex(event);
  const disabledDateKeys = new Set(getDisabledDateKeys(event));
  const filterDisabledDates = (dates) => dates.filter((date) => !disabledDateKeys.has(toDateKey(date)));

  if (Number.isInteger(eventDayIndex)) {
    const slots = providerSlots || getProviderSlots(event);
    return filterDisabledDates(getNextWeeklySessionStartsByDay(
      eventDayIndex,
      getFirstProviderSlotStartSource(slots, fallbackStart),
    ));
  }

  return filterDisabledDates(getNextWeeklySessionStarts(fallbackStart));
}

function getDisabledDateKeys(event) {
  return [
    event.disabledDates,
    event.disabledDateKeys,
    event.closedDates,
    event.blockedDates,
  ].find((items) => Array.isArray(items) && items.length) || [];
}

function buildSessionIdsForEvents(eventList) {
  return eventList.flatMap((event) => {
    const providerSlots = getProviderSlots(event);

    return getSessionStartsForEvent(event, providerSlots).flatMap((sessionStart) =>
      providerSlots.map((slot) => {
        const optionStart = copyTimeToDate(sessionStart, slot.startSource);
        return buildSessionId(event.id, optionStart || sessionStart, slot.providerId, slot.slotId);
      }),
    );
  });
}

function getWeeklyScheduleLabel(event, fallbackStart) {
  if (event.weeklyDay) return `Every ${event.weeklyDay}`;

  const eventDayIndex = getEventWeeklyDayIndex(event);
  if (Number.isInteger(eventDayIndex)) {
    return formatWeeklyScheduleFromDay(eventDayIndex);
  }

  return formatWeeklySchedule(fallbackStart);
}

function formatSlotsTimeRange(providerSlots, dateSource) {
  const slotDates = providerSlots
    .map((slot) => ({
      start: copyTimeToDate(dateSource, slot.startSource),
      end: copyTimeToDate(dateSource, slot.endSource),
    }))
    .filter((slot) => slot.start);

  if (!slotDates.length) return 'Time TBD';

  if (slotDates.length === 1) {
    return formatEventTime(slotDates[0].start, slotDates[0].end);
  }

  const earliestStart = slotDates.reduce((earliest, slot) =>
    slot.start.getTime() < earliest.getTime() ? slot.start : earliest,
  slotDates[0].start);
  const latestEnd = slotDates
    .map((slot) => slot.end || slot.start)
    .reduce((latest, date) => (date.getTime() > latest.getTime() ? date : latest), slotDates[0].end || slotDates[0].start);

  return formatEventTime(earliestStart, latestEnd);
}

function getInstructorLabel(event) {
  return (
    event.therapist ||
    event.instructor ||
    event.facilitator ||
    event.coach ||
    event.host ||
    event.provider ||
    event.organizer ||
    'She-Na Team'
  );
}

function getProviderName(provider, fallback) {
  return (
    provider.providerName ||
    provider.therapistName ||
    provider.therapist ||
    provider.instructorName ||
    provider.instructor ||
    provider.name ||
    fallback ||
    'She-Na Team'
  );
}

function getProviderSpecialty(provider, event) {
  return (
    provider.specialty ||
    provider.role ||
    provider.title ||
    provider.category ||
    event.category ||
    (inferEventType(event) === 'appointment' ? 'Therapist' : 'Instructor')
  );
}

function getProviderAvatar(provider) {
  return (
    provider.avatarUrl ||
    provider.photoUrl ||
    provider.imageUrl ||
    provider.profileImage ||
    provider.thumbnailUrl ||
    ''
  );
}

function getProviderSlotArrays(event) {
  return [
    event.providers,
    event.therapists,
    event.providerSlots,
    event.sessionProviders,
  ].find((items) => Array.isArray(items) && items.length) || [];
}

function getLooseTimeSlots(event) {
  return [
    event.timeSlots,
    event.slots,
    event.availableSlots,
  ].find((items) => Array.isArray(items) && items.length) || [];
}

function getProviderSlots(event) {
  const providerEntries = getProviderSlotArrays(event);

  if (providerEntries.length) {
    return providerEntries.flatMap((provider, providerIndex) => {
      const providerName = getProviderName(provider, getInstructorLabel(event));
      const providerId = slugifyIdentifier(provider.id || provider.uid || provider.email || providerName || `provider-${providerIndex + 1}`);
      const providerSlots = [
        provider.timeSlots,
        provider.slots,
        provider.availableSlots,
      ].find((items) => Array.isArray(items) && items.length) || [provider];

      return providerSlots.map((slot, slotIndex) => {
        const startSource = slot.startTime || slot.start || slot.from || provider.startTime || event.startTime || event.date;
        const endSource = slot.endTime || slot.end || slot.to || provider.endTime || event.endTime;
        const slotId = slugifyIdentifier(slot.id || `${providerId}-${getTimeKey(startSource)}-${getTimeKey(endSource)}-${slotIndex + 1}`);

        return {
          providerId,
          providerName,
          providerSpecialty: getProviderSpecialty(provider, event),
          providerAvatar: getProviderAvatar(provider),
          slotId,
          startSource,
          endSource,
          room: slot.room || slot.location || provider.room || provider.location || event.room || event.location || 'She-Na Center',
          capacity: Number(slot.maxParticipants || slot.capacity || slot.availableSpots || provider.maxParticipants || provider.capacity || event.maxParticipants || event.capacity) || 0,
        };
      });
    });
  }

  const looseSlots = getLooseTimeSlots(event);
  if (looseSlots.length) {
    return looseSlots.map((slot, slotIndex) => {
      const providerName = getProviderName(slot, getInstructorLabel(event));
      const providerId = slugifyIdentifier(slot.providerId || slot.therapistId || slot.instructorId || providerName || `provider-${slotIndex + 1}`);
      const startSource = slot.startTime || slot.start || slot.from || event.startTime || event.date;
      const endSource = slot.endTime || slot.end || slot.to || event.endTime;

      return {
        providerId,
        providerName,
        providerSpecialty: getProviderSpecialty(slot, event),
        providerAvatar: getProviderAvatar(slot),
        slotId: slugifyIdentifier(slot.id || `${providerId}-${getTimeKey(startSource)}-${getTimeKey(endSource)}-${slotIndex + 1}`),
        startSource,
        endSource,
        room: slot.room || slot.location || event.room || event.location || 'She-Na Center',
        capacity: Number(slot.maxParticipants || slot.capacity || slot.availableSpots || event.maxParticipants || event.capacity) || 0,
      };
    });
  }

  const fallbackProvider = getInstructorLabel(event);
  const providerId = slugifyIdentifier(event.providerId || event.therapistId || event.instructorId || fallbackProvider);

  return [
    {
      providerId,
      providerName: fallbackProvider,
      providerSpecialty: event.category || (inferEventType(event) === 'appointment' ? 'Therapist' : 'Instructor'),
      providerAvatar: event.providerAvatarUrl || event.therapistAvatarUrl || '',
      slotId: slugifyIdentifier(`${providerId}-${getTimeKey(event.startTime || event.date)}-${getTimeKey(event.endTime)}`),
      startSource: event.startTime || event.date,
      endSource: event.endTime,
      room: event.room || event.location || 'She-Na Center',
      capacity: Number(event.maxParticipants || event.capacity) || 0,
    },
  ];
}

function inferEventType(event) {
  const raw = `${event.type || ''} ${event.category || ''}`.toLowerCase();
  if (raw.includes('appointment') || raw.includes('therapy') || raw.includes('session')) return 'appointment';
  return 'workshop';
}

function getTemporalStatus(startValue) {
  const start = toDate(startValue);
  if (!start) return 'upcoming';
  return start.getTime() < Date.now() ? 'completed' : 'upcoming';
}

function getEventTone(type, index) {
  if (type === 'appointment') return 'rose';
  return ['lavender', 'purple', 'peach', 'blush'][index % 4];
}

function EventCategoryButton({ title, active, color, icon: Icon, onClick }) {
  return (
    <button
      className={`events-category-button events-category-button--${color}${active ? ' is-active' : ''}`}
      type="button"
      onClick={onClick}
      aria-pressed={active}
    >
      {Icon && <Icon fontSize="small" />}
      <span>{title}</span>
    </button>
  );
}

function CardDescriptionPanel({ description, isOpen }) {
  return (
    <div className="events-card__description">
      <div className={`events-card__description-panel${isOpen ? ' is-open' : ''}`}>
        <div className="events-card__description-inner">
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

function EventCard({
  event,
  registeredSessionIds,
  onOpenBooking,
}) {
  const typeLabel = event.eventType === 'appointment' ? 'Appointment' : 'Workshop';
  const hasRegisteredSessions = event.sessionOptions.some((session) => registeredSessionIds.has(session.id));
  const registrationClosed = event.registrationOpen === false;
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  return (
    <article className={`events-card events-card--${event.tone}`}>
      <div className="events-card__image">
        <img src={event.imageUrl} alt="" />
        <button
          className={`events-card__about-button events-card__about-button--${event.eventType}`}
          type="button"
          onClick={() => setIsDescriptionOpen((current) => !current)}
          aria-expanded={isDescriptionOpen}
          aria-label={`About ${typeLabel.toLowerCase()}`}
        >
          <KeyboardArrowDownIcon fontSize="small" />
          <span>About</span>
        </button>
      </div>

      <div className="events-card__body">
        <h3 className="events-card__title">{event.title}</h3>
        <span className="events-card__schedule">
          <CalendarMonthIcon fontSize="small" />
          {event.weeklySchedule}
        </span>
        <CardDescriptionPanel description={event.description} isOpen={isDescriptionOpen} />

        <button
          className={`events-card__action${hasRegisteredSessions ? ' events-card__action--more' : ''}`}
          type="button"
          onClick={() => onOpenBooking(event.id)}
          disabled={registrationClosed}
          aria-haspopup="dialog"
        >
          {registrationClosed ? 'Registration Closed' : hasRegisteredSessions ? 'Choose More Dates' : 'View Dates'}
          <ArrowForwardIcon fontSize="small" />
        </button>
      </div>
    </article>
  );
}

function getAppointmentServiceLabel(title = '') {
  const cleanTitle = title.trim();
  if (!cleanTitle) return 'Wellness Session';

  const normalized = cleanTitle.toLowerCase();
  if (normalized === 'yoga') return 'Yoga Therapy';
  if (normalized.includes('massage') && !normalized.includes('therapy')) return `${cleanTitle} Therapy`;
  if (normalized.includes('acupuncture')) return 'Acupuncture';
  if (normalized.includes('reflexology')) return 'Reflexology';
  return cleanTitle;
}

function getAppointmentServiceIcon(title = '') {
  const normalized = title.toLowerCase();
  if (normalized.includes('yoga') || normalized.includes('qi')) return VolunteerActivismIcon;
  if (normalized.includes('reflex')) return FavoriteBorderOutlinedIcon;
  if (normalized.includes('acupuncture') || normalized.includes('herbal')) return AutoAwesomeIcon;
  if (normalized.includes('massage')) return EventAvailableIcon;
  return FavoriteBorderIcon;
}

function getProviderInitials(name = 'SN') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'SN';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function getProviderRating(providerName = '') {
  const score = [...String(providerName)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return score % 3 === 0 ? '4.8' : '4.9';
}

function sortSessionsByDate(left, right) {
  const leftDate = toDate(left.startDate);
  const rightDate = toDate(right.startDate);
  if (!leftDate && !rightDate) return 0;
  if (!leftDate) return 1;
  if (!rightDate) return -1;
  return leftDate.getTime() - rightDate.getTime();
}

function getAppointmentProviders(event) {
  const providers = new Map();

  event.sessionOptions.forEach((option) => {
    const providerId = option.providerId || slugifyIdentifier(option.providerName || 'provider');
    const existing = providers.get(providerId);
    const nextDates = new Set(existing?.dateKeys || []);

    if (option.selectedDate) {
      nextDates.add(option.selectedDate);
    }

    providers.set(providerId, {
      id: providerId,
      name: option.providerName || 'She-Na Team',
      specialty: option.providerSpecialty || event.category || 'Wellness Teacher',
      avatar: option.providerAvatar || '',
      dateKeys: nextDates,
      sessions: (existing?.sessions || 0) + 1,
    });
  });

  return Array.from(providers.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function getAppointmentDayPills(event) {
  const days = new Map();

  event.sessionOptions.forEach((option) => {
    const date = toDate(option.startDate);
    if (!date) return;
    const dayIndex = date.getDay();
    days.set(dayIndex, new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date));
  });

  return Array.from(days.entries())
    .sort(([left], [right]) => left - right)
    .map(([, label]) => label);
}

function getAppointmentDateOptions(event, providerId) {
  return event.sessions
    .filter((session) => session.options.some((option) => option.providerId === providerId))
    .sort(sortSessionsByDate)
    .map((session) => ({
      dateKey: session.dateKey,
      label: new Intl.DateTimeFormat('en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(toDate(session.startDate) || new Date()),
      shortLabel: session.tabLabel || session.date,
      session,
    }));
}

function getAppointmentTimeOptions(event, dateKey, providerId, registeredSessionIds) {
  const session = event.sessions.find((item) => item.dateKey === dateKey);
  if (!session) return [];

  const orderedTimes = new Map();

  session.options
    .slice()
    .sort((left, right) => {
      const leftDate = toDate(left.startDate);
      const rightDate = toDate(right.startDate);
      if (!leftDate && !rightDate) return 0;
      if (!leftDate) return 1;
      if (!rightDate) return -1;
      return leftDate.getTime() - rightDate.getTime();
    })
    .forEach((option) => {
      const key = option.selectedTimeSlot || option.time || option.id;
      const existing = orderedTimes.get(key);
      const isProviderOption = option.providerId === providerId;
      const isRegistered = registeredSessionIds.has(option.id);
      const isFull = option.capacity > 0 && option.participants >= option.capacity && !isRegistered;

      if (!existing) {
        orderedTimes.set(key, {
          id: `unavailable-${key}`,
          label: option.time || option.selectedTimeSlot || 'Time TBD',
          option: isProviderOption ? option : null,
          unavailable: !isProviderOption,
          isFull: isProviderOption ? isFull : false,
          sortDate: option.startDate,
        });
        return;
      }

      if (isProviderOption) {
        orderedTimes.set(key, {
          ...existing,
          id: option.id,
          label: option.time || option.selectedTimeSlot || existing.label,
          option,
          unavailable: false,
          isFull,
          sortDate: option.startDate || existing.sortDate,
        });
      }
    });

  return Array.from(orderedTimes.values());
}

function AppointmentServiceCard({ event, isSelected, onOpenBooking }) {
  const providers = getAppointmentProviders(event);
  const days = getAppointmentDayPills(event);
  const serviceLabel = getAppointmentServiceLabel(event.title);

  return (
    <article className={`appointment-service-card${isSelected ? ' is-selected' : ''}`}>
      <div className="appointment-service-card__media">
        <img src={event.imageUrl || appointmentsHero} alt="" />
      </div>

      <div className="appointment-service-card__copy">
        <h3>{serviceLabel}</h3>
        <p>{event.description}</p>
        <div className="appointment-service-card__meta" aria-label={`Available days for ${serviceLabel}`}>
          {(days.length ? days : ['Soon']).map((day) => (
            <span key={day}>{day}</span>
          ))}
          <span className="appointment-service-card__provider-count">
            Available with {providers.length || 1} {providers.length === 1 ? 'instructor' : 'instructors'}
          </span>
        </div>
      </div>

      <button
        className="appointment-service-card__action"
        type="button"
        onClick={() => onOpenBooking(event.id)}
        disabled={event.registrationOpen === false}
        aria-haspopup="dialog"
      >
        View Available Times
        <ArrowForwardIcon fontSize="small" />
      </button>
    </article>
  );
}

function AppointmentServicesPanel({
  events,
  selectedEvent,
  registeredSessionIds,
  onOpenBooking,
  onRegisterSession,
  onCancelSession,
  onCloseBooking,
}) {
  return (
    <section className={`appointments-tab-panel${selectedEvent ? ' has-panel' : ''}`} aria-label="Appointment services">
      <div className="appointments-tab-panel__body">
        <div className="appointments-tab-panel__list">
          <div className="appointment-service-list">
            {events.map((event) => (
              <AppointmentServiceCard
                event={event}
                isSelected={selectedEvent?.id === event.id}
                onOpenBooking={onOpenBooking}
                key={event.id}
              />
            ))}
          </div>

          <article className="appointments-waitlist-card">
            <span aria-hidden="true">
              <FavoriteBorderOutlinedIcon fontSize="small" />
            </span>
            <div>
              <h3>Can't find a suitable time?</h3>
              <p>Join the waiting list and we'll notify you when a slot opens up.</p>
            </div>
            <button type="button">Join Waiting List</button>
          </article>
        </div>

        {selectedEvent && (
          <AppointmentBookingDrawer
            event={selectedEvent}
            registeredSessionIds={registeredSessionIds}
            onRegisterSession={onRegisterSession}
            onCancelSession={onCancelSession}
            onClose={onCloseBooking}
          />
        )}
      </div>
    </section>
  );
}

function AppointmentBookingDrawer({
  event,
  registeredSessionIds,
  onRegisterSession,
  onCancelSession,
  onClose,
}) {
  const providers = useMemo(() => getAppointmentProviders(event), [event]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [dateIndex, setDateIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState('');

  useEffect(() => {
    setSelectedProviderId(providers[0]?.id || '');
    setDateIndex(0);
    setSelectedOptionId('');
  }, [event?.id, providers]);

  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId) || providers[0] || null;
  const dateOptions = useMemo(
    () => (selectedProvider ? getAppointmentDateOptions(event, selectedProvider.id) : []),
    [event, selectedProvider],
  );
  const selectedDate = dateOptions[dateIndex] || dateOptions[0] || null;
  const timeOptions = useMemo(
    () => getAppointmentTimeOptions(event, selectedDate?.dateKey, selectedProvider?.id, registeredSessionIds),
    [event, registeredSessionIds, selectedDate?.dateKey, selectedProvider?.id],
  );

  useEffect(() => {
    setDateIndex(0);
    setSelectedOptionId('');
  }, [selectedProviderId]);

  useEffect(() => {
    if (!dateOptions.length) {
      setDateIndex(0);
      return;
    }

    setDateIndex((current) => Math.min(current, dateOptions.length - 1));
  }, [dateOptions.length]);

  useEffect(() => {
    const currentOption = timeOptions.find((timeOption) => timeOption.option?.id === selectedOptionId);
    if (currentOption && !currentOption.unavailable && !currentOption.isFull) return;

    const firstOpenOption = timeOptions.find((timeOption) => timeOption.option && !timeOption.unavailable && !timeOption.isFull);
    setSelectedOptionId(firstOpenOption?.option?.id || '');
  }, [selectedOptionId, timeOptions]);

  if (!event) return null;

  const serviceLabel = getAppointmentServiceLabel(event.title);
  const ServiceIcon = getAppointmentServiceIcon(event.title);
  const selectedTime = timeOptions.find((timeOption) => timeOption.option?.id === selectedOptionId) || null;
  const selectedOption = selectedTime?.option || null;
  const isRegistered = selectedOption ? registeredSessionIds.has(selectedOption.id) : false;
  const canCancelBooking = isRegistered && canCancelSessionBooking(selectedOption);
  const confirmDisabled = !selectedOption || selectedOption.isRegistering || selectedTime?.isFull || (isRegistered && !canCancelBooking);

  async function handleConfirmBooking() {
    if (!selectedOption || confirmDisabled) return;

    if (isRegistered) {
      await onCancelSession(selectedOption);
      return;
    }

    await onRegisterSession(event, selectedOption);
  }

  return (
      <aside
        className="appointment-drawer"
        role="dialog"
        aria-modal="false"
        aria-labelledby="appointment-drawer-title"
        dir="ltr"
      >
        <button className="appointment-drawer__close" type="button" onClick={onClose} aria-label="Close appointment booking">
          <CloseIcon fontSize="small" />
        </button>

        <header className="appointment-drawer__header">
          <span className="appointment-drawer__mark">
            <ServiceIcon fontSize="small" />
          </span>
          <div>
            <h2 id="appointment-drawer-title">{serviceLabel}</h2>
            <p>Book a session</p>
          </div>
        </header>

        <section className="appointment-booking-step">
          <h3><span>1</span> Choose your instructor</h3>
          <div className="appointment-instructor-grid">
            {providers.map((provider) => {
              const isSelected = provider.id === selectedProvider?.id;

              return (
                <button
                  className={`appointment-instructor-card${isSelected ? ' is-selected' : ''}`}
                  type="button"
                  onClick={() => setSelectedProviderId(provider.id)}
                  aria-pressed={isSelected}
                  key={provider.id}
                >
                  {provider.avatar ? (
                    <img src={provider.avatar} alt="" />
                  ) : (
                    <span className="appointment-instructor-card__avatar">
                      {getProviderInitials(provider.name)}
                    </span>
                  )}
                  <strong>{provider.name}</strong>
                  <small>{provider.specialty}</small>
                  <em>
                    <StarRoundedIcon fontSize="small" />
                    {getProviderRating(provider.name)}
                  </em>
                </button>
              );
            })}
          </div>
        </section>

        <section className="appointment-booking-step">
          <h3><span>2</span> Choose a date</h3>
          <div className="appointment-date-selector">
            <button
              type="button"
              onClick={() => setDateIndex((current) => Math.max(0, current - 1))}
              disabled={dateIndex <= 0}
              aria-label="Previous available date"
            >
              <ArrowBackIcon fontSize="small" />
            </button>
            <strong>
              <CalendarMonthIcon fontSize="small" />
              {selectedDate?.label || 'Dates coming soon'}
            </strong>
            <button
              type="button"
              onClick={() => setDateIndex((current) => Math.min(dateOptions.length - 1, current + 1))}
              disabled={dateIndex >= dateOptions.length - 1}
              aria-label="Next available date"
            >
              <ArrowForwardIcon fontSize="small" />
            </button>
          </div>
        </section>

        <section className="appointment-booking-step">
          <h3><span>3</span> Available times</h3>
          {timeOptions.length ? (
            <div className="appointment-time-grid">
              {timeOptions.map((timeOption) => {
                const option = timeOption.option;
                const isSelected = option?.id === selectedOptionId;
                const disabled = !option || timeOption.unavailable || timeOption.isFull || option.isRegistering;

                return (
                  <button
                    className={`${isSelected ? 'is-selected' : ''}${disabled ? ' is-disabled' : ''}`}
                    type="button"
                    onClick={() => option && setSelectedOptionId(option.id)}
                    disabled={disabled}
                    key={timeOption.id}
                  >
                    {timeOption.label}
                    {disabled && <LockOutlinedIcon fontSize="small" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="appointment-drawer__empty">No times are currently available for this instructor.</p>
          )}
          <p className="appointment-drawer__timezone">
            <AccessTimeIcon fontSize="small" />
            All times are displayed in your local time (GMT +3)
          </p>
        </section>

        <div className="appointment-drawer__actions">
          <button
            className="appointment-drawer__confirm"
            type="button"
            onClick={handleConfirmBooking}
            disabled={confirmDisabled}
          >
            {selectedOption?.isRegistering
              ? 'Please wait...'
              : isRegistered
                ? 'Cancel Booking'
                : 'Confirm Booking'}
            <ArrowForwardIcon fontSize="small" />
          </button>
          <button className="appointment-drawer__cancel" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </aside>
  );
}

function getWorkshopPrimarySession(event) {
  return event.sessionOptions.slice().sort(sortSessionsByDate)[0] || null;
}

function getWorkshopRegisteredSession(event, registeredSessionIds) {
  return event.sessionOptions.find((session) => registeredSessionIds.has(session.id)) || null;
}

function getWorkshopActiveSession(event, registeredSessionIds) {
  return getWorkshopRegisteredSession(event, registeredSessionIds) || getWorkshopPrimarySession(event);
}

function getWorkshopAvailabilityLabel(session) {
  if (!session) return 'Availability coming soon';
  if (!session.capacity || session.capacity <= 0) return 'Open registration';

  const remaining = Math.max(0, session.capacity - (session.participants || 0));
  return `${remaining} of ${session.capacity} spots available`;
}

function WorkshopListCard({ event, registeredSessionIds, isSelected, onOpenBooking }) {
  const session = getWorkshopActiveSession(event, registeredSessionIds);
  const isRegistered = Boolean(session && registeredSessionIds.has(session.id));
  const registrationClosed = event.registrationOpen === false;

  return (
    <article className={`workshop-list-card${isSelected ? ' is-selected' : ''}${isRegistered ? ' is-registered' : ''}`}>
      <div className="workshop-list-card__media">
        <img src={event.imageUrl || appointmentsHero} alt="" />
      </div>

      <div className="workshop-list-card__content">
        <div>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
        </div>

        <div className="workshop-list-card__meta">
          <span>
            <EventAvailableIcon fontSize="small" />
            {session?.date || event.date || 'Date TBD'}
          </span>
          <span>
            <AccessTimeIcon fontSize="small" />
            {session?.time || event.time || 'Time TBD'}
          </span>
          <span>
            <HomeRoundedIcon fontSize="small" />
            {session?.location || event.location || 'She-Na Center'}
          </span>
          <span>
            <GroupsRoundedIcon fontSize="small" />
            {getWorkshopAvailabilityLabel(session)}
          </span>
        </div>
      </div>

      <button
        className="workshop-list-card__action"
        type="button"
        onClick={() => onOpenBooking(event.id)}
        disabled={registrationClosed}
        aria-haspopup="dialog"
      >
        {registrationClosed ? 'Registration Closed' : isRegistered ? 'View Registration' : 'View Details / Register'}
        <ArrowForwardIcon fontSize="small" />
      </button>
    </article>
  );
}

function WorkshopDetailsPanel({
  event,
  registeredSessionIds,
  onRegisterSession,
  onCancelSession,
  onClose,
}) {
  const session = getWorkshopActiveSession(event, registeredSessionIds);
  const isRegistered = Boolean(session && registeredSessionIds.has(session.id));
  const canCancelBooking = isRegistered && canCancelSessionBooking(session);
  const isFull = session?.capacity > 0 && session.participants >= session.capacity && !isRegistered;
  const registrationClosed = event.registrationOpen === false;
  const actionDisabled = !session || session.isRegistering || registrationClosed || isFull || (isRegistered && !canCancelBooking);

  async function handleWorkshopAction() {
    if (!session || actionDisabled) return;

    if (isRegistered) {
      await onCancelSession(session);
      return;
    }

    await onRegisterSession(event, session);
  }

  return (
    <aside
      className="workshop-details-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="workshop-details-title"
      dir="ltr"
    >
      <button className="workshop-details-panel__close" type="button" onClick={onClose} aria-label="Close workshop details">
        <CloseIcon fontSize="small" />
      </button>

      <div className="workshop-details-panel__image">
        <img src={event.imageUrl || appointmentsHero} alt="" />
      </div>

      <header className="workshop-details-panel__header">
        <span>
          <VolunteerActivismIcon fontSize="small" />
        </span>
        <div>
          <h2 id="workshop-details-title">{event.title}</h2>
          <p>{isRegistered ? 'You are registered' : 'Workshop details'}</p>
        </div>
      </header>

      <p className="workshop-details-panel__description">{event.description}</p>

      <div className="workshop-details-panel__details">
        <span>
          <EventAvailableIcon fontSize="small" />
          <strong>Date</strong>
          {session?.date || event.date || 'Date TBD'}
        </span>
        <span>
          <AccessTimeIcon fontSize="small" />
          <strong>Time</strong>
          {session?.time || event.time || 'Time TBD'}
        </span>
        <span>
          <HomeRoundedIcon fontSize="small" />
          <strong>Location</strong>
          {session?.location || event.location || 'She-Na Center'}
        </span>
        <span>
          <PersonIcon fontSize="small" />
          <strong>Instructor</strong>
          {session?.providerName || event.instructor || 'She-Na Team'}
        </span>
        <span>
          <GroupsRoundedIcon fontSize="small" />
          <strong>Spots</strong>
          {getWorkshopAvailabilityLabel(session)}
        </span>
        <span>
          <CalendarMonthIcon fontSize="small" />
          <strong>Status</strong>
          {isRegistered ? 'Registered' : registrationClosed ? 'Closed' : isFull ? 'Full' : 'Open'}
        </span>
      </div>

      {isRegistered && !canCancelBooking && (
        <p className="workshop-details-panel__notice">{CANCELLATION_CLOSED_MESSAGE}</p>
      )}

      <div className="workshop-details-panel__actions">
        <button
          className={`workshop-details-panel__primary${isRegistered ? ' is-cancel' : ''}`}
          type="button"
          onClick={handleWorkshopAction}
          disabled={actionDisabled}
        >
          {session?.isRegistering
            ? 'Please wait...'
            : isRegistered
              ? 'Cancel Registration'
              : isFull
                ? 'Workshop Full'
                : registrationClosed
                  ? 'Registration Closed'
                  : 'Register'}
          <ArrowForwardIcon fontSize="small" />
        </button>
        <button className="workshop-details-panel__secondary" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </aside>
  );
}

function WorkshopListPanel({
  events,
  selectedEvent,
  registeredSessionIds,
  onOpenBooking,
  onRegisterSession,
  onCancelSession,
  onCloseBooking,
}) {
  return (
    <section className={`workshops-tab-panel${selectedEvent ? ' has-panel' : ''}`} aria-label="Workshop sessions">
      <div className="workshops-tab-panel__body">
        <div className="workshop-list">
          {events.map((event) => (
            <WorkshopListCard
              event={event}
              registeredSessionIds={registeredSessionIds}
              isSelected={selectedEvent?.id === event.id}
              onOpenBooking={onOpenBooking}
              key={event.id}
            />
          ))}
        </div>

        {selectedEvent && (
          <WorkshopDetailsPanel
            event={selectedEvent}
            registeredSessionIds={registeredSessionIds}
            onRegisterSession={onRegisterSession}
            onCancelSession={onCancelSession}
            onClose={onCloseBooking}
          />
        )}
      </div>
    </section>
  );
}

function EventBookingModal({
  event,
  registeredSessionIds,
  onRegisterSession,
  onCancelSession,
  onClose,
}) {
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [isCalendarExiting, setIsCalendarExiting] = useState(false);
  const dateSelectionTimeoutRef = useRef(null);

  useEffect(() => {
    if (dateSelectionTimeoutRef.current) {
      clearTimeout(dateSelectionTimeoutRef.current);
      dateSelectionTimeoutRef.current = null;
    }
    setSelectedDateKey('');
    setIsCalendarExiting(false);
  }, [event?.id]);

  useEffect(() => () => {
    if (dateSelectionTimeoutRef.current) {
      clearTimeout(dateSelectionTimeoutRef.current);
    }
  }, []);

  const handleDateSelection = useCallback((dateKey) => {
    if (!dateKey || isCalendarExiting) return;

    setIsCalendarExiting(true);

    if (dateSelectionTimeoutRef.current) {
      clearTimeout(dateSelectionTimeoutRef.current);
    }

    dateSelectionTimeoutRef.current = setTimeout(() => {
      setSelectedDateKey(dateKey);
      setIsCalendarExiting(false);
      dateSelectionTimeoutRef.current = null;
    }, 180);
  }, [isCalendarExiting]);

  const handleChangeDate = useCallback(() => {
    if (dateSelectionTimeoutRef.current) {
      clearTimeout(dateSelectionTimeoutRef.current);
      dateSelectionTimeoutRef.current = null;
    }

    setIsCalendarExiting(false);
    setSelectedDateKey('');
  }, []);

  if (!event) return null;

  const selectedSession = event.sessions.find((session) => session.dateKey === selectedDateKey) || null;
  const selectedOptions = selectedSession?.options || [];
  const bookingCalendar = buildBookingCalendar(event.sessions);
  const sessionsByDateKey = new Map(event.sessions.map((session) => [session.dateKey, session]));

  return (
    <div className="events-booking-modal" role="presentation">
      <button className="events-booking-modal__backdrop" type="button" aria-label="Close booking calendar" onClick={onClose} />
      <section
        className="events-booking-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="events-booking-modal-title"
        dir="ltr"
      >
        <button className="events-booking-modal__close" type="button" onClick={onClose} aria-label="Close booking calendar">
          <CloseIcon fontSize="small" />
        </button>

        {event.sessions.length > 0 ? (
          <div className="events-card__booking-inner">
            {!selectedSession ? (
              <section className={`events-card__booking-view events-card__booking-view--calendar${isCalendarExiting ? ' is-exiting' : ''}`}>
                <header className="events-card__booking-header">
                  <div>
                    <h4 id="events-booking-modal-title">{bookingCalendar.title}</h4>
                    <strong>{event.title}</strong>
                    <p>Only available dates are highlighted</p>
                    <p>Select a date to view time and provider options</p>
                  </div>
                </header>

                <div className="events-card__calendar" aria-label={`Available calendar dates for ${event.title}`}>
                  <div className="events-card__calendar-weekdays" aria-hidden="true">
                    {CALENDAR_WEEKDAYS.map((weekday) => (
                      <span key={weekday}>{weekday}</span>
                    ))}
                  </div>

                  <div className="events-card__calendar-grid">
                    {bookingCalendar.days.map((day) => {
                      const session = sessionsByDateKey.get(day.dateKey);
                      const isAvailable = Boolean(session);

                      return (
                        <button
                          className={isAvailable ? 'is-available' : ''}
                          type="button"
                          onClick={() => handleDateSelection(day.dateKey)}
                          disabled={!isAvailable || isCalendarExiting}
                          aria-label={session ? `Choose ${session.date}` : 'Unavailable date'}
                          key={day.id}
                        >
                          {day.dayNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : (
              <section className="events-card__booking-view events-card__booking-view--providers">
                <section className="events-card__session-panel events-card__session-panel--standalone" aria-live="polite">
                  <header className="events-card__session-panel-header">
                    <div>
                      <h4 id="events-booking-modal-title">{selectedSession.date}</h4>
                      <p>Available Sessions</p>
                      <button
                        className="events-card__change-date events-card__change-date--back"
                        type="button"
                        onClick={handleChangeDate}
                      >
                        <ArrowBackIcon fontSize="small" />
                        Back to calendar
                      </button>
                    </div>
                  </header>

                  {selectedOptions.length === 0 ? (
                    <p className="events-card__booking-empty">No available sessions for this date.</p>
                  ) : (
                    <div className="events-card__session-list">
                      {selectedOptions.map((option) => {
                        const isRegistered = registeredSessionIds.has(option.id);
                        const isFull = option.capacity > 0 && option.participants >= option.capacity && !isRegistered;
                        const canCancelBooking = isRegistered && canCancelSessionBooking(option);
                        const actionDisabled = option.isRegistering || (isRegistered ? !canCancelBooking : isFull);

                        return (
                          <article
                            className={`events-card__session-option${isRegistered ? ' is-registered' : ''}`}
                            key={option.id}
                          >
                            <div className="events-card__session-provider">
                              {option.providerAvatar ? (
                                <img src={option.providerAvatar} alt="" />
                              ) : (
                                <span className="events-card__session-avatar">
                                  {option.providerName.slice(0, 2).toUpperCase()}
                                </span>
                              )}

                              <div>
                                <strong>{option.providerName}</strong>
                                <span>{option.providerSpecialty}</span>
                              </div>
                            </div>

                            <time className="events-card__session-time">
                              <AccessTimeIcon fontSize="small" />
                              {option.time}
                            </time>

                            <div className="events-card__session-action">
                              <button
                                type="button"
                                onClick={() => (isRegistered ? onCancelSession(option) : onRegisterSession(event, option))}
                                disabled={actionDisabled}
                              >
                                {option.isRegistering
                                  ? 'Wait...'
                                  : isRegistered
                                    ? 'Cancel Booking'
                                    : isFull
                                      ? 'Full'
                                      : 'Register'}
                              </button>
                              {isRegistered && !canCancelBooking && (
                                <small>{CANCELLATION_CLOSED_MESSAGE}</small>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </section>
            )}
          </div>
        ) : (
          <p className="events-card__booking-empty">Upcoming dates will appear soon.</p>
        )}
      </section>
    </div>
  );
}

function RegisteredSessionCard({ session, onCancelRegistration }) {
  return (
    <article className="registered-session-card">
      <div className="registered-session-card__media">
        <img src={session.imageUrl || appointmentsHero} alt="" />
      </div>

      <div className="registered-session-card__content">
        <div>
          <h3>{session.title}</h3>
          <p>{session.description}</p>
        </div>

        <div className="registered-session-card__meta">
          <span>
            <CalendarMonthIcon fontSize="small" />
            {session.date}
          </span>
          <span>
            <AccessTimeIcon fontSize="small" />
            {session.time}
          </span>
          <span>
            <EventAvailableIcon fontSize="small" />
            {session.location}
          </span>
          <span>
            <PersonIcon fontSize="small" />
            {session.providerName}
          </span>
        </div>
      </div>

      <div className="registered-session-card__actions">
        <span className="registered-session-card__status">Registered</span>
        <button
          className="registered-session-card__cancel"
          type="button"
          onClick={() => onCancelRegistration(session)}
          disabled={session.isRegistering}
        >
          <CalendarMonthIcon fontSize="small" />
          {session.isRegistering ? 'Please wait...' : 'Cancel Registration'}
        </button>
      </div>
    </article>
  );
}

function RegisteredEventsPanel({
  events,
  onCancelRegistration,
}) {
  return (
    <section className="registered-tab-panel" aria-label="Registered events">
      <div className="registered-session-list">
        {events.map((session) => (
          <RegisteredSessionCard
            session={session}
            onCancelRegistration={onCancelRegistration}
            key={session.id}
          />
        ))}
      </div>
    </section>
  );
}

function SuggestWorkshopModal({
  form,
  errors,
  successMessage,
  submitError,
  isSubmitting,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="suggest-modal" role="presentation">
      <div className="suggest-modal__overlay" onClick={onClose} />
      <section className="suggest-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="suggest-modal-title">
        <button className="suggest-modal__close" type="button" onClick={onClose} aria-label="Close suggestion form">
          <CloseIcon />
        </button>

        <div className="suggest-modal__header">
          <span className="suggest-modal__mark">
            <FavoriteBorderOutlinedIcon />
          </span>
          <h2 id="suggest-modal-title">What would you like to see next?</h2>
          <p>Suggest a workshop, session, or support circle you would love to see in our community.</p>
        </div>

        {successMessage && <div className="suggest-modal__success">{successMessage}</div>}
        {submitError && <div className="suggest-modal__error">{submitError}</div>}

        <form className="suggest-form" onSubmit={onSubmit}>
          <label className="suggest-form__field">
            <span>Workshop title *</span>
            <div className="suggest-form__control">
              <EditOutlinedIcon />
              <input
                value={form.title}
                onChange={(event) => onChange('title', event.target.value)}
                placeholder="Example: Anxiety support circle"
              />
            </div>
            {errors.title && <small>{errors.title}</small>}
          </label>

          <label className="suggest-form__field">
            <span>Category *</span>
            <div className="suggest-form__control">
              <GroupsRoundedIcon />
              <select value={form.category} onChange={(event) => onChange('category', event.target.value)}>
                <option value="">Select a category</option>
                {suggestionCategories.map((category) => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </select>
            </div>
            {errors.category && <small>{errors.category}</small>}
          </label>

          <label className="suggest-form__field">
            <span>Short description *</span>
            <div className="suggest-form__control suggest-form__control--textarea">
              <MenuBookIcon />
              <textarea
                value={form.description}
                onChange={(event) => onChange('description', event.target.value)}
                placeholder="Describe the workshop or session idea..."
                rows={3}
              />
            </div>
            {errors.description && <small>{errors.description}</small>}
          </label>

          <label className="suggest-form__field">
            <span>Why would this help you?</span>
            <div className="suggest-form__control suggest-form__control--textarea">
              <FavoriteBorderIcon />
              <textarea
                value={form.reason}
                onChange={(event) => onChange('reason', event.target.value)}
                placeholder="Tell us why this topic would be meaningful or helpful..."
                rows={3}
              />
            </div>
          </label>

          <label className="suggest-form__anonymous">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(event) => onChange('anonymous', event.target.checked)}
            />
            <span>
              Submit anonymously
              <small>Your name will not be visible.</small>
            </span>
          </label>

          <div className="suggest-form__actions">
            <button className="suggest-form__cancel" type="button" onClick={onClose}>Cancel</button>
            <button className="suggest-form__submit" type="submit" disabled={isSubmitting}>
              <SendOutlinedIcon fontSize="small" />
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function EventsPage({ embedInDashboard = false, locale = 'he' }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAdmin();
  const [activeView, setActiveView] = useState(VIEW_WORKSHOPS);
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({});
  const [registeredMap, setRegisteredMap] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [eventsReloadKey, setEventsReloadKey] = useState(0);
  const [registeringId, setRegisteringId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionForm, setSuggestionForm] = useState(emptySuggestionForm);
  const [suggestionErrors, setSuggestionErrors] = useState({});
  const [suggestionSuccess, setSuggestionSuccess] = useState('');
  const [suggestionSubmitError, setSuggestionSubmitError] = useState('');
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [bookingEventId, setBookingEventId] = useState(null);

  const displayName = useMemo(() => {
    if (currentUser?.displayName) return currentUser.displayName.split(' ')[0];
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'Participant';
  }, [currentUser]);

  const refreshRegistrationData = useCallback(async (eventList) => {
    if (!eventList.length) {
      setCounts({});
      setRegisteredMap({});
      return;
    }

    try {
      const sessionIds = buildSessionIdsForEvents(eventList);
      const [countsData, userRegistrations] = await Promise.all([
        sessionIds.length ? getRegistrationCounts(sessionIds) : Promise.resolve({}),
        currentUser?.email ? getUserRegisteredEventIds(currentUser.email) : Promise.resolve({}),
      ]);

      setCounts(countsData);
      setRegisteredMap(userRegistrations);
    } catch (error) {
      console.error('Failed to load event registration data:', error);
      setEventsError('Events loaded, but registration data could not be refreshed.');
    }
  }, [currentUser?.email]);

  useEffect(() => {
    let cancelled = false;
    setLoadingEvents(true);
    setEventsError('');

    getPublishedEvents()
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        setLoadingEvents(false);
        refreshRegistrationData(data);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load published events:', error);
        setEvents([]);
        setCounts({});
        setRegisteredMap({});
        setEventsError('Could not load events from Firestore.');
        setLoadingEvents(false);
      });

    return () => { cancelled = true; };
  }, [eventsReloadKey, refreshRegistrationData]);

  useEffect(() => {
    setBookingEventId(null);
  }, [activeView]);

  useEffect(() => {
    if (!bookingEventId) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setBookingEventId(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bookingEventId]);

  const displayEvents = useMemo(
    () =>
      [...events].sort((left, right) => {
        const leftDate = getSessionStartsForEvent(left)[0];
        const rightDate = getSessionStartsForEvent(right)[0];

        if (!leftDate && !rightDate) return 0;
        if (!leftDate) return 1;
        if (!rightDate) return -1;

        return leftDate.getTime() - rightDate.getTime();
      }).map((event, index) => {
        const imageUrl = event.imageUrl || event.thumbnailUrl || event.coverImageUrl || appointmentsHero;
        const eventType = inferEventType(event);
        const displayTitle = localizeField(event.translations?.title ?? event.title, locale) || 'Untitled Event';
        const displayCategory = eventType === 'appointment' ? 'Appointment' : 'Workshop';
        const templateStart = event.startTime || event.date;
        const providerSlots = getProviderSlots(event);
        const providerNames = [...new Set(providerSlots.map((slot) => slot.providerName))];
        const roomLabels = [...new Set(providerSlots.map((slot) => slot.room).filter(Boolean))];
        const displayLocation = roomLabels.length > 1 ? 'Multiple rooms' : roomLabels[0] || localizeField(event.translations?.location ?? event.location, locale) || 'She-Na Center';
        const sessionStarts = getSessionStartsForEvent(event, providerSlots);
        const weeklySchedule = getWeeklyScheduleLabel(event, templateStart);
        const templateDescription = localizeField(event.translations?.description ?? event.description, locale) || 'More details will be added soon.';
        const sessions = sessionStarts.map((sessionStart) => {
          const dateKey = toDateKey(sessionStart);
          const options = providerSlots.map((slot) => {
            const optionStart = copyTimeToDate(sessionStart, slot.startSource);
            const optionEnd = copyTimeToDate(sessionStart, slot.endSource);
            const optionId = buildSessionId(event.id, optionStart || sessionStart, slot.providerId, slot.slotId);
            const participants = counts[optionId] ?? 0;
            return {
              id: optionId,
              slotId: optionId,
              eventId: event.id,
              templateId: event.id,
              eventTemplateId: event.id,
              title: displayTitle,
              category: displayCategory,
              description: templateDescription,
              date: formatSessionDate(optionStart || sessionStart),
              dateKey,
              selectedDate: dateKey,
              startDate: optionStart || sessionStart,
              endDate: optionEnd,
              time: formatEventTime(optionStart || sessionStart, optionEnd),
              selectedTimeSlot: formatEventTime(optionStart || sessionStart, optionEnd),
              providerId: slot.providerId,
              providerName: slot.providerName,
              providerSpecialty: slot.providerSpecialty,
              providerAvatar: slot.providerAvatar,
              room: slot.room,
              location: slot.room,
              participants,
              capacity: slot.capacity,
              tone: getEventTone(eventType, index),
              imageUrl,
              eventType,
              instructor: slot.providerName,
              weeklySchedule,
              isRegistering: registeringId === optionId,
            };
          });

          return {
            id: `${event.id}__${dateKey}`,
            date: formatSessionDate(sessionStart),
            tabLabel: formatSessionTabDate(sessionStart),
            dateKey,
            startDate: sessionStart,
            options,
          };
        });
        const sessionOptions = sessions.flatMap((session) => session.options);

        return {
          id: event.id,
          title: displayTitle,
          category: displayCategory,
          description: templateDescription,
          date: formatEventDate(templateStart),
          time: formatSlotsTimeRange(providerSlots, sessionStarts[0] || templateStart),
          participants: sessionOptions.reduce((total, session) => total + session.participants, 0),
          capacity: sessionOptions.reduce((total, session) => total + session.capacity, 0),
          location: displayLocation,
          tone: getEventTone(eventType, index),
          imageUrl,
          eventType,
          instructor: getInstructorLabel(event),
          providerSummary: providerNames.length > 1 ? `${providerNames.length} providers available` : providerNames[0] || getInstructorLabel(event),
          registrationOpen: event.registrationOpen !== false,
          weeklySchedule,
          temporalStatus: getTemporalStatus(sessions[0]?.startDate || templateStart),
          sessions,
          sessionOptions,
        };
      }),
    [counts, events, registeringId, locale],
  );

  const registeredEvents = useMemo(
    () =>
      displayEvents.flatMap((event) =>
        event.sessionOptions
          .filter((session) => Boolean(registeredMap[session.id]))
          .map((session) => ({
            ...session,
            registrationId: registeredMap[session.id],
          })),
      ),
    [displayEvents, registeredMap],
  );

  const filteredEvents = useMemo(() => {
    if (activeView === VIEW_REGISTERED) return registeredEvents;
    return displayEvents.filter((event) => event.eventType === activeView.slice(0, -1));
  }, [activeView, displayEvents, registeredEvents]);

  const activeBookingEvent = useMemo(
    () => displayEvents.find((event) => event.id === bookingEventId) || null,
    [bookingEventId, displayEvents],
  );

  const categoryCards = useMemo(() => {
    return [
      {
        type: VIEW_WORKSHOPS,
        title: 'Workshops',
        color: 'lavender',
        icon: VolunteerActivismIcon,
      },
      {
        type: VIEW_APPOINTMENTS,
        title: 'Appointments',
        color: 'blush',
        icon: CalendarMonthIcon,
      },
      {
        type: VIEW_REGISTERED,
        title: 'Registered Events',
        color: 'peach',
        icon: PersonIcon,
      },
    ];
  }, []);

  const sectionTitle = useMemo(() => {
    if (activeView === VIEW_APPOINTMENTS) return 'Upcoming Appointments';
    if (activeView === VIEW_REGISTERED) return 'My Registered Events';
    return 'Upcoming Workshops';
  }, [activeView]);

  const registeredSessionIds = useMemo(() => new Set(Object.keys(registeredMap)), [registeredMap]);

  async function handleRegisterSession(event, session) {
    if (!currentUser?.email || registeringId) return;

    if (!event || !session || registeredMap[session.id]) return;

    if (event.isScheduleTemplate) {
      setEventsError('This schedule is not ready for registration yet. Please choose an admin-published event.');
      return;
    }

    if (event.registrationOpen === false) {
      setEventsError('Registration is closed for this event.');
      return;
    }

    setRegisteringId(session.id);
    setEventsError('');

    try {
      const newRegistrationId = await addRegistration({
        eventId: event.id,
        slotId: session.id,
        uid: currentUser.uid,
        participantName: currentUser.displayName || currentUser.email.split('@')[0],
        participantEmail: currentUser.email,
        eventTitle: event.title,
        eventDate: session.startDate || null,
        dateKey: session.selectedDate,
        startAt: session.startDate || null,
        endAt: session.endDate || null,
        eventLocation: session.room || event.location || '',
        eventCoverUrl: event.imageUrl || '',
        eventTemplateId: event.id,
        parentEventId: event.id,
        eventType: event.eventType,
        selectedDate: session.selectedDate,
        selectedTime: session.selectedTimeSlot,
        providerId: session.providerId,
        providerName: session.providerName,
        selectedTimeSlot: session.selectedTimeSlot,
        room: session.room,
        sessionDateLabel: session.date,
        sessionTime: session.time,
        recurringSchedule: event.weeklySchedule,
      });
      setRegisteredMap((current) => ({ ...current, [session.id]: newRegistrationId }));
      setCounts((current) => ({
        ...current,
        [event.id]: (current[event.id] ?? 0) + 1,
        [session.id]: (current[session.id] ?? 0) + 1,
      }));
    } catch (error) {
      console.error('Registration action failed:', error);
      setEventsError('Could not register for this session. Please try again.');
    } finally {
      setRegisteringId(null);
    }
  }

  async function handleCancelSession(session) {
    if (!currentUser?.email || registeringId || !session) return;

    const registrationId = registeredMap[session.id];
    if (!registrationId) return;

    if (!canCancelSessionBooking(session)) {
      setEventsError(CANCELLATION_CLOSED_MESSAGE);
      return;
    }

    setRegisteringId(session.id);
    setEventsError('');

    try {
      const realEventId = session.eventId || session.eventTemplateId || session.templateId || session.parentEventId || session.id;
      await removeRegistration(registrationId, currentUser.displayName || currentUser.email, realEventId);
      setRegisteredMap((current) => {
        const next = { ...current };
        delete next[session.id];
        return next;
      });
      setCounts((current) => ({
        ...current,
        [realEventId]: Math.max(0, (current[realEventId] ?? 1) - 1),
        [session.id]: Math.max(0, (current[session.id] ?? 1) - 1),
      }));
    } catch (error) {
      console.error('Cancel session registration failed:', error);
      setEventsError('Could not cancel this session registration. Please try again.');
    } finally {
      setRegisteringId(null);
    }
  }

  function openSuggestionModal() {
    setSuggestionErrors({});
    setSuggestionSuccess('');
    setSuggestionSubmitError('');
    setIsSuggestionModalOpen(true);
  }

  function closeSuggestionModal() {
    setIsSuggestionModalOpen(false);
    setSuggestionErrors({});
    setSuggestionSubmitError('');
    setIsSubmittingSuggestion(false);
  }

  function openBookingModal(eventId) {
    setBookingEventId(eventId);
  }

  function closeBookingModal() {
    setBookingEventId(null);
  }

  function updateSuggestionField(fieldName, value) {
    setSuggestionForm((current) => ({ ...current, [fieldName]: value }));
    setSuggestionErrors((current) => ({ ...current, [fieldName]: '' }));
    setSuggestionSubmitError('');
  }

  function validateSuggestionForm() {
    const nextErrors = {};

    if (!suggestionForm.title.trim()) nextErrors.title = 'Please enter a workshop title.';
    if (!suggestionForm.category) nextErrors.category = 'Please choose a category.';
    if (!suggestionForm.description.trim()) nextErrors.description = 'Please add a short description.';

    setSuggestionErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmitSuggestion(event) {
    event.preventDefault();

    if (!validateSuggestionForm()) return;

    setIsSubmittingSuggestion(true);
    setSuggestionSubmitError('');

    try {
      const suggestion = await createWorkshopSuggestion(suggestionForm, currentUser);
      setSuggestions((current) => [suggestion, ...current]);
      setSuggestionSuccess('Thank you. Your suggestion was submitted successfully.');
      setSuggestionForm(emptySuggestionForm);

      window.setTimeout(() => {
        setIsSuggestionModalOpen(false);
        setSuggestionSuccess('');
      }, 1200);
    } catch (error) {
      console.error('Failed to submit workshop suggestion:', error);
      setSuggestionSubmitError('Could not submit your suggestion. Please check Firestore rules and try again.');
    } finally {
      setIsSubmittingSuggestion(false);
    }
  }

  const eventsContent = (
    <>
      <section className="events-hero-banner" aria-label="Events wellness banner">
        <img className="events-hero-banner__image" src={eventsHeroBanner} alt="" />
      </section>

      {(loadingEvents || eventsError) && (
        <div className={`events-status${eventsError ? ' events-status--error' : ''}`}>
          <span>{loadingEvents ? 'Loading live events from Firestore...' : eventsError}</span>
          {eventsError && !loadingEvents && (
            <button type="button" onClick={() => setEventsReloadKey((current) => current + 1)}>
              Retry
            </button>
          )}
        </div>
      )}

      <section className="events-categories" aria-label="Event categories">
        <div className="events-category-grid">
          {categoryCards.map((card) => (
              <EventCategoryButton
                {...card}
                active={activeView === card.type}
                onClick={() => setActiveView(card.type)}
              key={card.type}
            />
          ))}
        </div>
      </section>

      {!loadingEvents && !eventsError && (
        <section className="events-list-panel">
          {activeView === VIEW_APPOINTMENTS ? (
            <AppointmentServicesPanel
              events={filteredEvents}
              selectedEvent={activeBookingEvent?.eventType === 'appointment' ? activeBookingEvent : null}
              registeredSessionIds={registeredSessionIds}
              onOpenBooking={openBookingModal}
              onRegisterSession={handleRegisterSession}
              onCancelSession={handleCancelSession}
              onCloseBooking={closeBookingModal}
            />
          ) : activeView === VIEW_REGISTERED ? (
            <RegisteredEventsPanel
              events={filteredEvents}
              onCancelRegistration={handleCancelSession}
            />
          ) : (
            <WorkshopListPanel
              events={filteredEvents}
              selectedEvent={activeBookingEvent?.eventType === 'workshop' ? activeBookingEvent : null}
              registeredSessionIds={registeredSessionIds}
              onOpenBooking={openBookingModal}
              onRegisterSession={handleRegisterSession}
              onCancelSession={handleCancelSession}
              onCloseBooking={closeBookingModal}
            />
          )}
        </section>
      )}

      {!loadingEvents && !eventsError && filteredEvents.length === 0 && (
        <section className="events-empty">
          <AutoAwesomeIcon />
          <h2>No events here yet</h2>
          <p>When matching published events are available, they will appear in this section.</p>
        </section>
      )}

      {isSuggestionModalOpen && (
        <SuggestWorkshopModal
          form={suggestionForm}
          errors={suggestionErrors}
          successMessage={suggestionSuccess}
          submitError={suggestionSubmitError}
          isSubmitting={isSubmittingSuggestion}
          onChange={updateSuggestionField}
          onSubmit={handleSubmitSuggestion}
          onClose={closeSuggestionModal}
        />
      )}

    </>
  );

  if (embedInDashboard) {
    return (
      <section className="events-main events-main--embedded" dir="rtl">
        {eventsContent}
      </section>
    );
  }

  return (
    <main className="events-page" dir="rtl">
      <aside className="events-sidebar" aria-label="Participant navigation">
        <button className="events-brand" type="button" onClick={() => navigate('/home')}>
          <span className="events-brand__mark">S</span>
          <span className="events-brand__text">
            <strong>She-Na</strong>
            <small>Your journey matters</small>
          </span>
        </button>

        <nav className="events-nav">
          {participantNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={item.key === 'events' ? 'is-active' : ''}
                type="button"
                onClick={() => navigate(item.path)}
                key={item.key}
              >
                <Icon fontSize="small" />
                <span>{item.label}</span>
                {item.badge && <small>{item.badge}</small>}
              </button>
            );
          })}
        </nav>

        <div className="events-support-card">
          <VolunteerActivismIcon />
          <strong>Need Support?</strong>
          <span>We are here for you.</span>
          <button type="button" onClick={() => navigate('/home')}>
            Contact Us
          </button>
        </div>

        <button className="events-logout" type="button" onClick={logout}>
          <LogoutIcon fontSize="small" />
          <span>Logout</span>
        </button>
      </aside>

      <section className="events-main">
        <header className="events-topbar">
          <div>
            <p>Hi, {displayName}</p>
            <strong>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</strong>
          </div>
          <div className="events-profile">
            <span>{currentUser?.email || 'Participant'}</span>
            <strong>{displayName.slice(0, 2).toUpperCase()}</strong>
          </div>
        </header>
        {eventsContent}
      </section>
    </main>
  );
}
