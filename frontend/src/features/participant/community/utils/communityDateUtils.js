const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

export const parseCommunityDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'object' && typeof value.seconds === 'number') {
    const parsedTimestamp = new Date(value.seconds * 1000);
    return Number.isNaN(parsedTimestamp.getTime()) ? null : parsedTimestamp;
  }

  if (typeof value === 'number') {
    const parsedTimestamp = new Date(value);
    return Number.isNaN(parsedTimestamp.getTime()) ? null : parsedTimestamp;
  }

  if (typeof value !== 'string') return null;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatCommunityDayMonth = (date) => (
  `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`
);

export const formatRelativeCommunityTime = (createdAt, now = new Date()) => {
  const createdDate = parseCommunityDate(createdAt);
  const currentDate = parseCommunityDate(now) ?? new Date();

  if (!createdDate) return 'just now';

  const diffMs = Math.max(currentDate.getTime() - createdDate.getTime(), 0);

  if (diffMs < MS_PER_MINUTE) return 'just now';

  if (diffMs < MS_PER_HOUR) {
    const minutes = Math.floor(diffMs / MS_PER_MINUTE);
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
  }

  if (diffMs < MS_PER_DAY) {
    const hours = Math.floor(diffMs / MS_PER_HOUR);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  if (diffMs <= 3 * MS_PER_DAY) {
    const days = Math.floor(diffMs / MS_PER_DAY);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  return formatCommunityDayMonth(createdDate);
};

export const getTodayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const normalizeCommunityDateKey = (value) => {
  if (typeof value === 'string' && getDateKeyTimestamp(value) !== null) {
    return value;
  }

  const parsedDate = parseCommunityDate(value);
  return parsedDate ? getTodayKey(parsedDate) : null;
};

export const getDateKeyTimestamp = (dateKey) => {
  if (typeof dateKey !== 'string') return null;

  const dateParts = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateParts) return null;

  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]);
  const day = Number(dateParts[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year
    || parsedDate.getMonth() !== month - 1
    || parsedDate.getDate() !== day
  ) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
};

export const getDayDifference = (previousDateKey, currentDateKey = getTodayKey()) => {
  const previousTimestamp = getDateKeyTimestamp(previousDateKey);
  const currentTimestamp = getDateKeyTimestamp(currentDateKey);

  if (previousTimestamp === null || currentTimestamp === null) return null;

  return Math.round((currentTimestamp - previousTimestamp) / MS_PER_DAY);
};

export const isStreakAtRiskForDate = (lastActivityDate, todayKey = getTodayKey()) => (
  getDayDifference(lastActivityDate, todayKey) === 2
);

export const isStreakReminderDueForDate = (
  lastActivityDate,
  now = new Date(),
  reminderHour = 21
) => (
  getDayDifference(lastActivityDate, getTodayKey(now)) === 1
  && now.getHours() >= reminderHour
);
