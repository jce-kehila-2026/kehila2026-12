import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import EventPreviewCard from './EventPreviewCard';
import LoadingState from './LoadingState';

const DEMO_EVENTS = [
  {
    id: 'demo-event-1',
    title: 'Community Support Circle',
    description:
      'A welcoming group session for sharing, listening, and finding steady support in community.',
    startDate: '2026-06-12',
    dateLabel: 'June 12, 2026',
    time: '17:00',
    location: 'She-Na Community Center',
    isPublic: true,
    active: true,
    status: 'upcoming',
  },
  {
    id: 'demo-event-2',
    title: 'Wellbeing Skills Workshop',
    description:
      'Practical tools for building calm routines, setting boundaries, and navigating difficult days.',
    startDate: '2026-06-19',
    dateLabel: 'June 19, 2026',
    time: '10:30',
    location: 'Online',
    isPublic: true,
    active: true,
    status: 'upcoming',
  },
  {
    id: 'demo-event-3',
    title: 'Resource Guidance Session',
    description:
      'A short introduction to available support services, community programs, and next steps.',
    startDate: '2026-06-26',
    dateLabel: 'June 26, 2026',
    time: '14:00',
    location: 'She-Na Center Hall',
    isPublic: true,
    active: true,
    status: 'upcoming',
  },
];

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
  events = DEMO_EVENTS,
  maxItems = 3,
  isLoading = false,
  hasError = false,
}) {
  const publicUpcomingEvents = getPublicUpcomingEvents(events, maxItems);

  return (
    <section className="public-section public-section--events public-section--muted" id="events">
      <div className="public-section__header public-section__header--events">
        <p className="public-eyebrow">Events</p>
        <h2>Upcoming Activities</h2>
        <p className="public-section__text">
          Discover upcoming support activities, workshops, and community gatherings open to visitors.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Loading activities..." />
      ) : hasError ? (
        <ErrorState message="Could not load the activities. Please try again later." />
      ) : publicUpcomingEvents.length ? (
        <div className="public-events-grid">
          {publicUpcomingEvents.map((event) => (
            <EventPreviewCard event={event} key={event.id || event.title} />
          ))}
        </div>
      ) : (
        <EmptyState message="No public activities are available at the moment." />
      )}
    </section>
  );
}
