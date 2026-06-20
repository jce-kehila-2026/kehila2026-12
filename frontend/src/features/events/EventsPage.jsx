import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { useLocation, useNavigate } from 'react-router-dom';
import appointmentsHero from '../../assets/appointments-hero.png';
import { useAdmin } from '../admin/context/AdminContext';
import { getPublishedEvents } from '../admin/services/eventService';
import { localizeField } from '../../i18n/localizeField';
import { useParticipantLocale } from '../participant/context/ParticipantLocaleContext';
import {
  addRegistration,
  getUserRegisteredEventIds,
  removeRegistration,
} from '../admin/services/registrationService';
import { createWorkshopSuggestion } from './workshopSuggestionService';
import './EventsPage.css';

const VIEW_WORKSHOPS = 'workshops';
const VIEW_APPOINTMENTS = 'appointments';
const VIEW_REGISTERED = 'registered';

function resolveEventsTab(tab) {
  if (tab === VIEW_APPOINTMENTS || tab === 'appointments') return VIEW_APPOINTMENTS;
  if (tab === VIEW_WORKSHOPS || tab === 'workshops') return VIEW_WORKSHOPS;
  return VIEW_REGISTERED;
}
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
  { key: 'home', labelKey: 'navHome', icon: HomeRoundedIcon, path: '/home' },
  { key: 'calendar', labelKey: 'navCalendar', icon: CalendarMonthIcon, path: '/calendar' },
  { key: 'events', labelKey: 'navEvents', icon: EventAvailableIcon, path: '/events' },
  { key: 'community', labelKey: 'navCommunity', icon: Diversity3Icon, path: '/home' },
  { key: 'messages', labelKey: 'evMessages', icon: ChatBubbleOutlineIcon, path: '/home', badge: 3 },
  { key: 'settings', labelKey: 'navSettings', icon: SettingsIcon, path: '/home' },
];

function useLockBodyScroll() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, []);
}

