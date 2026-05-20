import { NavLink, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const NAV_ITEMS = [
  { label: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
  { label: 'Public Home-page', path: '/admin/cms', icon: <ArticleIcon /> },
  { label: 'Audit Log', path: '/admin/audit-log', icon: <ReceiptLongIcon /> },
];

export default function Sidebar({ drawerWidth = 260 }) {
  const location = useLocation();
  const eventsActive = location.pathname.startsWith('/admin/events');

  return (
    <Drawer
      anchor="right"
      variant="permanent"
      sx={{
        width: { xs: 84, md: drawerWidth },
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: { xs: 84, md: drawerWidth },
          boxSizing: 'border-box',
          borderLeft: '1px solid rgba(109, 60, 207, 0.10)',
          background:
            'linear-gradient(180deg, rgba(255, 251, 255, 0.92) 0%, rgba(246, 240, 255, 0.88) 100%)',
          boxShadow: '-18px 0 48px rgba(51, 29, 95, 0.08)',
          backdropFilter: 'blur(22px)',
          p: { xs: 0.5, md: 1.25 },
        },
      }}
    >
      {/* Brand */}
      <Box sx={{ p: { xs: 1.5, md: 2.5 }, display: 'flex', flexDirection: { xs: 'row', md: 'row-reverse' }, alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1.5, textAlign: 'right' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6D3CCF, #E94B93)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          S
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
            She-Na
          </Typography>
          <Typography variant="subtitle2" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Main Navigation */}
      <Box sx={{ px: { xs: 1, md: 1.5 }, pt: 2 }}>
        <Typography variant="subtitle2" sx={{ px: 1, mb: 1, display: { xs: 'none', md: 'block' }, textTransform: 'uppercase', letterSpacing: 0, color: 'text.secondary', textAlign: 'right' }}>
          Main
        </Typography>
        <List disablePadding>
          <ListItemButton
            component={NavLink}
            to="/admin/dashboard"
            selected={location.pathname.startsWith('/admin/dashboard')}
            id="nav-dashboard"
            sx={{
              borderRadius: 2,
              mb: 0.75,
              flexDirection: { xs: 'row', md: 'row-reverse' },
              justifyContent: { xs: 'center', md: 'flex-start' },
              textAlign: 'right',
              '&.Mui-selected': {
                bgcolor: 'rgba(109, 60, 207, 0.12)',
                color: '#6D3CCF',
                boxShadow: '0 12px 28px rgba(109, 60, 207, 0.14)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: { xs: 0, md: 36 }, color: 'inherit' }}><DashboardIcon /></ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
              sx={{ display: { xs: 'none', md: 'block' } }}
            />
          </ListItemButton>

          <ListItemButton
            component={NavLink}
            to="/admin/events"
            selected={eventsActive}
            id="nav-events"
            sx={{
              borderRadius: 2,
              mb: 0.75,
              flexDirection: { xs: 'row', md: 'row-reverse' },
              justifyContent: { xs: 'center', md: 'flex-start' },
              textAlign: 'right',
              '&.Mui-selected': {
                bgcolor: 'rgba(233, 75, 147, 0.12)',
                color: '#E94B93',
                boxShadow: '0 12px 28px rgba(233, 75, 147, 0.14)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: { xs: 0, md: 36 }, color: 'inherit' }}><EventIcon /></ListItemIcon>
            <ListItemText
              primary="Events"
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 700 }}
              sx={{ display: { xs: 'none', md: 'block' } }}
            />
          </ListItemButton>

          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              selected={location.pathname.startsWith(item.path)}
              id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              sx={{
                borderRadius: 2,
                mb: 0.75,
                flexDirection: { xs: 'row', md: 'row-reverse' },
                justifyContent: { xs: 'center', md: 'flex-start' },
                textAlign: 'right',
                '&.Mui-selected': {
                  bgcolor: 'rgba(109, 60, 207, 0.12)',
                  color: '#6D3CCF',
                  boxShadow: '0 12px 28px rgba(109, 60, 207, 0.14)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 0, md: 36 }, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                sx={{ display: { xs: 'none', md: 'block' } }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>


    </Drawer>
  );
}
