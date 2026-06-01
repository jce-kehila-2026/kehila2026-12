import { NavLink, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAdmin } from '../context/AdminContext';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: <DashboardIcon />,
    id: 'nav-dashboard',
    accent: '#6D3CCF',
    active: (pathname) => pathname.startsWith('/admin/dashboard'),
  },
  {
    label: 'Events',
    path: '/admin/events',
    icon: <EventIcon />,
    id: 'nav-events',
    accent: '#E94B93',
    active: (pathname) => pathname.startsWith('/admin/events'),
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: <PeopleIcon />,
    id: 'nav-users',
    accent: '#6D3CCF',
    active: (pathname) => pathname.startsWith('/admin/users'),
  },
  {
    label: 'Public Home-page',
    path: '/admin/cms',
    icon: <ArticleIcon />,
    id: 'nav-public-home-page',
    accent: '#6D3CCF',
    active: (pathname) => pathname.startsWith('/admin/cms'),
  },
  {
    label: 'Audit Log',
    path: '/admin/audit-log',
    icon: <ReceiptLongIcon />,
    id: 'nav-audit-log',
    accent: '#6D3CCF',
    active: (pathname) => pathname.startsWith('/admin/audit-log'),
  },
];

export default function Sidebar({ drawerWidth = 260, collapsed = false, onToggleSidebar }) {
  const location = useLocation();
  const { currentUser, logout } = useAdmin();
  const adminNameSource = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin User';
  const adminName = /tala/i.test(adminNameSource) ? 'Tala Jabaren' : adminNameSource;
  const initials = adminName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD';

  return (
    <Drawer
      anchor="right"
      variant="permanent"
      sx={{
        width: { xs: 84, md: drawerWidth + 24 },
        flexShrink: 0,
        transition: 'width 300ms ease-in-out',
        '& .MuiDrawer-paper': {
          width: { xs: 84, md: drawerWidth },
          top: { xs: 0, md: 16 },
          right: { xs: 0, md: 12 },
          bottom: { xs: 0, md: 16 },
          height: { xs: '100vh', md: 'calc(100vh - 32px)' },
          boxSizing: 'border-box',
          overflow: 'visible',
          border: '1px solid rgba(255,255,255,0.45)',
          borderRadius: { xs: 0, md: '28px' },
          background:
            'radial-gradient(circle at 22% 8%, rgba(233,75,147,0.16), transparent 30%), radial-gradient(circle at 92% 18%, rgba(167,139,250,0.22), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.66), rgba(244,237,255,0.48))',
          boxShadow:
            '-22px 24px 70px rgba(51, 29, 95, 0.16), inset 0 1px 0 rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px) saturate(1.12)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.12)',
          p: { xs: 0.5, md: collapsed ? '18px 14px' : '18px' },
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
              'linear-gradient(110deg, rgba(255,255,255,0.42), transparent 32%, rgba(167,139,250,0.08) 64%, transparent)',
            pointerEvents: 'none',
          },
        },
      }}
    >
      <IconButton
        onClick={onToggleSidebar}
        id="btn-toggle-sidebar"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          sx={{
            position: 'absolute',
            top: 18,
            right: 18,
          zIndex: 4,
          display: { xs: 'none', md: 'inline-flex' },
          width: 42,
          height: 42,
          border: '1px solid rgba(255,255,255,0.62)',
          borderRadius: '50%',
          color: '#6D3CCF',
          bgcolor: 'rgba(255, 255, 255, 0.82)',
          boxShadow:
            '0 16px 30px rgba(109, 60, 207, 0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
          backdropFilter: 'blur(16px)',
          transition:
            'transform 300ms ease-in-out, background 220ms ease-in-out, box-shadow 220ms ease-in-out',
          transform: collapsed ? 'rotate(180deg)' : 'none',
          '&:hover': {
            bgcolor: 'rgba(248, 242, 255, 0.95)',
            boxShadow:
              '0 20px 40px rgba(109, 60, 207, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.86)',
            transform: collapsed ? 'rotate(180deg) scale(1.04)' : 'scale(1.04)',
          },
        }}
      >
        <MenuRoundedIcon fontSize="small" />
      </IconButton>

      <Box
        sx={{
          width: '100%',
          height: { xs: 84, md: 140 },
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'center', md: collapsed ? 'center' : 'space-between' },
          gap: { xs: 0, md: collapsed ? 0 : '16px' },
          mt: { xs: 0, md: '18px' },
          px: { xs: 1.5, md: collapsed ? 0 : '24px' },
          py: 0,
          direction: 'ltr',
          textAlign: 'left',
          transition: 'all 300ms ease-in-out',
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: collapsed ? 0 : 'max-content',
            maxWidth: collapsed ? 0 : 'none',
            minWidth: collapsed ? 0 : 'max-content',
            opacity: collapsed ? 0 : 1,
            overflow: 'visible',
            whiteSpace: 'nowrap',
            transition: 'opacity 220ms ease-in-out, width 300ms ease-in-out',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              overflow: 'visible',
              color: '#24104F',
              fontSize: '16px',
              lineHeight: 1.2,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {adminName}
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              width: 'fit-content',
              mt: 0.35,
              px: '10px',
              height: '22px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              color: '#6D3CCF',
              background: 'rgba(167, 139, 250, 0.18)',
              fontSize: '11px',
              lineHeight: 1,
              fontWeight: 800,
            }}
          >
            ADMIN
          </Typography>
        </Box>
        <Avatar
          src={currentUser?.photoURL || undefined}
          sx={{
            width: collapsed ? 44 : 48,
            height: collapsed ? 44 : 48,
            background: 'linear-gradient(135deg, #6D3CCF, #E94B93)',
            fontSize: 15,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
            border: '2px solid rgba(255, 255, 255, 0.78)',
            boxShadow: '0 16px 32px rgba(109, 60, 207, 0.18)',
            transition: 'all 300ms ease-in-out',
          }}
        >
          {initials}
        </Avatar>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.48)', mx: collapsed ? 0 : -2 }} />

      <Box sx={{ px: { xs: 1, md: 0 }, pt: 2, transition: 'padding 300ms ease-in-out' }}>
        <Typography
          variant="subtitle2"
          sx={{
            px: collapsed ? 0 : 1.25,
            mb: 1.25,
            display: { xs: 'none', md: 'block' },
            textTransform: 'uppercase',
            letterSpacing: 0,
            color: 'text.secondary',
            textAlign: collapsed ? 'center' : 'left',
            opacity: collapsed ? 0 : 1,
            height: collapsed ? 0 : 'auto',
            overflow: 'hidden',
            transition: 'opacity 220ms ease-in-out, height 300ms ease-in-out',
          }}
        >
          Main
        </Typography>
        <List disablePadding>
          {NAV_ITEMS.map((item) => {
            const selected = item.active(location.pathname);
            const button = (
              <ListItemButton
                component={NavLink}
                to={item.path}
                selected={selected}
                id={item.id}
                sx={{
                  width: { xs: 52, md: collapsed ? 52 : 'auto' },
                  minHeight: 52,
                  mx: { xs: 'auto', md: collapsed ? 'auto' : 0 },
                  mb: '10px',
                  px: { xs: 1, md: collapsed ? 0 : '18px' },
                  borderRadius: '18px',
                  flexDirection: 'row-reverse',
                  justifyContent: { xs: 'center', md: collapsed ? 'center' : 'flex-start' },
                  textAlign: 'right',
                  color: selected ? item.accent : 'text.secondary',
                  gap: collapsed ? 0 : '14px',
                  transition:
                    'width 300ms ease-in-out, border-radius 300ms ease-in-out, background 220ms ease-in-out, box-shadow 220ms ease-in-out',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.38)',
                    boxShadow: '0 12px 26px rgba(51,29,95,0.08)',
                  },
                  '&.Mui-selected': {
                    bgcolor: selected ? `${item.accent}1f` : 'rgba(109, 60, 207, 0.12)',
                    color: item.accent,
                    boxShadow: `0 12px 28px ${item.accent}24`,
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: `${item.accent}26`,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: { xs: 0, md: collapsed ? 0 : 36 },
                    color: 'inherit',
                    justifyContent: 'center',
                    '& svg': {
                      width: 22,
                      height: 22,
                    },
                    transition: 'min-width 300ms ease-in-out',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: selected ? 700 : 500,
                    noWrap: true,
                  }}
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    flex: collapsed ? '0 0 0' : '1 1 auto',
                    width: collapsed ? 0 : 'auto',
                    opacity: collapsed ? 0 : 1,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 220ms ease-in-out, width 300ms ease-in-out, flex-basis 300ms ease-in-out',
                  }}
                />
              </ListItemButton>
            );

            return (
              <Tooltip
                title={collapsed ? item.label : ''}
                placement="left"
                arrow
                disableHoverListener={!collapsed}
                key={item.path}
              >
                {button}
              </Tooltip>
            );
          })}
        </List>
      </Box>

      <Box
        sx={{
          mt: 'auto',
          px: { xs: 1, md: 0 },
          pb: 2,
          transition: 'padding 300ms ease-in-out',
        }}
      >
        <Tooltip title={collapsed ? 'Logout' : ''} placement="left" arrow disableHoverListener={!collapsed}>
          <ListItemButton
            onClick={logout}
            id="btn-logout"
            sx={{
              width: { xs: 52, md: collapsed ? 52 : 'auto' },
              minHeight: 52,
              mx: { xs: 'auto', md: collapsed ? 'auto' : 0 },
              px: { xs: 1, md: collapsed ? 0 : '18px' },
              border: '1px solid rgba(233, 75, 147, 0.12)',
              borderRadius: '18px',
              flexDirection: 'row-reverse',
              justifyContent: { xs: 'center', md: collapsed ? 'center' : 'flex-start' },
              color: '#E94B93',
              background:
                'linear-gradient(145deg, rgba(255, 240, 248, 0.62), rgba(246, 238, 255, 0.42))',
              boxShadow: '0 12px 28px rgba(233, 75, 147, 0.1)',
              textAlign: 'right',
              gap: collapsed ? 0 : '14px',
              transition: 'all 300ms ease-in-out',
              '&:hover': {
                background:
                  'linear-gradient(145deg, rgba(255, 229, 243, 0.95), rgba(241, 231, 255, 0.84))',
                boxShadow: '0 16px 34px rgba(233, 75, 147, 0.15)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: { xs: 0, md: collapsed ? 0 : 36 },
                color: 'inherit',
                justifyContent: 'center',
                '& svg': {
                  width: 22,
                  height: 22,
                },
                transition: 'min-width 300ms ease-in-out',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 800, noWrap: true }}
              sx={{
                display: { xs: 'none', md: 'block' },
                flex: collapsed ? '0 0 0' : '1 1 auto',
                width: collapsed ? 0 : 'auto',
                opacity: collapsed ? 0 : 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'opacity 220ms ease-in-out, width 300ms ease-in-out, flex-basis 300ms ease-in-out',
              }}
            />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
