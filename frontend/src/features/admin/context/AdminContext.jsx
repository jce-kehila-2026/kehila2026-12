import { createContext, useContext } from 'react';

/**
 * AdminContext — provides auth state, RBAC role, and impersonation to the entire admin tree.
 *
 * Shape:
 *   currentUser        – Firebase Auth user object (or null)
 *   userRole           – 'participant' | 'admin' | 'super_admin' (or null while loading)
 *   impersonatedUserUID – UID being impersonated (or null)
 *   effectiveUID       – impersonatedUserUID ?? currentUser.uid
 *   isImpersonating    – boolean
 *   loading            – true while auth / role fetch is in progress
 *   mustChangePassword – true when the signed-in member still has a temp password
 *   startImpersonation(uid, displayName) – begin impersonation session
 *   stopImpersonation()                  – end impersonation session
 *   clearMustChangePassword()            – clear the flag after a successful change
 *   logout()                             – sign out
 */
export const AdminContext = createContext(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
}
