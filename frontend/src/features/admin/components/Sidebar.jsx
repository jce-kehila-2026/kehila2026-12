import { NavLink, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAdmin } from '../context/AdminContext';
import { useAdminLocale } from '../context/AdminLocaleContext';
import SidebarCollapseButton from '../../../shared/components/SidebarCollapseButton';

const NAV_ITEMS = [
  {
    labelKey: 'navDashboard',
    path: '/admin/dashboard',
    icon: <DashboardIcon fontSize="small" />,
    id: 'nav-dashboard',
    active: (pathname) => pathname.startsWith('/admin/dashboard'),
  },
  {
    labelKey: 'navEvents',
    path: '/admin/events',
    icon: <EventIcon fontSize="small" />,
    id: 'nav-events',
    active: (pathname) => pathname.startsWith('/admin/events'),
  },
  {
    labelKey: 'navUsers',
    path: '/admin/users',
    icon: <PeopleIcon fontSize="small" />,
    id: 'nav-users',
    active: (pathname) => pathname.startsWith('/admin/users'),
  },
  {
    labelKey: 'navBookings',
    path: '/admin/appointments',
    icon: <CalendarMonthIcon fontSize="small" />,
    id: 'nav-bookings',
    active: (pathname) => pathname.startsWith('/admin/appointments'),
  },
  {
    labelKey: 'navForms',
    path: '/admin/forms',
    icon: <DescriptionOutlinedIcon fontSize="small" />,
    id: 'nav-forms',
    active: (pathname) => pathname.startsWith('/admin/forms'),
  },
  {
    labelKey: 'navPublicHomePage',
    path: '/admin/cms',
    icon: <HomeWorkOutlinedIcon fontSize="small" />,
    id: 'nav-public-home-page',
    active: (pathname) => pathname.startsWith('/admin/cms'),
  },
  {
    labelKey: 'navCommunity',
    path: '/admin/community',
    icon: <ForumOutlinedIcon fontSize="small" />,
    id: 'nav-community',
    active: (pathname) => pathname.startsWith('/admin/community'),
  },
  {
    labelKey: 'navUpdates',
    path: '/admin/updates',
    icon: <CampaignOutlinedIcon fontSize="small" />,
    id: 'nav-updates',
    active: (pathname) => pathname.startsWith('/admin/updates'),
  },
  {
    labelKey: 'navAuditLog',
    path: '/admin/audit-log',
    icon: <ReceiptLongIcon fontSize="small" />,
    id: 'nav-audit-log',
    active: (pathname) => pathname.startsWith('/admin/audit-log'),
  },
];

export default function Sidebar({ drawerWidth = 260, collapsed = false, onToggleSidebar }) {
  const location = useLocation();
  const { currentUser, logout } = useAdmin();
  const { t } = useAdminLocale();
  const adminNameSource = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Tala Jabaren';
  const adminName = /tala/i.test(adminNameSource) ? 'Tala Jabaren' : adminNameSource;
  const initials = adminName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TA';

  return (
    <Drawer
      anchor="left"
      className={`admin-sidebar ${collapsed ? 'is-collapsed' : 'is-expanded'}`}
      PaperProps={{
        className: `admin-sidebar-paper ${collapsed ? 'is-collapsed' : 'is-expanded'}`,
      }}
      variant="permanent"
      sx={{
        width: { xs: '5.25rem', md: drawerWidth + 24 },
        flexShrink: 0,
        transition: 'width 300ms ease-in-out',
        direction: 'ltr',
        '& .MuiDrawer-paper': {
          width: { xs: '5.25rem', md: drawerWidth },
          top: { xs: 0, md: 16 },
          left: { xs: 0, md: 12 },
          right: 'auto !important',
          bottom: { xs: 0, md: 16 },
          height: { xs: '100vh', md: 'calc(100vh - 32px)' },
          direction: 'ltr',
          boxSizing: 'border-box',
          overflow: 'hidden',
          borderRadius: { xs: 0, md: '24px' },
          p: { xs: '18px 10px', md: collapsed ? '24px 12px' : '28px 20px' },
          transition: 'width 300ms ease-in-out, padding 300ms ease-in-out, border-radius 300ms ease-in-out',
        },
      }}
    >
      <div className={`admin-sidebar-profile${collapsed ? ' is-collapsed' : ''}`}>
        <div className="admin-sidebar-profile__main">
          <Avatar
            src={currentUser?.photoURL || undefined}
            className="admin-sidebar-profile__avatar"
          >
            {initials}
          </Avatar>
          <div className="admin-sidebar-profile__copy">
            <span className="admin-sidebar-profile__name">{adminName}</span>
            <span className="admin-sidebar-profile__badge">{t('adminBadge')}</span>
          </div>
        </div>
        <SidebarCollapseButton
          collapsed={collapsed}
          onClick={onToggleSidebar}
          expandLabel={t('expandSidebar')}
          collapseLabel={t('collapseSidebar')}
          id="btn-toggle-sidebar"
        />
      </div>

      <List disablePadding className="admin-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const selected = item.active(location.pathname, location.search);
          const button = (
            <ListItemButton
              component={NavLink}
              to={item.path}
              selected={selected}
              id={item.id}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={t(item.labelKey)} />
            </ListItemButton>
          );

          return (
            <Tooltip
              title={collapsed ? t(item.labelKey) : ''}
              placement="right"
              arrow
              disableHoverListener={!collapsed}
              key={item.path}
            >
              {button}
            </Tooltip>
          );
        })}
      </List>

      <Tooltip title={collapsed ? t('logout') : ''} placement="right" arrow disableHoverListener={!collapsed}>
        <ListItemButton
          onClick={logout}
          id="btn-logout"
          className="admin-sidebar-logout"
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('logout')} />
        </ListItemButton>
      </Tooltip>
    </Drawer>
  );
}
