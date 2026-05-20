#!/usr/bin/env node
/**
 * Seed / repair public_pages/home with the default field groups.
 *
 * Idempotent: only writes the field groups that are currently missing. Existing
 * field groups are left untouched. Re-running is safe.
 *
 * Usage:
 *   1. Provide serviceAccount.json at the repo root.
 *   2. From the repo root:
 *        node scripts/seedPublicHome.js
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
  console.error(`Missing ${KEY_PATH}. Generate a service-account key in Firebase console.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const HERO_SEED = {
  title: 'את לא לבד במסע שלך',
  subtitle: 'קהילה תומכת לנשים ולמתמודדות עם סרטן',
  description: 'מרחב חם, בטוח ומקצועי לתמיכה, ליווי, למידה ותקווה לאורך הדרך.',
  // Empty string => the public site falls back to the bundled hero image.
  // Replace with a hosted URL once one exists.
  backgroundImageUrl: '',
};

const ABOUT_US_SEED = {
  paragraph:
    'SHE-NA היא ארגון ללא כוונת רווח המעניק תמיכה רגשית, חברתית וחינוכית לנשים ולמתמודדות עם סרטן. אנו מאמינות בכוח של קהילה תומכת ובחשיבות של ליווי אישי ומקצועי במסע האתגרי.',
  cards: [
    {
      iconKey: 'calendar-heart',
      title: 'סדנאות ואירועים',
      description: 'פעילויות העשרה ומפגשים מעצימים לנפש ולגוף.',
    },
    {
      iconKey: 'message-circle-heart',
      title: 'תמיכה קהילתית',
      description: 'חיבור בין נשים, אכפתיות וליווי חם במעגל תומך.',
    },
    {
      iconKey: 'users-round',
      title: 'קהילה בטוחה',
      description: 'מרחב תומך ומכיל לכל אישה בכל שלב במסע.',
    },
    {
      iconKey: 'heart',
      title: 'תמיכה רגשית',
      description: 'ליווי אישי וקבוצתי במסע שלך עם הבנה ואמפתיה.',
    },
  ],
};

async function main() {
  const ref = db.collection('public_pages').doc('home');
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      hero: HERO_SEED,
      aboutUs: ABOUT_US_SEED,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'system-seed',
    });
    console.log('Created public_pages/home with hero + aboutUs seed content.');
    return;
  }

  const data = snap.data() || {};
  const updates = {};
  const filledGroups = [];

  if (!data.hero) {
    updates.hero = HERO_SEED;
    filledGroups.push('hero');
  }
  if (!data.aboutUs) {
    updates.aboutUs = ABOUT_US_SEED;
    filledGroups.push('aboutUs');
  }

  if (filledGroups.length === 0) {
    console.log('public_pages/home already has all known field groups. Nothing to do.');
    return;
  }

  updates.updatedAt = FieldValue.serverTimestamp();
  updates.updatedBy = 'system-seed';

  await ref.update(updates);
  console.log(`Filled missing field groups: ${filledGroups.join(', ')}.`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
