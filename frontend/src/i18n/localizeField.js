// Read helper for content that may carry per-language values.
//
// Admin-edited content is translated once (at save time) and stored as a
// per-language object, e.g. { he: "...", en: "...", ar: "..." }. Read paths use
// localizeField() to pick the right language for the current locale, with a
// graceful fallback. Plain strings (content saved before translation existed)
// are returned as-is, so this is safe to drop into existing render code.

export const SUPPORTED_LANGS = ['he', 'en', 'ar'];
export const FALLBACK_LANG = 'he';

function firstNonEmpty(obj) {
  for (const lang of SUPPORTED_LANGS) {
    if (obj[lang]) return obj[lang];
  }
  return Object.values(obj).find((value) => typeof value === 'string' && value) || '';
}

/**
 * Resolve a possibly-translated field to a string for the given locale.
 * @param {string | Record<string, string> | null | undefined} value
 * @param {'he'|'en'|'ar'|string} locale
 * @param {string} [fallback='he']
 * @returns {string}
 */
export function localizeField(value, locale, fallback = FALLBACK_LANG) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[locale] || value[fallback] || firstNonEmpty(value) || '';
  }
  return String(value);
}

/** True when a value is a per-language translation object (not a plain string). */
export function isLocalizedField(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
