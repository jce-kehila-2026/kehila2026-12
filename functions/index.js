import admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

admin.initializeApp();

const db = admin.firestore();
const USERS_COL = 'users';
const ACTIVITY_NOTIFICATIONS_COL = 'activity_notifications';
const STREAK_TIME_ZONE = 'Asia/Hebron';

function getDateKeyInTimeZone(date = new Date(), timeZone = STREAK_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getDateKeyTimestamp(dateKey) {
  if (typeof dateKey !== 'string') return null;

  const parts = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return null;

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year
    || parsedDate.getUTCMonth() !== month - 1
    || parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return parsedDate.getTime();
}

function getDayDifference(previousDateKey, currentDateKey) {
  const previousTimestamp = getDateKeyTimestamp(previousDateKey);
  const currentTimestamp = getDateKeyTimestamp(currentDateKey);

  if (previousTimestamp === null || currentTimestamp === null) return null;

  return Math.round((currentTimestamp - previousTimestamp) / (24 * 60 * 60 * 1000));
}

function getStreakNotification(type, streakCount) {
  if (type === 'streak_reminder') {
    return {
      title: 'Community streak reminder',
      body: `Heads up: you have not interacted in the community today. Interact before the day ends to keep your ${streakCount}-day streak.`,
    };
  }

  if (type === 'streak_grace') {
    return {
      title: 'Community streak at risk',
      body: `You still have until the end of today to interact in the community and keep your ${streakCount}-day streak.`,
    };
  }

  return {
    title: 'Community streak lost',
    body: 'Unfortunately, you lost your community streak. Interact in the community to start a new one.',
  };
}

function createStreakNotificationWrite(batch, userRef, uid, type, todayKey, streakCount) {
  const { title, body } = getStreakNotification(type, streakCount);
  const notificationRef = userRef
    .collection(ACTIVITY_NOTIFICATIONS_COL)
    .doc(`${type}-${todayKey}`);

  batch.set(notificationRef, {
    recipientId: uid,
    actorId: uid,
    actorName: 'Community streak',
    type,
    title,
    body,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: false });
}

async function fetchUsersWithActiveStreaks() {
  const snap = await db.collection(USERS_COL).get();

  return snap.docs.filter((docSnap) => {
    const data = docSnap.data();
    return (data.communityStreakCount ?? 0) > 0 && Boolean(data.communityLastActivityDate);
  });
}

async function processStreakReminderRun() {
  const todayKey = getDateKeyInTimeZone();
  const userDocs = await fetchUsersWithActiveStreaks();
  let createdCount = 0;

  for (const userDoc of userDocs) {
    const data = userDoc.data();
    const dayDifference = getDayDifference(data.communityLastActivityDate, todayKey);

    if (dayDifference !== 1 || data.communityStreakReminderDate === todayKey) continue;

    const batch = db.batch();
    createStreakNotificationWrite(
      batch,
      userDoc.ref,
      userDoc.id,
      'streak_reminder',
      todayKey,
      data.communityStreakCount ?? 0
    );
    batch.set(userDoc.ref, { communityStreakReminderDate: todayKey }, { merge: true });
    await batch.commit();
    createdCount += 1;
  }

  logger.info('Community streak reminder run completed.', { todayKey, createdCount });
}

async function processStreakRolloverRun() {
  const todayKey = getDateKeyInTimeZone();
  const userDocs = await fetchUsersWithActiveStreaks();
  let graceCount = 0;
  let lostCount = 0;

  for (const userDoc of userDocs) {
    const data = userDoc.data();
    const dayDifference = getDayDifference(data.communityLastActivityDate, todayKey);

    if (dayDifference === 2 && data.communityStreakGraceDate !== todayKey) {
      const batch = db.batch();
      createStreakNotificationWrite(
        batch,
        userDoc.ref,
        userDoc.id,
        'streak_grace',
        todayKey,
        data.communityStreakCount ?? 0
      );
      batch.set(userDoc.ref, { communityStreakGraceDate: todayKey }, { merge: true });
      await batch.commit();
      graceCount += 1;
      continue;
    }

    if (dayDifference >= 3 && data.communityStreakLostDate !== todayKey) {
      const batch = db.batch();
      createStreakNotificationWrite(
        batch,
        userDoc.ref,
        userDoc.id,
        'streak_lost',
        todayKey,
        data.communityStreakCount ?? 0
      );
      batch.set(userDoc.ref, {
        communityStreakCount: 0,
        communityStreakLostDate: todayKey,
      }, { merge: true });
      await batch.commit();
      lostCount += 1;
    }
  }

  logger.info('Community streak rollover run completed.', { todayKey, graceCount, lostCount });
}

export const sendCommunityStreakReminders = onSchedule({
  schedule: '0 21 * * *',
  timeZone: STREAK_TIME_ZONE,
}, processStreakReminderRun);

export const processCommunityStreakRollover = onSchedule({
  schedule: '5 0 * * *',
  timeZone: STREAK_TIME_ZONE,
}, processStreakRolloverRun);

/**
 * Permanently delete a member account: removes the Firestore profile (and all of
 * its subcollections) AND the Firebase Auth user, so the email is freed and the
 * person can re-apply from scratch via the public join form.
 *
 * The client SDK cannot delete an arbitrary Auth user, so this must run with the
 * Admin SDK. Only admins (role === 'admin' in their own users doc) may call it,
 * and an admin cannot delete their own account (which would lock them out).
 */
export const deleteUserAccount = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) {
    throw new HttpsError('unauthenticated', 'You must be signed in to perform this action.');
  }

  const targetUid = String(request.data?.uid || '').trim();
  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'A target user id (uid) is required.');
  }
  if (targetUid === callerUid) {
    throw new HttpsError('failed-precondition', 'You cannot delete your own account.');
  }

  // Admin gate: re-check the caller's role server-side; never trust the client.
  const callerSnap = await db.collection(USERS_COL).doc(callerUid).get();
  if (!callerSnap.exists || callerSnap.get('role') !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can delete accounts.');
  }

  // Delete the Auth account first: if this fails we abort before touching
  // Firestore, leaving the account in a consistent (still-usable) state rather
  // than a half-deleted one. A missing Auth user is fine — proceed to clean up
  // any leftover profile doc.
  try {
    await admin.auth().deleteUser(targetUid);
  } catch (err) {
    if (err?.code !== 'auth/user-not-found') {
      logger.error('Failed to delete auth account', { targetUid, code: err?.code, message: err?.message });
      throw new HttpsError('internal', 'Failed to delete the authentication account.');
    }
  }

  // Then remove the Firestore profile and every subcollection under it
  // (registrations, bookings, appointments, calendar_notes, ...).
  await db.recursiveDelete(db.collection(USERS_COL).doc(targetUid));

  logger.info('Deleted user account', { targetUid, by: callerUid });
  return { ok: true, uid: targetUid };
});
