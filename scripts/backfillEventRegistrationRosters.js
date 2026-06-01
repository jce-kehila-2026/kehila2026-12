#!/usr/bin/env node
/**
 * Backfill existing participant registration mirrors into event roster
 * subcollections.
 *
 * Source:
 *   users/{uid}/registrations/{sessionOrEventId}
 *
 * Targets:
 *   events/{sessionOrEventId}/registrations/{uid}
 *   events/{eventTemplateId}/registrations/{uid__sessionOrEventId}
 *
 * The second target is what the admin Events Management panel reads for the
 * main recurring event document, for example:
 *   events/schedule-couples-counseling/registrations/{registrationId}
 *
 * Safe to re-run. Uses set(..., { merge: true }) and never deletes data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_PATH = path.resolve(__dirname, '..', 'serviceAccount.json');

if (!fs.existsSync(KEY_PATH)) {
  console.error(`Missing ${KEY_PATH}. Put serviceAccount.json in the repo root first.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function keyPart(value, fallback = 'registration') {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100) || fallback;
}

function inferTemplateIdFromSessionId(eventId) {
  const value = String(eventId || '');
  return value.includes('__') ? value.split('__')[0] : value;
}

function getUserName(userData, registration, email) {
  return (
    registration.participantName ||
    registration.userName ||
    registration.name ||
    userData.displayName ||
    userData.name ||
    (email ? email.split('@')[0] : '')
  );
}

function getRosterPayload({ uid, userData, registration, sessionEventId, templateEventId, sessionRosterKey, templateRosterKey }) {
  const email = registration.participantEmail || registration.userEmail || registration.email || userData.email || '';
  const name = getUserName(userData, registration, email);
  const phone = registration.participantPhone || registration.userPhone || registration.phone || userData.phone || '';

  return {
    registrationKey: sessionRosterKey,
    sessionRegistrationKey: sessionRosterKey,
    templateRosterKey,
    userId: uid,
    userName: name,
    userEmail: email,
    userPhone: phone,
    status: registration.status || 'confirmed',
    checkedIn: Boolean(registration.checkedIn),
    registeredAt: registration.registeredAt || FieldValue.serverTimestamp(),
    participantName: name,
    participantEmail: email,
    participantPhone: phone,
    eventId: sessionEventId,
    eventTitle: registration.eventTitle || '',
    eventDate: registration.eventDate || null,
    eventLocation: registration.eventLocation || registration.room || '',
    eventCoverUrl: registration.eventCoverUrl || '',
    eventTemplateId: templateEventId,
    parentEventId: templateEventId,
    sessionEventId,
    eventType: registration.eventType || '',
    selectedDate: registration.selectedDate || '',
    providerId: registration.providerId || '',
    providerName: registration.providerName || '',
    selectedTimeSlot: registration.selectedTimeSlot || registration.sessionTime || '',
    room: registration.room || registration.eventLocation || '',
    sessionDateLabel: registration.sessionDateLabel || '',
    sessionTime: registration.sessionTime || '',
    recurringSchedule: registration.recurringSchedule || '',
    rosterBackfilledAt: FieldValue.serverTimestamp(),
  };
}

async function backfillEventRegistrationRosters() {
  const usersSnap = await db.collection('users').get();
  const writes = [];
  const seenPaths = new Set();
  let userRegistrationCount = 0;
  let skippedCount = 0;

  for (const userDoc of usersSnap.docs) {
    const registrationsSnap = await userDoc.ref.collection('registrations').get();
    if (registrationsSnap.empty) continue;

    const uid = userDoc.id;
    const userData = userDoc.data() || {};

    for (const registrationDoc of registrationsSnap.docs) {
      const registration = registrationDoc.data() || {};
      const sessionEventId = registration.sessionEventId || registration.eventId || registrationDoc.id;

      if (!sessionEventId) {
        skippedCount += 1;
        console.warn(`Skipped users/${uid}/registrations/${registrationDoc.id}: missing event id.`);
        continue;
      }

      const templateEventId =
        registration.eventTemplateId ||
        registration.parentEventId ||
        inferTemplateIdFromSessionId(sessionEventId);
      const sessionRosterKey = registration.sessionRegistrationKey || registration.registrationKey || uid;
      const templateRosterKey = registration.templateRosterKey || (
        templateEventId && templateEventId !== sessionEventId
          ? `${sessionRosterKey}__${keyPart(sessionEventId, 'session')}`
          : sessionRosterKey
      );
      const payload = getRosterPayload({
        uid,
        userData,
        registration,
        sessionEventId,
        templateEventId,
        sessionRosterKey,
        templateRosterKey,
      });

      userRegistrationCount += 1;

      const targets = [
        {
          path: `events/${sessionEventId}/registrations/${sessionRosterKey}`,
          data: payload,
        },
      ];

      if (templateEventId && templateEventId !== sessionEventId) {
        targets.push({
          path: `events/${templateEventId}/registrations/${templateRosterKey}`,
          data: payload,
        });
      }

      targets.forEach((target) => {
        if (seenPaths.has(target.path)) return;
        seenPaths.add(target.path);
        writes.push(target);
      });
    }
  }

  let committed = 0;
  for (let index = 0; index < writes.length; index += 450) {
    const batch = db.batch();
    writes.slice(index, index + 450).forEach((write) => {
      batch.set(db.doc(write.path), write.data, { merge: true });
    });
    await batch.commit();
    committed += writes.slice(index, index + 450).length;
    console.log(`Committed ${committed}/${writes.length} roster writes...`);
  }

  console.log('\nEvent registration roster backfill complete.');
  console.log(`User registration docs scanned: ${userRegistrationCount}`);
  console.log(`Roster docs written/merged: ${committed}`);
  console.log(`Skipped docs: ${skippedCount}`);
}

backfillEventRegistrationRosters().catch((error) => {
  console.error('Event registration roster backfill failed:', error);
  process.exit(1);
});
