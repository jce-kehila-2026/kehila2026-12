export const PARTICIPANT_LOCALE_STORAGE_KEY = 'shena-participant-locale';

export const PARTICIPANT_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'he', label: 'עברית' },
];

/**
 * @param {string|null|undefined} profileLanguage
 * @returns {'en' | 'ar' | 'he'}
 */
export function profileLanguageToLocale(profileLanguage) {
  const normalized = String(profileLanguage || '').trim().toLowerCase();

  if (normalized === 'hebrew' || normalized === 'he') return 'he';
  if (normalized === 'arabic' || normalized === 'ar') return 'ar';
  return 'en';
}

/**
 * @param {'en' | 'ar' | 'he'} locale
 * @returns {'english' | 'arabic' | 'hebrew'}
 */
export function localeToProfileLanguage(locale) {
  if (locale === 'he') return 'hebrew';
  if (locale === 'ar') return 'arabic';
  return 'english';
}

/**
 * @param {'en' | 'ar' | 'he'} locale
 * @returns {'ltr' | 'rtl'}
 */
export function getParticipantLocaleDirection(locale) {
  return locale === 'en' ? 'ltr' : 'rtl';
}

/**
 * @param {'en' | 'ar' | 'he'} locale
 * @returns {string}
 */
export function getParticipantLocaleLang(locale) {
  if (locale === 'ar') return 'ar';
  if (locale === 'he') return 'he';
  return 'en';
}

/**
 * @returns {'en' | 'ar' | 'he'}
 */
export function getStoredParticipantLocale() {
  try {
    const stored = localStorage.getItem(PARTICIPANT_LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'ar' || stored === 'he') {
      return stored;
    }
  } catch {
    // Ignore storage failures.
  }
  return 'en';
}

/**
 * @param {'en' | 'ar' | 'he'} locale
 */
export function storeParticipantLocale(locale) {
  try {
    localStorage.setItem(PARTICIPANT_LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore storage failures.
  }
}
