#!/usr/bin/env node
/**
 * One-time cleanup: remove hero.primaryCta and hero.secondaryCta from
 * public_pages/home. Both buttons are now hardcoded in the public site.
 *
 * Idempotent: re-running is safe. Logs whether the fields were present.
 *
 * Usage:
 *   1. Provide serviceAccount.json at the repo root.
 *   2. From the repo root:
 *        node scripts/cleanupPublicHomeCta.js
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

async function main() {
  const ref = db.collection('public_pages').doc('home');
  const snap = await ref.get();

  if (!snap.exists) {
    console.log('public_pages/home does not exist yet. Nothing to clean up.');
    return;
  }

  const hero = snap.data()?.hero || {};
  const hadPrimary = Object.prototype.hasOwnProperty.call(hero, 'primaryCta');
  const hadSecondary = Object.prototype.hasOwnProperty.call(hero, 'secondaryCta');

  if (!hadPrimary && !hadSecondary) {
    console.log('hero.primaryCta and hero.secondaryCta are already absent. Nothing to do.');
    return;
  }

  await ref.update({
    'hero.primaryCta': FieldValue.delete(),
    'hero.secondaryCta': FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'cleanup-script',
  });

  console.log(
    `Removed:${hadPrimary ? ' hero.primaryCta' : ''}${hadSecondary ? ' hero.secondaryCta' : ''}`,
  );
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
