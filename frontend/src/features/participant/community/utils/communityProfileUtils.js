export const normalizeCommunityName = (name = '') => name.trim().toLowerCase();

export const getExistingDisplayName = (personalDetails = {}) => (
  personalDetails.fullName
  || personalDetails.displayName
  || personalDetails.userName
  || personalDetails.name
  || [personalDetails.firstName, personalDetails.lastName].filter(Boolean).join(' ')
  || ''
).trim();

export const formatDateToDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const normalizeCommunityBirthday = (birthdayValue) => {
  if (!birthdayValue) return '';

  if (birthdayValue instanceof Date) {
    return formatDateToDateKey(birthdayValue);
  }

  if (typeof birthdayValue === 'object' && typeof birthdayValue.seconds === 'number') {
    return formatDateToDateKey(new Date(birthdayValue.seconds * 1000));
  }

  if (typeof birthdayValue !== 'string') return '';

  const trimmed = birthdayValue.trim();
  if (!trimmed) return '';

  const dateParts = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateParts) {
    const year = Number(dateParts[1]);
    const month = Number(dateParts[2]);
    const day = Number(dateParts[3]);
    const parsedDate = new Date(year, month - 1, day);

    if (
      parsedDate.getFullYear() === year
      && parsedDate.getMonth() === month - 1
      && parsedDate.getDate() === day
    ) {
      return trimmed;
    }
  }

  const parsedDate = new Date(trimmed);
  return formatDateToDateKey(parsedDate);
};

export const getCommunityBirthday = (personalDetails = {}) => normalizeCommunityBirthday(
  personalDetails.birthDate
  || personalDetails.birthday
  || personalDetails.dateOfBirth,
);

export const hasRequiredCommunityPersonalDetails = (personalDetails = {}) => Boolean(
  getExistingDisplayName(personalDetails) && getCommunityBirthday(personalDetails),
);

const isValidMonthDay = (month, day) => (
  Number.isInteger(month) && Number.isInteger(day)
  && month >= 1 && month <= 12
  && day >= 1 && day <= 31
);

// Extracts { month, day } (1-based) from a birthday given as a full
// 'YYYY-MM-DD', a year-stripped 'MM-DD', a Date, or a Firestore timestamp;
// returns null when unparseable. public_profiles stores only 'MM-DD' (no year,
// so a member's age can't be derived), while the user's own entry may still
// carry a full date — both shapes resolve here.
export const getBirthdayMonthDay = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : { month: value.getMonth() + 1, day: value.getDate() };
  }

  if (value && typeof value === 'object' && typeof value.seconds === 'number') {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime())
      ? null
      : { month: date.getMonth() + 1, day: date.getDate() };
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const fullDate = trimmed.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (fullDate) {
    const month = Number(fullDate[1]);
    const day = Number(fullDate[2]);
    return isValidMonthDay(month, day) ? { month, day } : null;
  }

  const monthDay = trimmed.match(/^(\d{2})-(\d{2})$/);
  if (monthDay) {
    const month = Number(monthDay[1]);
    const day = Number(monthDay[2]);
    return isValidMonthDay(month, day) ? { month, day } : null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime())
    ? null
    : { month: parsed.getMonth() + 1, day: parsed.getDate() };
};

// Year-stripped 'MM-DD' string (or '') — used when mirroring the birthday to
// the world-readable public_profiles doc and when matching today's birthdays.
export const toBirthdayMonthDay = (value) => {
  const monthDay = getBirthdayMonthDay(value);
  if (!monthDay) return '';
  return `${String(monthDay.month).padStart(2, '0')}-${String(monthDay.day).padStart(2, '0')}`;
};
