import { useEffect, useState } from 'react';
import { isBirthdayToday } from './participantBirthdayUtils';

function msUntilNextLocalMidnight() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime() - now.getTime();
}

/**
 * Re-evaluates birthday status at local midnight so the banner disappears automatically.
 * @param {*} birthDateRaw
 * @returns {boolean}
 */
export default function useBirthdayToday(birthDateRaw) {
  const [isToday, setIsToday] = useState(() => isBirthdayToday(birthDateRaw));

  useEffect(() => {
    let timerId;

    const refresh = () => {
      setIsToday(isBirthdayToday(birthDateRaw));
      timerId = window.setTimeout(refresh, msUntilNextLocalMidnight());
    };

    refresh();

    return () => {
      if (timerId) window.clearTimeout(timerId);
    };
  }, [birthDateRaw]);

  return isToday;
}
