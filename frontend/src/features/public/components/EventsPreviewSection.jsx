import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import EventPreviewCard from './EventPreviewCard';
import LoadingState from './LoadingState';
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
    <section className="public-section public-section--events public-section--muted" id="events" aria-labelledby="public-events-title">
      <div className="public-section__header public-section__header--events reveal">
        <p className="public-eyebrow">אירועים</p>
        <h2 id="public-events-title">פעילויות קרובות</h2>
        <p className="public-section__text reveal reveal-delay-1">
          פעילויות תמיכה, סדנאות ומפגשי קהילה קרובים הפתוחים למשתתפות.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="טוענות פעילויות..." />
      ) : hasError ? (
        <ErrorState message="לא ניתן לטעון את הפעילויות. נסי שוב מאוחר יותר." />
      ) : publicUpcomingEvents.length ? (
        <div className="public-events-grid stagger-children">
          {publicUpcomingEvents.map((event) => (
            <EventPreviewCard event={event} key={event.id || event.title} />
          ))}
        </div>
      ) : (
        <EmptyState message="אין פעילויות ציבוריות זמינות כרגע." />
      )}
    </section>
  );
}
