import { Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useAdmin } from '../context/AdminContext';

export default function AuthenticatedRoute({ children }) {
  const { currentUser, loading } = useAdmin();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
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

  return children;
}
