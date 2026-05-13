import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';

export default function SupportAreasSection({ supportAreas = [], isLoading = false, hasError = false }) {
  const visibleSupportAreas = Array.isArray(supportAreas) ? supportAreas.filter(Boolean) : [];

  return (
    <section className="public-section public-section--support" id="support" aria-labelledby="public-support-title">
      <div className="public-section__header">
        <p className="public-eyebrow">Support Areas</p>
        <h2 id="public-support-title">Focused support for recovery and growth</h2>
      </div>

      {isLoading ? (
        <LoadingState message="Loading support areas..." />
      ) : hasError ? (
        <ErrorState message="Could not load support areas. Showing other available content." />
      ) : visibleSupportAreas.length ? (
        <div className="public-support__grid" data-content-source="fallback">
          {visibleSupportAreas.map((area) => (
            <article className="public-support__card" key={area.id || area.title}>
              <span className="public-support__icon" aria-hidden="true">
                {area.icon || (area.title || 'S').charAt(0)}
              </span>
              <h3>{area.title || 'Support area'}</h3>
              <p>{area.description || area.text || 'Support details will appear here when available.'}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="Support areas will appear here when public data is available." />
      )}
    </section>
  );
}
