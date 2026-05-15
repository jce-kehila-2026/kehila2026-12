import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../../../firebase';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

function isAdminRole(role) {
  return ADMIN_ROLES.has(String(role || '').toLowerCase());
}

async function emailExistsInCollection(collectionName, email) {
  if (!email) return false;

  const lowerEmail = email.toLowerCase();
  const checks = [
    query(collection(db, collectionName), where('email', '==', email), limit(1)),
    query(collection(db, collectionName), where('email', '==', lowerEmail), limit(1)),
  ];

  const results = await Promise.allSettled(checks.map((adminQuery) => getDocs(adminQuery)));
  return results.some((result) => result.status === 'fulfilled' && !result.value.empty);
}

export async function resolveUserRole(user) {
  if (!user) return null;

  try {
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    if (userSnap.exists() && isAdminRole(userSnap.data().role)) {
      return 'admin';
    }
  } catch (error) {
    console.error('Failed to fetch role from users collection:', error);
  }

  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (adminSnap.exists()) {
      return 'admin';
    }
  } catch (error) {
    console.error('Failed to fetch admin document by uid:', error);
  }

  try {
    const email = user.email || '';
    const adminEmailDocs = await Promise.allSettled([
      getDoc(doc(db, 'admins', email)),
      getDoc(doc(db, 'admins', email.toLowerCase())),
    ]);
    if (adminEmailDocs.some((result) => result.status === 'fulfilled' && result.value.exists())) {
      return 'admin';
    }
  } catch (error) {
    console.error('Failed to fetch admin document by email:', error);
  }

  try {
    if (await emailExistsInCollection('admins', user.email)) {
      return 'admin';
    }
  } catch (error) {
    console.error('Failed to check admins collection by email:', error);
  }

  return 'participant';
}

export async function ensureParticipantProfile(user, details = {}) {
  if (!user?.uid) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists() && isAdminRole(userSnap.data().role)) {
    return;
  }

  await setDoc(
    userRef,
    {
      email: user.email || details.email || '',
      displayName: details.displayName || user.displayName || user.email?.split('@')[0] || '',
      role: 'participant',
      updatedAt: serverTimestamp(),
      ...(userSnap.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}

export function getPostLoginPath(role) {
  return isAdminRole(role) ? '/admin' : '/home';
}
