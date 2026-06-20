import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../../../../firebase';
import { formatRelativeCommunityTime } from '../utils/communityDateUtils';
import { isCommunityContentVisible } from '../utils/communityModerationUtils';
import { translateFields, isTranslationConfigured } from '../../../admin/services/translationService';

// Best-effort Azure translation of participant-authored text. Returns a
// `{ content: { he, en, ar } }` map to co-locate on the doc, or null when
// translation is unconfigured/empty/failed — saves must never block on it.
async function buildContentTranslations(content) {
  if (!isTranslationConfigured() || !content || !String(content).trim()) {
    return null;
  }
  try {
    const out = await translateFields({ content }, ['content']);
    return out && out.content ? out : null;
  } catch {
    return null;
  }
}

const POSTS_COL = 'community_posts';
const USERS_COL = 'users';
// Community-visible display data only (name + birthday). Mirrored from
// users/{uid} so it can be read by any signed-in member without exposing the
// contact PII stored in users/{uid}.
const PUBLIC_PROFILES_COL = 'public_profiles';
const ACTIVITY_NOTIFICATIONS_COL = 'activity_notifications';

// The subset of community-profile fields that are safe to expose to other
// signed-in members and that the birthday widget needs.
const PUBLIC_PROFILE_FIELDS = [
  'communityDisplayName',
  'communityBirthday',
  'showBirthdayInCommunity',
];

const makeExcerpt = (text, max = 80) => {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
};

function buildActivityNotificationWrite({
  recipientId,
  actorId,
  actorName,
  type,
  postId,
  notificationKey,
  postExcerpt = '',
  commentExcerpt = '',
  title,
  body,
} = {}) {
  // The security rule requires actorId == request.auth.uid, so always attribute
  // to the authenticated user rather than the (possibly unresolved) community id.
  const resolvedActorId = auth.currentUser?.uid ?? actorId;
  if (!recipientId || !resolvedActorId || recipientId === resolvedActorId || !notificationKey) return null;

  return {
    ref: doc(db, USERS_COL, recipientId, ACTIVITY_NOTIFICATIONS_COL, notificationKey),
    data: {
      recipientId,
      actorId: resolvedActorId,
      actorName: actorName || 'Someone',
      type,
      postId: postId ?? null,
      postExcerpt,
      commentExcerpt,
      ...(title ? { title } : {}),
      ...(body ? { body } : {}),
      createdAt: serverTimestamp(),
    },
  };
}

/**
 * Best-effort: write an activity notification into the recipient's
 * users/{recipientId}/activity_notifications subcollection. Fire-and-forget —
 * it never throws into the caller, so engagement actions still succeed even if
 * the notification write is denied or fails. Skips self-notifications.
 */
