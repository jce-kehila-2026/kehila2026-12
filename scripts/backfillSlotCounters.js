#!/usr/bin/env node
/**
 * Backfill per-slot seat counters used for transactional capacity enforcement.
 *
 * Source of truth:
 *   bookings/{bookingId}   (status != 'cancelled')
 *
 * Target (one counter per bookable slot):
 *   events/{realEventId}/slotCounters/{slotKey}  ->  { count, slotId, eventId, updatedAt }
 *
 * Keying matches registrationService.addRegistration exactly:
 *   realEventId = booking.sessionEventId || booking.eventId
 *   slotKey     = booking.slotId || realEventId
 *
 * Run this ONCE before enabling capacity enforcement (and any time you suspect
 * counter drift). Safe to re-run: it recomputes counts from the bookings and
 * overwrites. Uses the Admin SDK, which bypasses security rules.
 *
 * Usage:
 *   node backfillSlotCounters.js            # apply
 *   node backfillSlotCounters.js --dry-run  # report only, write nothing
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
  console.error(`Missing ${KEY_PATH}. Put serviceAccount.json in the repo root first.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function isCancelled(booking) {
  return String(booking.status || '').toLowerCase() === 'cancelled';
}

async function main() {
  console.log(`Backfilling slot counters${DRY_RUN ? ' (DRY RUN)' : ''}...`);

  const bookingsSnap = await db.collection('bookings').get();

  // Group unique, active bookings by their counter doc path.
  // Map<counterPath, { realEventId, slotKey, bookingIds:Set }>
  const groups = new Map();
  let skippedCancelled = 0;
  let skippedNoEvent = 0;

  bookingsSnap.forEach((docSnap) => {
    const booking = docSnap.data();
    if (isCancelled(booking)) { skippedCancelled += 1; return; }

    const realEventId = booking.sessionEventId || booking.eventId;
    if (!realEventId) { skippedNoEvent += 1; return; }

    const slotKey = booking.slotId || realEventId;
    const counterPath = `events/${realEventId}/slotCounters/${slotKey}`;

    let group = groups.get(counterPath);
    if (!group) {
      group = { realEventId, slotKey, bookingIds: new Set() };
      groups.set(counterPath, group);
    }
    // bookingId is deterministic per (user, event, slot); dedupe defensively.
    group.bookingIds.add(booking.bookingId || docSnap.id);
  });

  console.log(
    `Scanned ${bookingsSnap.size} bookings -> ${groups.size} slot counters `
    + `(skipped ${skippedCancelled} cancelled, ${skippedNoEvent} without an event id).`,
  );

  let written = 0;
  // Commit in batches of 400 (Firestore batch limit is 500).
  let batch = db.batch();
  let opsInBatch = 0;

  for (const [counterPath, group] of groups) {
    const count = group.bookingIds.size;
    console.log(`  ${counterPath} = ${count}`);
    if (DRY_RUN) continue;

    batch.set(
      db.doc(counterPath),
      {
        count,
        slotId: group.slotKey,
        eventId: group.realEventId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    written += 1;
    opsInBatch += 1;
    if (opsInBatch >= 400) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  }

  if (!DRY_RUN && opsInBatch > 0) {
    await batch.commit();
  }

  console.log(DRY_RUN
    ? 'Dry run complete — no writes performed.'
    : `Done. Wrote ${written} slot counter docs.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