function toDate(value) {
  if (!value) return null;
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const CANCELLATION_WINDOW_MS = 48 * 60 * 60 * 1000;
const CANCELLATION_CLOSED_MESSAGE = 'Booking can no longer be cancelled (less than 48h remaining)';
const INTL_LOCALE_BY_LANG = { he: 'he-IL', ar: 'ar', en: 'en' };

// Translation helper for module-level formatters: uses `t` when supplied,
// otherwise the English fallback so any non-localized call still works.
function tr(t, key, fallback) {
  return typeof t === 'function' ? t(key) : fallback;
}

function canCancelSessionBooking(session, now = new Date()) {
  const startDate = toDate(session?.startDate || session?.eventDate);
  return Boolean(startDate && startDate.getTime() - now.getTime() > CANCELLATION_WINDOW_MS);
}

function formatEventDate(value, t = null, intlLocale = 'en') {
  const date = toDate(value);
  if (!date) return tr(t, 'evToBeScheduled', 'To be scheduled');

  return new Intl.DateTimeFormat(intlLocale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatEventTime(startValue, endValue, t = null, intlLocale = 'en') {
  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start) return tr(t, 'evTimeTBD', 'Time TBD');

  const formatter = new Intl.DateTimeFormat(intlLocale, {
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

function formatWeekday(value, intlLocale = 'en') {
  const date = toDate(value);
  if (!date) return null;

  return new Intl.DateTimeFormat(intlLocale, { weekday: 'long' }).format(date);
}

function formatWeeklySchedule(value, t = null, intlLocale = 'en') {
  const weekday = formatWeekday(value, intlLocale);
  return weekday ? tr(t, 'evEveryDay', 'Every {day}').replace('{day}', weekday) : tr(t, 'evScheduleTBD', 'Schedule TBD');
}

function formatWeeklyScheduleFromDay(dayIndex, t = null, intlLocale = 'en') {
  if (!Number.isInteger(dayIndex)) return tr(t, 'evScheduleTBD', 'Schedule TBD');
  // Build a real date for the weekday so the day name is localized.
  const reference = new Date();
  reference.setDate(reference.getDate() + ((dayIndex - reference.getDay() + 7) % 7));
  const weekday = new Intl.DateTimeFormat(intlLocale, { weekday: 'long' }).format(reference);
  return tr(t, 'evEveryDay', 'Every {day}').replace('{day}', weekday);
}

function formatSessionDate(value, t = null, intlLocale = 'en') {
  const date = toDate(value);
  if (!date) return tr(t, 'evDateTBD', 'Date TBD');

  return new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatSessionTabDate(value, t = null, intlLocale = 'en') {
  const date = toDate(value);
  if (!date) return tr(t, 'evDateTBD', 'Date TBD');

  return new Intl.DateTimeFormat(intlLocale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatAvailableSpots(availableSpots, t = null) {
  if (availableSpots === null) return tr(t, 'evSpotsAvailable', 'Spots available');
  if (availableSpots === 1) return tr(t, 'evOneSpotLeft', '1 spot left');
  return tr(t, 'evSpotsLeft', '{n} spots left').replace('{n}', String(availableSpots));
}

function getCalendarTitle(sessions, t = null, intlLocale = 'en') {
  const dates = sessions.map((session) => toDate(session.startDate)).filter(Boolean);
  if (!dates.length) return tr(t, 'evUpcomingDates', 'Upcoming dates');

  const firstDate = dates[0];
  return new Intl.DateTimeFormat(intlLocale, {
    month: 'long',
    year: 'numeric',
  }).format(firstDate);
}

function buildBookingCalendar(sessions, t = null, intlLocale = 'en') {
  const dates = sessions.map((session) => toDate(session.startDate)).filter(Boolean);
  if (!dates.length) return { title: tr(t, 'evUpcomingDates', 'Upcoming dates'), days: [] };

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
    title: getCalendarTitle(sessions, t, intlLocale),
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

function getWeeklyScheduleLabel(event, fallbackStart, t = null, intlLocale = 'en') {
  if (event.weeklyDay) return tr(t, 'evEveryDay', 'Every {day}').replace('{day}', event.weeklyDay);

  const eventDayIndex = getEventWeeklyDayIndex(event);
  if (Number.isInteger(eventDayIndex)) {
    return formatWeeklyScheduleFromDay(eventDayIndex, t, intlLocale);
  }

  return formatWeeklySchedule(fallbackStart, t, intlLocale);
}

function formatSlotsTimeRange(providerSlots, dateSource, t = null, intlLocale = 'en') {
  const slotDates = providerSlots
    .map((slot) => ({
      start: copyTimeToDate(dateSource, slot.startSource),
      end: copyTimeToDate(dateSource, slot.endSource),
    }))
    .filter((slot) => slot.start);

  if (!slotDates.length) return tr(t, 'evTimeTBD', 'Time TBD');

  if (slotDates.length === 1) {
    return formatEventTime(slotDates[0].start, slotDates[0].end, t, intlLocale);
  }

  const earliestStart = slotDates.reduce((earliest, slot) =>
    slot.start.getTime() < earliest.getTime() ? slot.start : earliest,
  slotDates[0].start);
  const latestEnd = slotDates
    .map((slot) => slot.end || slot.start)
    .reduce((latest, date) => (date.getTime() > latest.getTime() ? date : latest), slotDates[0].end || slotDates[0].start);

  return formatEventTime(earliestStart, latestEnd, t, intlLocale);
}

function getInstructorLabel(event, t = null) {
  return (
    event.therapist ||
    event.instructor ||
    event.facilitator ||
    event.coach ||
    event.host ||
    event.provider ||
    event.organizer ||
    tr(t, 'evSheNaTeam', 'She-Na Team')
  );
}

function getProviderName(provider, fallback, t = null) {
  return (
    provider.providerName ||
    provider.therapistName ||
    provider.therapist ||
    provider.instructorName ||
    provider.instructor ||
    provider.name ||
    fallback ||
    tr(t, 'evSheNaTeam', 'She-Na Team')
  );
}

function getProviderSpecialty(provider, event, t = null) {
  return (
    provider.specialty ||
    provider.role ||
    provider.title ||
    provider.category ||
    event.category ||
    (inferEventType(event) === 'appointment' ? tr(t, 'evTherapist', 'Therapist') : tr(t, 'evInstructor', 'Instructor'))
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

function getProviderSlots(event, t = null) {
  const providerEntries = getProviderSlotArrays(event);

  if (providerEntries.length) {
    return providerEntries.flatMap((provider, providerIndex) => {
      const providerName = getProviderName(provider, getInstructorLabel(event, t), t);
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
          providerSpecialty: getProviderSpecialty(provider, event, t),
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
      const providerName = getProviderName(slot, getInstructorLabel(event, t), t);
      const providerId = slugifyIdentifier(slot.providerId || slot.therapistId || slot.instructorId || providerName || `provider-${slotIndex + 1}`);
      const startSource = slot.startTime || slot.start || slot.from || event.startTime || event.date;
      const endSource = slot.endTime || slot.end || slot.to || event.endTime;

      return {
        providerId,
        providerName,
        providerSpecialty: getProviderSpecialty(slot, event, t),
        providerAvatar: getProviderAvatar(slot),
        slotId: slugifyIdentifier(slot.id || `${providerId}-${getTimeKey(startSource)}-${getTimeKey(endSource)}-${slotIndex + 1}`),
        startSource,
        endSource,
        room: slot.room || slot.location || event.room || event.location || 'She-Na Center',
        capacity: Number(slot.maxParticipants || slot.capacity || slot.availableSpots || event.maxParticipants || event.capacity) || 0,
      };
    });
  }

  const fallbackProvider = getInstructorLabel(event, t);
  const providerId = slugifyIdentifier(event.providerId || event.therapistId || event.instructorId || fallbackProvider);

  return [
    {
      providerId,
      providerName: fallbackProvider,
      providerSpecialty: event.category || (inferEventType(event) === 'appointment' ? tr(t, 'evTherapist', 'Therapist') : tr(t, 'evInstructor', 'Instructor')),
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
  const { t } = useParticipantLocale();
  const typeLabel = event.eventType === 'appointment' ? t('evAppointment') : t('evWorkshop');
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
          aria-label={t('evAboutAria').replace('{type}', typeLabel)}
        >
          <KeyboardArrowDownIcon fontSize="small" />
          <span>{t('evAbout')}</span>
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
          {registrationClosed ? t('evRegistrationClosed') : hasRegisteredSessions ? t('evChooseMoreDates') : t('evViewDates')}
          <ArrowForwardIcon fontSize="small" />
        </button>
      </div>
    </article>
  );
}

function getAppointmentServiceLabel(title = '', t = null) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return tr(t, 'evWellnessSession', 'Wellness Session');

  const normalized = cleanTitle.toLowerCase();
  if (normalized === 'yoga') return tr(t, 'evYogaTherapy', 'Yoga Therapy');
  if (normalized.includes('massage') && !normalized.includes('therapy')) return tr(t, 'evTherapySuffix', '{title} Therapy').replace('{title}', cleanTitle);
  if (normalized.includes('acupuncture')) return tr(t, 'evAcupuncture', 'Acupuncture');
  if (normalized.includes('reflexology')) return tr(t, 'evReflexology', 'Reflexology');
  return cleanTitle;
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

function getAppointmentProviders(event, t = null) {
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
      name: option.providerName || tr(t, 'evSheNaTeam', 'She-Na Team'),
      specialty: option.providerSpecialty || event.category || tr(t, 'evWellnessTeacher', 'Wellness Teacher'),
      avatar: option.providerAvatar || '',
      dateKeys: nextDates,
      sessions: (existing?.sessions || 0) + 1,
    });
  });

  return Array.from(providers.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function getAppointmentDayPills(event, intlLocale = 'en') {
  const days = new Map();

  event.sessionOptions.forEach((option) => {
    const date = toDate(option.startDate);
    if (!date) return;
    const dayIndex = date.getDay();
    days.set(dayIndex, new Intl.DateTimeFormat(intlLocale, { weekday: 'short' }).format(date));
  });

  return Array.from(days.entries())
    .sort(([left], [right]) => left - right)
    .map(([, label]) => label);
}

function getAppointmentDateOptions(event, providerId, intlLocale = 'en') {
  return event.sessions
    .filter((session) => session.options.some((option) => option.providerId === providerId))
    .sort(sortSessionsByDate)
    .map((session) => ({
      dateKey: session.dateKey,
      label: new Intl.DateTimeFormat(intlLocale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(toDate(session.startDate) || new Date()),
      shortLabel: session.tabLabel || session.date,
      session,
    }));
}

function getAppointmentTimeOptions(event, dateKey, providerId, registeredSessionIds, t = null) {
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
          label: option.time || option.selectedTimeSlot || tr(t, 'evTimeTBD', 'Time TBD'),
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
  const { t, lang } = useParticipantLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en';
  const providers = getAppointmentProviders(event, t);
  const days = getAppointmentDayPills(event, intlLocale);
  const serviceLabel = getAppointmentServiceLabel(event.title, t);
  const providerCount = providers.length || 1;
  const providerUnit = providers.length === 1 ? t('evInstructorSingular') : t('evInstructorPlural');

  return (
    <article className={`appointment-service-card${isSelected ? ' is-selected' : ''}`}>
      <div className="appointment-service-card__media">
        <img src={event.imageUrl || appointmentsHero} alt="" />
      </div>

      <div className="appointment-service-card__copy">
        <h3>{serviceLabel}</h3>
        <p>{event.description}</p>
        <div className="appointment-service-card__meta" aria-label={t('evAvailableDaysAria').replace('{service}', serviceLabel)}>
          {(days.length ? days : [t('evSoon')]).map((day) => (
            <span key={day}>{day}</span>
          ))}
          <span className="appointment-service-card__provider-count">
            {t('evAvailableWith').replace('{count}', String(providerCount)).replace('{unit}', providerUnit)}
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
        {t('evViewAvailableTimes')}
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
  const { t } = useParticipantLocale();
  return (
    <section className={`appointments-tab-panel${selectedEvent ? ' has-panel' : ''}`} aria-label={t('evAppointmentServicesAria')}>
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
  useLockBodyScroll();

  const { t, lang } = useParticipantLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en';
  const providers = useMemo(() => getAppointmentProviders(event, t), [event, t]);
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
    () => (selectedProvider ? getAppointmentDateOptions(event, selectedProvider.id, intlLocale) : []),
    [event, selectedProvider, intlLocale],
  );
  const selectedDate = dateOptions[dateIndex] || dateOptions[0] || null;
  const timeOptions = useMemo(
    () => getAppointmentTimeOptions(event, selectedDate?.dateKey, selectedProvider?.id, registeredSessionIds, t),
    [event, registeredSessionIds, selectedDate?.dateKey, selectedProvider?.id, t],
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

  const serviceLabel = getAppointmentServiceLabel(event.title, t);
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

  const modalContent = (
    <div className="booking-flow-modal appointment-drawer-modal" role="presentation">
      <button
        className="booking-flow-modal__backdrop appointment-drawer__backdrop"
        type="button"
        onClick={onClose}
        aria-label="Close appointment booking"
      />
      <aside
        className="appointment-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-drawer-title"
        dir="ltr"
      >
        <button className="appointment-drawer__close" type="button" onClick={onClose} aria-label={t('evCloseAppointmentBooking')}>
          <CloseIcon fontSize="small" />
        </button>

        <header className="appointment-drawer__header">
          <h2 id="appointment-drawer-title">{serviceLabel}</h2>
          <p>{t('evBookASession')}</p>
        </header>

        <div className="appointment-drawer__body">
          <section className="appointment-booking-step">
            <h3><span>1</span> {t('evStep1Instructor')}</h3>
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
            <h3><span>2</span> {t('evStep2Date')}</h3>
            <div className="appointment-date-selector">
              <button
                type="button"
                onClick={() => setDateIndex((current) => Math.max(0, current - 1))}
                disabled={dateIndex <= 0}
                aria-label={t('evPrevDate')}
              >
                <ArrowBackIcon fontSize="small" />
              </button>
              <strong>
                <CalendarMonthIcon fontSize="small" />
                {selectedDate?.label || t('evDatesComingSoon')}
              </strong>
              <button
                type="button"
                onClick={() => setDateIndex((current) => Math.min(dateOptions.length - 1, current + 1))}
                disabled={dateIndex >= dateOptions.length - 1}
                aria-label={t('evNextDate')}
              >
                <ArrowForwardIcon fontSize="small" />
              </button>
            </div>
          </section>

          <section className="appointment-booking-step">
            <h3><span>3</span> {t('evStep3Times')}</h3>
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
              <p className="appointment-drawer__empty">{t('evNoTimesInstructor')}</p>
            )}
            <p className="appointment-drawer__timezone">
              <AccessTimeIcon fontSize="small" />
              {t('evLocalTime')}
            </p>
          </section>
        </div>

        <div className="appointment-drawer__actions">
          <button
            className="appointment-drawer__confirm"
            type="button"
            onClick={handleConfirmBooking}
            disabled={confirmDisabled}
          >
            {selectedOption?.isRegistering
              ? t('evPleaseWait')
              : isRegistered
                ? t('evCancelBooking')
                : t('evConfirmBooking')}
            <ArrowForwardIcon fontSize="small" />
          </button>
          <button className="appointment-drawer__cancel" type="button" onClick={onClose}>
            {t('evCancel')}
          </button>
        </div>
      </aside>
    </div>
  );

  return typeof document === 'undefined' ? modalContent : createPortal(modalContent, document.body);
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

function getWorkshopAvailabilityLabel(session, t = null) {
  if (!session) return tr(t, 'evAvailabilityComingSoon', 'Availability coming soon');
  if (!session.capacity || session.capacity <= 0) return tr(t, 'evOpenRegistration', 'Open registration');

  const remaining = Math.max(0, session.capacity - (session.participants || 0));
  return tr(t, 'evRemainingSpots', '{remaining} of {capacity} spots available')
    .replace('{remaining}', String(remaining))
    .replace('{capacity}', String(session.capacity));
}

function WorkshopListCard({ event, registeredSessionIds, isSelected, onOpenBooking }) {
  const { t } = useParticipantLocale();
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
            {session?.date || event.date || t('evDateTBD')}
          </span>
          <span>
            <AccessTimeIcon fontSize="small" />
            {session?.time || event.time || t('evTimeTBD')}
          </span>
          <span>
            <HomeRoundedIcon fontSize="small" />
            {session?.location || event.location || 'She-Na Center'}
          </span>
          <span>
            <GroupsRoundedIcon fontSize="small" />
            {getWorkshopAvailabilityLabel(session, t)}
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
        {registrationClosed ? t('evRegistrationClosed') : isRegistered ? t('evViewRegistration') : t('evViewDetailsRegister')}
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
  useLockBodyScroll();
  const { t } = useParticipantLocale();
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

  const modalContent = (
    <div className="booking-flow-modal" role="presentation">
      <button
        className="booking-flow-modal__backdrop"
        type="button"
        onClick={onClose}
        aria-label="Close workshop details"
      />
    <aside
      className="workshop-details-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workshop-details-title"
      dir="ltr"
    >
      <button className="workshop-details-panel__close" type="button" onClick={onClose} aria-label={t('evCloseWorkshopDetails')}>
        <CloseIcon fontSize="small" />
      </button>

      <header className="workshop-details-panel__header">
        <h2 id="workshop-details-title">{event.title}</h2>
        <p>{isRegistered ? t('evYouAreRegistered') : t('evWorkshopDetails')}</p>
      </header>

      <div className="workshop-details-panel__body">
        <section className="workshop-details-panel__section">
          <h3>{t('evWorkshopDetails')}</h3>
          <p className="workshop-details-panel__description">{event.description}</p>
        </section>

        <div className="workshop-details-panel__details">
          <span>
            <EventAvailableIcon fontSize="small" />
            <strong>{t('evDate')}</strong>
            {session?.date || event.date || t('evDateTBD')}
          </span>
          <span>
            <AccessTimeIcon fontSize="small" />
            <strong>{t('evTime')}</strong>
            {session?.time || event.time || t('evTimeTBD')}
          </span>
          <span>
            <HomeRoundedIcon fontSize="small" />
            <strong>{t('evLocation')}</strong>
            {session?.location || event.location || 'She-Na Center'}
          </span>
          <span>
            <PersonIcon fontSize="small" />
            <strong>{t('evInstructorLabel')}</strong>
            {session?.providerName || event.instructor || t('evSheNaTeam')}
          </span>
          <span>
            <GroupsRoundedIcon fontSize="small" />
            <strong>{t('evSpots')}</strong>
            {getWorkshopAvailabilityLabel(session, t)}
          </span>
          <span>
            <CalendarMonthIcon fontSize="small" />
            <strong>{t('evStatus')}</strong>
            {isRegistered ? t('evRegistered') : registrationClosed ? t('evClosed') : isFull ? t('evFull') : t('evOpen')}
          </span>
        </div>

        {isRegistered && !canCancelBooking && (
          <p className="workshop-details-panel__notice">{t('evCancellationClosed')}</p>
        )}
      </div>

      <div className="workshop-details-panel__actions">
        <button
          className={`workshop-details-panel__primary${isRegistered ? ' is-cancel' : ''}`}
          type="button"
          onClick={handleWorkshopAction}
          disabled={actionDisabled}
        >
          {session?.isRegistering
            ? t('evPleaseWait')
            : isRegistered
              ? t('evCancelRegistration')
              : isFull
                ? t('evWorkshopFull')
                : registrationClosed
                  ? t('evRegistrationClosed')
                  : t('evRegister')}
          <ArrowForwardIcon fontSize="small" />
        </button>
        <button className="workshop-details-panel__secondary" type="button" onClick={onClose}>
          {t('evClose')}
        </button>
      </div>
    </aside>
    </div>
  );

  return typeof document === 'undefined' ? modalContent : createPortal(modalContent, document.body);
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
  const { t } = useParticipantLocale();
  return (
    <section className={`workshops-tab-panel${selectedEvent ? ' has-panel' : ''}`} aria-label={t('evWorkshopSessionsAria')}>
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
  const { t, lang } = useParticipantLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en';
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
  const bookingCalendar = buildBookingCalendar(event.sessions, t, intlLocale);
  const sessionsByDateKey = new Map(event.sessions.map((session) => [session.dateKey, session]));

  return (
    <div className="events-booking-modal" role="presentation">
      <button className="events-booking-modal__backdrop" type="button" aria-label={t('evCloseBookingCalendar')} onClick={onClose} />
      <section
        className="events-booking-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="events-booking-modal-title"
        dir="ltr"
      >
        <button className="events-booking-modal__close" type="button" onClick={onClose} aria-label={t('evCloseBookingCalendar')}>
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
                    <p>{t('evOnlyAvailableHighlighted')}</p>
                    <p>{t('evSelectDateToView')}</p>
                  </div>
                </header>

                <div className="events-card__calendar" aria-label={t('evAvailableCalendarDatesAria').replace('{title}', event.title)}>
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
                          aria-label={session ? t('evChooseDate').replace('{date}', session.date) : t('evUnavailableDate')}
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
                      <p>{t('evAvailableSessions')}</p>
                      <button
                        className="events-card__change-date events-card__change-date--back"
                        type="button"
                        onClick={handleChangeDate}
                      >
                        <ArrowBackIcon fontSize="small" />
                        {t('evBackToCalendar')}
                      </button>
                    </div>
                  </header>

                  {selectedOptions.length === 0 ? (
                    <p className="events-card__booking-empty">{t('evNoSessionsForDate')}</p>
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
                                  ? t('evWait')
                                  : isRegistered
                                    ? t('evCancelBooking')
                                    : isFull
                                      ? t('evFull')
                                      : t('evRegister')}
                              </button>
                              {isRegistered && !canCancelBooking && (
                                <small>{t('evCancellationClosed')}</small>
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
          <p className="events-card__booking-empty">{t('evUpcomingDatesSoon')}</p>
        )}
      </section>
    </div>
  );
}

function RegisteredSessionCard({ session, onCancelRegistration }) {
  const { t } = useParticipantLocale();
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
        <span className="registered-session-card__status">{t('evRegistered')}</span>
        <button
          className="registered-session-card__cancel"
          type="button"
          onClick={() => onCancelRegistration(session)}
          disabled={session.isRegistering}
        >
          <CalendarMonthIcon fontSize="small" />
          {session.isRegistering ? t('evPleaseWait') : t('evCancelRegistration')}
        </button>
      </div>
    </article>
  );
}

function RegisteredEventsPanel({
  events,
  onCancelRegistration,
}) {
  const { t } = useParticipantLocale();
  return (
    <section className="registered-tab-panel" aria-label={t('evRegisteredEventsAria')}>
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
  const { t } = useParticipantLocale();
  return (
    <div className="suggest-modal" role="presentation">
      <div className="suggest-modal__overlay" onClick={onClose} />
      <section className="suggest-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="suggest-modal-title">
        <button className="suggest-modal__close" type="button" onClick={onClose} aria-label={t('evCloseSuggestionForm')}>
          <CloseIcon />
        </button>

        <div className="suggest-modal__header">
          <span className="suggest-modal__mark">
            <FavoriteBorderOutlinedIcon />
          </span>
          <h2 id="suggest-modal-title">{t('evSuggestTitle')}</h2>
          <p>{t('evSuggestSubtitle')}</p>
        </div>

        {successMessage && <div className="suggest-modal__success">{successMessage}</div>}
        {submitError && <div className="suggest-modal__error">{submitError}</div>}

        <form className="suggest-form" onSubmit={onSubmit}>
          <label className="suggest-form__field">
            <span>{t('evWorkshopTitleField')}</span>
            <div className="suggest-form__control">
              <EditOutlinedIcon />
              <input
                value={form.title}
                onChange={(event) => onChange('title', event.target.value)}
                placeholder={t('evTitlePlaceholder')}
              />
            </div>
            {errors.title && <small>{errors.title}</small>}
          </label>

          <label className="suggest-form__field">
            <span>{t('evCategoryField')}</span>
            <div className="suggest-form__control">
              <GroupsRoundedIcon />
              <select value={form.category} onChange={(event) => onChange('category', event.target.value)}>
                <option value="">{t('evSelectCategory')}</option>
                {suggestionCategories.map((category) => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </select>
            </div>
            {errors.category && <small>{errors.category}</small>}
          </label>

          <label className="suggest-form__field">
            <span>{t('evShortDescField')}</span>
            <div className="suggest-form__control suggest-form__control--textarea">
              <MenuBookIcon />
              <textarea
                value={form.description}
                onChange={(event) => onChange('description', event.target.value)}
                placeholder={t('evDescPlaceholder')}
                rows={3}
              />
            </div>
            {errors.description && <small>{errors.description}</small>}
          </label>

          <label className="suggest-form__field">
            <span>{t('evWhyHelpField')}</span>
            <div className="suggest-form__control suggest-form__control--textarea">
              <FavoriteBorderIcon />
              <textarea
                value={form.reason}
                onChange={(event) => onChange('reason', event.target.value)}
                placeholder={t('evReasonPlaceholder')}
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
              {t('evSubmitAnonymously')}
              <small>{t('evNameNotVisible')}</small>
            </span>
          </label>

          <div className="suggest-form__actions">
            <button className="suggest-form__cancel" type="button" onClick={onClose}>{t('evCancel')}</button>
            <button className="suggest-form__submit" type="submit" disabled={isSubmitting}>
              <SendOutlinedIcon fontSize="small" />
              {isSubmitting ? t('evSubmitting') : t('evSubmitSuggestion')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function EventsPage({ embedInDashboard = false, locale = 'he' }) {
  const { t, lang, direction } = useParticipantLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en';
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAdmin();
  const [activeView, setActiveView] = useState(() => resolveEventsTab(location.state?.eventsTab));
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({});
  const [registeredMap, setRegisteredMap] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [registrationWarning, setRegistrationWarning] = useState('');
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

  useEffect(() => {
    if (!location.state?.eventsTab) return;
    setActiveView(resolveEventsTab(location.state.eventsTab));
  }, [location.state?.eventsTab, location.key]);

  const displayName = useMemo(() => {
    if (currentUser?.displayName) return currentUser.displayName.split(' ')[0];
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return t('evParticipant');
  }, [currentUser, t]);

  const refreshRegistrationData = useCallback(async (eventList) => {
    if (!eventList.length) {
      setCounts({});
      setRegisteredMap({});
      return;
    }

    try {
      const userRegistrations = currentUser?.uid
        ? await getUserRegisteredEventIds(currentUser.uid)
        : {};

      setCounts({});
      setRegisteredMap(userRegistrations);
      setRegistrationWarning('');
    } catch (error) {
      console.error('Failed to load event registration data:', error);
      setCounts({});
      setRegisteredMap({});
      setRegistrationWarning(t('evRegDataWarning'));
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    let cancelled = false;
    setLoadingEvents(true);
    setEventsError('');
    setRegistrationWarning('');

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
        setRegistrationWarning('');
        setEventsError(t('evLoadError'));
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
        const displayTitle = localizeField(event.translations?.title ?? event.title, locale) || t('evUntitledEvent');
        const displayCategory = eventType === 'appointment' ? t('evAppointment') : t('evWorkshop');
        const templateStart = event.startTime || event.date;
        const providerSlots = getProviderSlots(event, t);
        const providerNames = [...new Set(providerSlots.map((slot) => slot.providerName))];
        const roomLabels = [...new Set(providerSlots.map((slot) => slot.room).filter(Boolean))];
        const displayLocation = roomLabels.length > 1 ? t('evMultipleRooms') : roomLabels[0] || localizeField(event.translations?.location ?? event.location, locale) || 'She-Na Center';
        const sessionStarts = getSessionStartsForEvent(event, providerSlots);
        const weeklySchedule = getWeeklyScheduleLabel(event, templateStart, t, intlLocale);
        const templateDescription = localizeField(event.translations?.description ?? event.description, locale) || t('evMoreDetailsSoon');
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
              date: formatSessionDate(optionStart || sessionStart, t, intlLocale),
              dateKey,
              selectedDate: dateKey,
              startDate: optionStart || sessionStart,
              endDate: optionEnd,
              time: formatEventTime(optionStart || sessionStart, optionEnd, t, intlLocale),
              selectedTimeSlot: formatEventTime(optionStart || sessionStart, optionEnd, t, intlLocale),
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
            date: formatSessionDate(sessionStart, t, intlLocale),
            tabLabel: formatSessionTabDate(sessionStart, t, intlLocale),
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
          date: formatEventDate(templateStart, t, intlLocale),
          time: formatSlotsTimeRange(providerSlots, sessionStarts[0] || templateStart, t, intlLocale),
          participants: sessionOptions.reduce((total, session) => total + session.participants, 0),
          capacity: sessionOptions.reduce((total, session) => total + session.capacity, 0),
          location: displayLocation,
          tone: getEventTone(eventType, index),
          imageUrl,
          eventType,
          instructor: getInstructorLabel(event, t),
          providerSummary: providerNames.length > 1 ? t('evProvidersAvailable').replace('{n}', String(providerNames.length)) : providerNames[0] || getInstructorLabel(event, t),
          registrationOpen: event.registrationOpen !== false,
          weeklySchedule,
          temporalStatus: getTemporalStatus(sessions[0]?.startDate || templateStart),
          sessions,
          sessionOptions,
        };
      }),
    [counts, events, registeringId, locale, t, intlLocale],
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
        type: VIEW_REGISTERED,
        title: t('evCatRegisteredEvents'),
        color: 'peach',
        icon: PersonIcon,
      },
      {
        type: VIEW_APPOINTMENTS,
        title: t('evCatAppointments'),
        color: 'blush',
        icon: CalendarMonthIcon,
      },
      {
        type: VIEW_WORKSHOPS,
        title: t('evCatWorkshops'),
        color: 'lavender',
        icon: VolunteerActivismIcon,
      },
    ];
  }, [t]);

  const sectionTitle = useMemo(() => {
    if (activeView === VIEW_APPOINTMENTS) return t('evSecUpcomingAppointments');
    if (activeView === VIEW_REGISTERED) return t('evSecMyRegistered');
    return t('evSecUpcomingWorkshops');
  }, [activeView, t]);

  const registeredSessionIds = useMemo(() => new Set(Object.keys(registeredMap)), [registeredMap]);

  async function handleRegisterSession(event, session) {
    if (!currentUser?.email || registeringId) return;

    if (!event || !session || registeredMap[session.id]) return;

    if (event.isScheduleTemplate) {
      setRegistrationWarning(t('evScheduleNotReady'));
      return;
    }

    if (event.registrationOpen === false) {
      setRegistrationWarning(t('evRegClosedForEvent'));
      return;
    }

    setRegisteringId(session.id);
    setEventsError('');
    setRegistrationWarning('');

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
      setRegistrationWarning(t('evRegisterFailed'));
    } finally {
      setRegisteringId(null);
    }
  }

  async function handleCancelSession(session) {
    if (!currentUser?.email || registeringId || !session) return;

    const registrationId = registeredMap[session.id];
    if (!registrationId) return;

    if (!canCancelSessionBooking(session)) {
      setRegistrationWarning(t('evCancellationClosed'));
      return;
    }

    setRegisteringId(session.id);
    setEventsError('');
    setRegistrationWarning('');

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
      setRegistrationWarning(t('evCancelFailed'));
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

    if (!suggestionForm.title.trim()) nextErrors.title = t('evTitleRequired');
    if (!suggestionForm.category) nextErrors.category = t('evCategoryRequired');
    if (!suggestionForm.description.trim()) nextErrors.description = t('evDescRequired');

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
      setSuggestionSuccess(t('evSuggestSuccess'));
      setSuggestionForm(emptySuggestionForm);

      window.setTimeout(() => {
        setIsSuggestionModalOpen(false);
        setSuggestionSuccess('');
      }, 1200);
    } catch (error) {
      console.error('Failed to submit workshop suggestion:', error);
      setSuggestionSubmitError(t('evSuggestError'));
    } finally {
      setIsSubmittingSuggestion(false);
    }
  }

  const eventsContent = (
    <>
      <section className="events-categories" aria-label={t('evCategoriesAria')}>
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

      {(loadingEvents || eventsError || registrationWarning) && (
        <div className={`events-status${eventsError || registrationWarning ? ' events-status--error' : ''}`}>
          <span>{loadingEvents ? t('evLoadingEvents') : (eventsError || registrationWarning)}</span>
          {eventsError && !loadingEvents && (
            <button type="button" onClick={() => setEventsReloadKey((current) => current + 1)}>
              {t('evRetry')}
            </button>
          )}
        </div>
      )}

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
          <h2>{t('evNoEventsTitle')}</h2>
          <p>{t('evNoEventsBody')}</p>
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
      <section className="events-main events-main--embedded" dir={direction}>
        {eventsContent}
      </section>
    );
  }

  return (
    <main className="events-page" dir={direction}>
      <aside className="events-sidebar" aria-label={t('evNavAria')}>
        <button className="events-brand" type="button" onClick={() => navigate('/home')}>
          <span className="events-brand__mark">S</span>
          <span className="events-brand__text">
            <strong>She-Na</strong>
            <small>{t('evJourneyMatters')}</small>
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
                <span>{t(item.labelKey)}</span>
                {item.badge && <small>{item.badge}</small>}
              </button>
            );
          })}
        </nav>

        <div className="events-support-card">
          <VolunteerActivismIcon />
          <strong>{t('evNeedSupport')}</strong>
          <span>{t('evHereForYou')}</span>
          <button type="button" onClick={() => navigate('/home')}>
            {t('evContactUs')}
          </button>
        </div>

        <button className="events-logout" type="button" onClick={logout}>
          <LogoutIcon fontSize="small" />
          <span>{t('logout')}</span>
        </button>
      </aside>

      <section className="events-main">
        <header className="events-topbar">
          <div>
            <p>{t('evHi').replace('{name}', displayName)}</p>
            <strong>{new Intl.DateTimeFormat(intlLocale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</strong>
          </div>
          <div className="events-profile">
            <span>{currentUser?.email || t('evParticipant')}</span>
            <strong>{displayName.slice(0, 2).toUpperCase()}</strong>
          </div>
        </header>
        {eventsContent}
      </section>
    </main>
  );
}
