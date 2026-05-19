import { NavLink, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import ShieldIcon from '@mui/icons-material/Shield';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const NAV_ITEMS = [
  { label: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
  { label: 'Role Management', path: '/admin/roles', icon: <ShieldIcon /> },
  { label: 'CMS', path: '/admin/cms', icon: <ArticleIcon /> },
  { label: 'Audit Log', path: '/admin/audit-log', icon: <ReceiptLongIcon /> },
];

export default function Sidebar({ drawerWidth = 260 }) {
  const location = useLocation();
  const eventsActive = location.pathname.startsWith('/admin/events') || location.pathname.startsWith('/admin/appointments');
  const activeEventType = new URLSearchParams(location.search).get('type');

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: { xs: 84, md: drawerWidth },
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: { xs: 84, md: drawerWidth },
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(109, 60, 207, 0.12)',
          background:
            'linear-gradient(180deg, rgba(248, 243, 255, 0.96) 0%, rgba(255, 255, 255, 0.96) 100%)',
          boxShadow: '12px 0 35px rgba(51, 29, 95, 0.06)',
        },
      }}
    >
      {/* Brand */}
      <Box sx={{ p: { xs: 1.5, md: 2.5 }, display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1.5 }}>
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
        <Typography variant="subtitle2" sx={{ px: 1, mb: 1, display: { xs: 'none', md: 'block' }, textTransform: 'uppercase', letterSpacing: 0, color: 'text.secondary' }}>
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
              justifyContent: { xs: 'center', md: 'flex-start' },
              '&.Mui-selected': { bgcolor: 'rgba(109, 60, 207, 0.1)', color: '#6D3CCF' },
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
              justifyContent: { xs: 'center', md: 'flex-start' },
              '&.Mui-selected': {
                bgcolor: 'rgba(233, 75, 147, 0.12)',
                color: '#E94B93',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: { xs: 0, md: 36 }, color: 'inherit' }}><EventIcon /></ListItemIcon>
            <ListItemText
              primary="Events"
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 700 }}
              sx={{ display: { xs: 'none', md: 'block' } }}
            />
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              {eventsActive ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Box>
          </ListItemButton>

          <Collapse in={eventsActive} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ display: { xs: 'none', md: 'block' }, mb: 1, pl: 1 }}>
              <ListItemButton
                component={NavLink}
                to="/admin/events?type=workshops"
                selected={location.pathname.startsWith('/admin/events') && activeEventType !== 'appointments'}
                id="nav-workshops"
                sx={{
                  borderLeft: '2px solid rgba(109, 60, 207, 0.18)',
                  borderRadius: 2,
                  pl: 2,
                  '&.Mui-selected': { bgcolor: 'rgba(233, 75, 147, 0.08)', color: '#2f2851' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}><PeopleIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Workshops" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
              </ListItemButton>
              <ListItemButton
                component={NavLink}
                to="/admin/events?type=appointments"
                selected={location.pathname.startsWith('/admin/events') && activeEventType === 'appointments'}
                id="nav-appointments"
                sx={{
                  borderLeft: '2px solid rgba(109, 60, 207, 0.18)',
                  borderRadius: 2,
                  pl: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}><CalendarTodayIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Appointments" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
              </ListItemButton>
            </List>
          </Collapse>

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
                justifyContent: { xs: 'center', md: 'flex-start' },
                '&.Mui-selected': { bgcolor: 'rgba(109, 60, 207, 0.1)', color: '#6D3CCF' },
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
