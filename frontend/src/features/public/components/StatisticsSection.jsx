import { useMemo, useRef } from 'react';
import { BookOpen, HandHeart, Heart, Megaphone, Sparkles, UsersRound } from 'lucide-react';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import AnimatedCounter from './AnimatedCounter';
import useInViewOnce from '../hooks/useInViewOnce';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeStatistics } from '../i18n/publicHomeContentLocalization';

const STATISTIC_ICON_PROPS = {
  className: 'public-statistics__icon-glyph',
  strokeWidth: 1.5,
  absoluteStrokeWidth: true,
  'aria-hidden': true,
};

const STATISTIC_ICONS = {
  'hands-heart': HandHeart,
  megaphone: Megaphone,
  'users-round': UsersRound,
  'book-open': BookOpen,
  heart: Heart,
  sparkles: Sparkles,
  // legacy id-based keys (back-compat with content service fallbacks)
  women: HandHeart,
  events: Megaphone,
  volunteers: UsersRound,
  stories: BookOpen,
};

function formatStatisticDisplayValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const formatted = new Intl.NumberFormat('en-US').format(Math.max(0, Math.floor(value)));
    return `${formatted}+`;
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return '';
}

function adaptStatisticForRender(statistic) {
  if (!statistic || typeof statistic !== 'object') return statistic;
  const label = statistic.title || statistic.label || '';
  const note = statistic.description || statistic.note || '';
  return {
    ...statistic,
    label,
    note,
    value: formatStatisticDisplayValue(statistic.value),
    iconKey: statistic.icon || statistic.id,
  };
}

function StatisticsDivider({ modifier = '' }) {
  const className = ['public-statistics__divider', modifier].filter(Boolean).join(' ');

  return (
    <div className={className} aria-hidden="true">
      <span className="public-statistics__divider-line" />
      <span className="public-statistics__divider-heart">♥</span>
      <span className="public-statistics__divider-line" />
    </div>
  );
}

function StatisticsGrid({
  statistics,
  countersInView,
  ariaLabel,
  gridClassName = '',
  enableEntranceAnimation = true,
  instantCounters = false,
  animateOnMount = false,
  revealCards = false,
  counterDurationMs = 1200,
  counterRunOnce = false,
}) {
  const shouldAnimateEntrance = enableEntranceAnimation && (countersInView || animateOnMount);
  const shouldAnimateCounters = !instantCounters && (countersInView || animateOnMount);
  const gridClasses = [
    'public-statistics__grid',
    shouldAnimateEntrance ? 'public-statistics__grid--in-view' : '',
    gridClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={gridClasses} aria-label={ariaLabel}>
      {statistics.map((statistic, index) => {
        const Icon = STATISTIC_ICONS[statistic.iconKey] || STATISTIC_ICONS[statistic.id] || BookOpen;
        const tone = index % 2 === 0 ? 'pink' : 'purple';

        return (
          <article
            className={[
              `public-statistics__card public-statistics__card--${tone}`,
              revealCards ? 'reveal' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={statistic.id || statistic.label}
          >
            <span className="public-statistics__icon" aria-hidden="true">
              <Icon {...STATISTIC_ICON_PROPS} />
            </span>
            <AnimatedCounter
              value={statistic.value}
              structured
              startAnimation={shouldAnimateCounters}
              instant={instantCounters}
              durationMs={counterDurationMs}
              runOnce={counterRunOnce}
            />
            <StatisticsDivider modifier="public-statistics__divider--card" />
            <h3>{statistic.label}</h3>
            {statistic.note ? <p className="public-statistics__card-text">{statistic.note}</p> : null}
          </article>
        );
      })}
    </div>
  );
}

export { StatisticsGrid, StatisticsDivider, adaptStatisticForRender };

export default function StatisticsSection({ statistics = [], isLoading = false, hasError = false }) {
  const { locale, t } = usePublicLocale();
  const adaptedStatistics = useMemo(
    () => (Array.isArray(statistics) ? statistics.map(adaptStatisticForRender) : []),
    [statistics],
  );
  const localizedStatistics = localizeStatistics(adaptedStatistics, locale);
  const hasStatistics = localizedStatistics.length > 0;
  const sectionRef = useRef(null);
  const countersInView = useInViewOnce(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="public-section public-section--statistics"
      id="statistics"
      aria-labelledby="public-statistics-title"
    >
      <div className="public-statistics__decor" aria-hidden="true">
        <span className="public-statistics__orb public-statistics__orb--pink" />
        <span className="public-statistics__orb public-statistics__orb--lavender" />
        <span className="public-statistics__orb public-statistics__orb--purple" />
        <span className="public-statistics__dots" />
        <span className="public-statistics__butterfly public-statistics__butterfly--start" />
        <span className="public-statistics__butterfly public-statistics__butterfly--end" />
      </div>

      <div className="public-statistics__inner">
        <header className="public-statistics__header reveal">
          <p className="public-statistics__eyebrow">
            <span className="public-statistics__eyebrow-line" aria-hidden="true" />
            <span className="public-statistics__eyebrow-heart" aria-hidden="true">
              ♥
            </span>
            <span className="public-statistics__eyebrow-text">{t('statsEyebrow')}</span>
            <span className="public-statistics__eyebrow-heart" aria-hidden="true">
              ♥
            </span>
            <span className="public-statistics__eyebrow-line" aria-hidden="true" />
          </p>

          <h2 id="public-statistics-title" className="public-statistics__title">
            {t('statsTitle')}
          </h2>

          <StatisticsDivider modifier="public-statistics__divider--title" />

          <p className="public-statistics__subtitle reveal reveal-delay-1">{t('statsSubtitle')}</p>
        </header>

        {isLoading ? (
          <LoadingState message={t('loadingStats')} />
        ) : hasError ? (
          <ErrorState message={t('errorStats')} />
        ) : hasStatistics ? (
          <div className="public-statistics__cards-wrap">
            <StatisticsGrid statistics={localizedStatistics} countersInView={countersInView} ariaLabel={t('statsAriaLabel')} />
          </div>
        ) : (
          <EmptyState message={t('emptyStats')} />
        )}
      </div>
    </section>
  );
}
