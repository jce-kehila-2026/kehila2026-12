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
  arrayUnion,
} from 'firebase/firestore';

import { db } from '../../../firebase';
import { isTranslationConfigured, translateFields } from './translationService';

const UPDATES_COL = 'updates';

/**
 * Publish a new announcement.
 * @param {{ title: string, body: string, type: string, targetUids?: string[] }} data
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

  const doc = {
    title,
    body,
    type: data.type,
    createdAt: serverTimestamp(),
    createdBy: adminUser.uid,
    createdByName: adminUser.displayName || adminUser.email || 'Admin',
    active: true,
  };

  // When targetUids is provided, the update is only visible to those users.
  // An empty array or omission means "send to everyone" (no field stored).
  if (Array.isArray(data.targetUids) && data.targetUids.length > 0) {
    doc.targetUids = data.targetUids;
  }

  return addDoc(collection(db, UPDATES_COL), doc);
}

/**
 * Fetch all updates, most recent first.
 * Active filtering is done client-side to avoid a composite index requirement.
 * @param {boolean} onlyActive – if true, filters out archived (active === false) docs
 * @param {string} [forUid] – when supplied, filters out updates whose targetUids
 *   array exists but does not include this user (targeted updates for other people).
 *   Updates without a targetUids field are visible to everyone.
 */
