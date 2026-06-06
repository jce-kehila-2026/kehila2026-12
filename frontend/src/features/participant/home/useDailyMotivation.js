import { useEffect, useState } from 'react';
import { getFallbackQuoteForDate } from './dailyMotivationQuotes';
import { getDailyMotivationQuote } from './dailyMotivationService';

/**
 * @typedef {{ text: string, author: string, source?: string }} DailyMotivationQuote
 */

/**
 * Loads a motivational quote that stays stable for the current local day.
 * @returns {{ quote: DailyMotivationQuote, isLoading: boolean }}
 */
export default function useDailyMotivation() {
  const [quote, setQuote] = useState(() => getFallbackQuoteForDate());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadQuote() {
      try {
        const nextQuote = await getDailyMotivationQuote();
        if (!ignore) setQuote(nextQuote);
      } catch {
        if (!ignore) setQuote(getFallbackQuoteForDate());
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
