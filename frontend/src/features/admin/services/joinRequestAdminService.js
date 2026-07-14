// Admin-side access to public membership applications ("טופס הצטרפות לעמותה").
//
// The public website writes these documents to the `joinRequests` collection
// via features/public/services/joinRequestService.js (status: 'new'). This
// service is the admin counterpart: it reads them so the Users page can show
// who applied. Accept/reject actions are added in a later phase.
//
// Firestore rules already grant admins read/update/delete on `joinRequests`,
// so no rules changes are needed for this read path.
import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, inMemoryPersistence, initializeAuth, sendPasswordResetEmail, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../../../firebase';
import { logAuditEvent } from './auditService';

export const JOIN_REQUESTS_COLLECTION = 'joinRequests';

export const JOIN_REQUEST_STATUS = {
  NEW: 'new',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Firestore Timestamp | ISO string | {seconds} -> millis (0 when missing), so
// we can sort newest-first on the client without requiring a composite index.
function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value === 'object' && typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeJoinRequest(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    status: data.status || JOIN_REQUEST_STATUS.NEW,
    ...data,
  };
}

/**
 * Fetch all membership applications, newest first.
 * Sorted client-side to avoid excluding docs missing `createdAt` and to keep
 * the query index-free.
 */
export async function listJoinRequests() {
  const snap = await getDocs(query(collection(db, JOIN_REQUESTS_COLLECTION), limit(500)));
  return snap.docs
    .map(normalizeJoinRequest)
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
}

// Typed error so the UI can show friendly, specific messages.
export class JoinRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'JoinRequestError';
    this.code = code;
  }
}

