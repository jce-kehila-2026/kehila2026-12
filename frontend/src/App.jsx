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
import AuthenticatedRoute from './features/admin/components/AuthenticatedRoute';
import ProtectedRoute from './features/admin/components/ProtectedRoute';
import AdminLayout from './features/admin/components/AdminLayout';
import LoginPage from './features/admin/pages/LoginPage';
import DashboardPage from './features/admin/pages/DashboardPage';
import AdminEventsPage from './features/admin/pages/EventsPage';
import EventDetailPage from './features/admin/pages/EventDetailPage';
// import AppointmentsPage from './features/admin/pages/AppointmentsPage';
import CMSPage from './features/admin/pages/CMSPage';
import UserManagementPage from './features/admin/pages/UserManagementPage';
import AuditLogPage from './features/admin/pages/AuditLogPage';
import RoleManagementPage from './features/admin/pages/RoleManagementPage';
import ProfilePage from './features/profile/pages/ProfilePage';
import CalendarPage from './features/calendar/CalendarPage';
import EventsPage from './features/events/EventsPage';
import ParticipantHome from './features/participant/ParticipantHome';
import AppointmentPage from './features/appointments/pages/AppointmentPage';
import PublicHomePage from './features/public/pages/PublicHomePage';
import { useAdmin } from './features/admin/context/AdminContext';
import { getPostLoginPath } from './features/admin/services/authRoleService';

// Emotion caches for RTL and LTR
const cacheRtl = createCache({ key: 'muirtl', stylisPlugins: [prefixer, rtlPlugin] });
const cacheLtr = createCache({ key: 'muiltr', stylisPlugins: [prefixer] });

function RoleRedirect() {
  const { currentUser, userRole, loading } = useAdmin();

  if (loading) return null;
  if (!currentUser) return <Navigate to="/public" replace />;

  return <Navigate to={getPostLoginPath(userRole)} replace />;
}

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
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/public" element={<PublicHomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/home"
              element={
                <AuthenticatedRoute>
                  <ParticipantHome />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <AuthenticatedRoute>
                  <CalendarPage />
                </AuthenticatedRoute>
              }
            />
            <Route path="/appointments" element={<AppointmentPage />} />
            <Route
              path="/events"
              element={
                <AuthenticatedRoute>
                  <EventsPage />
                </AuthenticatedRoute>
              }
            />

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
              <Route path="events" element={<AdminEventsPage />} />
              <Route path="events/:eventId" element={<EventDetailPage />} />
              <Route path="appointments" element={<div>Appointments Page</div>} />
              <Route path="calendar" element={<Navigate to="/home" replace />} />
              <Route path="cms" element={<CMSPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="roles" element={<RoleManagementPage />} />
              <Route path="audit-log" element={<AuditLogPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/public" replace />} />
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
