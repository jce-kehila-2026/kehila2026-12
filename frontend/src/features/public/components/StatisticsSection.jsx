import { useRef } from 'react';
import { BookHeart, CalendarHeart, HeartHandshake, Sparkles, Users } from 'lucide-react';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import AnimatedCounter from './AnimatedCounter';
import useInViewOnce from '../hooks/useInViewOnce';

const STATISTIC_ICON_PROPS = {
  size: 42,
  strokeWidth: 1.75,
  absoluteStrokeWidth: true,
};

const STATISTIC_ICONS = {
  women: HeartHandshake,
  events: CalendarHeart,
  volunteers: Users,
  stories: BookHeart,
};

const STATISTICS_ICON_GRADIENT_ID = 'public-statistics-icon-gradient';

export default function StatisticsSection({ statistics = [], isLoading = false, hasError = false }) {
  const hasStatistics = statistics.length > 0;
  const sectionRef = useRef(null);
  const countersInView = useInViewOnce(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="public-section public-section--statistics"
      id="statistics"
      aria-labelledby="public-statistics-title"
    >
      <svg className="public-statistics__icon-defs" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={STATISTICS_ICON_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e11d8f" />
            <stop offset="48%" stopColor="#a21caf" />
            <stop offset="100%" stopColor="#5b1578" />
          </linearGradient>
        </defs>
      </svg>

      <div className="public-statistics__decor" aria-hidden="true">
        <span className="public-statistics__blob public-statistics__blob--lavender" />
        <span className="public-statistics__blob public-statistics__blob--rose" />
        <span className="public-statistics__blob public-statistics__blob--center" />
        <span className="public-statistics__leaf public-statistics__leaf--start" />
        <span className="public-statistics__leaf public-statistics__leaf--end" />
        <span className="public-statistics__sparkle public-statistics__sparkle--1" />
        <span className="public-statistics__sparkle public-statistics__sparkle--2" />
        <span className="public-statistics__sparkle public-statistics__sparkle--3" />
        <span className="public-statistics__sparkle public-statistics__sparkle--4" />
        <span className="public-statistics__sparkle public-statistics__sparkle--5" />
      </div>
      <span className="public-statistics__wave" aria-hidden="true" />

      <div className="public-statistics__inner">
        <header className="public-statistics__header reveal">
          <p className="public-statistics__eyebrow">
            <span className="public-statistics__eyebrow-line" aria-hidden="true" />
            <span className="public-statistics__eyebrow-heart" aria-hidden="true">
              ♥
            </span>
            יחד יוצרות שינוי
            <span className="public-statistics__eyebrow-heart" aria-hidden="true">
              ♥
            </span>
            <span className="public-statistics__eyebrow-line" aria-hidden="true" />
          </p>
          <h2 id="public-statistics-title">השפעה שלנו</h2>
          <div className="public-statistics__title-divider" aria-hidden="true">
            <span className="public-statistics__title-divider-wing public-statistics__title-divider-wing--start" />
            <span className="public-statistics__title-divider-heart">♥</span>
            <span className="public-statistics__title-divider-wing public-statistics__title-divider-wing--end" />
          </div>
          <p className="public-statistics__subtitle reveal reveal-delay-1">
            ביחד אנחנו יוצרות קהילה חזקה ותומכת משנה חיים.
          </p>
        </header>

        {isLoading ? (
          <LoadingState message="טוענות נתוני השפעה..." />
        ) : hasError ? (
          <ErrorState message="לא ניתן לטעון את נתוני ההשפעה. מציגות תוכן זמין אחר." />
        ) : hasStatistics ? (
          <div className="public-statistics__cards-wrap">
            <span className="public-statistics__grid-glow" aria-hidden="true" />
            <div className="public-statistics__grid stagger-children" aria-label="נתוני השפעה">
              {statistics.map((statistic) => {
                const Icon = STATISTIC_ICONS[statistic.id] || Sparkles;

                return (
                  <article className="public-statistics__card" key={statistic.id || statistic.label}>
                    <span className="public-statistics__card-shine" aria-hidden="true" />
                    <span className="public-statistics__icon" aria-hidden="true">
                      <Icon className="public-statistics__icon-glyph" {...STATISTIC_ICON_PROPS} />
                    </span>
                    <AnimatedCounter
                      value={statistic.value}
                      structured
                      startAnimation={countersInView}
                    />
                    <div className="public-statistics__card-divider" aria-hidden="true">
                      <span className="public-statistics__card-divider-line" />
                      <span className="public-statistics__card-divider-heart">♥</span>
                      <span className="public-statistics__card-divider-line" />
                    </div>
                    <h3>{statistic.label}</h3>
                    {statistic.note ? <p className="public-statistics__card-text">{statistic.note}</p> : null}
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState message="נתוני ההשפעה יופיעו כאן כאשר התוכן הציבורי יהיה זמין." />
        )}
      </div>
    </section>
  );
}