export async function fetchUpdates(onlyActive = true, forUid) {
  const snap = await getDocs(query(collection(db, UPDATES_COL), orderBy('createdAt', 'desc')));
  let all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (onlyActive) all = all.filter((u) => u.active !== false);
  if (forUid) {
    all = all.filter((u) => !u.targetUids || u.targetUids.includes(forUid));
  }
  return all;
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

/** A notification belongs to the "community" tab when it's auto-generated activity. */
function isCommunityItem(update) {
  return update.kind === 'activity';
}

/**
 * Resolve the "last seen" millisecond cutoff that applies to a given item.
 * Community activity and admin announcements track independent cutoffs so that
 * reading one feed never silently marks the other read. Older accounts only
 * have the general cutoff, so community falls back to it for a clean migration.
 *
 * @param {{ general: any, community: any }|any} lastSeen
 */
function seenCutoffMs(update, lastSeen) {
  const general = lastSeen?.general ?? null;
  const community = lastSeen?.community ?? general;
  const cutoff = isCommunityItem(update) ? community : general;
  if (cutoff == null) return null;
  return cutoff.toMillis ? cutoff.toMillis() : Number(cutoff);
}

/**
 * Whether a single notification is still unread for this participant.
 *
 * Read state is tracked per item so clicking one notification clears only that
 * one: community activity carries a `read` flag on its own doc, announcements
 * are tracked by id in `readUpdateIds`. The per-tab timestamp cutoff is the
 * bulk "Mark all read" / migration baseline layered on top.
 *
 * @param {object} update – a notification item
 * @param {{ general: any, community: any }|null} lastSeen – per-tab cutoffs
 * @param {Set<string>} [readIds] – announcement ids already marked read
 */
export function isItemUnread(update, lastSeen, readIds) {
  if (update.active === false) return false;
  if (isCommunityItem(update)) {
    if (update.read === true) return false;
  } else if (readIds?.has?.(update.id)) {
    return false;
  }
  const seenMs = seenCutoffMs(update, lastSeen);
  if (seenMs == null) return true;
  return (update.createdAt?.toMillis?.() ?? 0) > seenMs;
}

/**
 * Calculate the number of unread updates for a participant.
 * Uses client-side filtering against a pre-fetched updates list for zero extra reads.
 *
 * @param {{ general: any, community: any }|null} lastSeen – per-tab cutoffs from getLastSeenAt()
 * @param {Array} updates – already-fetched list from fetchUpdates()
 * @param {string[]} [readUpdateIds] – announcement ids already marked read
 */
export function countUnread(lastSeen, updates, readUpdateIds = []) {
  const readIds = new Set(readUpdateIds);
  return updates.filter((u) => isItemUnread(u, lastSeen, readIds)).length;
}

const ACTIVITY_VERB = {
  comment: 'commented on your post',
  follow: 'started following you',
  like: 'liked your post',
  support: 'supported your post',
};
const ACTIVITY_TITLE = {
  comment: 'New comment',
  follow: 'New follower',
  like: 'New like',
  support: 'New support',
  birthday_wish: 'Birthday wish',
};
const STREAK_NOTIFICATION_TYPES = new Set([
  'streak_reminder',
  'streak_grace',
  'streak_lost',
]);

const makeExcerpt = (text, max = 80) => {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

async function isStaleLikeNotification(data) {
  if (!data.postId || !data.actorId) return false;
  const postSnap = await getDoc(doc(db, 'community_posts', data.postId));
  if (!postSnap.exists()) return true;

  const likedBy = postSnap.data().likedBy;
  return !Array.isArray(likedBy) || !likedBy.includes(data.actorId);
}

async function isStaleCommentNotification(docId, data) {
  if (!data.postId || !data.actorId) return false;

  const postSnap = await getDoc(doc(db, 'community_posts', data.postId));
  if (!postSnap.exists()) return true;

  const deterministicPrefix = `comment-${data.postId}-`;
  if (docId.startsWith(deterministicPrefix)) {
    const commentId = docId.slice(deterministicPrefix.length);
    if (commentId) {
      const commentSnap = await getDoc(doc(db, 'community_posts', data.postId, 'comments', commentId));
      return !commentSnap.exists();
    }
  }

  const commentsSnap = await getDocs(collection(db, 'community_posts', data.postId, 'comments'));
  return !commentsSnap.docs.some((commentDoc) => {
    const comment = commentDoc.data();
    if (comment.authorId !== data.actorId) return false;
    if (!data.commentExcerpt) return true;
    return makeExcerpt(comment.content) === data.commentExcerpt;
  });
}

async function isStaleActivityNotification(docSnap) {
  const data = docSnap.data();
  try {
    if (data.type === 'like') return isStaleLikeNotification(data);
    if (data.type === 'comment') return isStaleCommentNotification(docSnap.id, data);
  } catch {
    return false;
  }

  return false;
}

/**
 * Map a stored activity_notifications doc into the same display shape the
 * NotificationsDropdown uses for admin announcements, so both render in one
 * unified feed.
 */
function activityDocToItem(docSnap) {
  const data = docSnap.data();
  const read = data.read === true;
  if (data.type === 'birthday_wish') {
    return {
      id: docSnap.id,
      kind: 'activity',
      type: data.type,
      title: data.title ?? ACTIVITY_TITLE.birthday_wish,
      body: data.body ?? data.message ?? '',
      postId: data.postId ?? null,
      createdAt: data.createdAt,
      active: true,
      read,
    };
  }

  if (STREAK_NOTIFICATION_TYPES.has(data.type)) {
    return {
      id: docSnap.id,
      kind: 'activity',
      type: data.type,
      title: data.title ?? 'Community streak',
      body: data.body ?? data.message ?? '',
      postId: data.postId ?? null,
      createdAt: data.createdAt,
      active: true,
      read,
    };
  }

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
    postId: data.postId ?? null,
    createdAt: data.createdAt,
    active: true,
    read,
  };
}

/**
 * Fetch the most recent activity notifications for a participant from their
 * own users/{uid}/activity_notifications subcollection. A single capped query —
 * scoped to the user's own data, so reads stay minimal and no index is needed.
 *
 * Staleness pruning (detecting likes/comments that were since removed) costs an
 * extra read per item plus deletes, so it is opt-in via `pruneStale`. Background
 * polling skips it to avoid an N+1 read burst every minute; it runs only when
 * the participant actually opens the bell.
 *
 * @param {string} uid
 * @param {number} [max]
 * @param {{ pruneStale?: boolean }} [options]
 */
export async function fetchActivityNotifications(uid, max = 20, { pruneStale = true } = {}) {
  if (!uid) return [];
  const snap = await getDocs(query(
    collection(db, 'users', uid, 'activity_notifications'),
    orderBy('createdAt', 'desc'),
    limit(max),
  ));

  if (!pruneStale) {
    return snap.docs.map(activityDocToItem);
  }

  const resolvedDocs = await Promise.all(snap.docs.map(async (docSnap) => {
    const stale = await isStaleActivityNotification(docSnap);
    if (stale) {
      deleteDoc(docSnap.ref).catch(() => {});
      return null;
    }
    return docSnap;
  }));

  return resolvedDocs.filter(Boolean).map(activityDocToItem);
}

/**
 * Read the per-tab "last seen" cutoffs from the participant's user document.
 * `general` covers admin announcements; `community` covers activity. Either is
 * null when the user has never marked that feed seen.
 *
 * @returns {Promise<{ general: any, community: any }>}
 */
export async function getLastSeenAt(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return { general: null, community: null, readUpdateIds: [] };
  const data = snap.data();
  return {
    general: data.lastSeenUpdatesAt ?? null,
    community: data.lastSeenCommunityAt ?? null,
    readUpdateIds: Array.isArray(data.readUpdateIds) ? data.readUpdateIds : [],
  };
}

/**
 * Stamp the participant's user document with the current server time,
 * marking every update across both tabs as "seen".
 */
export async function markAllAsRead(uid) {
  return updateDoc(doc(db, 'users', uid), {
    lastSeenUpdatesAt: serverTimestamp(),
    lastSeenCommunityAt: serverTimestamp(),
  });
}

/**
 * Mark a single community activity notification read, by flipping a `read` flag
 * on its own doc — so clicking one notification clears only that one.
 */
export async function markActivityNotificationRead(uid, notificationId) {
  if (!uid || !notificationId) return null;
  return updateDoc(doc(db, 'users', uid, 'activity_notifications', notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });
}

/**
 * Mark a single admin announcement read. Announcements live in an admin-write
 * collection, so per-user read state is tracked as an id list on the user doc.
 */
export async function markUpdateRead(uid, updateId) {
  if (!uid || !updateId) return null;
  return updateDoc(doc(db, 'users', uid), {
    readUpdateIds: arrayUnion(updateId),
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
      participants.push({ uid: d.id, name, email });
    }
  }
  participants.sort((a, b) => a.name.localeCompare(b.name));
  return participants;
}
