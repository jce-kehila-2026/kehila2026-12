import { useEffect, useState } from 'react';
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
    const dayDifference = getDayDifference(lastActivityDate, todayKey);

    if (!lastActivityDate || dayDifference === null || dayDifference >= 3) {
      setCommunityStreakCount(1);
    } else if (dayDifference === 1 || dayDifference === 2) {
      setCommunityStreakCount((currentCount) => currentCount + 1);
    }

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
