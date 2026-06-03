import { useEffect, useRef, useState } from 'react';
import {
  getDayDifference,
  getTodayKey,
  isStreakAtRiskForDate,
  INITIAL_COMMUNITY_STREAK_COUNT,
  INITIAL_LAST_ACTIVITY_DATE,
} from '../communityInteractionHelpers';
import {
  getCommunityStreak,
  updateCommunityStreak,
} from '../services/communityService';

const isRealUserId = (uid) => Boolean(uid) && uid !== 'current-user';

export default function useCommunityStreak({ localUserId } = {}) {
  const [communityStreakCount, setCommunityStreakCount] = useState(INITIAL_COMMUNITY_STREAK_COUNT);
  const [lastActivityDate, setLastActivityDate] = useState(INITIAL_LAST_ACTIVITY_DATE);
  const communityStreakCountRef = useRef(INITIAL_COMMUNITY_STREAK_COUNT);
  const lastActivityDateRef = useRef(INITIAL_LAST_ACTIVITY_DATE);
  const [isCommunityStreakAtRisk, setIsCommunityStreakAtRisk] = useState(false);

  useEffect(() => {
    if (!isRealUserId(localUserId)) return;
    let cancelled = false;

    getCommunityStreak(localUserId).then((streakData) => {
      if (cancelled || !streakData) return;

      const count = streakData.communityStreakCount ?? 0;
      const date = streakData.communityLastActivityDate ?? null;

      communityStreakCountRef.current = count;
      lastActivityDateRef.current = date;
      setCommunityStreakCount(count);
      setLastActivityDate(date);
      setIsCommunityStreakAtRisk(isStreakAtRiskForDate(date));
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [localUserId]);

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

    if (isRealUserId(localUserId)) {
      updateCommunityStreak(localUserId, {
        communityStreakCount: nextStreakCount,
        communityLastActivityDate: todayKey,
      }).catch(() => {});
    }
  };

  return {
    communityStreakCount,
    lastActivityDate,
    isCommunityStreakAtRisk: isCommunityStreakAtRisk || isStreakAtRiskForDate(lastActivityDate),
    registerCommunityActivity,
  };
}
