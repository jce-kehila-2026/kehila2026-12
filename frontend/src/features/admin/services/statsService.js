// Stats summary documents — avoid expensive collection counts on every page load.
// stats/admin_summary  — counts used by the admin dashboard.
// stats/public_summary — counts shown on the public homepage.
// Updates use increment() so they can be batched alongside the source write.
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../../../firebase';

const ADMIN_DOC = doc(db, 'stats', 'admin_summary');
const PUBLIC_DOC = doc(db, 'stats', 'public_summary');

const DEFAULT_ADMIN = {
  totalUsers: 0,
  publishedEvents: 0,
  upcomingAppointmentsCount: 0,
  pendingSuggestions: 0,
  registrationsThisMonth: 0,
};

const DEFAULT_PUBLIC = {
  totalParticipants: 0,
  workshopsHosted: 0,
  yearsActive: 0,
};

export async function getAdminSummary() {
  const snap = await getDoc(ADMIN_DOC);
  return snap.exists() ? snap.data() : { ...DEFAULT_ADMIN, updatedAt: null };
}

export async function getPublicSummary() {
  const snap = await getDoc(PUBLIC_DOC);
  return snap.exists() ? snap.data() : { ...DEFAULT_PUBLIC, updatedAt: null };
}

// Pass deltas (+1/-1) for the fields you want to change. Other fields untouched.
export async function bumpAdminSummary(deltas) {
  const payload = { updatedAt: serverTimestamp() };
  for (const [k, v] of Object.entries(deltas || {})) {
    if (typeof v === 'number') payload[k] = increment(v);
  }
  await setDoc(ADMIN_DOC, payload, { merge: true });
}

export async function bumpPublicSummary(deltas) {
  const payload = { updatedAt: serverTimestamp() };
  for (const [k, v] of Object.entries(deltas || {})) {
    if (typeof v === 'number') payload[k] = increment(v);
  }
  await setDoc(PUBLIC_DOC, payload, { merge: true });
}

// Idempotent seed — used by migration and on first run.
export async function seedSummaryDocsIfMissing() {
  const [a, p] = await Promise.all([getDoc(ADMIN_DOC), getDoc(PUBLIC_DOC)]);
  const writes = [];
  if (!a.exists()) writes.push(setDoc(ADMIN_DOC, { ...DEFAULT_ADMIN, updatedAt: serverTimestamp() }));
  if (!p.exists()) writes.push(setDoc(PUBLIC_DOC, { ...DEFAULT_PUBLIC, updatedAt: serverTimestamp() }));
  await Promise.all(writes);
}
