/** Local fallback quotes — stable, short, uplifting for wellness journeys. */
export const DAILY_MOTIVATION_DEFAULT_FALLBACK = {
  text: 'Every small step forward is still progress.',
  author: 'She-Na',
};

export const DAILY_MOTIVATION_FALLBACK_QUOTES = [
  DAILY_MOTIVATION_DEFAULT_FALLBACK,
  { text: 'You are stronger than you think, braver than you feel, and more loved than you know.', author: 'She-Na' },
  { text: 'Healing is not linear — every gentle step forward still counts.', author: 'She-Na' },
  { text: 'Your courage today is planting hope for tomorrow.', author: 'She-Na' },
  { text: 'Rest is not giving up; it is part of your recovery.', author: 'She-Na' },
  { text: 'You do not have to carry this alone — your community walks beside you.', author: 'She-Na' },
  { text: 'Small wins matter. Celebrate the moments you showed up for yourself.', author: 'She-Na' },
  { text: 'Your story is still being written, and it holds so much light.', author: 'She-Na' },
  { text: 'Be patient with yourself — you are doing something incredibly hard.', author: 'She-Na' },
  { text: 'Hope grows quietly in the spaces where you choose to keep going.', author: 'She-Na' },
  { text: 'You deserve compassion, especially from yourself.', author: 'She-Na' },
  { text: 'Every sunrise is a reminder that new beginnings are always possible.', author: 'She-Na' },
  { text: 'Your body hears everything your mind says — speak with kindness.', author: 'She-Na' },
  { text: 'Strength looks like asking for help when you need it.', author: 'She-Na' },
  { text: 'You have survived every difficult day so far — that is proof of your resilience.', author: 'She-Na' },
  { text: 'Allow yourself to feel joy, even on hard days.', author: 'She-Na' },
  { text: 'Progress is personal. Compare yourself only to who you were yesterday.', author: 'She-Na' },
  { text: 'Your presence makes this community warmer and stronger.', author: 'She-Na' },
  { text: 'Breathe deeply — this moment is yours to take gently.', author: 'She-Na' },
  { text: 'Healing happens in community, in rest, and in small acts of self-care.', author: 'She-Na' },
  { text: 'You are not defined by illness — you are defined by your spirit.', author: 'She-Na' },
  { text: 'Today, choose one kind thing for yourself. That is enough.', author: 'She-Na' },
  { text: 'Your feelings are valid. Your journey is valid. You are valid.', author: 'She-Na' },
  { text: 'Light finds its way through even the longest nights.', author: 'She-Na' },
  { text: 'Trust the pace of your own healing.', author: 'She-Na' },
  { text: 'You are worthy of care, comfort, and peace.', author: 'She-Na' },
  { text: 'Courage is not the absence of fear — it is moving forward with love.', author: 'She-Na' },
  { text: 'Your heart knows how to heal — give it time and tenderness.', author: 'She-Na' },
  { text: 'Each day you choose hope is a victory worth honoring.', author: 'She-Na' },
  { text: 'You belong here, exactly as you are, in this moment.', author: 'She-Na' },
  { text: 'Gentleness is a form of strength you can practice every day.', author: 'She-Na' },
  { text: 'Your wellness journey is unique — honor it without comparison.', author: 'She-Na' },
  { text: 'May today bring you one moment of calm, warmth, or quiet joy.', author: 'She-Na' },
  { text: 'Keep going — not because it is easy, but because you are worth it.', author: 'She-Na' },
];

export const DAILY_MOTIVATION_STORAGE_KEY = 'shena-participant-daily-motivation';

export const DAILY_MOTIVATION_MAX_LENGTH = 130;

const UNSUITABLE_QUOTE_PATTERNS = [
  /\b(god|jesus|christ|allah|bible|quran|prayer|pray|church|mosque|temple|sinful|devil|hell)\b/i,
  /\b(cancer|chemo|chemotherapy|tumor|diagnosis|hospice|medication|prescription)\b/i,
  /\b(suicid|kill yourself|worthless|hopeless|give up|never win|you'll fail|cannot succeed)\b/i,
];

/**
 * Filters out harsh, religious, medical, or negative quotes from external APIs.
 * @param {string} text
 * @returns {boolean}
 */
export function isQuoteSuitable(text) {
  const normalized = String(text || '').trim();
  if (!normalized || normalized.length > DAILY_MOTIVATION_MAX_LENGTH) return false;

  return !UNSUITABLE_QUOTE_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * @returns {string} YYYY-MM-DD in local timezone
 */
export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deterministic index for a calendar day.
 * @param {Date} [date]
 * @returns {number}
 */
export function getDayOfYearIndex(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * @param {Date} [date]
 * @returns {{ text: string, author: string }}
 */
export function getFallbackQuoteForDate(date = new Date()) {
  const index = getDayOfYearIndex(date) % DAILY_MOTIVATION_FALLBACK_QUOTES.length;
  return DAILY_MOTIVATION_FALLBACK_QUOTES[index];
}
