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