// 12-char temp password (upper/lower/digit/symbol guaranteed) using the
// crypto RNG. Meets Firebase's >=6 char rule with room to spare.
function generateTempPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%*?';
  const all = upper + lower + digits + symbols;
  const randomInt = (max) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return Math.floor((buf[0] / 2 ** 32) * max);
  };
  const pick = (set) => set[randomInt(set.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = chars.length; i < 12; i += 1) chars.push(pick(all));
  // Fisher–Yates shuffle so the guaranteed chars aren't always in front.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// Create a Firebase Auth account for the applicant WITHOUT disturbing the
// admin's session. A throwaway secondary Firebase app (in-memory auth, so it
// never touches localStorage) signs in as the new user just long enough to
// create the account and write their own users/{uid} profile (which the
// Firestore rules allow because it's `isSelf` with role 'participant').
async function provisionMemberAccount(email, password, profile) {
  const secondaryApp = initializeApp(firebaseConfig, `member-provisioning-${Date.now()}`);
  try {
    const secondaryAuth = initializeAuth(secondaryApp, { persistence: inMemoryPersistence });
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const secondaryDb = getFirestore(secondaryApp);
    try {
      await setDoc(doc(secondaryDb, 'users', credential.user.uid), profile);
    } catch (profileError) {
      // Account exists and can log in as a participant even without this doc,
      // so don't fail the whole approval — just surface it in logs.
      console.warn('Created auth account but failed to write users profile:', profileError);
    }
    await signOut(secondaryAuth);
    return credential.user.uid;
  } finally {
    await deleteApp(secondaryApp).catch(() => {});
  }
}

/**
 * Revive a previously-deleted (tombstoned) account that owns this email.
 *
 * On the Spark plan a deleted member's Firebase Auth record can't be removed, so
 * their users/{uid} doc is left as a `status:'deleted'` tombstone (see
 * userAccountService.deleteMemberAccount). When that same email re-applies, we
 * can't create a new Auth account (`auth/email-already-in-use`), so instead we
 * reuse the existing uid: rewrite a fresh, active profile and send a password-
 * reset email so the applicant can set a new password.
 *
 * @returns {Promise<{ uid: string } | null>} null when there's no tombstone to revive
 *          (e.g. the email belongs to a still-active account — caller should then
 *          surface EMAIL_IN_USE).
 */
async function reviveDeletedAccount(email, profile) {
  const emailLower = String(email || '').trim().toLowerCase();
  if (!emailLower) return null;

  // Single-field equality query (auto-indexed, no composite index needed);
  // filter to the deleted tombstone on the client.
  const snap = await getDocs(query(
    collection(db, 'users'),
    where('emailLower', '==', emailLower),
    limit(5),
  ));
  const tombstone = snap.docs.find((docSnap) => String(docSnap.data()?.status || '').toLowerCase() === 'deleted');
  if (!tombstone) return null;

  const uid = tombstone.id;
  // Rebuild a fresh, active profile on the reused uid. They set a new password
  // via the reset email below — we can't set one for an existing Auth account
  // from the client on the Spark plan.
  await setDoc(doc(db, 'users', uid), {
    ...profile,
    status: 'active',
    isActive: true,
    mustChangePassword: false,
    revivedAt: serverTimestamp(),
  });

  await sendPasswordResetEmail(auth, email).catch((err) => {
    console.warn('Revival password-reset email failed:', err);
  });

  return { uid };
}

/**
 * Approve a membership application: create the member's login account with a
 * temporary password, mark the request approved, and audit it.
 *
 * @returns {Promise<{ uid: string, email: string, tempPassword?: string, revived: boolean }>}
 *          For a new account the temp password is returned (never stored) so the
 *          UI can show/email it. For a revived (previously-deleted) account
 *          `revived` is true and no temp password exists — a reset email is sent.
 */
export async function approveJoinRequest(request) {
  const email = String(request?.email || '').trim();
  if (!email) {
    throw new JoinRequestError('MISSING_EMAIL', 'This application has no email address, so an account cannot be created.');
  }

  const tempPassword = generateTempPassword();

  // Map the membership-application fields onto the participant profile using the
  // exact field names the profile form (PersonalDetailsForm) reads, so the data
  // the applicant entered shows up pre-filled in their account:
  //   fullName  → First/Last name (the form splits fullName on whitespace)
  //   phone     → phoneNumber
  //   address   → city (the join form's location field is an Israeli city)
  //   birthDate, email → same names
  const firstName = String(request.firstName || '').trim();
  const lastName = String(request.lastName || '').trim();
  const fullName = String(request.fullName || '').trim() || [firstName, lastName].filter(Boolean).join(' ');
  const profile = {
    email,
    fullName,
    firstName,
    lastName,
    displayName: fullName,
    role: 'participant',
    phoneNumber: request.phone || '',
    city: request.address || '',
    streetAddress: '',
    birthDate: request.birthDate || '',
    preferredContactMethod: 'email',
    mustChangePassword: true,
    source: 'membership-application',
    joinRequestId: request.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  let uid;
  try {
    uid = await provisionMemberAccount(email, tempPassword, profile);
  } catch (error) {
    if (error?.code === 'auth/email-already-in-use') {
      // The email may belong to a previously-deleted account. If so, revive it
      // (reuse the uid + send a reset email) so the applicant effectively gets a
      // fresh account; otherwise it's a genuine clash → surface EMAIL_IN_USE.
      const revived = await reviveDeletedAccount(email, profile);
      if (revived) {
        await updateDoc(doc(db, JOIN_REQUESTS_COLLECTION, request.id), {
          status: JOIN_REQUEST_STATUS.APPROVED,
          decidedAt: serverTimestamp(),
          decidedBy: auth.currentUser?.email || auth.currentUser?.uid || '',
          linkedUserUid: revived.uid,
        });

        await logAuditEvent({
          actionType: 'JOIN_REQUEST_APPROVED',
          targetId: request.id,
          details: { participant: request.fullName || email, email, uid: revived.uid, revived: true },
        });

        return { uid: revived.uid, email, revived: true };
      }
      throw new JoinRequestError('EMAIL_IN_USE', 'An account with this email already exists. No new account was created.');
    }
    if (error?.code === 'auth/invalid-email') {
      throw new JoinRequestError('INVALID_EMAIL', 'The email address on this application is invalid.');
    }
    throw error;
  }

  await updateDoc(doc(db, JOIN_REQUESTS_COLLECTION, request.id), {
    status: JOIN_REQUEST_STATUS.APPROVED,
    decidedAt: serverTimestamp(),
    decidedBy: auth.currentUser?.email || auth.currentUser?.uid || '',
    linkedUserUid: uid,
  });

  await logAuditEvent({
    actionType: 'JOIN_REQUEST_APPROVED',
    targetId: request.id,
    details: { participant: request.fullName || email, email, uid },
  });

  return { uid, email, tempPassword, revived: false };
}

/**
 * Reject a membership application. No account is created.
 */
export async function rejectJoinRequest(request, { reason = '' } = {}) {
  await updateDoc(doc(db, JOIN_REQUESTS_COLLECTION, request.id), {
    status: JOIN_REQUEST_STATUS.REJECTED,
    decidedAt: serverTimestamp(),
    decidedBy: auth.currentUser?.email || auth.currentUser?.uid || '',
    rejectionReason: String(reason || '').trim(),
  });

  await logAuditEvent({
    actionType: 'JOIN_REQUEST_REJECTED',
    targetId: request.id,
    details: { participant: request.fullName || request.email || request.id, reason },
  });

  return { status: JOIN_REQUEST_STATUS.REJECTED };
}
