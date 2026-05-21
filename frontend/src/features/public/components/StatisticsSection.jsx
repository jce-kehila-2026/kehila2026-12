import { useRef } from 'react';
import { BookOpen, HandHeart, Megaphone, UsersRound } from 'lucide-react';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import AnimatedCounter from './AnimatedCounter';
import useInViewOnce from '../hooks/useInViewOnce';

const STATISTIC_ICON_PROPS = {
  className: 'public-statistics__icon-glyph',
  strokeWidth: 1.5,
  absoluteStrokeWidth: true,
  'aria-hidden': true,
};

const STATISTIC_ICONS = {
  women: HandHeart,
  events: Megaphone,
  volunteers: UsersRound,
  stories: BookOpen,
};

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
            <span className="public-statistics__eyebrow-text">יחד יוצרות שינוי</span>
            <span className="public-statistics__eyebrow-heart" aria-hidden="true">
              ♥
            </span>
            <span className="public-statistics__eyebrow-line" aria-hidden="true" />
          </p>

          <h2 id="public-statistics-title" className="public-statistics__title">
            ההשפעה שלנו
          </h2>

          <StatisticsDivider modifier="public-statistics__divider--title" />

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
            <StatisticsGrid statistics={statistics} countersInView={countersInView} />
          </div>
        ) : (
          <EmptyState message="נתוני ההשפעה יופיעו כאן כאשר התוכן הציבורי יהיה זמין." />
        )}
      </div>
    </section>
  );
}

function StatisticsGrid({ statistics, countersInView }) {
  return (
    <div
      className={`public-statistics__grid${countersInView ? ' public-statistics__grid--in-view' : ''}`}
      aria-label="נתוני השפעה"
    >
      {statistics.map((statistic, index) => {
        const Icon = STATISTIC_ICONS[statistic.id] || BookOpen;
        const tone = index % 2 === 0 ? 'pink' : 'purple';

        return (
          <article
            className={`public-statistics__card public-statistics__card--${tone}`}
            key={statistic.id || statistic.label}
          >
            <span className="public-statistics__icon" aria-hidden="true">
              <Icon {...STATISTIC_ICON_PROPS} />
            </span>
            <AnimatedCounter value={statistic.value} structured startAnimation={countersInView} />
            <StatisticsDivider modifier="public-statistics__divider--card" />
            <h3>{statistic.label}</h3>
            {statistic.note ? <p className="public-statistics__card-text">{statistic.note}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
