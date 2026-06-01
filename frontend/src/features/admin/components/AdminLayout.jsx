import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ImpersonationBanner from './ImpersonationBanner';

const DRAWER_WIDTH = 260;
const COLLAPSED_DRAWER_WIDTH = 88;

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const drawerWidth = sidebarCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <>
      <ImpersonationBanner />
      <Box
        sx={{
          '--admin-sidebar-width': `${drawerWidth}px`,
          '--admin-modal-offset': sidebarCollapsed ? '140px' : '320px',
          display: 'flex',
          flexDirection: 'row-reverse',
          minHeight: '100vh',
        }}
      >
        <Sidebar
          drawerWidth={drawerWidth}
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            transition: 'all 300ms ease-in-out',
          }}
        >
          <TopBar
            title={title}
            drawerWidth={drawerWidth}
            sidebarCollapsed={sidebarCollapsed}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3, md: 4 },
              mt: '64px',
              minWidth: 0,
              transition: 'padding 300ms ease-in-out',
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </>
  );
}
