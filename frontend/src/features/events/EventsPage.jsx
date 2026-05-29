import { useCallback, useEffect, useMemo, useState } from 'react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
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
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { useNavigate } from 'react-router-dom';
import appointmentsHero from '../../assets/appointments-hero.png';
import { useAdmin } from '../admin/context/AdminContext';
import { getPublishedEvents } from '../admin/services/eventService';
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

const ENGLISH_SCHEDULE_TEMPLATES = [
  {
    title: 'Reflexology',
    keys: ['reflexology'],
    description: 'Gentle pressure therapy through the feet to support balance, relaxation, and inner wellbeing.',
    dayIndex: 1,
    slots: [
      { providerName: 'Margarita', specialty: 'Reflexology Therapist', startTime: '10:30', endTime: '11:00', room: 'Treatment Room #1', capacity: 1 },
      { providerName: 'Margarita', specialty: 'Reflexology Therapist', startTime: '11:00', endTime: '11:30', room: 'Treatment Room #1', capacity: 1 },
      { providerName: 'Margarita', specialty: 'Reflexology Therapist', startTime: '11:30', endTime: '12:00', room: 'Treatment Room #1', capacity: 1 },
      { providerName: 'Margarita', specialty: 'Reflexology Therapist', startTime: '12:00', endTime: '12:30', room: 'Treatment Room #1', capacity: 1 },
      { providerName: 'Margarita', specialty: 'Reflexology Therapist', startTime: '12:30', endTime: '13:00', room: 'Treatment Room #1', capacity: 1 },
    ],
  },
  {
    title: 'Acupuncture and Herbal Medicine',
    keys: ['acupuncture', 'herbal medicine', 'chinese medicine'],
    description: 'Traditional Chinese medicine support for balance, symptom relief, and overall strengthening.',
    dayIndex: 3,
    slots: [
      { providerName: 'Shagi', specialty: 'Acupuncture Therapist', startTime: '10:30', endTime: '11:30', room: 'Treatment Room #1', capacity: 1 },
      { providerName: 'Omer', specialty: 'Acupuncture Therapist', startTime: '10:30', endTime: '11:30', room: 'Treatment Room #2', capacity: 1 },
      { providerName: 'Shagi', specialty: 'Acupuncture Therapist', startTime: '11:30', endTime: '12:30', room: 'Treatment Room #1', capacity: 1 },
      { providerName: 'Omer', specialty: 'Acupuncture Therapist', startTime: '11:30', endTime: '12:30', room: 'Treatment Room #2', capacity: 1 },
    ],
  },
  {
    title: 'Qi Gong',
    keys: ['qi gong', 'qigong'],
    description: 'Gentle movement and breathing practice for release, energetic balance, and mind-body strength.',
    dayIndex: 2,
    slots: [
      { providerName: 'Tzofi', specialty: 'Qi Gong Instructor', startTime: '17:00', room: 'Workshop Room', capacity: 6 },
    ],
  },
  {
    title: "Women's Circle",
    keys: ['women circle', "women's circle", 'the day after'],
    description: 'A supportive women-centered space for sharing, listening, connection, and healing.',
    dayIndex: 1,
    slots: [
      { providerName: 'Stav', specialty: "Women's Circle Facilitator", startTime: '19:30', room: 'Workshop Room', capacity: 8 },
    ],
  },
  {
    title: 'Yoga',
    keys: ['yoga'],
    description: 'Adapted yoga practice combining movement, breathing, and relaxation.',
    dayIndex: 3,
    slots: [
      { providerName: 'Keren', specialty: 'Yoga Instructor', startTime: '10:30', room: 'Workshop Room', capacity: 6 },
    ],
  },
  {
    title: 'Couples Counseling',
    keys: ['couples counseling', 'relationship counseling'],
    description: 'Emotional, practical, and communication-based support for strengthening relationships.',
    dayIndex: 4,
    slots: [
      { providerName: 'Michal Papo', specialty: 'Couples Counselor', startTime: '10:00', room: 'Conversation Room', capacity: 1 },
    ],
  },
  {
    title: 'NLP Therapy',
    keys: ['nlp'],
    description: 'NLP-based emotional and cognitive work for creating change, resilience, and healthier patterns.',
    dayIndex: null,
    slots: [
      { providerName: 'Oshrat Yosef', specialty: 'NLP Therapist', startTime: '', room: '', capacity: 1 },
    ],
  },
  {
    title: 'NLP Touch Therapy',
    keys: ['nlp touch', 'nlp touch therapy'],
    description: 'A combination of NLP and supportive touch for emotional processing, strengthening, and inner resources.',
    dayIndex: null,
    slots: [
      { providerName: 'Eilat Shabtai', specialty: 'NLP and Touch Therapist', startTime: '', room: '', capacity: 1 },
    ],
  },
];

