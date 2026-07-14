import { useMemo } from 'react';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import EventPreviewCard from './EventPreviewCard';
import LoadingState from './LoadingState';
import PublicSectionHeading from './PublicSectionHeading';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeEvents } from '../i18n/publicHomeContentLocalization';
import useHorizontalCardCarousel from '../hooks/useHorizontalCardCarousel';

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
  maxItems = 20,
  isLoading = false,
  hasError = false,
}) {
  const { direction, locale, t } = usePublicLocale();
  const publicUpcomingEvents = useMemo(() => {
    const upcoming = getPublicUpcomingEvents(events, maxItems);
    return localizeEvents(upcoming, locale);
  }, [events, locale, maxItems]);

  const carousel = useHorizontalCardCarousel({
    cardSelector: '.public-event-card',
    direction,
    itemCount: publicUpcomingEvents.length,
    refreshKey: locale,
  });

  return (
    <section
      className="public-section public-section--events"
      id="events"
      aria-labelledby="public-events-title"
    >
      <div className="public-pink-section-decor" aria-hidden="true">
        <span className="public-pink-section-decor__dots public-pink-section-decor__dots--mesh" />
        <span className="public-pink-section-decor__blob public-pink-section-decor__blob--pink" />
        <span className="public-pink-section-decor__blob public-pink-section-decor__blob--lavender" />
        <span className="public-pink-section-decor__blob public-pink-section-decor__blob--purple" />
        <span className="public-pink-section-decor__dots public-pink-section-decor__dots--one" />
        <span className="public-pink-section-decor__dots public-pink-section-decor__dots--two" />
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
          <div className={[
            'public-events__carousel',
            'public-card-carousel',
            !carousel.showControls ? 'public-card-carousel--without-controls' : '',
            carousel.fadeLeft ? 'public-card-carousel--fade-left' : '',
            carousel.fadeRight ? 'public-card-carousel--fade-right' : '',
          ].filter(Boolean).join(' ')}>
            {carousel.showControls ? <button
              type="button"
              className="public-events__scroll-btn public-events__scroll-btn--prev public-card-carousel__button"
              aria-label={t('scrollPrevActivity')}
              onClick={() => carousel.scrollByCards(-1)}
              disabled={!carousel.canScrollPrev}
            >
              <ChevronRightRoundedIcon fontSize="inherit" aria-hidden="true" />
            </button> : null}

            <div className="public-events-grid public-card-carousel__track stagger-children" ref={carousel.scrollerRef}>
              {publicUpcomingEvents.map((event, index) => (
                <EventPreviewCard event={event} index={index} key={event.id || event.title} />
              ))}
            </div>

            {carousel.showControls ? <button
              type="button"
              className="public-events__scroll-btn public-events__scroll-btn--next public-card-carousel__button"
              aria-label={t('scrollNextActivity')}
              onClick={() => carousel.scrollByCards(1)}
              disabled={!carousel.canScrollNext}
            >
              <ChevronLeftRoundedIcon fontSize="inherit" aria-hidden="true" />
            </button> : null}
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
