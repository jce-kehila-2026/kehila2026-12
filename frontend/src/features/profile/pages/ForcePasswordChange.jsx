// First-login gate for members approved from a join request.
//
// They sign in with the temporary password emailed to them; the
// `mustChangePassword` flag on their users/{uid} doc routes them here (via
// AuthenticatedRoute) and they cannot use the app until they set their own
// password. updatePassword works without re-auth because they just signed in.
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { updatePassword } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { auth, db } from '../../../firebase';
import { useAdmin } from '../../admin/context/AdminContext';

const MIN_LENGTH = 8;

export default function ForcePasswordChange() {
  const navigate = useNavigate();
  const { currentUser, loading, mustChangePassword, clearMustChangePassword } = useAdmin();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Only reachable while logged in and still flagged.
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!mustChangePassword) return <Navigate to="/home" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (newPassword.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The passwords don’t match.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        mustChangePassword: false,
        updatedAt: serverTimestamp(),
      });
      clearMustChangePassword();
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Force password change failed:', err);
      if (err?.code === 'auth/weak-password') {
        setError('Please choose a stronger password.');
      } else if (err?.code === 'auth/requires-recent-login') {
        setError('For security, please sign in again and then set your password.');
      } else {
        setError('Could not update your password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const toggleAdornment = (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setShowPassword((value) => !value)}
        edge="end"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        sx={{ color: '#9d5bd6' }}
      >
        {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px',
      bgcolor: 'rgba(255,255,255,0.9)',
      '& fieldset': { borderColor: 'rgba(181, 123, 232, 0.28)' },
      '&:hover fieldset': { borderColor: 'rgba(124, 58, 237, 0.4)' },
      '&.Mui-focused fieldset': { borderColor: '#B57BE8' },
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background:
          'radial-gradient(circle at 14% 18%, rgba(223, 50, 123, 0.12), transparent 32%), radial-gradient(circle at 88% 8%, rgba(109, 60, 207, 0.16), transparent 36%), linear-gradient(135deg, #FAF7FF 0%, #FFF9FC 50%, #F7FBFF 100%)',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 460,
          p: { xs: 3, md: 4.5 },
          borderRadius: '28px',
          bgcolor: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(130, 92, 206, 0.16)',
          boxShadow: '0 30px 80px rgba(91, 57, 145, 0.16)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Stack spacing={2.5}>
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: '3.5rem',
                height: '3.5rem',
                mx: 'auto',
                mb: 1.5,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                background: 'linear-gradient(135deg, #7C3AED 0%, #DF327B 100%)',
              }}
            >
              <LockOutlinedIcon />
            </Box>
            <Typography variant="h5" fontWeight={950} sx={{ color: '#100B2F' }}>
              Set your password
            </Typography>
            <Typography sx={{ mt: 0.8, color: '#5E587E' }}>
              Welcome! For your security, please replace your temporary password with one of your own to continue.
            </Typography>
          </Box>

          <TextField
            label="New password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            fullWidth
            autoComplete="new-password"
            sx={fieldSx}
            helperText={`At least ${MIN_LENGTH} characters.`}
            InputProps={{ endAdornment: toggleAdornment }}
          />
          <TextField
            label="Confirm new password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            fullWidth
            autoComplete="new-password"
            sx={fieldSx}
            InputProps={{ endAdornment: toggleAdornment }}
          />

          {error ? <Alert severity="error" sx={{ borderRadius: '14px' }}>{error}</Alert> : null}

          <Button
            type="submit"
            disabled={submitting}
            variant="contained"
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LockOutlinedIcon />}
            sx={{
              height: '3.25rem',
              borderRadius: '16px',
              textTransform: 'none',
              fontWeight: 950,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #7C3AED 0%, #DF327B 100%)',
              boxShadow: '0 14px 30px rgba(124, 58, 237, 0.26)',
              '&:hover': { background: 'linear-gradient(135deg, #6F32D8 0%, #D12B72 100%)' },
            }}
          >
            {submitting ? 'Saving…' : 'Set password & continue'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
