import { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { AdminContext } from './AdminContext';
import { logAuditEvent } from '../services/auditService';
import { resolveUserRole } from '../services/authRoleService';

export default function AdminProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedUserUID, setImpersonatedUserUID] = useState(null);
  const [impersonatedDisplayName, setImpersonatedDisplayName] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const role = await resolveUserRole(user);
        setUserRole(role || 'participant');
        // Members approved from a join request get a temporary password and a
        // `mustChangePassword` flag, which gates them to the set-password screen.
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          setMustChangePassword(snap.exists() && snap.data().mustChangePassword === true);
        } catch (err) {
          console.error('Failed to read profile flags:', err);
          setMustChangePassword(false);
        }
      } else {
        setUserRole(null);
        setImpersonatedUserUID(null);
        setMustChangePassword(false);
      }
      setLoading(false);
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
      clearMustChangePassword,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
