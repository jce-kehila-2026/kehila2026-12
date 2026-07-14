import { useEffect, useRef, useState } from 'react';
import {
  getDayDifference,
  getTodayKey,
  isStreakAtRiskForDate,
  isStreakReminderDueForDate,
  INITIAL_COMMUNITY_STREAK_COUNT,
  INITIAL_LAST_ACTIVITY_DATE,
} from '../communityInteractionHelpers';
import {
  createCommunityStreakNotification,
  getCommunityStreak,
  updateCommunityStreak,
} from '../services/communityService';

const isRealUserId = (uid) => Boolean(uid) && uid !== 'current-user';
const STREAK_STATUS_CHECK_MS = 60 * 1000;

const getReminderNotification = (streakCount) => ({
  type: 'streak_reminder',
  title: 'Community streak reminder',
  body: `Heads up: you have not interacted in the community today. Interact before the day ends to keep your ${streakCount}-day streak.`,
});

const getGraceNotification = (streakCount) => ({
  type: 'streak_grace',
  title: 'Community streak at risk',
  body: `You still have until the end of today to interact in the community and keep your ${streakCount}-day streak.`,
});

const getLostNotification = () => ({
  type: 'streak_lost',
  title: 'Community streak lost',
  body: 'Unfortunately, you lost your community streak. Interact in the community to start a new one.',
});

export default function useCommunityStreak({ localUserId } = {}) {
  const [communityStreakCount, setCommunityStreakCount] = useState(INITIAL_COMMUNITY_STREAK_COUNT);
  const [lastActivityDate, setLastActivityDate] = useState(INITIAL_LAST_ACTIVITY_DATE);
  const communityStreakCountRef = useRef(INITIAL_COMMUNITY_STREAK_COUNT);
  const lastActivityDateRef = useRef(INITIAL_LAST_ACTIVITY_DATE);
  const streakReminderDateRef = useRef(null);
  const streakGraceDateRef = useRef(null);
  const streakLostDateRef = useRef(null);
  const [isCommunityStreakAtRisk, setIsCommunityStreakAtRisk] = useState(false);

  const evaluateStreakStatus = () => {
    if (!isRealUserId(localUserId)) return;

    const todayKey = getTodayKey();
    const lastActivityDate = lastActivityDateRef.current;
    const currentCount = communityStreakCountRef.current;
    const dayDifference = getDayDifference(lastActivityDate, todayKey);

    if (!lastActivityDate || currentCount <= 0 || dayDifference === null || dayDifference <= 0) {
      setIsCommunityStreakAtRisk(false);
      return;
    }

    if (
      dayDifference === 1
      && isStreakReminderDueForDate(lastActivityDate)
      && streakReminderDateRef.current !== todayKey
    ) {
      const notification = getReminderNotification(currentCount);
      streakReminderDateRef.current = todayKey;
      updateCommunityStreak(localUserId, { communityStreakReminderDate: todayKey }).catch(() => {});
      createCommunityStreakNotification(localUserId, {
        notificationKey: `streak-reminder-${todayKey}`,
        ...notification,
      }).catch(() => {});
    }

    if (dayDifference === 2) {
      setIsCommunityStreakAtRisk(true);
      if (streakGraceDateRef.current !== todayKey) {
        const notification = getGraceNotification(currentCount);
        streakGraceDateRef.current = todayKey;
        updateCommunityStreak(localUserId, { communityStreakGraceDate: todayKey }).catch(() => {});
        createCommunityStreakNotification(localUserId, {
          notificationKey: `streak-grace-${todayKey}`,
          ...notification,
        }).catch(() => {});
      }
      return;
    }

    if (dayDifference >= 3 && streakLostDateRef.current !== todayKey) {
      streakLostDateRef.current = todayKey;
      communityStreakCountRef.current = 0;
      setCommunityStreakCount(0);
      setIsCommunityStreakAtRisk(false);
      updateCommunityStreak(localUserId, {
        communityStreakCount: 0,
        communityStreakLostDate: todayKey,
      }).catch(() => {});
      createCommunityStreakNotification(localUserId, {
        notificationKey: `streak-lost-${todayKey}`,
        ...getLostNotification(),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (!isRealUserId(localUserId)) return;
    let cancelled = false;

    getCommunityStreak(localUserId).then((streakData) => {
      if (cancelled || !streakData) return;

      const count = streakData.communityStreakCount ?? 0;
      const date = streakData.communityLastActivityDate ?? null;

      communityStreakCountRef.current = count;
      lastActivityDateRef.current = date;
      streakReminderDateRef.current = streakData.communityStreakReminderDate ?? null;
      streakGraceDateRef.current = streakData.communityStreakGraceDate ?? null;
      streakLostDateRef.current = streakData.communityStreakLostDate ?? null;
      setCommunityStreakCount(count);
      setLastActivityDate(date);
      setIsCommunityStreakAtRisk(isStreakAtRiskForDate(date));
      window.setTimeout(evaluateStreakStatus, 0);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [localUserId]);

  useEffect(() => {
    if (!isRealUserId(localUserId)) return undefined;

    evaluateStreakStatus();
    const intervalId = window.setInterval(evaluateStreakStatus, STREAK_STATUS_CHECK_MS);

    return () => window.clearInterval(intervalId);
  }, [localUserId]);

  const registerCommunityActivity = () => {
    const todayKey = getTodayKey();
    const previousActivityDate = lastActivityDateRef.current;
    const dayDifference = getDayDifference(previousActivityDate, todayKey);
    let nextStreakCount = communityStreakCountRef.current;

    if (!previousActivityDate || dayDifference === null || dayDifference >= 3) {
      nextStreakCount = 1;
    } else if (dayDifference === 1 || dayDifference === 2) {
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
