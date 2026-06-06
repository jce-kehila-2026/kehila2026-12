import { useEffect, useState } from 'react';
import { DAILY_MOTIVATION_DEFAULT_FALLBACK } from './dailyMotivationQuotes';
import {
  getDailyMotivationQuote,
  readCachedMotivationQuote,
} from './dailyMotivationService';

/**
 * @typedef {{ text: string, author: string, source?: string }} DailyMotivationQuote
 */

function getInitialQuote() {
  const cached = readCachedMotivationQuote();
  if (cached) {
    return {
      text: cached.text,
      author: cached.author,
      source: cached.source,
    };
  }

  return { ...DAILY_MOTIVATION_DEFAULT_FALLBACK };
}

/**
 * Loads a motivational quote — stable for 24 hours via localStorage.
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
      } catch {
        const cached = readCachedMotivationQuote();
        if (!ignore) {
          setQuote(
            cached
              ? { text: cached.text, author: cached.author, source: cached.source }
              : { ...DAILY_MOTIVATION_DEFAULT_FALLBACK, source: 'fallback' },
          );
        }
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
