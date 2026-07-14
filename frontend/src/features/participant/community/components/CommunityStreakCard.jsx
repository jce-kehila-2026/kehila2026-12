import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { getTodayKey } from '../utils/communityDateUtils';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

const WEEK_DAYS = [
  { shortKey: 'daySunShort', labelKey: 'daySun' },
  { shortKey: 'dayMonShort', labelKey: 'dayMon' },
  { shortKey: 'dayTueShort', labelKey: 'dayTue' },
  { shortKey: 'dayWedShort', labelKey: 'dayWed' },
  { shortKey: 'dayThuShort', labelKey: 'dayThu' },
  { shortKey: 'dayFriShort', labelKey: 'dayFri' },
  { shortKey: 'daySatShort', labelKey: 'daySat' },
];

export default function CommunityStreakCard({ isAtRisk = false, lastActivityDate = null, streakCount = 0 }) {
  const { t } = useParticipantLocale();
  const hasStartedStreak = streakCount > 0;
  const todayIndex = new Date().getDay();
  const hasCompletedToday = lastActivityDate === getTodayKey();
  const weeklyProgressCount = Math.min(Math.max(streakCount, 0), WEEK_DAYS.length);
  const weeklyProgressPercent = (weeklyProgressCount / WEEK_DAYS.length) * 100;
  const ringProgress = `${weeklyProgressPercent}%`;
  const statusText = !hasStartedStreak
    ? t('streakStart')
    : isAtRisk
      ? t('streakAtRiskMsg')
      : t('streakKeepUp');
  const streakAria = t('communityStreakAria')
    .replace('{n}', String(streakCount))
    .replace('{unit}', streakCount === 1 ? t('unitDay') : t('unitDays'));

  return (
    <section
      className={`community-streak-card${isAtRisk && hasStartedStreak ? ' is-at-risk' : ''}`}
      aria-label={streakAria}
    >
      <div className="community-streak-card__topline">
        <div className="community-streak-card__title">
          <strong>{t('communityStreak')}</strong>
        </div>
        {isAtRisk && hasStartedStreak && (
          <span className="community-streak-card__risk">{t('atRisk')}</span>
        )}
      </div>

      <div
        className="community-streak-card__ring"
        role="progressbar"
        aria-label={t('weeklyProgressAria')}
        aria-valuemin="0"
        aria-valuemax={WEEK_DAYS.length}
        aria-valuenow={weeklyProgressCount}
        style={{ '--streak-progress': ringProgress }}
      >
        <div className="community-streak-card__ring-inner">
          <strong className="community-streak-card__count">{streakCount}</strong>
          <span>{t('dayStreak')}</span>
        </div>
      </div>

      {hasCompletedToday && (
        <div className="community-streak-card__completion-badge" aria-label={t('todayCompleted')}>
          <FavoriteRoundedIcon aria-hidden="true" />
          <span>{t('todayCompleted')}</span>
        </div>
      )}

      <p className="community-streak-card__subtitle">{statusText}</p>

      <div className="community-streak-card__week" aria-label={t('weeklyTrackerAria')}>
        {WEEK_DAYS.map((day, index) => {
          const isToday = index === todayIndex;
          const isActiveToday = hasCompletedToday && isToday;
          const dayAria = `${t(day.labelKey)}${isToday ? t('todaySuffix') : ''}${isActiveToday ? t('activeSuffix') : ''}`;

          return (
            <span className="community-streak-card__day-wrap" key={day.shortKey}>
              <span className="community-streak-card__day-label">{t(day.shortKey)}</span>
              <span
                className={[
                  'community-streak-card__day',
                  isToday ? 'is-today' : '',
                  isActiveToday ? 'is-active' : '',
                ].filter(Boolean).join(' ')}
                aria-label={dayAria}
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
