import {
  DAILY_MOTIVATION_STORAGE_KEY,
  getFallbackQuoteForDate,
  getLocalDateKey,
} from './dailyMotivationQuotes';

const ZENQUOTES_TODAY_URL = 'https://zenquotes.io/api/today';

/**
 * @typedef {{ text: string, author: string, source?: string }} DailyMotivationQuote
 */

/**
 * @returns {DailyMotivationQuote | null}
 */
function readCachedQuote() {
  try {
    const raw = localStorage.getItem(DAILY_MOTIVATION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed?.date !== getLocalDateKey() || !parsed?.text) return null;

    return {
      text: String(parsed.text),
      author: String(parsed.author || 'She-Na'),
      source: parsed.source || 'cache',
    };
  } catch {
    return null;
  }
}

/**
 * @param {DailyMotivationQuote} quote
 */
function writeCachedQuote(quote) {
  try {
    localStorage.setItem(
      DAILY_MOTIVATION_STORAGE_KEY,
      JSON.stringify({
        date: getLocalDateKey(),
        text: quote.text,
        author: quote.author,
        source: quote.source || 'fallback',
      }),
    );
  } catch {
    // Ignore storage failures.
  }
}

/**
 * @returns {Promise<DailyMotivationQuote | null>}
 */
async function fetchZenQuotesToday() {
  const response = await fetch(ZENQUOTES_TODAY_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`ZenQuotes request failed (${response.status})`);
  }

  const payload = await response.json();
  const entry = Array.isArray(payload) ? payload[0] : null;
  const text = String(entry?.q || '').trim();

  if (!text) {
    throw new Error('ZenQuotes returned an empty quote');
  }

  return {
    text,
    author: String(entry?.a || 'Unknown').trim() || 'Unknown',
    source: 'zenquotes',
  };
}

/**
 * Returns today's motivational quote — stable for the full local day.
 * @returns {Promise<DailyMotivationQuote>}
 */
export async function getDailyMotivationQuote() {
  const cached = readCachedQuote();
  if (cached) return cached;

  try {
    const remoteQuote = await fetchZenQuotesToday();
    writeCachedQuote(remoteQuote);
    return remoteQuote;
  } catch {
    const fallbackQuote = getFallbackQuoteForDate();
    writeCachedQuote({ ...fallbackQuote, source: 'fallback' });
    return { ...fallbackQuote, source: 'fallback' };
  }
}