const SCHEDULE_TEMPLATE_MATCH_KEYS = {
  Reflexology: ['\u05e8\u05e4\u05dc\u05e7\u05e1\u05d5\u05dc\u05d5\u05d2\u05d9\u05d4'],
  'Acupuncture and Herbal Medicine': [
    '\u05d3\u05d9\u05e7\u05d5\u05e8 \u05d5\u05e6\u05de\u05d7\u05d9 \u05de\u05e8\u05e4\u05d0',
    '\u05d3\u05d9\u05e7\u05d5\u05e8',
    '\u05e6\u05de\u05d7\u05d9 \u05de\u05e8\u05e4\u05d0',
  ],
  'Qi Gong': [
    '\u05e6\u05f3\u05d9 \u05e7\u05d5\u05e0\u05d2',
    "\u05e6'\u05d9 \u05e7\u05d5\u05e0\u05d2",
    '\u05e6\u05d9\u05e7\u05d5\u05e0\u05d2',
  ],
  "Women's Circle": [
    '\u05de\u05e2\u05d2\u05dc \u05e0\u05e9\u05d9\u05dd',
    '\u05d4\u05d9\u05d5\u05dd \u05e9\u05d0\u05d7\u05e8\u05d9',
  ],
  Yoga: ['\u05d9\u05d5\u05d2\u05d4'],
  'Couples Counseling': [
    '\u05d9\u05d9\u05e2\u05d5\u05e5 \u05d6\u05d5\u05d2\u05d9',
    '\u05d9\u05e2\u05d5\u05e5 \u05d6\u05d5\u05d2\u05d9',
  ],
  'NLP Touch Therapy': ['nlp \u05de\u05d2\u05e2'],
};

const SCHEDULE_TEMPLATES = ENGLISH_SCHEDULE_TEMPLATES.map((template) => ({
  ...template,
  keys: [
    ...template.keys,
    ...(SCHEDULE_TEMPLATE_MATCH_KEYS[template.title] || []),
  ],
}));

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
  const referenceSunday = new Date(2026, 4, 24, 12, 0, 0, 0);
  const date = new Date(referenceSunday);
  date.setDate(referenceSunday.getDate() + dayIndex);

  return `Every ${new Intl.DateTimeFormat('en', { weekday: 'long' }).format(date)}`;
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

function normalizeScheduleText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\u05f3\u05f4'"]/g, '')
    .replace(/\s+/g, ' ');
}

function findScheduleTemplate(event) {
  const searchableText = normalizeScheduleText(`${event.title || ''} ${event.category || ''}`);

  return SCHEDULE_TEMPLATES.find((template) =>
    template.keys.some((key) => searchableText.includes(normalizeScheduleText(key))),
  ) || null;
}

function getFirstSlotStartSource(scheduleTemplate, fallbackStart) {
  const firstScheduledSlot = scheduleTemplate?.slots?.find((slot) => slot.startTime);
  return firstScheduledSlot?.startTime || fallbackStart;
}

