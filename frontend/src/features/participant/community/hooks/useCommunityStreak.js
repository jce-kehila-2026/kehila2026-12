import { useEffect, useRef, useState } from 'react';
import {
  getDayDifference,
  getInitialStreakState,
  getTodayKey,
  isStreakAtRiskForDate,
} from '../communityInteractionHelpers';
import { saveStoredCommunityStreak } from '../services/communityStorageService';

export default function useCommunityStreak() {
  const [initialStreakState] = useState(getInitialStreakState);
  const [communityStreakCount, setCommunityStreakCount] = useState(initialStreakState.streakCount);
  const [lastActivityDate, setLastActivityDate] = useState(initialStreakState.lastActivityDate);
  const communityStreakCountRef = useRef(initialStreakState.streakCount);
  const lastActivityDateRef = useRef(initialStreakState.lastActivityDate);
  const [isCommunityStreakAtRisk, setIsCommunityStreakAtRisk] = useState(
    () => isStreakAtRiskForDate(initialStreakState.lastActivityDate),
  );

  useEffect(() => {
    saveStoredCommunityStreak({
      streakCount: communityStreakCount,
      lastActivityDate,
      updatedAt: new Date(),
    });
  }, [communityStreakCount, lastActivityDate]);

  const registerCommunityActivity = () => {
    const todayKey = getTodayKey();
    const previousActivityDate = lastActivityDateRef.current;
    const dayDifference = getDayDifference(previousActivityDate, todayKey);
    let nextStreakCount = communityStreakCountRef.current;

    if (!previousActivityDate || dayDifference === null || dayDifference >= 2) {
      nextStreakCount = 1;
    } else if (dayDifference === 1) {
      nextStreakCount = communityStreakCountRef.current + 1;
    }

    communityStreakCountRef.current = nextStreakCount;
    lastActivityDateRef.current = todayKey;
    setCommunityStreakCount(nextStreakCount);
    setLastActivityDate(todayKey);
    setIsCommunityStreakAtRisk(false);
  };

  return {
    communityStreakCount,
    lastActivityDate,
    isCommunityStreakAtRisk: isCommunityStreakAtRisk || isStreakAtRiskForDate(lastActivityDate),
    registerCommunityActivity,
  };
}
