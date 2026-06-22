import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Sidebar from './Sidebar';
import ImpersonationBanner from './ImpersonationBanner';
import AdminLanguageSwitcher from './AdminLanguageSwitcher';
import { AdminLocaleProvider, useAdminLocale } from '../context/AdminLocaleContext';
import './AdminLayout.css';

const DRAWER_WIDTH = 270;
const COLLAPSED_DRAWER_WIDTH = 88;

export default function AdminLayout() {
  return (
    <AdminLocaleProvider>
      <AdminLayoutInner />
    </AdminLocaleProvider>
  );
}

function AdminLayoutInner() {
  const { direction } = useAdminLocale();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const drawerWidth = sidebarCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <>
      <ImpersonationBanner />
      <Box
        className="admin-layout"
        sx={{
          '--admin-sidebar-width': `${drawerWidth}px`,
          '--admin-modal-offset': sidebarCollapsed ? '140px' : '320px',
          display: 'flex',
          flexDirection: 'row',
          direction,
          minHeight: '100vh',
          background:
            'radial-gradient(circle at 18% 10%, rgba(252, 231, 243, 0.72), transparent 28%), radial-gradient(circle at 85% 5%, rgba(167, 139, 250, 0.24), transparent 34%), linear-gradient(135deg, #faf7ff 0%, #ffffff 46%, #fbf7ff 100%)',
        }}
      >
        <Sidebar
          drawerWidth={drawerWidth}
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
        />
        <Box
          className="admin-content-frame"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            direction,
            transition: 'all 300ms ease-in-out',
          }}
        >
          <Box
            className="admin-topbar"
            sx={{
              display: 'flex',
              justifyContent: direction === 'rtl' ? 'flex-start' : 'flex-end',
              alignItems: 'center',
              px: { xs: 2, sm: 3, md: '32px' },
              pt: { xs: 1.5, md: 2.5 },
              pb: 0,
              flexShrink: 0,
            }}
          >
            <AdminLanguageSwitcher />
          </Box>
          <Box
            component="main"
            className="admin-main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3, md: '32px' },
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
