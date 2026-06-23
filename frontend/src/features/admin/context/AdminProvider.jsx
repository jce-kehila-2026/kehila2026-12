import { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { AdminContext } from './AdminContext';
import { logAuditEvent } from '../services/auditService';
import { resolveUserRole } from '../services/authRoleService';

const ADMIN_PROFILE_TIMEOUT_MS = 6000;

function withTimeout(promise, fallback, label) {
  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`${label} timed out; continuing with fallback.`);
      resolve(fallback);
    }, ADMIN_PROFILE_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

export default function AdminProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedUserUID, setImpersonatedUserUID] = useState(null);
  const [impersonatedDisplayName, setImpersonatedDisplayName] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [accountInactive, setAccountInactive] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);

      try {
        if (user) {
          const role = await withTimeout(resolveUserRole(user), 'participant', 'Admin role lookup');
          setUserRole(role || 'participant');
          // Members approved from a join request get a temporary password and a
          // `mustChangePassword` flag, which gates them to the set-password screen.
          try {
            const snap = await withTimeout(getDoc(doc(db, 'users', user.uid)), null, 'Admin profile lookup');
            const profile = snap?.exists?.() ? snap.data() : {};
            const inactive = profile.isActive === false || String(profile.status || '').toLowerCase() === 'inactive';
            setAccountInactive(inactive);
            setMustChangePassword(!inactive && profile.mustChangePassword === true);
          } catch (err) {
            console.error('Failed to read profile flags:', err);
            setAccountInactive(false);
            setMustChangePassword(false);
          }
        } else {
          setUserRole(null);
          setImpersonatedUserUID(null);
          setMustChangePassword(false);
          setAccountInactive(false);
        }
      } catch (err) {
        console.error('Failed to resolve admin auth state:', err);
        setUserRole(user ? 'participant' : null);
        setAccountInactive(false);
        setMustChangePassword(false);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const startImpersonation = useCallback(
    async (targetUID, displayName = '') => {
      setImpersonatedUserUID(targetUID);
      setImpersonatedDisplayName(displayName);
      // Record in audit log
      try {
        await logAuditEvent({
          actionType: 'IMPERSONATE_START',
          targetId: targetUID,
          details: { description: `Started impersonation of ${displayName || targetUID}` },
        });
      } catch (err) {
        console.error('Failed to write impersonation audit log:', err);
      }
    },
    []
  );

  const stopImpersonation = useCallback(() => {
    setImpersonatedUserUID(null);
    setImpersonatedDisplayName('');
  }, []);

  const clearMustChangePassword = useCallback(() => {
    setMustChangePassword(false);
  }, []);

  const logout = useCallback(async () => {
    setImpersonatedUserUID(null);
    await signOut(auth);
  }, []);

  const effectiveUID = impersonatedUserUID || currentUser?.uid || null;
  const isImpersonating = !!impersonatedUserUID;

  const value = useMemo(
    () => ({
      currentUser,
      userRole,
      loading,
      impersonatedUserUID,
      impersonatedDisplayName,
      effectiveUID,
      isImpersonating,
      startImpersonation,
      stopImpersonation,
      logout,
      mustChangePassword,
      accountInactive,
      clearMustChangePassword,
    }),
    [
      currentUser,
      userRole,
      loading,
      impersonatedUserUID,
      impersonatedDisplayName,
      effectiveUID,
      isImpersonating,
      startImpersonation,
      stopImpersonation,
      logout,
      mustChangePassword,
      accountInactive,
      clearMustChangePassword,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
