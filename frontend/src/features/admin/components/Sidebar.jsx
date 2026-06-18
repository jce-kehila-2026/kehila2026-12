import { NavLink, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
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
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import TranslateIcon from '@mui/icons-material/Translate';
import { useAdmin } from '../context/AdminContext';
import { useAdminLocale } from '../context/AdminLocaleContext';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: <DashboardIcon />,
    id: 'nav-dashboard',
    active: (pathname) => pathname.startsWith('/admin/dashboard'),
  },
  {
    label: 'Events',
    path: '/admin/events',
    icon: <EventIcon />,
    id: 'nav-events',
    active: (pathname) => pathname.startsWith('/admin/events'),
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: <PeopleIcon />,
    id: 'nav-users',
    active: (pathname) => pathname.startsWith('/admin/users'),
  },
  {
    label: 'Bookings',
    path: '/admin/appointments',
    icon: <CalendarMonthIcon />,
    id: 'nav-bookings',
    active: (pathname) => pathname.startsWith('/admin/appointments'),
  },
  {
    label: 'Forms',
    path: '/admin/forms',
    icon: <DescriptionOutlinedIcon />,
    id: 'nav-forms',
    active: (pathname) => pathname.startsWith('/admin/forms'),
  },
  {
    label: 'Public Home-page',
    path: '/admin/cms',
    icon: <HomeWorkOutlinedIcon />,
    id: 'nav-public-home-page',
    active: (pathname) => pathname.startsWith('/admin/cms'),
  },
  {
    label: 'Community',
    path: '/admin/community',
    icon: <ForumOutlinedIcon />,
    id: 'nav-community',
    active: (pathname) => pathname.startsWith('/admin/community'),
  },
  {
    label: 'Updates',
    path: '/admin/updates',
    icon: <CampaignOutlinedIcon />,
    id: 'nav-updates',
    active: (pathname) => pathname.startsWith('/admin/updates'),
  },
  {
    label: 'Audit Log',
    path: '/admin/audit-log',
    icon: <ReceiptLongIcon />,
    id: 'nav-audit-log',
    active: (pathname) => pathname.startsWith('/admin/audit-log'),
  },
  {
    label: 'Settings',
    path: '/admin/users?tab=roles',
    icon: <SettingsOutlinedIcon />,
    id: 'nav-settings',
    active: (pathname, search) => pathname.startsWith('/admin/users') && search.includes('tab=roles'),
  },
];

