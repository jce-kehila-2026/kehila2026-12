import { useEffect, useState } from 'react';
import { subscribeToParticipantNotes } from './participantNotesService';

/** @typedef {import('./participantNotesModel').DashboardNote} DashboardNote */

/**
 * Real-time dashboard notes for the signed-in participant.
 *
 * @param {string|null|undefined} userId
 */
export function useParticipantNotes(userId) {
  const [notes, setNotes] = useState(/** @type {DashboardNote[]} */ ([]));
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!userId) {
      setNotes([]);
      setIsLoading(false);
      setHasError(false);
      return undefined;
    }

    setIsLoading(true);
    setHasError(false);

    const unsubscribe = subscribeToParticipantNotes(
      userId,
      (nextNotes) => {
        setNotes(nextNotes);
        setIsLoading(false);
        setHasError(false);
      },
      () => {
        setNotes([]);
        setIsLoading(false);
        setHasError(true);
      },
    );

    return unsubscribe;
  }, [userId]);

  return { notes, isLoading, hasError };
}
