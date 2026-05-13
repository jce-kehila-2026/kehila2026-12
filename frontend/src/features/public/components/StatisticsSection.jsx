const FALLBACK_STATISTICS = [
  {
    id: 'programs',
    value: '3+',
    label: 'Support areas',
    note: 'Placeholder until CMS data is connected.',
  },
  {
    id: 'activities',
    value: '6',
    label: 'Activity types',
    note: 'Temporary planning number.',
  },
  {
    id: 'community',
    value: '1',
    label: 'Recovery center',
    note: 'Prepared for verified public data.',
  },
];

export default function StatisticsSection({ statistics = FALLBACK_STATISTICS }) {
  const hasStatistics = statistics.length > 0;

  return (
    <section className="public-section public-section--statistics" id="statistics">
      <div className="public-section__header public-section__header--centered">
        <p className="public-eyebrow">Statistics</p>
        <h2>Current focus in simple numbers</h2>
        <p className="public-section__text">
          These are temporary public placeholders. Verified numbers can replace them from Firestore later.
        </p>
      </div>

      {hasStatistics ? (
        <div className="public-statistics__grid" data-content-source="fallback">
          {statistics.map((statistic) => (
            <article className="public-statistics__card" key={statistic.id}>
              <strong>{statistic.value}</strong>
              <span>{statistic.label}</span>
              <p>{statistic.note}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="public-section__empty" data-empty-state="statistics">
          Statistics will appear here when public data is available.
        </div>
      )}
    </section>
  );
}
