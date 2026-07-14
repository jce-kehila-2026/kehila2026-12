import { useCallback, useEffect, useState } from 'react';
import { auth } from '../../../firebase';
import { fetchUpcomingAppointment, fetchUpcomingEvent } from './participantDashboardService';

/** @typedef {import('./participantDashboardModel').DashboardAppointment} DashboardAppointment */
/** @typedef {import('./participantDashboardModel').DashboardEvent} DashboardEvent */

/**
 * Loads dashboard home appointment + event card data from Firestore.
 *
 * @param {string|null|undefined} userId
 * @param {number} [refreshToken=0] Bump when returning to home so cards refetch after cancellations.
 */
export function useParticipantDashboardHomeData(userId, refreshToken = 0) {
  const [appointment, setAppointment] = useState(/** @type {DashboardAppointment|null} */ (null));
  const [event, setEvent] = useState(/** @type {DashboardEvent|null} */ (null));
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentError, setAppointmentError] = useState(false);
  const [eventError, setEventError] = useState(false);

  const loadDashboardCards = useCallback(async (participantId, signal) => {
    setIsLoading(true);
    setAppointmentError(false);
    setEventError(false);
    setAppointment(null);
    setEvent(null);

    const loadAppointment = fetchUpcomingAppointment(participantId)
      .then((nextAppointment) => {
        if (!signal.aborted) {
          setAppointment(nextAppointment);
        }
      })
      .catch((loadError) => {
        console.error('[Dashboard] Failed to load upcoming appointment:', loadError);
        if (!signal.aborted) {
          setAppointment(null);
          setAppointmentError(true);
        }
      });

    const loadEvent = fetchUpcomingEvent(participantId)
      .then((nextEvent) => {
        if (!signal.aborted) {
          setEvent(nextEvent);
        }
      })
      .catch((loadError) => {
        console.error('[Dashboard] Failed to load upcoming event:', loadError);
        if (!signal.aborted) {
          setEvent(null);
          setEventError(true);
        }
      });

    await Promise.all([loadAppointment, loadEvent]);

    if (!signal.aborted) {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const participantId = userId || auth.currentUser?.uid;
    const controller = new AbortController();

    loadDashboardCards(participantId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [userId, refreshToken, loadDashboardCards]);

  return { appointment, event, isLoading, appointmentError, eventError };
}
