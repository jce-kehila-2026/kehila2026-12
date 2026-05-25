#!/usr/bin/env node
/**
 * Seed / repair the participant Events collection.
 *
 * Idempotent: uses fixed document IDs and set(..., { merge: true }), so re-running
 * updates the same event templates instead of creating duplicates.
 *
 * Usage:
 *   1. Put Firebase Admin service account JSON at repo root:
 *        serviceAccount.json
 *   2. Install script dependencies once:
 *        cd scripts
 *        npm install
 *   3. From repo root:
 *        node scripts/seedEvents.js
 *
 * Optional cleanup:
 *        node scripts/seedEvents.js --archive-existing
 *   This marks non-seeded published event docs as "archived" so old test events
 *   stop showing in the participant Events page.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_PATH = path.resolve(__dirname, '..', 'serviceAccount.json');
const SHOULD_ARCHIVE_EXISTING = process.argv.includes('--archive-existing');

if (!fs.existsSync(KEY_PATH)) {
  console.error(`Missing ${KEY_PATH}. Generate it in Firebase console > Project settings > Service accounts.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const EVENTS = [
  {
    id: 'schedule-reflexology',
    title: 'Reflexology',
    type: 'appointment',
    category: 'Appointment',
    status: 'published',
    recurrence: 'weekly',
    weeklyDay: 'Monday',
    weeklyDayIndex: 1,
    description: 'Gentle pressure therapy through the feet to support balance, relaxation, and inner wellbeing.',
    location: 'Treatment Room #1',
    startTime: '10:30',
    endTime: '13:00',
    providers: [
      {
        id: 'margarita',
        name: 'Margarita',
        specialty: 'Reflexology Therapist',
        room: 'Treatment Room #1',
        slots: [
          { id: 'margarita-1030', startTime: '10:30', endTime: '11:00', room: 'Treatment Room #1', capacity: 1 },
          { id: 'margarita-1100', startTime: '11:00', endTime: '11:30', room: 'Treatment Room #1', capacity: 1 },
          { id: 'margarita-1130', startTime: '11:30', endTime: '12:00', room: 'Treatment Room #1', capacity: 1 },
          { id: 'margarita-1200', startTime: '12:00', endTime: '12:30', room: 'Treatment Room #1', capacity: 1 },
          { id: 'margarita-1230', startTime: '12:30', endTime: '13:00', room: 'Treatment Room #1', capacity: 1 },
        ],
      },
    ],
  },
  {
    id: 'schedule-qi-gong',
    title: 'Qi Gong',
    type: 'workshop',
    category: 'Workshop',
    status: 'published',
    recurrence: 'weekly',
    weeklyDay: 'Tuesday',
    weeklyDayIndex: 2,
    description: 'Gentle movement and breathing practice for release, energetic balance, and mind-body strength.',
    location: 'Workshop Room',
    startTime: '17:00',
    endTime: '18:00',
    providers: [
      {
        id: 'tzofi',
        name: 'Tzofi',
        specialty: 'Qi Gong Instructor',
        room: 'Workshop Room',
        slots: [
          { id: 'tzofi-1700', startTime: '17:00', endTime: '18:00', room: 'Workshop Room', capacity: 6 },
        ],
      },
    ],
  },
  {
    id: 'schedule-womens-circle',
    title: "Women's Circle",
    type: 'workshop',
    category: 'Workshop',
    status: 'published',
    recurrence: 'weekly',
    weeklyDay: 'Monday',
    weeklyDayIndex: 1,
    description: 'A supportive women-centered space for sharing, listening, connection, and healing.',
    location: 'Workshop Room',
    startTime: '19:30',
    endTime: '21:00',
    providers: [
      {
        id: 'stav',
        name: 'Stav',
        specialty: "Women's Circle Facilitator",
        room: 'Workshop Room',
        slots: [
          { id: 'stav-1930', startTime: '19:30', endTime: '21:00', room: 'Workshop Room', capacity: 8 },
        ],
      },
    ],
  },
  {
    id: 'schedule-yoga',
    title: 'Yoga',
    type: 'workshop',
    category: 'Workshop',
    status: 'published',
    recurrence: 'weekly',
    weeklyDay: 'Wednesday',
    weeklyDayIndex: 3,
    description: 'Adapted yoga practice combining movement, breathing, and relaxation.',
    location: 'Workshop Room',
    startTime: '10:30',
    endTime: '11:30',
    providers: [
      {
        id: 'keren',
        name: 'Keren',
        specialty: 'Yoga Instructor',
        room: 'Workshop Room',
        slots: [
          { id: 'keren-1030', startTime: '10:30', endTime: '11:30', room: 'Workshop Room', capacity: 6 },
        ],
      },
    ],
  },
  {
    id: 'schedule-acupuncture-herbal-medicine',
    title: 'Acupuncture and Herbal Medicine',
    type: 'appointment',
    category: 'Appointment',
    status: 'published',
    recurrence: 'weekly',
    weeklyDay: 'Wednesday',
    weeklyDayIndex: 3,
    description: 'Traditional Chinese medicine support for balance, symptom relief, and overall strengthening.',
    location: 'Multiple rooms',
    startTime: '10:30',
    endTime: '12:30',
    providers: [
      {
        id: 'shagi',
        name: 'Shagi',
        specialty: 'Acupuncture Therapist',
        slots: [
          { id: 'shagi-1030', startTime: '10:30', endTime: '11:30', room: 'Treatment Room #1', capacity: 1 },
          { id: 'shagi-1130', startTime: '11:30', endTime: '12:30', room: 'Treatment Room #1', capacity: 1 },
        ],
      },
      {
        id: 'omer',
        name: 'Omer',
        specialty: 'Acupuncture Therapist',
        slots: [
          { id: 'omer-1030', startTime: '10:30', endTime: '11:30', room: 'Treatment Room #2', capacity: 1 },
          { id: 'omer-1130', startTime: '11:30', endTime: '12:30', room: 'Treatment Room #2', capacity: 1 },
        ],
      },
    ],
  },
  {
    id: 'schedule-couples-counseling',
    title: 'Couples Counseling',
    type: 'appointment',
    category: 'Appointment',
    status: 'published',
    recurrence: 'weekly',
    weeklyDay: 'Thursday',
    weeklyDayIndex: 4,
    description: 'Emotional, practical, and communication-based support for strengthening relationships.',
    location: 'Conversation Room',
    startTime: '10:00',
    endTime: '11:00',
    providers: [
      {
        id: 'michal-papo',
        name: 'Michal Papo',
        specialty: 'Couples Counselor',
        room: 'Conversation Room',
        slots: [
          { id: 'michal-papo-1000', startTime: '10:00', endTime: '11:00', room: 'Conversation Room', capacity: 1 },
        ],
      },
    ],
  },
  {
    id: 'schedule-nlp-therapy',
    title: 'NLP Therapy',
    type: 'appointment',
    category: 'Appointment',
    status: 'published',
    recurrence: 'weekly',
    weeklyDay: '',
    weeklyDayIndex: null,
    description: 'NLP-based emotional and cognitive work for creating change, resilience, and healthier patterns.',
    location: 'To be scheduled',
    startTime: '',
    endTime: '',
    providers: [
      {
        id: 'oshrat-yosef',
        name: 'Oshrat Yosef',
        specialty: 'NLP Therapist',
        room: 'To be scheduled',
        slots: [],
      },
    ],
  },
  {
    id: 'schedule-nlp-touch-therapy',
    title: 'NLP Touch Therapy',
    type: 'appointment',
    category: 'Appointment',
    status: 'published',
    recurrence: 'weekly',
    weeklyDay: '',
    weeklyDayIndex: null,
    description: 'A combination of NLP and supportive touch for emotional processing, strengthening, and inner resources.',
    location: 'To be scheduled',
    startTime: '',
    endTime: '',
    providers: [
      {
        id: 'eilat-shabtai',
        name: 'Eilat Shabtai',
        specialty: 'NLP and Touch Therapist',
        room: 'To be scheduled',
        slots: [],
      },
    ],
  },
];

function eventPayload(event) {
  const { id, ...payload } = event;
  return {
    ...payload,
    isRecurringTemplate: true,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'seedEvents',
  };
}

async function seedEvents() {
  console.log('Seeding participant Events collection...');

  for (const event of EVENTS) {
    const ref = db.collection('events').doc(event.id);
    const snap = await ref.get();
    const payload = eventPayload(event);

    if (!snap.exists) {
      payload.createdAt = FieldValue.serverTimestamp();
      payload.createdBy = 'seedEvents';
    }

    await ref.set(payload, { merge: true });
    console.log(`${snap.exists ? 'Updated' : 'Created'} events/${event.id}`);
  }
}

async function archiveExistingEvents() {
  if (!SHOULD_ARCHIVE_EXISTING) return;

  const seedIds = new Set(EVENTS.map((event) => event.id));
  const snap = await db.collection('events').where('status', '==', 'published').get();
  const batch = db.batch();
  let archived = 0;

  snap.docs.forEach((docSnap) => {
    if (seedIds.has(docSnap.id)) return;
    batch.set(
      docSnap.ref,
      {
        status: 'archived',
        archivedAt: FieldValue.serverTimestamp(),
        archivedBy: 'seedEvents',
      },
      { merge: true },
    );
    archived += 1;
  });

  if (archived > 0) {
    await batch.commit();
  }

  console.log(`Archived ${archived} old published event docs.`);
}

async function main() {
  await seedEvents();
  await archiveExistingEvents();
  console.log('Events seed complete.');
}

main().catch((error) => {
  console.error('Events seed failed:', error);
  process.exit(1);
});
