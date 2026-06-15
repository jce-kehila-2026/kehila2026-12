// Client for the Azure Translator proxy (Cloudflare Worker). Used at admin save
// time to translate content into Hebrew/English/Arabic once, so it can be stored
// per-language on the document. The Azure key never reaches the browser — this
// only talks to the Worker URL in VITE_TRANSLATE_PROXY_URL.
//
// The proxy URL is read at call time (not module load) so it's easy to stub in
// tests and so a missing config degrades gracefully instead of throwing on import.

export const TRANSLATION_TARGETS = ['he', 'en', 'ar'];

function getProxyUrl() {
  return import.meta.env.VITE_TRANSLATE_PROXY_URL || '';
}

/** True only when the translate proxy URL is configured. */
export function isTranslationConfigured() {
  return Boolean(getProxyUrl());
}

class TranslationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TranslationError';
    this.code = code;
  }
}

/**
 * Translate an array of strings. Returns an array aligned to `texts`, each a
 * per-language map, e.g. [{ he, en, ar }, ...].
 */
export async function translateTexts(texts, { to = TRANSLATION_TARGETS } = {}) {
  const url = getProxyUrl();
  if (!url) {
    throw new TranslationError('NOT_CONFIGURED', 'Translation proxy is not configured.');
  }

  const list = (texts || []).map((value) => String(value ?? ''));
  if (list.length === 0) return [];

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: list, to }),
    });
  } catch (err) {
    throw new TranslationError('NETWORK', `Could not reach the translation service: ${err}`);
  }

  if (!response.ok) {
    throw new TranslationError('REQUEST_FAILED', `Translation failed (HTTP ${response.status}).`);
  }

  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}

/** Translate a single string into a per-language map { he, en, ar }. */
export async function translateText(text, options) {
  const [result] = await translateTexts([text], options);
  return result || {};
}

/**
 * Translate selected string fields of an object in ONE proxy call.
 * Empty/blank fields are skipped. Returns { [field]: { he, en, ar } } for the
 * fields that had content.
 *
 * @param {Record<string, any>} source
 * @param {string[]} fields
 */
export async function translateFields(source, fields, options) {
  const names = (fields || []).filter(
    (name) => source?.[name] != null && String(source[name]).trim() !== '',
  );
  if (names.length === 0) return {};

  const results = await translateTexts(names.map((name) => String(source[name])), options);

  const out = {};
  names.forEach((name, index) => {
    out[name] = results[index] || {};
  });
  return out;
}
