import { describe, expect, it } from 'vitest';
import {
  getDayDifference,
  getTodayKey,
  isStreakAtRiskForDate,
  isStreakReminderDueForDate,
} from './communityDateUtils';

describe('community streak date helpers', () => {
  it('uses calendar dates instead of elapsed 24-hour windows', () => {
    const beforeMidnight = new Date(2026, 5, 1, 23, 59);
    const afterMidnight = new Date(2026, 5, 2, 0, 0);

    expect(getTodayKey(beforeMidnight)).toBe('2026-06-01');
    expect(getTodayKey(afterMidnight)).toBe('2026-06-02');
    expect(getDayDifference(getTodayKey(beforeMidnight), getTodayKey(afterMidnight))).toBe(1);
  });

  it('marks a streak at risk on the grace day and reminder due after the reminder hour', () => {
    expect(isStreakReminderDueForDate('2026-06-01', new Date(2026, 5, 2, 20, 59))).toBe(false);
    expect(isStreakReminderDueForDate('2026-06-01', new Date(2026, 5, 2, 21, 0))).toBe(true);
    expect(isStreakAtRiskForDate('2026-06-01', '2026-06-03')).toBe(true);
  });
});
