import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useAdmin } from '../context/AdminContext';
import { useDirection } from '../context/DirectionContext';

export default function TopBar({ title, drawerWidth = 260 }) {
  const { currentUser, userRole, logout } = useAdmin();
  const { direction, toggleDirection } = useDirection();

  const initials = currentUser?.email
    ? currentUser.email.substring(0, 2).toUpperCase()
    : '??';

  const displayRole = userRole || 'Unknown';

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { xs: 'calc(100% - 84px)', md: `calc(100% - ${drawerWidth}px)` },
        mr: { xs: '84px', md: `${drawerWidth}px` },
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        color: 'text.primary',
        borderBottom: '1px solid rgba(109, 60, 207, 0.12)',
        boxShadow: '0 10px 35px rgba(51, 29, 95, 0.06)',
        backdropFilter: 'blur(16px)',
        transition: 'width 300ms ease-in-out, margin-right 300ms ease-in-out',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, minWidth: 0 }}>
            {title || 'Dashboard'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Direction Toggle */}
          <Tooltip title={direction === 'rtl' ? 'Switch to LTR' : 'Switch to RTL'}>
            <IconButton onClick={toggleDirection} size="small" color="inherit" id="btn-toggle-dir">
              <SwapHorizIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton size="small" color="inherit" id="btn-notifications">
              <Badge color="primary" variant="dot">
                <NotificationsNoneIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                background: 'linear-gradient(135deg, #DF327B, #E85B95)',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Welcome back
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'capitalize' }}>
                {currentUser?.email || displayRole}
              </Typography>
            </Box>
          </Box>

          {/* Logout */}
          <Button
            variant="text"
            size="small"
            color="inherit"
            startIcon={<LogoutIcon fontSize="small" />}
            onClick={logout}
            id="btn-logout"
            sx={{ color: 'text.secondary' }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
