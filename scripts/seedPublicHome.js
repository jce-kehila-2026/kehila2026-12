#!/usr/bin/env node
/**
 * Seed public_pages/home with the current hero defaults.
 *
 * Idempotent: uses setDoc(..., { merge: true }) — only the hero field group
 * and metadata are written. Re-running will not overwrite admin edits unless
 * fields are explicitly the same.
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

async function main() {
  const ref = db.collection('public_pages').doc('home');
  const snap = await ref.get();

  if (snap.exists) {
    console.log('public_pages/home already exists. Leaving it untouched.');
    return;
  }

  await ref.set({
    hero: HERO_SEED,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'system-seed',
  });

  console.log('Seeded public_pages/home with default hero content.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
