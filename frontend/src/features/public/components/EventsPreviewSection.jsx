import { useMemo } from 'react';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import EventPreviewCard from './EventPreviewCard';
import LoadingState from './LoadingState';
import PublicSectionHeading from './PublicSectionHeading';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeEvents } from '../i18n/publicHomeContentLocalization';
import '../styles/public-events-section.css';

function isUpcomingEvent(event) {
  if (event.status === 'past' || event.status === 'completed') {
    return false;
  }

  if (!event.startDate && !event.date) {
    return true;
  }

  const rawDate = event.startDate || event.date;
  const eventDate = new Date(rawDate);

  if (Number.isNaN(eventDate.getTime())) {
    return true;
  }

  return eventDate >= new Date();
}

function getPublicUpcomingEvents(events, maxItems) {
  return (Array.isArray(events) ? events : [])
    .filter((event) => {
      if (!event || typeof event !== 'object') {
        return false;
      }

      const isPublic = event.isPublic !== false && event.public !== false;
      const isVisible = event.isVisible !== false && event.visible !== false && event.hidden !== true;
      const isActive = event.active !== false && event.status !== 'inactive';
      const isCancelled = event.cancelled === true || event.status === 'cancelled';
      const isDraft = event.status === 'draft' || event.status === 'unpublished';

      return isPublic && isVisible && isActive && !isCancelled && !isDraft && isUpcomingEvent(event);
    })
    .slice(0, maxItems);
}

export default function EventsPreviewSection({
  events = [],
  maxItems = 3,
  isLoading = false,
  hasError = false,
}) {
  const { locale, t } = usePublicLocale();
  const publicUpcomingEvents = useMemo(() => {
    const upcoming = getPublicUpcomingEvents(events, maxItems);
    return localizeEvents(upcoming, locale);
  }, [events, locale, maxItems]);

  return (
    <section
      className="public-section public-section--events"
      id="events"
      aria-labelledby="public-events-title"
    >
      <div className="public-events__decor" aria-hidden="true">
        <span className="public-events__dots public-events__dots--mesh" />
        <span className="public-events__blob public-events__blob--pink" />
        <span className="public-events__blob public-events__blob--lavender" />
        <span className="public-events__blob public-events__blob--purple" />
        <span className="public-events__dots public-events__dots--one" />
        <span className="public-events__dots public-events__dots--two" />
      </div>

      <div className="public-events__inner">
        <PublicSectionHeading
          className="public-events__heading-wrap"
          eyebrow={t('eventsEyebrow')}
          title={t('eventsTitle')}
          titleId="public-events-title"
          subtitle={t('eventsSubtitle')}
        />

        {isLoading ? (
          <div className="public-events__state">
            <LoadingState message={t('loadingEvents')} />
          </div>
        ) : hasError ? (
          <div className="public-events__state">
            <ErrorState message={t('errorEvents')} />
          </div>
        ) : publicUpcomingEvents.length ? (
          <div className="public-events-grid stagger-children">
            {publicUpcomingEvents.map((event, index) => (
              <EventPreviewCard event={event} index={index} key={event.id || event.title} />
            ))}
          </div>
        ) : (
          <div className="public-events__state">
            <EmptyState message={t('emptyEvents')} />
          </div>
        )}
      </div>
    </section>
  );
}
