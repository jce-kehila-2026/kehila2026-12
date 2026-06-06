import { useEffect, useState } from 'react';
import { auth } from '../../../firebase';
import { fetchUpcomingAppointment, fetchUpcomingEvent } from './participantDashboardService';

/** @typedef {import('./participantDashboardModel').DashboardAppointment} DashboardAppointment */
/** @typedef {import('./participantDashboardModel').DashboardEvent} DashboardEvent */

/**
 * Loads dashboard home appointment + event card data from Firestore.
 *
 * @param {string|null|undefined} userId
 */
export function useParticipantDashboardHomeData(userId) {
  const [appointment, setAppointment] = useState(/** @type {DashboardAppointment|null} */ (null));
  const [event, setEvent] = useState(/** @type {DashboardEvent|null} */ (null));
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentError, setAppointmentError] = useState(false);
  const [eventError, setEventError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const participantId = userId || auth.currentUser?.uid;

    async function loadDashboardCards() {
      setIsLoading(true);
      setAppointmentError(false);
      setEventError(false);
      setAppointment(null);
      setEvent(null);

      const loadAppointment = fetchUpcomingAppointment(participantId)
        .then((nextAppointment) => {
          if (!cancelled) {
            setAppointment(nextAppointment);
          }
        })
        .catch((loadError) => {
          console.error('[Dashboard] Failed to load upcoming appointment:', loadError);
          if (!cancelled) {
            setAppointment(null);
            setAppointmentError(true);
          }
        });

      const loadEvent = fetchUpcomingEvent(participantId)
        .then((nextEvent) => {
          if (!cancelled) {
            setEvent(nextEvent);
          }
        })
        .catch((loadError) => {
          console.error('[Dashboard] Failed to load upcoming event:', loadError);
          if (!cancelled) {
            setEvent(null);
            setEventError(true);
          }
        });

      await Promise.all([loadAppointment, loadEvent]);

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    loadDashboardCards();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { appointment, event, isLoading, appointmentError, eventError };
}
