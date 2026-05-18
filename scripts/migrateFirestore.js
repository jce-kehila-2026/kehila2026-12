#!/usr/bin/env node
/**
 * One-time Firestore migration to the Phase 2 data structure.
 *
 *   event_registrations / registrations / participants
 *      → users/{uid}/registrations/{eventId}   AND   events/{eventId}/registrations/{uid}
 *   calendar_notes (top-level)
 *      → users/{uid}/calendar_notes/{noteId}
 *   articles, team_profiles, org_info
 *      → cms_articles, cms_team, cms_org
 *   appointments (existing flat docs)
 *      → users/{uid}/appointments/{apptId}   (kept in flat collection as well)
 *
 * Side effects:
 *   - Adds expiresAt (90d after createdAt) to any audit_logs missing it.
 *   - Seeds stats/admin_summary and stats/public_summary with computed counts.
 *
 * Idempotent: uses setDoc(..., { merge: true }), never addDoc.
 *
 * Usage:
 *   1. Create a service-account key in Firebase console (Project settings →
 *      Service accounts → Generate new private key). Save it as
 *      `serviceAccount.json` in the repo root (already gitignored).
 *   2. From the repo root:
 *        node scripts/migrateFirestore.js
 *
 * Safe to re-run. Logs every migrated document.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_PATH = path.resolve(__dirname, '..', 'serviceAccount.json');

if (!fs.existsSync(KEY_PATH)) {
  console.error(`Missing ${KEY_PATH}. See script header for instructions.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function emailKey(email) {
  return 'email_' + String(email).trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 80);
}

async function uidByEmail(email) {
  if (!email) return null;
  const snap = await db.collection('users').where('email', '==', email).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

async function migrateRegistrationsCollection(collectionName) {
  console.log(`\n── Migrating "${collectionName}" → subcollections ──`);
  const snap = await db.collection(collectionName).get();
  console.log(`Found ${snap.size} docs.`);

  for (const d of snap.docs) {
    const data = d.data();
    const eventId = data.eventId || data.eventID || data.eventRef?.id;
    if (!eventId) {
      console.warn(`  skip ${d.id}: no eventId`);
      continue;
    }
    const email = data.participantEmail || data.userEmail || data.email;
    const uid = data.userId || data.uid || (await uidByEmail(email));
    const rosterKey = uid || emailKey(email || d.id);

    const rosterPayload = {
      userId: uid || null,
      userName: data.participantName || data.userName || '',
      userEmail: email || '',
      userPhone: data.participantPhone || data.phone || '',
      status: data.status || 'confirmed',
      checkedIn: !!data.checkedIn,
      registeredAt: data.registeredAt || FieldValue.serverTimestamp(),
      participantName: data.participantName || data.userName || '',
      participantEmail: email || '',
      participantPhone: data.participantPhone || data.phone || '',
    };

    await db.doc(`events/${eventId}/registrations/${rosterKey}`).set(rosterPayload, { merge: true });
    console.log(`  ✓ events/${eventId}/registrations/${rosterKey}`);

    if (uid) {
      // Try to fetch the event for denormalized snapshot fields.
      const eventDoc = await db.doc(`events/${eventId}`).get();
      const ev = eventDoc.exists ? eventDoc.data() : {};
      await db.doc(`users/${uid}/registrations/${eventId}`).set(
        {
          eventId,
          eventTitle: ev.title || '',
          eventDate: ev.startTime || ev.date || null,
          eventLocation: ev.location || '',
          status: data.status || 'confirmed',
          checkedIn: !!data.checkedIn,
          registeredAt: data.registeredAt || FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`  ✓ users/${uid}/registrations/${eventId}`);
    }
  }
}

async function migrateCalendarNotes() {
  console.log(`\n── Migrating top-level calendar_notes → users/{uid}/calendar_notes ──`);
  const snap = await db.collection('calendar_notes').get();
  console.log(`Found ${snap.size} docs.`);

  for (const d of snap.docs) {
    const data = d.data();
    const uid = data.userId || data.uid;
    if (!uid) {
      console.warn(`  skip ${d.id}: no userId`);
      continue;
    }
    await db.doc(`users/${uid}/calendar_notes/${d.id}`).set(data, { merge: true });
    console.log(`  ✓ users/${uid}/calendar_notes/${d.id}`);
  }
}

async function migrateAppointmentsToUserMirror() {
  console.log(`\n── Mirroring appointments → users/{uid}/appointments ──`);
  const snap = await db.collection('appointments').get();
  console.log(`Found ${snap.size} docs.`);

  for (const d of snap.docs) {
    const data = d.data();
    const uid = data.userId || data.participantId || (await uidByEmail(data.participantEmail));
    if (!uid) {
      console.warn(`  skip ${d.id}: cannot resolve uid`);
      continue;
    }
    await db.doc(`users/${uid}/appointments/${d.id}`).set({ ...data, userId: uid }, { merge: true });
    console.log(`  ✓ users/${uid}/appointments/${d.id}`);
  }
}

async function copyCollection(srcName, dstName) {
  console.log(`\n── Copying ${srcName} → ${dstName} ──`);
  const snap = await db.collection(srcName).get();
  console.log(`Found ${snap.size} docs.`);
  for (const d of snap.docs) {
    await db.doc(`${dstName}/${d.id}`).set(d.data(), { merge: true });
    console.log(`  ✓ ${dstName}/${d.id}`);
  }
}

async function backfillAuditExpiresAt() {
  console.log(`\n── Backfilling audit_logs.expiresAt ──`);
  const snap = await db.collection('audit_logs').get();
  let touched = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (data.expiresAt) continue;
    const createdAt = data.timestamp?.toMillis?.() || Date.now();
    await d.ref.set(
      { expiresAt: Timestamp.fromMillis(createdAt + 90 * 24 * 60 * 60 * 1000) },
      { merge: true }
    );
    touched++;
  }
  console.log(`Updated ${touched}/${snap.size} audit log docs.`);
}

async function seedStats() {
  console.log(`\n── Seeding stats/admin_summary and stats/public_summary ──`);
  const [users, events, appointments, articles, logs, suggestions] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('events').where('status', '==', 'published').count().get(),
    db.collection('appointments').count().get(),
    db.collection('cms_articles').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
    db.collection('audit_logs').count().get(),
    db
      .collection('workshop_suggestions')
      .where('status', '==', 'new')
      .count()
      .get()
      .catch(() => ({ data: () => ({ count: 0 }) })),
  ]);

  const adminSummary = {
    totalUsers: users.data().count,
    publishedEvents: events.data().count,
    upcomingAppointmentsCount: appointments.data().count,
    publishedArticles: articles.data().count,
    auditLogEntries: logs.data().count,
    pendingSuggestions: suggestions.data().count,
    registrationsThisMonth: 0,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const publicSummary = {
    totalParticipants: users.data().count,
    workshopsHosted: events.data().count,
    yearsActive: 1,
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.doc('stats/admin_summary').set(adminSummary, { merge: true });
  await db.doc('stats/public_summary').set(publicSummary, { merge: true });

  console.log('stats/admin_summary:', adminSummary);
  console.log('stats/public_summary:', publicSummary);
}

async function main() {
  console.log('Starting migration…');
  await migrateRegistrationsCollection('event_registrations');
  await migrateRegistrationsCollection('registrations');
  await migrateCalendarNotes();
  await migrateAppointmentsToUserMirror();
  await copyCollection('articles', 'cms_articles');
  await copyCollection('team_profiles', 'cms_team');
  await copyCollection('org_info', 'cms_org');
  await backfillAuditExpiresAt();
  await seedStats();
  console.log('\n✅ Migration complete.');
  console.log('Next: deploy rules + delete the legacy collections from the Firebase console once you confirm everything reads correctly.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
