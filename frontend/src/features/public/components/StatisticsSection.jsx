import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';

export default function StatisticsSection({ statistics = [], isLoading = false, hasError = false }) {
  const hasStatistics = statistics.length > 0;

  return (
    <section className="public-section public-section--statistics" id="statistics" aria-labelledby="public-statistics-title">
      <div className="public-section__header public-section__header--centered">
        <p className="public-eyebrow">Statistics</p>
        <h2 id="public-statistics-title">Public impact details</h2>
        <p className="public-section__text">
          Verified public numbers will be shared here after they are reviewed and approved.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Loading statistics..." />
      ) : hasError ? (
        <ErrorState message="Could not load statistics. Showing other available content." />
      ) : hasStatistics ? (
        <div className="public-statistics__grid" data-content-source="fallback">
          {statistics.map((statistic) => (
            <article className="public-statistics__card" key={statistic.id || statistic.label}>
              <strong>{statistic.value || 'TBD'}</strong>
              <span>{statistic.label || 'Statistic'}</span>
              {statistic.note ? <p>{statistic.note}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="Statistics will appear here when public data is available." />
      )}
    </section>
  );
}
