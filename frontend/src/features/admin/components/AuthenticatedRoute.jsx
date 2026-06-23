import { Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useAdmin } from '../context/AdminContext';

export default function AuthenticatedRoute({ children }) {
  const { currentUser, loading, mustChangePassword, accountInactive, logout } = useAdmin();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" color="text.disabled">
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (accountInactive) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', gap: '0.875rem', px: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Your account has been deactivated. Please contact the organization.
        </Typography>
        <Button variant="outlined" color="inherit" onClick={logout} sx={{ mt: 1, borderRadius: 999 }}>
          Back to login
        </Button>
      </Box>
    );
  }

  if (mustChangePassword) {
    return <Navigate to="/set-password" replace />;
  }

  return children;
}
