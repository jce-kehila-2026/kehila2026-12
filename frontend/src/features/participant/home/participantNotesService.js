import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../../../firebase';

/** @typedef {import('./participantNotesModel').DashboardNote} DashboardNote */

const USERS_COLLECTION = 'users';
const NOTES_SUBCOLLECTION = 'dashboard_notes';

function resolveParticipantId(userId) {
  // Firestore rules require request.auth.uid == path uid — always prefer the signed-in user.
  return auth.currentUser?.uid || userId || null;
}

/**
 * @param {import('firebase/firestore').DocumentSnapshot} docSnap
 * @returns {DashboardNote}
 */
export function mapDashboardNoteDoc(docSnap) {
  const data = docSnap.data() || {};

  return {
    id: docSnap.id,
    title: String(data.title ?? '').trim(),
    date: String(data.date ?? data.dateKey ?? '').trim(),
    time: String(data.time ?? data.startTime ?? '').trim(),
    done: Boolean(data.done),
    syncToCalendar: Boolean(data.syncToCalendar),
  };
}

/**
 * Live listener for a participant's dashboard notes (createdAt DESC).
 *
 * @param {string|null|undefined} userId
 * @param {(notes: DashboardNote[]) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {import('firebase/firestore').Unsubscribe|undefined}
 */
export function subscribeToParticipantNotes(userId, onUpdate, onError) {
  const participantId = resolveParticipantId(userId);
  if (!participantId) {
    onUpdate([]);
    return undefined;
  }

  const notesQuery = query(
    collection(db, USERS_COLLECTION, participantId, NOTES_SUBCOLLECTION),
    orderBy('createdAt', 'desc'),
    limit(50),
  );

  return onSnapshot(
    notesQuery,
    (snapshot) => {
      const notes = snapshot.docs.map(mapDashboardNoteDoc).filter((note) => note.title);
      onUpdate(notes);
    },
    (error) => {
      console.error('[Dashboard notes] Listener failed:', error);
      onError?.(error);
      onUpdate([]);
    },
  );
}

/**
 * @param {string|null|undefined} userId
 * @param {Omit<DashboardNote, 'id'>} note
 * @returns {Promise<string>}
 */
export async function createParticipantNote(userId, note) {
  const participantId = resolveParticipantId(userId);
  if (!participantId) {
    throw new Error('Cannot save note: participant is not signed in.');
  }

  const payload = {
    title: String(note.title ?? '').trim(),
    date: String(note.date ?? '').trim(),
    time: String(note.time ?? '').trim(),
    done: Boolean(note.done),
    syncToCalendar: Boolean(note.syncToCalendar),
    participantId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const notesRef = collection(db, USERS_COLLECTION, participantId, NOTES_SUBCOLLECTION);

  try {
    const ref = await addDoc(notesRef, payload);
    return ref.id;
  } catch (error) {
    console.error('[Dashboard notes] createParticipantNote failed:', {
      code: error?.code,
      message: error?.message,
      path: `${USERS_COLLECTION}/${participantId}/${NOTES_SUBCOLLECTION}`,
      authUid: auth.currentUser?.uid,
      participantId,
    });
    throw error;
  }
}

/**
 * @param {string|null|undefined} userId
 * @param {string} noteId
 * @param {Partial<DashboardNote>} patch
 */
export async function updateParticipantNote(userId, noteId, patch) {
  const participantId = resolveParticipantId(userId);
  if (!participantId || !noteId) {
    throw new Error('Cannot update note: missing participant or note id.');
  }

  const payload = {
    updatedAt: serverTimestamp(),
  };

  if (patch.title !== undefined) payload.title = String(patch.title).trim();
  if (patch.date !== undefined) payload.date = String(patch.date).trim();
  if (patch.time !== undefined) payload.time = String(patch.time).trim();
  if (patch.done !== undefined) payload.done = Boolean(patch.done);
  if (patch.syncToCalendar !== undefined) payload.syncToCalendar = Boolean(patch.syncToCalendar);

  await updateDoc(
    doc(db, USERS_COLLECTION, participantId, NOTES_SUBCOLLECTION, noteId),
    payload,
  );
}
