import { useEffect, useState, useCallback } from 'react';
import { getPublishedEvents } from '../admin/services/eventService';
import {
  getRegistrationCounts,
  getUserRegisteredEventIds,
  addRegistration,
  removeRegistration,
} from '../admin/services/registrationService';
import { useAdmin } from '../admin/context/AdminContext';
import { localizeField } from '../../i18n/localizeField';

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

export default function WorkshopFeed({ locale = 'he' }) {
  const { currentUser } = useAdmin();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({});
  const [registeredMap, setRegisteredMap] = useState({});
  const [registering, setRegistering] = useState(null);

  const refreshRegistrationData = useCallback(async (eventList) => {
    if (!eventList.length || !currentUser?.email) return;
    const ids = eventList.map((e) => e.id);
    const [countsData, userRegs] = await Promise.all([
      getRegistrationCounts(ids),
      getUserRegisteredEventIds(currentUser.email),
    ]);
    setCounts(countsData);
    setRegisteredMap(userRegs);
  }, [currentUser?.email]);

  useEffect(() => {
    let cancelled = false;
    getPublishedEvents()
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        setLoading(false);
        refreshRegistrationData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load published events:', err);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshRegistrationData]);

  async function handleRegister(event) {
    if (!currentUser || registering) return;
    setRegistering(event.id);
    try {
      const regId = await addRegistration({
        eventId: event.id,
        uid: currentUser.uid,
        participantName: currentUser.displayName || currentUser.email.split('@')[0],
        participantEmail: currentUser.email,
        eventTitle: event.title,
        eventDate: event.startTime || event.date || null,
        eventLocation: event.location || '',
      });
      setRegisteredMap((prev) => ({ ...prev, [event.id]: regId }));
      setCounts((prev) => ({ ...prev, [event.id]: (prev[event.id] ?? 0) + 1 }));
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setRegistering(null);
    }
  }

  async function handleCancel(event) {
    if (!currentUser || registering) return;
    const regId = registeredMap[event.id];
    if (!regId) return;
    setRegistering(event.id);
    try {
      await removeRegistration(regId, currentUser.displayName || currentUser.email, event.id);
      setRegisteredMap((prev) => {
        const next = { ...prev };
        delete next[event.id];
        return next;
      });
      setCounts((prev) => ({ ...prev, [event.id]: Math.max(0, (prev[event.id] ?? 1) - 1) }));
    } catch (err) {
      console.error('Cancel registration failed:', err);
    } finally {
      setRegistering(null);
    }
  }

  if (loading) {
    return <p className="participant-empty-view">Loading workshops...</p>;
  }

  if (events.length === 0) {
    return <p className="participant-empty-view">No workshops published yet. Check back soon.</p>;
  }

  return (
    <div className="workshop-feed">
      {events.map((event) => {
        const registered = counts[event.id] ?? 0;
        const capacity = event.maxParticipants || 0;
        const isFull = capacity > 0 && registered >= capacity;
        const isRegistered = Boolean(registeredMap[event.id]);
        const isLoading = registering === event.id;

        return (
          <article className="workshop-card" key={event.id}>
            <div className="workshop-card__header">
              <span className="workshop-card__category">{event.category}</span>
              <strong className="workshop-card__title">{localizeField(event.translations?.title ?? event.title, locale)}</strong>
            </div>
            <time className="workshop-card__time">{formatEventDate(event.startTime)}</time>
            {event.location && (
              <span className="workshop-card__location">{localizeField(event.translations?.location ?? event.location, locale)}</span>
            )}
            <p className="workshop-card__description">{localizeField(event.translations?.description ?? event.description, locale)}</p>

            <div className="workshop-card__footer">
              {capacity > 0 && (
                <span className={`workshop-card__count${isFull ? ' workshop-card__count--full' : ''}`}>
                  {registered} / {capacity} registered
                </span>
              )}
              {isRegistered ? (
                <button
                  className="workshop-card__register-btn is-registered"
                  onClick={() => handleCancel(event)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Cancelling…' : 'Cancel Registration'}
                </button>
              ) : (
                <button
                  className={`workshop-card__register-btn${isFull ? ' is-full' : ''}`}
                  onClick={() => handleRegister(event)}
                  disabled={isFull || isLoading}
                >
                  {isLoading ? 'Registering…' : isFull ? 'Full' : 'Register'}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
