import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { getTodayKey } from '../utils/communityDateUtils';

const WEEK_DAYS = [
  { short: 'Sun', label: 'Sunday' },
  { short: 'Mon', label: 'Monday' },
  { short: 'Tue', label: 'Tuesday' },
  { short: 'Wed', label: 'Wednesday' },
  { short: 'Thu', label: 'Thursday' },
  { short: 'Fri', label: 'Friday' },
  { short: 'Sat', label: 'Saturday' },
];

export default function CommunityStreakCard({ isAtRisk = false, lastActivityDate = null, streakCount = 0 }) {
  const hasStartedStreak = streakCount > 0;
  const todayIndex = new Date().getDay();
  const hasCompletedToday = lastActivityDate === getTodayKey();
  const weeklyProgressCount = Math.min(Math.max(streakCount, 0), WEEK_DAYS.length);
  const weeklyProgressPercent = (weeklyProgressCount / WEEK_DAYS.length) * 100;
  const ringProgress = `${weeklyProgressPercent}%`;
  const statusText = !hasStartedStreak
    ? 'Share, like, or comment to begin your streak.'
    : isAtRisk
      ? 'Your streak is waiting. Interact today to keep it.'
      : 'Keep showing up for your community.';

  return (
    <section
      className={`community-streak-card${isAtRisk && hasStartedStreak ? ' is-at-risk' : ''}`}
      aria-label={`Community streak, ${streakCount} ${streakCount === 1 ? 'day' : 'days'}`}
    >
      <div className="community-streak-card__topline">
        <div className="community-streak-card__title">
          <strong>Community streak</strong>
        </div>
        {isAtRisk && hasStartedStreak && (
          <span className="community-streak-card__risk">At risk</span>
        )}
      </div>

      <div
        className="community-streak-card__ring"
        role="progressbar"
        aria-label="Weekly streak progress"
        aria-valuemin="0"
        aria-valuemax={WEEK_DAYS.length}
        aria-valuenow={weeklyProgressCount}
        style={{ '--streak-progress': ringProgress }}
      >
        <div className="community-streak-card__ring-inner">
          <strong className="community-streak-card__count">{streakCount}</strong>
          <span>day streak</span>
        </div>
      </div>

      {hasCompletedToday && (
        <div className="community-streak-card__completion-badge" aria-label="Today completed">
          <FavoriteRoundedIcon aria-hidden="true" />
          <span>Today completed</span>
        </div>
      )}

      <p className="community-streak-card__subtitle">{statusText}</p>

      <div className="community-streak-card__week" aria-label="Weekly tracker">
        {WEEK_DAYS.map((day, index) => {
          const isToday = index === todayIndex;
          const isActiveToday = hasCompletedToday && isToday;

          return (
            <span className="community-streak-card__day-wrap" key={day.short}>
              <span className="community-streak-card__day-label">{day.short}</span>
              <span
                className={[
                  'community-streak-card__day',
                  isToday ? 'is-today' : '',
                  isActiveToday ? 'is-active' : '',
                ].filter(Boolean).join(' ')}
                aria-label={`${day.label}${isToday ? ', today' : ''}${isActiveToday ? ', active' : ''}`}
              >
                {isActiveToday && <CheckRoundedIcon aria-hidden="true" />}
              </span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
