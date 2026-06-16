import { useEffect, useState } from 'react';
import { DAILY_MOTIVATION_DEFAULT_FALLBACK } from './dailyMotivationQuotes';
import {
  getDailyMotivationQuote,
  readCachedMotivationQuote,
} from './dailyMotivationService';

/**
 * @typedef {{ text: string, author: string, source?: string }} DailyMotivationQuote
 */

function getSafeFallbackQuote() {
  try {
    const cached = readCachedMotivationQuote();
    if (cached?.text) {
      return {
        text: cached.text,
        author: cached.author,
        source: cached.source,
      };
    }
  } catch {
    // Ignore cache read failures.
  }

  return { ...DAILY_MOTIVATION_DEFAULT_FALLBACK, source: 'fallback' };
}

function getInitialQuote() {
  return getSafeFallbackQuote();
}

/**
 * Loads a motivational quote — stable for 24 hours via localStorage.
 * Never throws; always exposes a safe fallback quote.
 * @returns {{ quote: DailyMotivationQuote, isLoading: boolean }}
 */
export default function useDailyMotivation() {
  const [quote, setQuote] = useState(getInitialQuote);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadQuote() {
      try {
        const nextQuote = await getDailyMotivationQuote();
        if (!ignore) setQuote(nextQuote);
      } catch (error) {
        console.warn('[Daily motivation] Hook fallback after unexpected error:', error);
        if (!ignore) setQuote(getSafeFallbackQuote());
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadQuote();

    return () => {
      ignore = true;
    };
  }, []);

  return { quote, isLoading };
}
