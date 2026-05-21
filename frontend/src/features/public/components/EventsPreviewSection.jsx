import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import EventPreviewCard from './EventPreviewCard';
import LoadingState from './LoadingState';
import '../styles/public-events-section.css';

function EventsTitleAccent() {
  return (
    <div className="public-events__title-accent" aria-hidden="true">
      <span className="public-events__title-line" />
      <span className="public-events__title-heart">♥</span>
      <span className="public-events__title-line" />
    </div>
  );
}

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
  const publicUpcomingEvents = getPublicUpcomingEvents(events, maxItems);

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
        <header className="public-events__header reveal">
          <p className="public-events__eyebrow">אירועים</p>
          <h2 id="public-events-title" className="public-events__heading">
            פעילויות קרובות
          </h2>
          <EventsTitleAccent />
          <p className="public-events__subtitle reveal reveal-delay-1">
            פעילויות תמיכה, סדנאות ומפגשי קהילה קרובים הפתוחים למשתתפות.
          </p>
        </header>

        {isLoading ? (
          <div className="public-events__state">
            <LoadingState message="טוענות פעילויות..." />
          </div>
        ) : hasError ? (
          <div className="public-events__state">
            <ErrorState message="לא ניתן לטעון את הפעילויות. נסי שוב מאוחר יותר." />
          </div>
        ) : publicUpcomingEvents.length ? (
          <div className="public-events-grid stagger-children">
            {publicUpcomingEvents.map((event, index) => (
              <EventPreviewCard event={event} index={index} key={event.id || event.title} />
            ))}
          </div>
        ) : (
          <div className="public-events__state">
            <EmptyState message="אין פעילויות ציבוריות זמינות כרגע." />
          </div>
        )}
      </div>
    </section>
  );
}
