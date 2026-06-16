import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../../../firebase';
import { isTranslationConfigured, translateFields } from './translationService';

const UPDATES_COL = 'updates';

/**
 * Publish a new announcement.
 * @param {{ title: string, body: string, type: string }} data
 * @param {{ uid: string, displayName: string }} adminUser
 */
export async function createUpdate(data, adminUser) {
  // Translate title/body to { he, en, ar } once, at save time. If translation
  // is unavailable, fall back to storing the original strings — localizeField
  // on the read side handles both shapes, so announcements still publish.
  let title = data.title;
  let body = data.body;
  if (isTranslationConfigured()) {
    try {
      const translated = await translateFields(
        { title: data.title, body: data.body },
        ['title', 'body'],
      );
      if (translated.title) title = translated.title;
      if (translated.body) body = translated.body;
    } catch (err) {
      console.error('Announcement translation failed; saving original text only:', err);
    }
  }

  return addDoc(collection(db, UPDATES_COL), {
    title,
    body,
    type: data.type,
    createdAt: serverTimestamp(),
    createdBy: adminUser.uid,
    createdByName: adminUser.displayName || adminUser.email || 'Admin',
    active: true,
  });
}

/**
 * Fetch all updates, most recent first.
 * Active filtering is done client-side to avoid a composite index requirement.
 * @param {boolean} onlyActive – if true, filters out archived (active === false) docs
 */
export async function fetchUpdates(onlyActive = true) {
  const snap = await getDocs(query(collection(db, UPDATES_COL), orderBy('createdAt', 'desc')));
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return onlyActive ? all.filter((u) => u.active !== false) : all;
}

/**
 * Soft-delete (archive) an update by setting active = false.
 */
export async function archiveUpdate(updateId) {
  return updateDoc(doc(db, UPDATES_COL, updateId), { active: false });
}

/**
 * Hard-delete an update document.
 */
export async function deleteUpdate(updateId) {
  return deleteDoc(doc(db, UPDATES_COL, updateId));
}

/**
 * Calculate the number of unread updates for a participant.
 * Uses client-side filtering against a pre-fetched updates list for zero extra reads.
 *
 * @param {import('firebase/firestore').Timestamp|null} lastSeenAt
 * @param {Array} updates – already-fetched list from fetchUpdates()
 */
export function countUnread(lastSeenAt, updates) {
  if (!lastSeenAt) return updates.filter((u) => u.active !== false).length;
  const seenMs = lastSeenAt.toMillis ? lastSeenAt.toMillis() : lastSeenAt;
  return updates.filter((u) => u.active !== false && u.createdAt?.toMillis?.() > seenMs).length;
}

const ACTIVITY_VERB = {
  comment: 'commented on your post',
  like: 'liked your post',
  support: 'supported your post',
};
const ACTIVITY_TITLE = {
  comment: 'New comment',
  like: 'New like',
  support: 'New support',
};

/**
 * Map a stored activity_notifications doc into the same display shape the
 * NotificationsDropdown uses for admin announcements, so both render in one
 * unified feed.
 */
function activityDocToItem(docSnap) {
  const data = docSnap.data();
  const actor = data.actorName || 'Someone';
  let body = `${actor} ${ACTIVITY_VERB[data.type] ?? 'interacted with your post'}`;
  if (data.type === 'comment' && data.commentExcerpt) {
    body += `: "${data.commentExcerpt}"`;
  } else if (data.postExcerpt) {
    body += `: "${data.postExcerpt}"`;
  }
  return {
    id: docSnap.id,
    kind: 'activity',
    type: data.type,
    title: ACTIVITY_TITLE[data.type] ?? 'New activity',
    body,
    createdAt: data.createdAt,
    active: true,
  };
}

/**
 * Fetch the most recent activity notifications for a participant from their
 * own users/{uid}/activity_notifications subcollection. A single capped query —
 * scoped to the user's own data, so reads stay minimal and no index is needed.
 */
export async function fetchActivityNotifications(uid, max = 20) {
  if (!uid) return [];
  const snap = await getDocs(query(
    collection(db, 'users', uid, 'activity_notifications'),
    orderBy('createdAt', 'desc'),
    limit(max),
  ));
  return snap.docs.map(activityDocToItem);
}

/**
 * Read the lastSeenUpdatesAt timestamp from the participant's user document.
 * Returns null if the field doesn't exist yet.
 */
export async function getLastSeenAt(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data().lastSeenUpdatesAt ?? null) : null;
}

/**
 * Stamp the participant's user document with the current server time,
 * marking all current updates as "seen".
 */
export async function markAllAsRead(uid) {
  return updateDoc(doc(db, 'users', uid), {
    lastSeenUpdatesAt: serverTimestamp(),
  });
}

/**
 * Fetch email addresses for all users with role === 'participant'.
 * Filtered client-side to avoid a composite index on (role, email).
 * Returns a deduplicated array of non-empty email strings.
 */
export async function fetchParticipantEmails() {
  const snap = await getDocs(collection(db, 'users'));
  const seen = new Set();
  const emails = [];
  for (const d of snap.docs) {
    const { role, email } = d.data();
    if (role === 'participant' && email && !seen.has(email)) {
      seen.add(email);
      emails.push(email);
    }
  }
  return emails;
}

/**
 * Fetch the participant recipients an admin can pick from when sending an
 * update by email. Like fetchParticipantEmails but keeps a display name
 * alongside each address so the admin can recognise who they're sending to.
 * Filtered client-side to avoid a composite index, deduplicated by email,
 * and sorted by name for a tidy list.
 *
 * @returns {Promise<Array<{ name: string, email: string }>>}
 */
export async function fetchParticipants() {
  const snap = await getDocs(collection(db, 'users'));
  const seen = new Set();
  const participants = [];
  for (const d of snap.docs) {
    const data = d.data();
    const { role, email } = data;
    if (role === 'participant' && email && !seen.has(email)) {
      seen.add(email);
      const name =
        data.displayName ||
        data.fullName ||
        [data.firstName, data.lastName].filter(Boolean).join(' ').trim() ||
        data.name ||
        email;
      participants.push({ name, email });
    }
  }
  participants.sort((a, b) => a.name.localeCompare(b.name));
  return participants;
}
