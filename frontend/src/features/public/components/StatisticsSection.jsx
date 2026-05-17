import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import AnimatedCounter from './AnimatedCounter';

export default function StatisticsSection({ statistics = [], isLoading = false, hasError = false }) {
  const hasStatistics = statistics.length > 0;

  return (
    <section className="public-section public-section--statistics" id="statistics" aria-labelledby="public-statistics-title">
      <div className="public-section__header public-section__header--centered reveal">
        <p className="public-eyebrow">יחד יוצרות שינוי</p>
        <h2 id="public-statistics-title">ההשפעה שלנו</h2>
        <p className="public-section__text reveal reveal-delay-1">
          ביחד אנחנו יוצרות קהילה חזקה ותומכת שמשנה חיים.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="טוענות נתוני השפעה..." />
      ) : hasError ? (
        <ErrorState message="לא ניתן לטעון את נתוני ההשפעה. מציגות תוכן זמין אחר." />
      ) : hasStatistics ? (
        <div className="public-statistics__grid stagger-children">
          {statistics.map((statistic) => (
            <article className="public-statistics__card reveal" key={statistic.id || statistic.label}>
              <AnimatedCounter value={statistic.value} />
              <span>{statistic.label}</span>
              {statistic.note ? <p>{statistic.note}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="נתוני ההשפעה יופיעו כאן כאשר התוכן הציבורי יהיה זמין." />
      )}
    </section>
  );
}
