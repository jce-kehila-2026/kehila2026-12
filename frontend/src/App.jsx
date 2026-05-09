import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { createAppTheme } from './theme';
import { DirectionProvider, useDirection } from './features/admin/context/DirectionContext';
import AdminProvider from './features/admin/context/AdminProvider';
import ProtectedRoute from './features/admin/components/ProtectedRoute';
import AdminLayout from './features/admin/components/AdminLayout';
import LoginPage from './features/admin/pages/LoginPage';
import DashboardPage from './features/admin/pages/DashboardPage';
import EventsPage from './features/admin/pages/EventsPage';
import CMSPage from './features/admin/pages/CMSPage';
import UserManagementPage from './features/admin/pages/UserManagementPage';
import AuditLogPage from './features/admin/pages/AuditLogPage';
import RoleManagementPage from './features/admin/pages/RoleManagementPage';
import ProfilePage from './features/profile/pages/ProfilePage';

// Emotion caches for RTL and LTR
const cacheRtl = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] });
const cacheLtr = createCache({ key: 'muiltr', stylisPlugins: [prefixer] });

function ThemedApp() {
  const { direction } = useDirection();
  const theme = useMemo(() => createAppTheme(direction), [direction]);
  const cache = direction === 'rtl' ? cacheRtl : cacheLtr;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AdminProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="cms" element={<CMSPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="roles" element={<RoleManagementPage />} />
              <Route path="audit-log" element={<AuditLogPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AdminProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default function App() {
  return (
    <DirectionProvider>
      <ThemedApp />
    </DirectionProvider>
  );
}