export default function Sidebar({ drawerWidth = 260, collapsed = false, onToggleSidebar }) {
  const location = useLocation();
  const { currentUser, logout } = useAdmin();
  const { locale, setLocale, t } = useAdminLocale();
  const currentLangLabel = locale === 'he' ? t('languageHebrew') : t('languageEnglish');
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
        className: 'admin-sidebar-paper',
        style: {
          left: typeof drawerWidth === 'number' && drawerWidth <= 88 ? 0 : 12,
          right: 'auto',
        },
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
          overflow: 'visible',
          border: '1px solid rgba(255,255,255,0.52)',
          borderRadius: { xs: 0, md: '30px' },
          background:
            'radial-gradient(circle at 20% 8%, rgba(224,82,151,0.18), transparent 30%), radial-gradient(circle at 88% 18%, rgba(167,139,250,0.28), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.64), rgba(244,237,255,0.48))',
          boxShadow:
            '22px 24px 70px rgba(51, 29, 95, 0.14), inset 0 1px 0 rgba(255,255,255,0.78)',
          backdropFilter: 'blur(22px) saturate(1.16)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.16)',
          p: { xs: '18px 10px 86px', md: collapsed ? '20px 14px 86px' : '20px 18px 86px' },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'width 300ms ease-in-out, padding 300ms ease-in-out, border-radius 300ms ease-in-out',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background:
              'linear-gradient(110deg, rgba(255,255,255,0.46), transparent 30%, rgba(167,139,250,0.12) 62%, transparent)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '1px',
            borderRadius: 'inherit',
            background:
              'repeating-linear-gradient(90deg, rgba(109,53,184,0.035) 0 2px, transparent 2px 15px)',
            opacity: 0.36,
            pointerEvents: 'none',
            maskImage: 'linear-gradient(180deg, black, transparent 92%)',
          },
        },
      }}
    >
      <IconButton
        onClick={onToggleSidebar}
        className="admin-sidebar-toggle"
        id="btn-toggle-sidebar"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <KeyboardDoubleArrowRightRoundedIcon fontSize="small" /> : <MenuRoundedIcon fontSize="small" />}
      </IconButton>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: '3.625rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '0.75rem',
          pb: 2.5,
          mb: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.5)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', width: '100%' }}>
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : 'auto',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'opacity 220ms ease-in-out, width 300ms ease-in-out',
            }}
          >
            <Typography sx={{ color: '#24104F', fontSize: '1rem', fontWeight: 800, lineHeight: 1.15 }}>
              {adminName}
            </Typography>
            <Typography
              sx={{
                mt: 0.6,
                width: 'fit-content',
                px: '9px',
                height: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 999,
                color: '#6D35B8',
                background: 'rgba(167,139,250,0.18)',
                fontSize: '0.6875rem',
                fontWeight: 800,
                lineHeight: 1,
              }}
          >
            ADMIN
          </Typography>
          </Box>
          <Avatar
            src={currentUser?.photoURL || undefined}
            sx={{
              width: '2.75rem',
              height: '2.75rem',
              flex: '0 0 auto',
              ml: 'auto',
              color: '#fff',
              background: 'linear-gradient(135deg, #6D35B8, #E05297)',
              border: '2px solid rgba(255,255,255,0.78)',
              boxShadow: '0 14px 28px rgba(109,53,184,0.16)',
              fontSize: '0.875rem',
              fontWeight: 800,
            }}
          >
            {initials}
          </Avatar>
        </Box>
      </Box>

      <List
        disablePadding
        sx={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          overflow: 'hidden',
          pb: 1,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const selected = item.active(location.pathname, location.search);
          const button = (
            <ListItemButton
              component={NavLink}
              to={item.path}
              selected={selected}
              id={item.id}
              sx={{
                width: { xs: '3.25rem', md: collapsed ? 52 : 'auto' },
                minHeight: '3.25rem',
                position: 'relative',
                mx: { xs: 'auto', md: collapsed ? 'auto' : 0 },
                mb: '9px',
                px: { xs: 1, md: collapsed ? 0 : '17px' },
                borderRadius: collapsed ? '18px' : '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'center', md: collapsed ? 'center' : 'flex-end' },
                color: selected ? '#24104F' : 'rgba(36,16,79,0.64)',
                gap: collapsed ? 0 : '14px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.52)',
                  color: '#24104F',
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.78)',
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.92), rgba(255,255,255,0.54))',
                  boxShadow: '0 16px 34px rgba(109,53,184,0.14)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: collapsed ? -14 : -18,
                    top: 12,
                    bottom: 12,
                    width: '0.25rem',
                    borderRadius: 999,
                    background: 'linear-gradient(180deg, #A78BFA, #E05297)',
                    boxShadow: '0 0 18px rgba(167,139,250,0.72)',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  order: 2,
                  minWidth: 0,
                  color: 'inherit',
                  justifyContent: 'center',
                  flex: '0 0 auto',
                  '& svg': { width: '1.375rem', height: '1.375rem' },
                  transition: 'all 0.3s ease',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.94rem',
                  fontWeight: selected ? 800 : 650,
                  noWrap: true,
                  sx: {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
                sx={{
                  order: 1,
                  display: { xs: 'none', md: 'block' },
                  flex: collapsed ? '0 0 0' : '0 1 auto',
                  width: collapsed ? 0 : 'auto',
                  maxWidth: collapsed ? 0 : 'none',
                  opacity: collapsed ? 0 : 1,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  pointerEvents: collapsed ? 'none' : 'auto',
                  transition: 'all 0.3s ease',
                }}
              />
            </ListItemButton>
          );

          return (
            <Tooltip
              title={collapsed ? item.label : ''}
              placement="right"
              arrow
              disableHoverListener={!collapsed}
              key={item.path}
            >
              {button}
            </Tooltip>
          );
        })}

        <Tooltip title={collapsed ? t('selectLanguage') : ''} placement="right" arrow disableHoverListener={!collapsed}>
          <ListItemButton
            onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
            id="btn-admin-language"
            aria-label={t('selectLanguage')}
            sx={{
              width: { xs: '3.25rem', md: collapsed ? 52 : 'auto' },
              minHeight: '3.25rem',
              mx: { xs: 'auto', md: collapsed ? 'auto' : 0 },
              mb: '9px',
              px: { xs: 1, md: collapsed ? 0 : '17px' },
              borderRadius: collapsed ? '18px' : '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'center', md: collapsed ? 'center' : 'flex-end' },
              color: 'rgba(36,16,79,0.64)',
              gap: collapsed ? 0 : '14px',
              transition: 'all 0.3s ease',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.52)', color: '#24104F' },
            }}
          >
            <ListItemIcon
              sx={{
                order: 2,
                minWidth: 0,
                color: 'inherit',
                justifyContent: 'center',
                flex: '0 0 auto',
                '& svg': { width: '1.375rem', height: '1.375rem' },
              }}
            >
              <TranslateIcon />
            </ListItemIcon>
            <ListItemText
              primary={currentLangLabel}
              primaryTypographyProps={{ fontSize: '0.94rem', fontWeight: 650, noWrap: true }}
              sx={{
                order: 1,
                display: { xs: 'none', md: 'block' },
                flex: collapsed ? '0 0 0' : '0 1 auto',
                width: collapsed ? 0 : 'auto',
                maxWidth: collapsed ? 0 : 'none',
                opacity: collapsed ? 0 : 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                pointerEvents: collapsed ? 'none' : 'auto',
                transition: 'all 0.3s ease',
              }}
            />
          </ListItemButton>
        </Tooltip>
      </List>

      <Tooltip title={collapsed ? 'Logout' : ''} placement="right" arrow disableHoverListener={!collapsed}>
        <ListItemButton
          onClick={logout}
          id="btn-logout"
          sx={{
            width: { xs: '3.25rem', md: collapsed ? 52 : 'auto' },
            minHeight: '3rem',
            position: 'absolute',
            zIndex: 1,
            left: { xs: 16, md: collapsed ? 18 : 18 },
            right: { xs: 16, md: collapsed ? 18 : 18 },
            bottom: 24,
            mx: 0,
            px: { xs: 1, md: collapsed ? 0 : '18px' },
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'center', md: collapsed ? 'center' : 'flex-end' },
            color: '#E05297',
            gap: collapsed ? 0 : '14px',
            background: 'rgba(255,255,255,0.68)',
            border: '1px solid rgba(255,255,255,0.54)',
            boxShadow: '0 14px 28px rgba(224,82,151,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(252,231,243,0.86)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              order: 2,
              minWidth: 0,
              color: 'inherit',
              justifyContent: 'center',
              flex: '0 0 auto',
              '& svg': { width: '1.3125rem', height: '1.3125rem' },
              transition: 'all 0.3s ease',
            }}
          >
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontSize: '0.94rem',
              fontWeight: 800,
              noWrap: true,
              sx: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
            sx={{
              order: 1,
              display: { xs: 'none', md: 'block' },
              flex: collapsed ? '0 0 0' : '0 1 auto',
              width: collapsed ? 0 : 'auto',
              maxWidth: collapsed ? 0 : 'none',
              opacity: collapsed ? 0 : 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              pointerEvents: collapsed ? 'none' : 'auto',
              transition: 'all 0.3s ease',
            }}
          />
        </ListItemButton>
      </Tooltip>
    </Drawer>
  );
}
