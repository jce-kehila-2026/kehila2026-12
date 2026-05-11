import { useEffect, useState } from 'react';
import { subscribeToPublishedEvents } from '../admin/services/eventService';

function formatEventDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '—';
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default function WorkshopFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPublishedEvents((data) => {
      setEvents(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <p className="participant-empty-view">Loading workshops...</p>;
  }

  if (events.length === 0) {
    return <p className="participant-empty-view">No workshops published yet. Check back soon.</p>;
  }

  return (
    <div className="workshop-feed">
      {events.map((event) => (
        <article className="workshop-card" key={event.id}>
          <div className="workshop-card__header">
            <span className="workshop-card__category">{event.category}</span>
            <strong className="workshop-card__title">{event.title}</strong>
          </div>
          <time className="workshop-card__time">{formatEventDate(event.startTime)}</time>
          {event.location && (
            <span className="workshop-card__location">{event.location}</span>
          )}
          <p className="workshop-card__description">{event.description}</p>
          {event.maxParticipants > 0 && (
            <span className="workshop-card__capacity">
              Capacity: {event.maxParticipants} participants
            </span>
          )}
        </article>
      ))}
    </div>
  );
}
