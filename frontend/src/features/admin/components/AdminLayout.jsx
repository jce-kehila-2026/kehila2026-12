import { useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ImpersonationBanner from './ImpersonationBanner';

const DRAWER_WIDTH = 260;

const ROUTE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/events': 'Events Management',
  '/admin/appointments': 'Appointments',
  '/admin/cms': 'Content Management',
  '/admin/users': 'User Management',
  '/admin/roles': 'Role Management',
  '/admin/audit-log': 'Audit Log',
};

export default function AdminLayout() {
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] || 'Dashboard';

  return (
    <>
      <ImpersonationBanner />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar drawerWidth={DRAWER_WIDTH} />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar title={title} drawerWidth={DRAWER_WIDTH} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3, md: 4 },
              mt: '64px',
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </>
  );
}
