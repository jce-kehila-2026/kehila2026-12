import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { auth, googleProvider } from '../../../firebase';
import { ensureParticipantProfile, getPostLoginPath, resolveUserRole } from '../services/authRoleService';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleEmailLogin(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const role = await resolveUserRole(credential.user);

      if (role === 'participant') {
        await syncParticipantProfile(credential.user);
      }

      navigate(getPostLoginPath(role), { replace: true });
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
      };
      setError(messages[err.code] || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailSignUp(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Please enter your full name.');
      setSubmitting(false);
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: trimmedName });
      await ensureParticipantProfile(credential.user, { displayName: trimmedName, email });
      navigate('/home', { replace: true });
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'An account already exists with this email.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password should be at least 6 characters.',
      };
      setError(messages[err.code] || 'Sign up failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setSubmitting(true);

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const role = await resolveUserRole(credential.user);

      if (role === 'participant') {
        await syncParticipantProfile(credential.user);
      }

      navigate(getPostLoginPath(role), { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        const localGoogleAuthHint =
          typeof window !== 'undefined'
            ? `Google sign-in is not allowed from ${window.location.host}. Open the app at http://localhost:${window.location.port || '5173'} or add ${window.location.hostname} in Firebase Authentication authorized domains.`
            : 'Google sign-in is not allowed from this address. Open the app at http://localhost:5173 or add this domain in Firebase Authentication authorized domains.';
        const messages = {
          'auth/unauthorized-domain': localGoogleAuthHint,
          'auth/operation-not-allowed': 'Google sign-in is not enabled for this Firebase project.',
          'auth/popup-blocked': 'The Google sign-in popup was blocked. Please allow popups and try again.',
          'auth/account-exists-with-different-credential': 'An account already exists with this email using another sign-in method.',
        };
        setError(messages[err.code] || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function toggleAuthMode() {
    setError('');
    setAuthMode((current) => (current === 'login' ? 'signup' : 'login'));
  }

  async function syncParticipantProfile(user) {
    try {
      await ensureParticipantProfile(user);
    } catch (err) {
      console.error('Signed in, but participant profile sync failed:', err);
    }
  }

  return (
    <Box
      dir="ltr"
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.08fr 0.92fr' },
        bgcolor: '#13081c',
        color: '#111827',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '100vh',
          p: { md: 6, lg: 8 },
          color: '#fff',
          backgroundImage:
            'linear-gradient(135deg, rgba(19,8,28,0.9), rgba(75,19,107,0.62), rgba(223,50,123,0.36)), url("https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80")',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                bgcolor: '#fff',
                color: '#DF327B',
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              S
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              She-Na
            </Typography>
          </Box>

          <Button color="inherit" startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ color: 'rgba(255,255,255,0.86)', fontWeight: 700 }}>
            Back to website
          </Button>
        </Box>

        <Box sx={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>
          <Typography variant="h1" sx={{ color: '#fff', fontSize: { md: '3.5rem', lg: '4.6rem' }, lineHeight: 1.05, mb: 3 }}>
            Heal Gently. Connect Safely. Grow Together.
          </Typography>
          <Typography sx={{ maxWidth: 620, color: 'rgba(255,255,255,0.78)', fontSize: '1.15rem', lineHeight: 1.7 }}>
            A calm participant space for workshops, appointments, reminders, and She-Na community support.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 6 }}>
            <Box sx={{ width: 42, height: 6, borderRadius: 999, bgcolor: '#fff' }} />
            <Box sx={{ width: 10, height: 6, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.36)' }} />
            <Box sx={{ width: 10, height: 6, borderRadius: 999, bgcolor: 'rgba(255,255,255,0.36)' }} />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4, lg: 5 },
          background:
            'radial-gradient(circle at 10% 0%, rgba(223,50,123,0.13), transparent 22rem), linear-gradient(135deg, #fff8fc, #f7effb)',
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 560,
            minHeight: { md: 680 },
            display: 'flex',
            alignItems: 'center',
            border: '1px solid rgba(75,19,107,0.1)',
            borderRadius: { xs: 4, sm: 5 },
            boxShadow: '0 24px 80px rgba(75,19,107,0.18)',
          }}
        >
          <CardContent sx={{ width: '100%', p: { xs: 3, sm: 6, lg: 7 } }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" sx={{ fontSize: { xs: '2rem', sm: '2.65rem' }, fontWeight: 800, mb: 1 }}>
                {authMode === 'login' ? 'Welcome Back!' : 'Create Account'}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '1rem' }}>
                {authMode === 'login'
                  ? 'Log in to continue to your She-Na space.'
                  : 'Sign up as a participant and we will prepare your home page.'}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5 }} id="login-error">
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={authMode === 'login' ? handleEmailLogin : handleEmailSignUp}>
              {authMode === 'signup' && (
                <TextField
                  id="signup-name"
                  label="Full name"
                  type="text"
                  fullWidth
                  placeholder="Input your full name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  autoComplete="name"
                  sx={{ mb: 2.5 }}
                />
              )}

              <TextField
                id="login-email"
                label="Email"
                type="email"
                fullWidth
                placeholder="Input your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                sx={{ mb: 2.5 }}
              />

              <TextField
                id="login-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                placeholder="Input your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                sx={{ mb: authMode === 'login' ? 1.5 : 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        edge="end"
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {authMode === 'login' && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <FormControlLabel control={<Checkbox size="small" />} label="Remember me" />
                  <Link component="button" type="button" underline="hover" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Forgot password?
                  </Link>
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={submitting}
                id="btn-login"
                sx={{
                  py: 1.55,
                  borderRadius: 999,
                  bgcolor: '#111111',
                  boxShadow: '0 14px 28px rgba(17,17,17,0.18)',
                  '&:hover': { bgcolor: '#4B136B' },
                }}
              >
                {submitting ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
              </Button>
            </Box>

            <Divider sx={{ my: 4 }}>
              <Typography variant="caption" color="text.disabled">
                Or continue with:
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={submitting}
              id="btn-google-login"
              sx={{
                py: 1.35,
                borderRadius: 999,
                borderColor: 'rgba(0,0,0,0.12)',
                color: 'text.primary',
                fontWeight: 800,
                '&:hover': { borderColor: 'primary.main', backgroundColor: 'rgba(223,50,123,0.05)' },
              }}
            >
              Continue with Google
            </Button>

            <Typography align="center" color="text.secondary" sx={{ mt: 4, fontWeight: 600 }}>
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Link component="button" type="button" underline="hover" disabled={submitting} onClick={toggleAuthMode} sx={{ color: '#4B136B', fontWeight: 800 }}>
                {authMode === 'login' ? 'Sign up here' : 'Sign in here'}
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

