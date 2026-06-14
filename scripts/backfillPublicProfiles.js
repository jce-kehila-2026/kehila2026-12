#!/usr/bin/env node
/**
 * Backfill the public_profiles/{uid} collection from existing users/{uid} docs.
 *
 * Why: users/{uid} now holds participant PII (name, email, phone, address) and
 * its Firestore read rule is restricted to the owner + admins. The community
 * birthday widget needs to read other members' display name + birthday, so
 * those three non-sensitive fields are mirrored into public_profiles/{uid},
 * which any signed-in member may read. New writes mirror automatically via
 * updateCommunityProfile(); this script seeds the mirror for existing users.
 *
 * Idempotent: uses set(..., { merge: true }) keyed by uid, so re-running just
 * refreshes the mirror.
 *
 * Usage:
 *   1. Put Firebase Admin service account JSON at repo root:
 *        serviceAccount.json
 *   2. Install script dependencies once:
 *        cd scripts && npm install
 *   3. From repo root:
 *        node scripts/backfillPublicProfiles.js
 *      Add --dry-run to preview without writing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_PATH = path.resolve(__dirname, '..', 'serviceAccount.json');
const DRY_RUN = process.argv.includes('--dry-run');

if (!fs.existsSync(KEY_PATH)) {
  console.error(`Missing ${KEY_PATH}. Generate it in Firebase console > Project settings > Service accounts.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const PUBLIC_PROFILE_FIELDS = [
  'communityDisplayName',
  'communityBirthday',
  'showBirthdayInCommunity',
];

async function run() {
  const usersSnap = await db.collection('users').get();
  let mirrored = 0;
  let skipped = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const patch = {};
    for (const field of PUBLIC_PROFILE_FIELDS) {
      if (data[field] !== undefined) patch[field] = data[field];
    }

    // Only mirror users that actually have community display data.
    if (Object.keys(patch).length === 0) {
      skipped += 1;
      continue;
    }

    patch.updatedAt = FieldValue.serverTimestamp();

    if (DRY_RUN) {
      console.log(`[dry-run] would mirror ${userDoc.id}:`, patch);
    } else {
      await db.collection('public_profiles').doc(userDoc.id).set(patch, { merge: true });
    }
    mirrored += 1;
  }

  console.log(
    `${DRY_RUN ? '[dry-run] ' : ''}Done. Mirrored ${mirrored} profile(s), skipped ${skipped} with no community data.`,
  );
}

run().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
