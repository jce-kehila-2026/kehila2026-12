import { Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LockIcon from '@mui/icons-material/Lock';
import { useAdmin } from '../context/AdminContext';

export default function ProtectedRoute({ children, requiredRole = 'admin' }) {
  const { currentUser, userRole, loading } = useAdmin();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" color="text.disabled">
          Verifying access…
        </Typography>
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'admin') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: 1.5 }}>
        <LockIcon sx={{ fontSize: '3.5rem', color: 'text.disabled' }} />
        <Typography variant="h5">Access Denied</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
          You don't have permission to view this page. Contact an Admin to request access.
        </Typography>
        <Button variant="outlined" color="inherit" onClick={() => window.history.back()} sx={{ mt: 1 }}>
          ← Go Back
        </Button>
      </Box>
    );
  }

  return children;
}
