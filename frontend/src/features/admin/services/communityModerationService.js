import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { logAuditEvent } from './auditService';

const POSTS_COL = 'community_posts';
const SETTINGS_COL = 'community_settings';

const bumpVersion = (current) => {
  const n = parseInt(String(current ?? 'v0').replace(/^v/i, ''), 10);
  return `v${Number.isFinite(n) ? n + 1 : 1}`;
};

export async function getModerationStats() {
  const col = collection(db, POSTS_COL);
  const [total, reported, hidden, active] = await Promise.all([
    getCountFromServer(col),
    getCountFromServer(query(col, where('status', '==', 'reported'))),
    getCountFromServer(query(col, where('hiddenByAdmin', '==', true))),
    getCountFromServer(query(col, where('status', '==', 'active'))),
  ]);
  return {
    total: total.data().count,
    reported: reported.data().count,
    hidden: hidden.data().count,
    active: active.data().count,
  };
}

export async function getReportedPosts() {
  const q = query(
    collection(db, POSTS_COL),
    where('status', '==', 'reported'),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.reportsCount ?? 0) - (a.reportsCount ?? 0));
}

export async function getAllPosts() {
  const q = query(
    collection(db, POSTS_COL),
    orderBy('createdAt', 'desc'),
    limit(200),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function hidePost(postId) {
  await updateDoc(doc(db, POSTS_COL, postId), {
    hiddenByAdmin: true,
    status: 'hidden',
    updatedAt: serverTimestamp(),
  });
  await logAuditEvent({
    actionType: 'HIDE_COMMUNITY_POST',
    targetId: postId,
    summary: `Hidden community post ${postId.slice(0, 8)}`,
  });
}

export async function restorePost(postId) {
  await updateDoc(doc(db, POSTS_COL, postId), {
    hiddenByAdmin: false,
    status: 'active',
    updatedAt: serverTimestamp(),
  });
  await logAuditEvent({
    actionType: 'RESTORE_COMMUNITY_POST',
    targetId: postId,
    summary: `Restored community post ${postId.slice(0, 8)}`,
  });
}

export async function hardDeletePost(postId) {
  await deleteDoc(doc(db, POSTS_COL, postId));
  await logAuditEvent({
    actionType: 'DELETE_COMMUNITY_POST',
    targetId: postId,
    summary: `Hard-deleted community post ${postId.slice(0, 8)}`,
  });
}

export async function dismissReports(postId) {
  await updateDoc(doc(db, POSTS_COL, postId), {
    reports: [],
    reportedBy: [],
    reportsCount: 0,
    status: 'active',
    updatedAt: serverTimestamp(),
  });
  await logAuditEvent({
    actionType: 'DISMISS_REPORTS',
    targetId: postId,
    summary: `Dismissed reports for post ${postId.slice(0, 8)}`,
  });
}

export async function getGuidelinesDoc() {
  const snap = await getDoc(doc(db, SETTINGS_COL, 'guidelines'));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function saveGuidelinesDoc({ shortGuidelines, fullGuidelines, currentVersion }) {
  const uid = auth.currentUser?.uid ?? '';
  const newVersion = bumpVersion(currentVersion);

  await setDoc(doc(db, SETTINGS_COL, 'guidelines'), {
    version: newVersion,
    shortGuidelines: shortGuidelines.filter((g) => g.trim()),
    fullGuidelines: fullGuidelines.filter((g) => g.trim()),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });

  await logAuditEvent({
    actionType: 'UPDATE_COMMUNITY_GUIDELINES',
    targetId: 'community_settings/guidelines',
    summary: `Community guidelines updated to ${newVersion} — re-acceptance required`,
  });

  return newVersion;
}