function getFirstProviderSlotStartSource(providerSlots, fallbackStart) {
  const firstProviderSlot = providerSlots?.find((slot) => slot.startSource);
  return firstProviderSlot?.startSource || fallbackStart;
}

function getEventWeeklyDayIndex(event, scheduleTemplate) {
  const rawDayIndex = event.weeklyDayIndex ?? event.dayIndex ?? event.recurringDayIndex ?? event.dayOfWeekIndex;
  const dayIndex = Number(rawDayIndex);
  if (Number.isInteger(dayIndex) && dayIndex >= 0 && dayIndex <= 6) return dayIndex;
  if (Number.isInteger(scheduleTemplate?.dayIndex)) return scheduleTemplate.dayIndex;
  return null;
}

function getSessionStartsForEvent(event, scheduleTemplate, providerSlots = null) {
  const fallbackStart = event.startTime || event.date;
  const eventDayIndex = getEventWeeklyDayIndex(event, scheduleTemplate);

  if (Number.isInteger(eventDayIndex)) {
    const slots = providerSlots || getProviderSlots(event);
    return getNextWeeklySessionStartsByDay(
      eventDayIndex,
      getFirstProviderSlotStartSource(slots, getFirstSlotStartSource(scheduleTemplate, fallbackStart)),
    );
  }

  return getNextWeeklySessionStarts(fallbackStart);
}

function buildSessionIdsForEvents(eventList) {
  return eventList.flatMap((event) => {
    const scheduleTemplate = findScheduleTemplate(event);
    const providerSlots = getProviderSlots(event);

    return getSessionStartsForEvent(event, scheduleTemplate, providerSlots).flatMap((sessionStart) =>
      providerSlots.map((slot) => {
        const optionStart = copyTimeToDate(sessionStart, slot.startSource);
        return buildSessionId(event.id, optionStart || sessionStart, slot.providerId, slot.slotId);
      }),
    );
  });
}

