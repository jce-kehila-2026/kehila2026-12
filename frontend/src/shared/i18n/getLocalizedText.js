/**
 * @param {unknown} value
 * @param {string} [lang]
 * @returns {string}
 */
export function getLocalizedText(value, lang) {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const record = /** @type {Record<string, unknown>} */ (value);
    const picked = record[lang] ?? record.en ?? record.he ?? record.ar ?? '';
    return String(picked ?? '');
  }

  return String(value);
}
