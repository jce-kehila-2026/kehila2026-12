import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useAdmin } from '../context/AdminContext';

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const { isImpersonating, impersonatedDisplayName, impersonatedUserUID, stopImpersonation } =
    useAdmin();

  function handleExit() {
    stopImpersonation();
    navigate('/admin/users');
  }

  if (!isImpersonating) return null;

  return (
    <Box
      id="impersonation-banner"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        '@keyframes bannerPulse': {
          '0%, 100%': { boxShadow: '0 2px 12px rgba(255, 107, 44, 0.4)' },
          '50%': { boxShadow: '0 2px 24px rgba(255, 107, 44, 0.6)' },
        },
        animation: 'bannerPulse 3s ease-in-out infinite',
      }}
    >
      <Alert
        severity="warning"
        variant="filled"
        sx={{
          borderRadius: 0,
          background: 'linear-gradient(90deg, #ff6b2c, #ff8f5c)',
          color: '#fff',
          fontWeight: 600,
          justifyContent: 'center',
          '& .MuiAlert-icon': { color: '#fff' },
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          },
        }}
        action={
          <Button
            color="inherit"
            size="small"
            variant="outlined"
            onClick={handleExit}
            id="btn-exit-impersonation"
            sx={{
              borderColor: 'rgba(255,255,255,0.5)',
              color: '#fff',
              fontWeight: 700,
              '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.15)' },
            }}
          >
            ✕ Exit Impersonation
          </Button>
        }
      >
        ⚠️ Impersonation Active — Viewing as{' '}
        <strong>{impersonatedDisplayName || impersonatedUserUID}</strong>
      </Alert>
    </Box>
  );
}
