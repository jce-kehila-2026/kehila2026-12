import admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
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
