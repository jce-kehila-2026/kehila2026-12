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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import ShieldIcon from '@mui/icons-material/Shield';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
  { label: 'Events', path: '/admin/events', icon: <EventIcon /> },
  { label: 'Appointments', path: '/admin/appointments', icon: <CalendarTodayIcon /> },
  { label: 'CMS', path: '/admin/cms', icon: <ArticleIcon /> },
  { label: 'Users', path: '/admin/users', icon: <PeopleIcon /> },
  { label: 'Role Management', path: '/admin/roles', icon: <ShieldIcon /> },
  { label: 'Audit Log', path: '/admin/audit-log', icon: <ReceiptLongIcon /> },
];

export default function Sidebar({ drawerWidth = 260 }) {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      {/* Brand */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #DF327B, #E85B95)',
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
        <Box>
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
      <Box sx={{ px: 1.5, pt: 2 }}>
        <Typography variant="subtitle2" sx={{ px: 1, mb: 1 }}>
          Main
        </Typography>
        <List disablePadding>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              selected={location.pathname.startsWith(item.path)}
              id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>


    </Drawer>
  );
}