function getWeeklyScheduleLabel(event, scheduleTemplate, fallbackStart) {
  if (event.weeklyDay) return `Every ${event.weeklyDay}`;

  const eventDayIndex = getEventWeeklyDayIndex(event, scheduleTemplate);
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

function getScheduleTemplateTitle(template) {
  return template.title || template.keys[0] || 'Weekly Program';
}

function getScheduleTemplateEventType(template) {
  return template.slots?.some((slot) => Number(slot.capacity) > 1) ? 'workshop' : 'appointment';
}

function getScheduleTemplateStartDate(template) {
  if (!Number.isInteger(template.dayIndex)) return null;

  const referenceSunday = new Date(2026, 4, 24, 12, 0, 0, 0);
  const date = new Date(referenceSunday);
  date.setDate(referenceSunday.getDate() + template.dayIndex);

  return copyTimeToDate(date, getFirstSlotStartSource(template, date)) || date;
}

function getScheduleTemplateEndDate(template) {
  const startDate = getScheduleTemplateStartDate(template);
  if (!startDate) return null;

  const lastTimedSlot = [...(template.slots || [])].reverse().find((slot) => slot.endTime || slot.startTime);
  return copyTimeToDate(startDate, lastTimedSlot?.endTime || lastTimedSlot?.startTime) || startDate;
}

function getScheduleTemplateLocation(template) {
  const rooms = [...new Set((template.slots || []).map((slot) => slot.room).filter(Boolean))];
  if (rooms.length > 1) return 'Multiple rooms';
  return rooms[0] || 'She-Na Center';
}

function createScheduleTemplateEvent(template) {
  const title = getScheduleTemplateTitle(template);
  const eventType = getScheduleTemplateEventType(template);
  const startDate = getScheduleTemplateStartDate(template);

  return {
    id: `schedule-${slugifyIdentifier(title)}`,
    title,
    type: eventType,
    category: eventType === 'appointment' ? 'Appointment' : 'Workshop',
    description: template.description || '',
    imageUrl: appointmentsHero,
    date: startDate,
    startTime: startDate,
    endTime: getScheduleTemplateEndDate(template),
    location: getScheduleTemplateLocation(template),
    status: 'published',
    isScheduleTemplate: true,
  };
}

function mergeScheduleTemplateEvents(publishedEvents) {
  const eventsWithSchedule = SCHEDULE_TEMPLATES
    .filter((template) => Number.isInteger(template.dayIndex) && template.slots?.some((slot) => slot.startTime))
    .filter((template) => !publishedEvents.some((event) => findScheduleTemplate(event) === template))
    .map(createScheduleTemplateEvent);

  return [...eventsWithSchedule, ...publishedEvents];
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

  const scheduleTemplate = findScheduleTemplate(event);
  if (scheduleTemplate?.slots?.length) {
    return scheduleTemplate.slots
      .filter((slot) => slot.startTime)
      .map((slot, slotIndex) => {
        const providerName = slot.providerName || getInstructorLabel(event);
        const providerId = slugifyIdentifier(slot.providerId || providerName);
        const slotId = slugifyIdentifier(slot.id || `${providerId}-${getTimeKey(slot.startTime)}-${getTimeKey(slot.endTime)}-${slotIndex + 1}`);

        return {
          providerId,
          providerName,
          providerSpecialty: slot.specialty || event.category || (inferEventType(event) === 'appointment' ? 'Therapist' : 'Instructor'),
          providerAvatar: slot.avatarUrl || '',
          slotId,
          startSource: slot.startTime,
          endSource: slot.endTime,
          room: slot.room || event.room || event.location || 'She-Na Center',
          capacity: Number(slot.capacity || event.maxParticipants || event.capacity) || 0,
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
          aria-haspopup="dialog"
        >
          {hasRegisteredSessions ? 'Choose More Dates' : 'View Dates'}
          <ArrowForwardIcon fontSize="small" />
        </button>
      </div>
    </article>
  );
}

function EventBookingModal({
  event,
  registeredSessionIds,
  onRegisterSession,
  onClose,
}) {
  const [selectedDateKey, setSelectedDateKey] = useState('');

  useEffect(() => {
    setSelectedDateKey('');
  }, [event?.id]);

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
              <section className="events-card__booking-view events-card__booking-view--calendar">
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
                      const isSelected = selectedDateKey === day.dateKey;

                      return (
                        <button
                          className={[
                            isAvailable ? 'is-available' : '',
                            isSelected ? 'is-selected' : '',
                          ].filter(Boolean).join(' ')}
                          type="button"
                          onClick={() => setSelectedDateKey(day.dateKey)}
                          disabled={!isAvailable}
                          aria-label={session ? `Choose ${session.date}` : 'Unavailable date'}
                          aria-pressed={isSelected}
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
                <header className="events-card__booking-header events-card__booking-header--providers">
                  <div>
                    <p>{selectedSession.date}</p>
                    <h4>Select time and provider</h4>
                    <strong>{event.title}</strong>
                  </div>
                  <button
                    className="events-card__change-date"
                    type="button"
                    onClick={() => setSelectedDateKey('')}
                  >
                    Change date
                  </button>
                </header>

                {selectedOptions.length === 0 ? (
                  <p className="events-card__booking-empty">No available sessions for this date.</p>
                ) : (
                  <div className="events-card__provider-list">
                    {selectedOptions.map((option) => {
                      const isRegistered = registeredSessionIds.has(option.id);
                      const isFull = option.capacity > 0 && option.participants >= option.capacity && !isRegistered;
                      const actionDisabled = option.isRegistering || isFull || isRegistered;
                      const availableSpots = option.capacity > 0 ? Math.max(0, option.capacity - option.participants) : null;

                      return (
                        <article
                          className={`events-card__provider-option${isRegistered ? ' is-registered' : ''}`}
                          key={option.id}
                        >
                          {option.providerAvatar ? (
                            <img src={option.providerAvatar} alt="" />
                          ) : (
                            <span className="events-card__provider-avatar">
                              {option.providerName.slice(0, 2).toUpperCase()}
                            </span>
                          )}

                          <div className="events-card__provider-copy">
                            <strong>{option.providerName}</strong>
                            <span>{option.providerSpecialty}</span>
                          </div>

                          <div className="events-card__provider-meta">
                            <time>{option.time}</time>
                            <span>{option.room}</span>
                            <small>{formatAvailableSpots(availableSpots)}</small>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRegisterSession(event, option)}
                            disabled={actionDisabled}
                          >
                            {option.isRegistering
                              ? 'Wait...'
                              : isRegistered
                                ? 'Registered'
                                : isFull
                                  ? 'Full'
                                  : 'Register'}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                )}
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
  const typeLabel = session.eventType === 'appointment' ? 'Appointment' : 'Workshop';
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  return (
    <article className={`events-card events-card--${session.tone}`}>
      <div className="events-card__image">
        <img src={session.imageUrl} alt="" />
        <button
          className={`events-card__about-button events-card__about-button--${session.eventType}`}
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
        <h3 className="events-card__title">{session.title}</h3>
        <strong className="events-card__instructor">With {session.providerName}</strong>
        <span className="events-card__schedule">
          <CalendarMonthIcon fontSize="small" />
          Registered for {session.date}
        </span>
        <div className="events-card__registered-meta">
          <span>
            <AccessTimeIcon fontSize="small" />
            {session.time}
          </span>
        </div>
        <CardDescriptionPanel description={session.description} isOpen={isDescriptionOpen} />

        <button
          className="events-card__action is-cancel"
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

export default function EventsPage({ embedInDashboard = false }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAdmin();
  const [activeView, setActiveView] = useState(VIEW_WORKSHOPS);
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({});
  const [registeredMap, setRegisteredMap] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
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
        const mergedEvents = mergeScheduleTemplateEvents(data);
        setEvents(mergedEvents);
        setLoadingEvents(false);
        refreshRegistrationData(mergedEvents);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load published events:', error);
        const fallbackEvents = mergeScheduleTemplateEvents([]);
        setEvents(fallbackEvents);
        refreshRegistrationData(fallbackEvents);
        setEventsError('Could not load live Firestore events. Showing the weekly schedule templates.');
        setLoadingEvents(false);
      });

    return () => { cancelled = true; };
  }, [refreshRegistrationData]);

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
        const leftDate = getSessionStartsForEvent(left, findScheduleTemplate(left))[0];
        const rightDate = getSessionStartsForEvent(right, findScheduleTemplate(right))[0];

        if (!leftDate && !rightDate) return 0;
        if (!leftDate) return 1;
        if (!rightDate) return -1;

        return leftDate.getTime() - rightDate.getTime();
      }).map((event, index) => {
        const imageUrl = event.imageUrl || event.thumbnailUrl || event.coverImageUrl || appointmentsHero;
        const scheduleTemplate = findScheduleTemplate(event);
        const eventType = scheduleTemplate ? getScheduleTemplateEventType(scheduleTemplate) : inferEventType(event);
        const displayTitle = scheduleTemplate ? getScheduleTemplateTitle(scheduleTemplate) : (event.title || 'Untitled Event');
        const displayCategory = eventType === 'appointment' ? 'Appointment' : 'Workshop';
        const templateStart = event.startTime || event.date;
        const providerSlots = getProviderSlots(event);
        const providerNames = [...new Set(providerSlots.map((slot) => slot.providerName))];
        const roomLabels = [...new Set(providerSlots.map((slot) => slot.room).filter(Boolean))];
        const displayLocation = scheduleTemplate ? getScheduleTemplateLocation(scheduleTemplate) : (roomLabels.length > 1 ? 'Multiple rooms' : roomLabels[0] || event.location || 'She-Na Center');
        const sessionStarts = getSessionStartsForEvent(event, scheduleTemplate, providerSlots);
        const weeklySchedule = getWeeklyScheduleLabel(event, scheduleTemplate, templateStart);
        const templateDescription = scheduleTemplate?.description || event.description || 'More details will be added soon.';
        const sessions = sessionStarts.map((sessionStart) => {
          const dateKey = toDateKey(sessionStart);
          const options = providerSlots.map((slot) => {
            const optionStart = copyTimeToDate(sessionStart, slot.startSource);
            const optionEnd = copyTimeToDate(sessionStart, slot.endSource);
            const optionId = buildSessionId(event.id, optionStart || sessionStart, slot.providerId, slot.slotId);
            const participants = counts[optionId] ?? 0;
            return {
              id: optionId,
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
          weeklySchedule,
          temporalStatus: getTemporalStatus(sessions[0]?.startDate || templateStart),
          sessions,
          sessionOptions,
        };
      }),
    [counts, events, registeringId],
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

    setRegisteringId(session.id);
    setEventsError('');

    try {
      const newRegistrationId = await addRegistration({
        eventId: session.id,
        uid: currentUser.uid,
        participantName: currentUser.displayName || currentUser.email.split('@')[0],
        participantEmail: currentUser.email,
        eventTitle: event.title,
        eventDate: session.startDate || null,
        eventLocation: session.room || event.location || '',
        eventCoverUrl: event.imageUrl || '',
        eventTemplateId: event.id,
        parentEventId: event.id,
        eventType: event.eventType,
        selectedDate: session.selectedDate,
        providerId: session.providerId,
        providerName: session.providerName,
        selectedTimeSlot: session.selectedTimeSlot,
        room: session.room,
        sessionDateLabel: session.date,
        sessionTime: session.time,
        recurringSchedule: event.weeklySchedule,
      });
      setRegisteredMap((current) => ({ ...current, [session.id]: newRegistrationId }));
      setCounts((current) => ({ ...current, [session.id]: (current[session.id] ?? 0) + 1 }));
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

    setRegisteringId(session.id);
    setEventsError('');

    try {
      await removeRegistration(registrationId, currentUser.displayName || currentUser.email, session.id);
      setRegisteredMap((current) => {
        const next = { ...current };
        delete next[session.id];
        return next;
      });
      setCounts((current) => ({ ...current, [session.id]: Math.max(0, (current[session.id] ?? 1) - 1) }));
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
      <section className="events-hero">
        <div className="events-hero__content">
          <h1>Events</h1>
          <p>All your sessions in one place</p>
        </div>
        <button className="events-suggest-pill" type="button" onClick={openSuggestionModal}>
          <AddCircleOutlineIcon fontSize="small" />
          Suggest a Workshop
        </button>
      </section>

      {(loadingEvents || eventsError) && (
        <div className={`events-status${eventsError ? ' events-status--error' : ''}`}>
          {loadingEvents ? 'Loading live events from Firestore...' : eventsError}
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

        <section className="events-list-panel">
          <div className="events-grid-shell">
            <section className="events-grid" aria-label={sectionTitle}>
              {activeView === VIEW_REGISTERED
                ? filteredEvents.map((session) => (
                  <RegisteredSessionCard
                    session={session}
                    onCancelRegistration={handleCancelSession}
                    key={session.id}
                  />
                ))
                : filteredEvents.map((event) => (
                  <EventCard
                    event={event}
                    registeredSessionIds={registeredSessionIds}
                    onOpenBooking={openBookingModal}
                    key={event.id}
                  />
                ))}
            </section>
          </div>
        </section>

      {!loadingEvents && filteredEvents.length === 0 && (
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

      {activeBookingEvent && (
        <EventBookingModal
          event={activeBookingEvent}
          registeredSessionIds={registeredSessionIds}
          onRegisterSession={handleRegisterSession}
          onClose={closeBookingModal}
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
