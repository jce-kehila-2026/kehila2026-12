import {
  DAILY_MOTIVATION_DEFAULT_FALLBACK,
  DAILY_MOTIVATION_STORAGE_KEY,
  isQuoteSuitable,
} from './dailyMotivationQuotes';

/** quotable.io is unavailable; ZenQuotes + type.fit are used instead. */
const ZENQUOTES_RANDOM_URL = 'https://zenquotes.io/api/random';
const TYPEFIT_QUOTES_URL = 'https://type.fit/api/quotes';
const MAX_FETCH_ATTEMPTS = 5;
const QUOTE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * @typedef {{ text: string, author: string, source?: string, fetchedAt?: number }} DailyMotivationQuote
 * @typedef {{ text: string, author: string, source?: string, fetchedAt: number }} StoredMotivationQuote
 */

/**
 * @returns {StoredMotivationQuote | null}
 */
export function readCachedMotivationQuote() {
  try {
    const raw = localStorage.getItem(DAILY_MOTIVATION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const text = String(parsed?.text || '').trim();
    if (!text) return null;

    return {
      text,
      author: String(parsed.author || 'She-Na').trim() || 'She-Na',
      source: parsed.source || 'cache',
      fetchedAt: Number(parsed.fetchedAt) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * @param {number} fetchedAt
 * @returns {boolean}
 */
export function isQuoteCacheFresh(fetchedAt) {
  if (!Number.isFinite(fetchedAt) || fetchedAt <= 0) return false;
  return Date.now() - fetchedAt < QUOTE_CACHE_TTL_MS;
}

/**
 * @param {DailyMotivationQuote} quote
 */
function writeCachedMotivationQuote(quote) {
  try {
    localStorage.setItem(
      DAILY_MOTIVATION_STORAGE_KEY,
      JSON.stringify({
        text: quote.text,
        author: quote.author,
        source: quote.source || 'cache',
        fetchedAt: Date.now(),
      }),
    );
  } catch {
    // Ignore storage failures.
  }
}

/**
 * @param {StoredMotivationQuote} cached
 * @returns {DailyMotivationQuote}
 */
function toPublicQuote(cached) {
  return {
    text: cached.text,
    author: cached.author,
    source: cached.source,
  };
}

/**
 * @param {unknown} payload
 * @returns {DailyMotivationQuote | null}
 */
function mapZenQuotesEntry(payload) {
  const entry = Array.isArray(payload) ? payload[0] : null;
  const text = String(entry?.q || '').trim();

  if (!text) return null;

  return {
    text,
    author: String(entry?.a || 'Unknown').trim() || 'Unknown',
    source: 'zenquotes',
  };
}

/**
 * @returns {Promise<DailyMotivationQuote | null>}
 */
async function fetchZenQuotesRandom() {
  const response = await fetch(ZENQUOTES_RANDOM_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`ZenQuotes request failed (${response.status})`);
  }

  return mapZenQuotesEntry(await response.json());
}

/**
 * @returns {Promise<DailyMotivationQuote | null>}
 */
async function fetchTypeFitRandom() {
  const response = await fetch(TYPEFIT_QUOTES_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`type.fit request failed (${response.status})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('type.fit returned an empty quote list');
  }

  const suitableQuotes = payload.filter((entry) => isQuoteSuitable(String(entry?.text || '')));
  const pool = suitableQuotes.length > 0 ? suitableQuotes : payload;
  const entry = pool[Math.floor(Math.random() * pool.length)];
  const text = String(entry?.text || '').trim();

  if (!text) return null;

  const author = String(entry?.author || 'Unknown')
    .split(',')[0]
    .trim() || 'Unknown';

  return {
    text,
    author,
    source: 'typefit',
  };
}

const QUOTE_PROVIDERS = [fetchZenQuotesRandom, fetchTypeFitRandom];

/**
 * Fetches a short, wellness-friendly quote from a free public API.
 * @returns {Promise<DailyMotivationQuote>}
 */
async function fetchRemoteMotivationQuote() {
  for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt += 1) {
    const provider = QUOTE_PROVIDERS[attempt % QUOTE_PROVIDERS.length];

    try {
      const quote = await provider();
      if (quote && isQuoteSuitable(quote.text)) {
        return quote;
      }
    } catch (error) {
      console.warn('[Daily motivation] Quote provider failed:', error);
    }
  }

  throw new Error('All quote providers failed');
}

/**
 * Returns a motivational quote cached for 24 hours in localStorage.
 * @returns {Promise<DailyMotivationQuote>}
 */
export async function getDailyMotivationQuote() {
  const cached = readCachedMotivationQuote();

  if (cached && isQuoteCacheFresh(cached.fetchedAt)) {
    return toPublicQuote(cached);
  }

  try {
    const remoteQuote = await fetchRemoteMotivationQuote();
    writeCachedMotivationQuote(remoteQuote);
    return remoteQuote;
  } catch (error) {
    console.warn('[Daily motivation] Using cached or fallback quote:', error);

    if (cached) {
      return toPublicQuote(cached);
    }

    const fallbackQuote = { ...DAILY_MOTIVATION_DEFAULT_FALLBACK, source: 'fallback' };
    writeCachedMotivationQuote(fallbackQuote);
    return fallbackQuote;
  }
}
