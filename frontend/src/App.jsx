import { lazy, Suspense, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { createAppTheme } from './theme';
import { DirectionProvider, useDirection } from './features/admin/context/DirectionContext';
import AdminProvider from './features/admin/context/AdminProvider';
// Eager: tiny route guards used by many routes; providers; redirect helpers.
import AuthenticatedRoute from './features/admin/components/AuthenticatedRoute';
import ProtectedRoute from './features/admin/components/ProtectedRoute';
import { useAdmin } from './features/admin/context/AdminContext';
import { getPostLoginPath } from './features/admin/services/authRoleService';
import { AccessibilityProvider } from './context/AccessibilityContext';
import AccessibilityWidget from './components/AccessibilityWidget';

// Lazy: route components are split into their own chunks so a first-time
// visitor on /public no longer downloads the admin + participant portals.
const AdminLayout = lazy(() => import('./features/admin/components/AdminLayout'));
const LoginPage = lazy(() => import('./features/admin/pages/LoginPage'));
const DashboardPage = lazy(() => import('./features/admin/pages/DashboardPage'));
const AdminEventsPage = lazy(() => import('./features/admin/pages/EventsPage'));
const EventDetailPage = lazy(() => import('./features/admin/pages/EventDetailPage'));
const AppointmentsPage = lazy(() => import('./features/admin/pages/AppointmentsPage'));
const CMSPage = lazy(() => import('./features/admin/pages/CMSPage'));
const UserManagementPage = lazy(() => import('./features/admin/pages/UserManagementPage'));
const FormsPage = lazy(() => import('./features/admin/pages/FormsPage'));
const BugReportsPage = lazy(() => import('./features/admin/pages/BugReportsPage'));
const AuditLogPage = lazy(() => import('./features/admin/pages/AuditLogPage'));
const CommunityModerationPage = lazy(() => import('./features/admin/pages/CommunityModerationPage'));
const UpdatesPage = lazy(() => import('./features/admin/pages/UpdatesPage'));
const ProfilePage = lazy(() => import('./features/profile/pages/ProfilePage'));
const ForcePasswordChange = lazy(() => import('./features/profile/pages/ForcePasswordChange'));
const ParticipantHome = lazy(() => import('./features/participant/ParticipantHome'));
const PublicHomePage = lazy(() => import('./features/public/pages/PublicHomePage'));
const PublicDonationsPage = lazy(() => import('./features/public/pages/PublicDonationsPage'));
const PublicStoriesArticlesPage = lazy(() => import('./features/public/pages/PublicStoriesArticlesPage'));
const PublicTeamPartnersPage = lazy(() => import('./features/public/pages/PublicTeamPartnersPage'));
const AccessibilityStatementPage = lazy(() => import('./features/public/pages/AccessibilityStatementPage'));

// Emotion caches for RTL and LTR. The Stylis prefixer can crash on some
// generated MUI styles in dev, so keep only the RTL transform plugin.
const cacheRtl = createCache({ key: 'muirtl', stylisPlugins: [rtlPlugin] });
const cacheLtr = createCache({ key: 'muiltr' });

function RouteFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </div>
  );
}

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
        <AccessibilityProvider>
          <AccessibilityWidget />
          <AdminProvider>
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<RoleRedirect />} />
              <Route path="/public" element={<PublicHomePage />} />
              <Route path="/public/donations" element={<PublicDonationsPage />} />
              <Route path="/public/stories-articles" element={<PublicStoriesArticlesPage />} />
              <Route path="/public/team-partners" element={<PublicTeamPartnersPage />} />
              <Route path="/accessibility" element={<AccessibilityStatementPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/set-password" element={<ForcePasswordChange />} />
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
                    <ParticipantHome initialView="calendar" />
                  </AuthenticatedRoute>
                }
              />
              <Route path="/appointments" element={<Navigate to="/home" replace />} />
              <Route
                path="/events"
                element={
                  <AuthenticatedRoute>
                    <ParticipantHome initialView="events" />
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
                <Route path="appointments" element={<AppointmentsPage />} />
                <Route path="calendar" element={<Navigate to="/home" replace />} />
                <Route path="cms" element={<CMSPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="forms" element={<FormsPage />} />
                <Route path="bug-reports" element={<BugReportsPage />} />
                <Route path="roles" element={<Navigate to="/admin/users?tab=roles" replace />} />
                <Route path="community" element={<CommunityModerationPage />} />
                <Route path="updates" element={<UpdatesPage />} />
                <Route path="audit-log" element={<AuditLogPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/public" replace />} />
            </Routes>
            </Suspense>
          </AdminProvider>
        </AccessibilityProvider>
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
