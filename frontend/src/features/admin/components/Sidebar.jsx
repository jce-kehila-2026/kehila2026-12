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
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';

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

  return (
    <Drawer
      anchor="right"
      variant="permanent"
      sx={{
        width: { xs: 84, md: drawerWidth },
        flexShrink: 0,
        transition: 'width 300ms ease-in-out',
        '& .MuiDrawer-paper': {
          width: { xs: 84, md: drawerWidth },
          boxSizing: 'border-box',
          overflowX: 'hidden',
          borderLeft: '1px solid rgba(109, 60, 207, 0.10)',
          background:
            'linear-gradient(180deg, rgba(255, 251, 255, 0.94) 0%, rgba(246, 240, 255, 0.9) 100%)',
          boxShadow: '-18px 0 48px rgba(51, 29, 95, 0.08)',
          backdropFilter: 'blur(22px)',
          p: { xs: 0.5, md: collapsed ? 1 : 1.25 },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'width 300ms ease-in-out, padding 300ms ease-in-out',
        },
      }}
    >
      <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="left" arrow>
        <IconButton
          onClick={onToggleSidebar}
          id="btn-toggle-sidebar"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          sx={{
            position: 'absolute',
            top: 24,
            left: 20,
            zIndex: 4,
            display: { xs: 'none', md: 'inline-flex' },
            width: 52,
            height: 52,
            border: '1px solid rgba(167, 139, 250, 0.22)',
            borderRadius: '50%',
            color: '#4b346f',
            bgcolor: 'rgba(255, 255, 255, 0.78)',
            boxShadow:
              '0 18px 34px rgba(51, 29, 95, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.76)',
            backdropFilter: 'blur(16px)',
            transition:
              'transform 300ms ease-in-out, background 220ms ease-in-out, box-shadow 220ms ease-in-out',
            '&:hover': {
              bgcolor: 'rgba(248, 242, 255, 0.95)',
              boxShadow:
                '0 20px 40px rgba(109, 60, 207, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.86)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          <MenuRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Box
        sx={{
          p: { xs: 1.5, md: collapsed ? '90px 0 18px' : '24px 72px 24px 20px' },
          display: 'flex',
          flexDirection: { xs: 'row', md: collapsed ? 'row' : 'row-reverse' },
          alignItems: 'center',
          justifyContent: { xs: 'center', md: collapsed ? 'center' : 'flex-end' },
          gap: collapsed ? 0 : 1.5,
          textAlign: 'right',
          transition: 'all 300ms ease-in-out',
        }}
      >
        <Box
          sx={{
            width: collapsed ? 46 : 40,
            height: collapsed ? 46 : 40,
            borderRadius: collapsed ? '18px' : 2,
            background: 'linear-gradient(135deg, #6D3CCF, #E94B93)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collapsed ? 22 : 20,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
            boxShadow: collapsed ? '0 16px 32px rgba(109, 60, 207, 0.22)' : 'none',
            transition: 'all 300ms ease-in-out',
          }}
        >
          S
        </Box>
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            width: collapsed ? 0 : 'auto',
            opacity: collapsed ? 0 : 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'opacity 220ms ease-in-out, width 300ms ease-in-out',
          }}
        >
          <Typography variant="h6" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
            She-Na
          </Typography>
          <Typography variant="subtitle2" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ px: { xs: 1, md: collapsed ? 0.25 : 1.5 }, pt: 2, transition: 'padding 300ms ease-in-out' }}>
        <Typography
          variant="subtitle2"
          sx={{
            px: 1,
            mb: 1,
            display: { xs: 'none', md: 'block' },
            textTransform: 'uppercase',
            letterSpacing: 0,
            color: 'text.secondary',
            textAlign: 'right',
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
                  minHeight: 48,
                  mx: { xs: 'auto', md: collapsed ? 'auto' : 0 },
                  mb: 0.75,
                  px: { xs: 1, md: collapsed ? 0 : 1.5 },
                  borderRadius: collapsed ? '18px' : 2,
                  flexDirection: { xs: 'row', md: collapsed ? 'row' : 'row-reverse' },
                  justifyContent: { xs: 'center', md: collapsed ? 'center' : 'flex-start' },
                  textAlign: 'right',
                  color: selected ? item.accent : 'text.secondary',
                  transition:
                    'width 300ms ease-in-out, border-radius 300ms ease-in-out, background 220ms ease-in-out, box-shadow 220ms ease-in-out',
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
          mx: 1.25,
          mb: 2,
          p: 2,
          display: { xs: 'none', md: collapsed ? 'none' : 'block' },
          border: '1px solid rgba(233, 75, 147, 0.12)',
          borderRadius: '22px',
          background:
            'linear-gradient(145deg, rgba(255, 240, 248, 0.92), rgba(246, 238, 255, 0.82))',
          boxShadow: '0 18px 40px rgba(51, 29, 95, 0.1)',
          textAlign: 'right',
        }}
      >
        <SupportAgentIcon sx={{ color: '#E94B93', mb: 1 }} />
        <Typography sx={{ color: '#251947', fontSize: '0.92rem', fontWeight: 800 }}>
          Need Help?
        </Typography>
        <Typography sx={{ color: '#6d6f91', fontSize: '0.76rem', fontWeight: 700, mt: 0.5 }}>
          We're here to support you.
        </Typography>
      </Box>
    </Drawer>
  );
}
