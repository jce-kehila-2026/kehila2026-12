import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CommunityStreakCard({ isAtRisk = false, streakCount = 0 }) {
  const hasStartedStreak = streakCount > 0;
  const todayIndex = new Date().getDay();
  const statusText = !hasStartedStreak
    ? 'Share, like, or comment to begin your streak.'
    : isAtRisk
      ? 'Your streak is waiting — interact today to keep it.'
      : 'Share, like, or comment today to keep your rhythm going.';

  return (
    <section className={`community-streak-card${isAtRisk && hasStartedStreak ? ' is-at-risk' : ''}`} aria-label="Community streak">
      <span className="community-streak-card__icon" aria-hidden="true">
        {isAtRisk && hasStartedStreak ? <HourglassEmptyOutlinedIcon /> : <AutoAwesomeOutlinedIcon />}
      </span>

      <div className="community-streak-card__content">
        <div className="community-streak-card__header">
          <div>
            <span>Community streak</span>
            <strong>
              {streakCount}
              <small>{streakCount === 1 ? 'day' : 'days'}</small>
            </strong>
          </div>
          {isAtRisk && hasStartedStreak && (
            <span className="community-streak-card__risk">At risk</span>
          )}
        </div>

        <p>{statusText}</p>

        <div className="community-streak-card__week" aria-label="Weekly streak progress">
          {WEEK_DAYS.map((day, index) => (
            <span
              className={[
                'community-streak-card__day',
                index === todayIndex ? 'is-today' : '',
                hasStartedStreak && index === todayIndex ? 'is-active' : '',
              ].filter(Boolean).join(' ')}
              key={day}
            >
              {day}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