async function createActivityNotification({
  recipientId,
  actorId,
  actorName,
  type,
  postId,
  notificationKey,
  postExcerpt = '',
  commentExcerpt = '',
  title,
  body,
} = {}) {
  const notificationWrite = buildActivityNotificationWrite({
    recipientId,
    actorId,
    actorName,
    type,
    postId,
    notificationKey: notificationKey || `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    postExcerpt,
    commentExcerpt,
    title,
    body,
  });
  if (!notificationWrite) return;

  try {
    await setDoc(notificationWrite.ref, notificationWrite.data, { merge: false });
  } catch {
    // Notifications are non-critical; swallow errors.
  }
}

const tsToDate = (ts) => {
  if (!ts) return new Date();
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date();
};

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'CU';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const mapFirestoreCommunityPost = (docSnap) => {
  const data = docSnap.data();
  const isAnon = Boolean(data.isAnonymous);
  const displayName = isAnon ? 'Anonymous User' : (data.authorDisplayName ?? 'Unknown');
  const createdAt = tsToDate(data.createdAt);
  const updatedAt = tsToDate(data.updatedAt);
  const attachment = data.attachment ?? null;
  const imageUrl = data.imageUrl ?? data.postImageUrl ?? '';

  return {
    id: docSnap.id,
    authorId: data.authorId ?? null,
    author: displayName,
    authorDisplayName: displayName,
    authorAvatarUrl: data.authorAvatarUrl ?? '',
    attachment,
    imageUrl,
    isAnonymous: isAnon,
    content: data.content ?? '',
    translations: data.translations ?? null,
    title: data.title ?? null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    likesCount: data.likesCount ?? 0,
    likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
    isLiked: false,
    supportCount: data.supportCount ?? 0,
    supportedBy: Array.isArray(data.supportedBy) ? data.supportedBy : [],
    isSupported: false,
    commentsCount: data.commentsCount ?? 0,
    status: data.status ?? 'active',
    reportsCount: data.reportsCount ?? 0,
    reportedBy: Array.isArray(data.reportedBy) ? data.reportedBy : [],
    reports: Array.isArray(data.reports) ? data.reports : [],
    hiddenByAdmin: Boolean(data.hiddenByAdmin),
    tone: data.tone ?? 'pink',
    body: data.content ?? '',
    likes: data.likesCount ?? 0,
    support: data.supportCount ?? 0,
    initials: isAnon ? 'AU' : getInitials(displayName),
    time: formatRelativeCommunityTime(createdAt),
    topic: 'Community share',
    previewComments: [],
    comments: [],
  };
};

const firestoreCommentToLocal = (docSnap, postId) => {
  const data = docSnap.data();
  const createdAt = tsToDate(data.createdAt);

  return {
    id: docSnap.id,
    postId,
    authorId: data.authorId ?? null,
    userId: data.authorId ?? null,
    author: data.authorDisplayName ?? 'Unknown',
    authorDisplayName: data.authorDisplayName ?? 'Unknown',
    content: data.content ?? '',
    text: data.content ?? '',
    translations: data.translations ?? null,
    createdAt: createdAt.toISOString(),
    updatedAt: tsToDate(data.updatedAt).toISOString(),
    status: data.status ?? 'active',
    reportsCount: data.reportsCount ?? 0,
    reportedBy: Array.isArray(data.reportedBy) ? data.reportedBy : [],
    hiddenByAdmin: Boolean(data.hiddenByAdmin),
    initials: getInitials(data.authorDisplayName),
    isLocalCurrentUser: false,
    time: formatRelativeCommunityTime(createdAt),
  };
};

// ── Posts ────────────────────────────────────────────────────────────────────

export async function getCommunityPosts(lastDoc = null, pageSize = 20) {
  const colRef = collection(db, POSTS_COL);
  const q = lastDoc
    ? query(colRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize))
    : query(colRef, orderBy('createdAt', 'desc'), limit(pageSize));

  const snapshot = await getDocs(q);
  const postsWithoutComments = snapshot.docs
    .map(mapFirestoreCommunityPost)
    .filter(isCommunityContentVisible);
  const posts = await Promise.all(postsWithoutComments.map(async (post) => {
    if (!post.commentsCount) return post;

    try {
      const comments = await getPostComments(post.id, 2);
      return {
        ...post,
        previewComments: comments,
        comments,
      };
    } catch {
      return post;
    }
  }));
  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;

  return { posts, lastDoc: newLastDoc };
}

/**
 * Live listener for the newest visible community post (createdAt DESC).
 * Reuses the same collection + mapper as the Community feed.
 *
 * @param {(post: ReturnType<typeof mapFirestoreCommunityPost>|null) => void} onUpdate
 * @param {(error: Error) => void} [onError]
 * @returns {import('firebase/firestore').Unsubscribe}
 */
export function subscribeToLatestCommunityPost(onUpdate, onError) {
  const q = query(
    collection(db, POSTS_COL),
    orderBy('createdAt', 'desc'),
    limit(10),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const latestPost = snapshot.docs
        .map(mapFirestoreCommunityPost)
        .filter(isCommunityContentVisible)[0] ?? null;

      onUpdate(latestPost);
    },
    (error) => {
      console.error('[Community] Latest post listener failed:', error);
      onError?.(error);
      onUpdate(null);
    },
  );
}

export async function createCommunityPost({
  authorId,
  authorDisplayName,
  author,
  content,
  isAnonymous,
  tone = 'pink',
} = {}) {
  const displayName = isAnonymous
    ? 'Anonymous User'
    : (authorDisplayName || author || 'Current User');

  // Fall back to auth.currentUser.uid so the Firestore rule (authorId == auth.uid) always passes,
  // even when localUserId hasn't resolved from personalDetails yet.
  const resolvedAuthorId = (authorId && authorId !== 'current-user')
    ? authorId
    : (auth.currentUser?.uid ?? null);

  const translations = await buildContentTranslations(content);

  const postData = {
    authorId: resolvedAuthorId,
    authorDisplayName: displayName,
    authorAvatarUrl: '',
    isAnonymous: Boolean(isAnonymous),
    content: content ?? '',
    ...(translations ? { translations } : {}),
    title: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likesCount: 0,
    likedBy: [],
    supportCount: 0,
    supportedBy: [],
    commentsCount: 0,
    status: 'active',
    reportsCount: 0,
    reportedBy: [],
    reports: [],
    hiddenByAdmin: false,
    tone,
  };

  const docRef = await addDoc(collection(db, POSTS_COL), postData);
  const now = new Date();

  return {
    id: docRef.id,
    authorId: resolvedAuthorId,
    author: displayName,
    authorDisplayName: displayName,
    authorAvatarUrl: '',
    isAnonymous: Boolean(isAnonymous),
    content: content ?? '',
    translations: translations ?? null,
    title: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    likesCount: 0,
    likedBy: [],
    isLiked: false,
    supportCount: 0,
    supportedBy: [],
    isSupported: false,
    commentsCount: 0,
    status: 'active',
    reportsCount: 0,
    reportedBy: [],
    reports: [],
    hiddenByAdmin: false,
    tone,
    body: content ?? '',
    likes: 0,
    support: 0,
    initials: isAnonymous ? 'AU' : getInitials(displayName),
    time: formatRelativeCommunityTime(now),
    topic: 'Community share',
    previewComments: [],
    comments: [],
  };
}

export async function updateCommunityPost(postId, { content } = {}) {
  const translations = await buildContentTranslations(content);
  await updateDoc(doc(db, POSTS_COL, postId), {
    content,
    ...(translations ? { translations } : {}),
    updatedAt: serverTimestamp(),
  });
  return { success: true, postId };
}

export async function deleteCommunityPost(postId) {
  const postRef = doc(db, POSTS_COL, postId);
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) return { success: false, postId };

  const postData = postSnap.data();
  const batch = writeBatch(db);

  batch.update(postRef, {
    status: 'deleted',
    updatedAt: serverTimestamp(),
  });

  if (postData.authorId) {
    const notificationsSnap = await getDocs(query(
      collection(db, USERS_COL, postData.authorId, ACTIVITY_NOTIFICATIONS_COL),
      where('postId', '==', postId),
    ));

    notificationsSnap.docs.forEach((notificationDoc) => {
      batch.delete(notificationDoc.ref);
    });
  }

  await batch.commit();

  return { success: true, postId };
}

// ── Likes & Support ──────────────────────────────────────────────────────────

export async function toggleCommunityPostLike(postId, userId, { actorName } = {}) {
  const postRef = doc(db, POSTS_COL, postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) return { success: false };

  const postData = snap.data();
  const likedBy = postData.likedBy ?? [];
  const isCurrentlyLiked = likedBy.includes(userId);
  const notificationKey = userId ? `like-${postId}-${userId}` : '';

  const batch = writeBatch(db);
  batch.update(postRef, {
    likedBy: isCurrentlyLiked ? arrayRemove(userId) : arrayUnion(userId),
    likesCount: increment(isCurrentlyLiked ? -1 : 1),
  });

  if (!isCurrentlyLiked) {
    const notificationWrite = buildActivityNotificationWrite({
      recipientId: postData.authorId,
      actorId: userId,
      actorName,
      type: 'like',
      postId,
      notificationKey,
      postExcerpt: makeExcerpt(postData.content),
    });
    if (notificationWrite) {
      batch.set(notificationWrite.ref, notificationWrite.data);
    }
  } else {
    batch.delete(doc(db, USERS_COL, postData.authorId, ACTIVITY_NOTIFICATIONS_COL, notificationKey));
  }

  await batch.commit();

  return { success: true, postId, userId, liked: !isCurrentlyLiked };
}

export async function toggleCommunityPostSupport(postId, userId, { actorName } = {}) {
  const postRef = doc(db, POSTS_COL, postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) return { success: false };

  const postData = snap.data();
  const supportedBy = postData.supportedBy ?? [];
  const isCurrentlySupported = supportedBy.includes(userId);

  await updateDoc(postRef, {
    supportedBy: isCurrentlySupported ? arrayRemove(userId) : arrayUnion(userId),
    supportCount: increment(isCurrentlySupported ? -1 : 1),
  });

  // Notify the post owner only when newly supporting (not when removing support).
  if (!isCurrentlySupported) {
    createActivityNotification({
      recipientId: postData.authorId,
      actorId: userId,
      actorName,
      type: 'support',
      postId,
      postExcerpt: makeExcerpt(postData.content),
    });
  }

  return { success: true, postId, userId, supported: !isCurrentlySupported };
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function createCommunityComment(postId, {
  authorId,
  authorDisplayName,
  author,
  content,
  postAuthorId,
  postExcerpt = '',
} = {}) {
  const displayName = authorDisplayName || author || 'Current User';
  const resolvedAuthorId = (authorId && authorId !== 'current-user')
    ? authorId
    : (auth.currentUser?.uid ?? null);
  const translations = await buildContentTranslations(content);
  const batch = writeBatch(db);

  const commentsRef = collection(db, POSTS_COL, postId, 'comments');
  const commentRef = doc(commentsRef);

  batch.set(commentRef, {
    authorId: resolvedAuthorId,
    authorDisplayName: displayName,
    content: content ?? '',
    ...(translations ? { translations } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'active',
    reportsCount: 0,
    reportedBy: [],
    hiddenByAdmin: false,
  });

  batch.update(doc(db, POSTS_COL, postId), {
    commentsCount: increment(1),
  });

  const notificationWrite = buildActivityNotificationWrite({
    recipientId: postAuthorId,
    actorId: resolvedAuthorId,
    actorName: displayName,
    type: 'comment',
    postId,
    notificationKey: `comment-${postId}-${commentRef.id}`,
    postExcerpt,
    commentExcerpt: makeExcerpt(content),
  });
  if (notificationWrite) {
    batch.set(notificationWrite.ref, notificationWrite.data);
  }

  await batch.commit();

  const now = new Date();
  return {
    id: commentRef.id,
    postId,
    authorId: resolvedAuthorId,
    userId: resolvedAuthorId,
    author: displayName,
    authorDisplayName: displayName,
    content: content ?? '',
    text: content ?? '',
    translations: translations ?? null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: 'active',
    reportsCount: 0,
    reportedBy: [],
    hiddenByAdmin: false,
    initials: getInitials(displayName),
    isLocalCurrentUser: true,
    time: formatRelativeCommunityTime(now),
  };
}

export async function addCommunityPostComment(postId, commentData = {}) {
  return createCommunityComment(postId, commentData);
}

export async function deleteCommunityComment(postId, commentId) {
  const postRef = doc(db, POSTS_COL, postId);
  const commentRef = doc(db, POSTS_COL, postId, 'comments', commentId);
  const [postSnap, commentSnap] = await Promise.all([
    getDoc(postRef),
    getDoc(commentRef),
  ]);
  if (!postSnap.exists() || !commentSnap.exists()) {
    return { success: false, postId, commentId };
  }

  const postAuthorId = postSnap.exists() ? postSnap.data().authorId : null;
  const commentAuthorId = commentSnap.exists() ? commentSnap.data().authorId : null;
  const batch = writeBatch(db);

  batch.delete(commentRef);
  batch.update(postRef, {
    commentsCount: increment(-1),
  });

  if (postAuthorId && commentAuthorId && postAuthorId !== commentAuthorId) {
    batch.delete(doc(
      db,
      USERS_COL,
      postAuthorId,
      ACTIVITY_NOTIFICATIONS_COL,
      `comment-${postId}-${commentId}`,
    ));
  }

  await batch.commit();

  return { success: true, postId, commentId };
}

export async function getPostComments(postId, limitCount = 50) {
  const q = query(
    collection(db, POSTS_COL, postId, 'comments'),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => firestoreCommentToLocal(docSnap, postId));
}

// ── Reports ──────────────────────────────────────────────────────────────────

export async function reportCommunityPost(postId, reportData = {}) {
  const reporterUserId = typeof reportData === 'string'
    ? reportData
    : (reportData.reporterUserId ?? reportData.userId ?? null);
  const reason = typeof reportData === 'string' ? '' : (reportData.reason ?? '');
  const postOwnerId = typeof reportData === 'string' ? null : (reportData.postOwnerId ?? null);
  const createdAt = reportData.createdAt ?? new Date().toISOString();
  const reportId = reportData.id ?? `report-${postId}-${reporterUserId}-${Date.now()}`;

  const reportRecord = {
    id: reportId,
    postId,
    reporterUserId,
    postOwnerId,
    reason,
    createdAt,
  };

  await updateDoc(doc(db, POSTS_COL, postId), {
    reportedBy: arrayUnion(reporterUserId),
    reportsCount: increment(1),
    reports: arrayUnion(reportRecord),
    status: 'reported',
  });

  return { success: true, postId, reporterUserId, reason, postOwnerId, createdAt };
}

// ── Community Profile (users/{uid}) ──────────────────────────────────────────

export async function getCommunityProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, USERS_COL, uid));
  if (!snap.exists()) return null;

  const data = snap.data();
  const hasBirthdayVisibilityPreference = Object.prototype.hasOwnProperty.call(
    data,
    'showBirthdayInCommunity'
  );

  return {
    communityDisplayName: data.communityDisplayName ?? '',
    communityBirthday: data.communityBirthday ?? '',
    showBirthdayInCommunity: Boolean(data.showBirthdayInCommunity),
    allowAnonymousPosting: data.allowAnonymousPosting !== false,
    communityProfileCompleted: Boolean(data.communityProfileCompleted),
    communityBirthdayPreferenceCompleted: Boolean(
      data.communityBirthdayPreferenceCompleted
      || data.communityProfileCompleted
      || hasBirthdayVisibilityPreference
    ),
    communityJoinedAt: data.communityJoinedAt ? tsToDate(data.communityJoinedAt) : new Date(),
    communityFollowedAuthors: Array.isArray(data.communityFollowedAuthors)
      ? data.communityFollowedAuthors
      : [],
    communityGuidelinesAcceptedVersion: data.communityGuidelinesAcceptedVersion ?? null,
  };
}

export async function updateCommunityProfile(uid, profileData = {}) {
  if (!uid) return;
  await setDoc(doc(db, USERS_COL, uid), profileData, { merge: true });

  // Mirror only the community-visible display fields to public_profiles/{uid}
  // (readable by any signed-in member) so the birthday widget and name display
  // work without exposing contact PII held in users/{uid}.
  const publicPatch = {};
  for (const field of PUBLIC_PROFILE_FIELDS) {
    if (field in profileData) publicPatch[field] = profileData[field];
  }
  if (Object.keys(publicPatch).length > 0) {
    publicPatch.updatedAt = serverTimestamp();
    await setDoc(doc(db, PUBLIC_PROFILES_COL, uid), publicPatch, { merge: true });
  }

  return { success: true };
}

// ── Streak (users/{uid}) ──────────────────────────────────────────────────────

export async function getCommunityStreak(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, USERS_COL, uid));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    communityStreakCount: data.communityStreakCount ?? 0,
    communityLastActivityDate: data.communityLastActivityDate ?? null,
    communityStreakReminderDate: data.communityStreakReminderDate ?? null,
    communityStreakGraceDate: data.communityStreakGraceDate ?? null,
    communityStreakLostDate: data.communityStreakLostDate ?? null,
  };
}

export async function updateCommunityStreak(uid, streakData = {}) {
  if (!uid) return;
  await setDoc(doc(db, USERS_COL, uid), streakData, { merge: true });
}

export async function createCommunityStreakNotification(uid, {
  notificationKey,
  type,
  title,
  body,
} = {}) {
  const resolvedActorId = auth.currentUser?.uid ?? uid;
  if (!uid || !notificationKey || !type || !title || !body || resolvedActorId !== uid) return;

  await setDoc(doc(db, USERS_COL, uid, ACTIVITY_NOTIFICATIONS_COL, notificationKey), {
    recipientId: uid,
    actorId: uid,
    actorName: 'Community streak',
    type,
    title,
    body,
    createdAt: serverTimestamp(),
  }, { merge: false });
}

// ── Follows (users/{uid}) ─────────────────────────────────────────────────────

export async function getFollowedAuthors(uid) {
  if (!uid) return [];
  const snap = await getDoc(doc(db, USERS_COL, uid));
  if (!snap.exists()) return [];

  const data = snap.data();
  return Array.isArray(data.communityFollowedAuthors) ? data.communityFollowedAuthors : [];
}

export async function followCommunityAuthor(uid, authorUid, { actorName } = {}) {
  if (!uid || !authorUid) return;
  await updateDoc(doc(db, USERS_COL, uid), {
    communityFollowedAuthors: arrayUnion(authorUid),
  });

  createActivityNotification({
    recipientId: authorUid,
    actorId: uid,
    actorName,
    type: 'follow',
  });
}

export async function unfollowCommunityAuthor(uid, authorUid) {
  if (!uid || !authorUid) return;
  await updateDoc(doc(db, USERS_COL, uid), {
    communityFollowedAuthors: arrayRemove(authorUid),
  });
}

// ── Birthdays ─────────────────────────────────────────────────────────────────

export async function getTodayCommunityBirthdays() {
  const today = new Date();
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const dayStr = String(today.getDate()).padStart(2, '0');
  const todaySuffix = `-${monthStr}-${dayStr}`;

  const q = query(
    collection(db, PUBLIC_PROFILES_COL),
    where('showBirthdayInCommunity', '==', true),
    limit(50),
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((user) => {
      const birthday = user.communityBirthday;
      return typeof birthday === 'string' && birthday.endsWith(todaySuffix);
    })
    .map((user) => ({
      id: user.id,
      name: user.communityDisplayName || 'Community Member',
      birthday: user.communityBirthday,
    }));
}

export async function sendBirthdayWish({
  recipientId,
  senderId,
  senderName,
  message,
} = {}) {
  const resolvedSenderId = auth.currentUser?.uid ?? senderId;
  if (!recipientId || !resolvedSenderId || !message) {
    throw new Error('Missing birthday wish details.');
  }

  if (recipientId === resolvedSenderId) {
    throw new Error('Birthday wishes cannot be sent to yourself.');
  }

  await addDoc(collection(db, USERS_COL, recipientId, ACTIVITY_NOTIFICATIONS_COL), {
    recipientId,
    actorId: resolvedSenderId,
    actorName: senderName || 'Someone',
    type: 'birthday_wish',
    title: 'Birthday wish',
    body: `${senderName || 'Someone'} sent you a birthday wish: "${message}"`,
    createdAt: serverTimestamp(),
  });

  return { success: true, recipientId, senderId: resolvedSenderId, message };
}

// ── Guidelines ────────────────────────────────────────────────────────────────

export async function getCommunityGuidelinesAccepted(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, USERS_COL, uid));
  if (!snap.exists()) return null;
  return snap.data().communityGuidelinesAcceptedVersion ?? null;
}

export async function saveCommunityGuidelinesAccepted(uid, version) {
  if (!uid) return;
  await setDoc(doc(db, USERS_COL, uid), {
    communityGuidelinesAcceptedVersion: version,
  }, { merge: true });
}

// ── Community Settings ────────────────────────────────────────────────────────

export async function getCommunitySettingsGuidelines() {
  const snap = await getDoc(doc(db, 'community_settings', 'guidelines'));
  if (!snap.exists()) return null;
  return snap.data();
}
