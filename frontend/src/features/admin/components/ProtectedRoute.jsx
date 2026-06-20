import { Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LockIcon from '@mui/icons-material/Lock';
import { useAdmin } from '../context/AdminContext';
import { getStoredAdminLocale } from '../context/AdminLocaleContext';
import { createAdminT } from '../i18n/adminUiTranslations';

export default function ProtectedRoute({ children, requiredRole = 'admin' }) {
  const { currentUser, userRole, loading } = useAdmin();
  // This gate renders outside AdminLocaleProvider (it wraps AdminLayout), so
  // resolve the persisted admin locale directly instead of via useAdminLocale.
  const locale = getStoredAdminLocale();
  const t = createAdminT(locale);
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  if (loading) {
    return (
      <Box dir={direction} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" color="text.disabled">
          {t('gateVerifyingAccess')}
        </Typography>
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'admin') {
    return (
      <Box dir={direction} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '0.75rem' }}>
        <LockIcon sx={{ fontSize: '3.5rem', color: 'text.disabled' }} />
        <Typography variant="h5">{t('gateAccessDenied')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
          {t('gateAccessDeniedBody')}
        </Typography>
        <Button variant="outlined" color="inherit" onClick={() => window.history.back()} sx={{ mt: 1 }}>
          {t('gateGoBack')}
        </Button>
      </Box>
    );
  }

  return children;
}
