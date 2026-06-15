import {
  DAILY_MOTIVATION_DEFAULT_FALLBACK,
  DAILY_MOTIVATION_STORAGE_KEY,
  getFallbackQuoteForDate,
} from './dailyMotivationQuotes';

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
        source: quote.source || 'local',
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
 * Local quote for today — no external network calls (avoids CORS failures in the browser).
 * @returns {DailyMotivationQuote}
 */
function getLocalMotivationQuote() {
  try {
    const localQuote = getFallbackQuoteForDate();
    if (localQuote?.text) {
      return {
        text: localQuote.text,
        author: localQuote.author || DAILY_MOTIVATION_DEFAULT_FALLBACK.author,
        source: 'local',
      };
    }
  } catch (error) {
    console.warn('[Daily motivation] Local quote selection failed:', error);
  }

  return {
    ...DAILY_MOTIVATION_DEFAULT_FALLBACK,
    source: 'fallback',
  };
}

/**
 * Returns a motivational quote cached for 24 hours in localStorage.
 * Never throws — always resolves with a safe local quote.
 * @returns {Promise<DailyMotivationQuote>}
 */
export async function getDailyMotivationQuote() {
  try {
    const cached = readCachedMotivationQuote();

    if (cached && isQuoteCacheFresh(cached.fetchedAt)) {
      return toPublicQuote(cached);
    }

    const nextQuote = getLocalMotivationQuote();
    writeCachedMotivationQuote(nextQuote);
    return nextQuote;
  } catch (error) {
    console.warn('[Daily motivation] Using default fallback quote:', error);

    try {
      const cached = readCachedMotivationQuote();
      if (cached) {
        return toPublicQuote(cached);
      }
    } catch {
      // Ignore cache read failures.
    }

    return {
      ...DAILY_MOTIVATION_DEFAULT_FALLBACK,
      source: 'fallback',
    };
  }
}
