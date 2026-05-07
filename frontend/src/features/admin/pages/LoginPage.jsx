import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../../firebase';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import GoogleIcon from '@mui/icons-material/Google';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard', { replace: true });
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

  async function handleGoogleLogin() {
    setError('');
    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(223,50,123,0.1), transparent 70%)',
          top: -200,
          right: -200,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(107,63,151,0.08), transparent 70%)',
          bottom: -100,
          left: -100,
          pointerEvents: 'none',
        },
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          zIndex: 1,
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography sx={{ fontSize: '2.2rem', mb: 1 }}>🌸</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              She-Na Admin
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Sign in to manage the platform
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} id="login-error">
              {error}
            </Alert>
          )}

          {/* Google Sign-In */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={submitting}
            id="btn-google-login"
            sx={{
              mb: 3,
              py: 1.3,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': { borderColor: 'primary.main', backgroundColor: 'rgba(223,50,123,0.05)' },
            }}
          >
            Sign in with Google
          </Button>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.disabled">
              or use email
            </Typography>
          </Divider>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin}>
            <TextField
              id="login-email"
              label="Email"
              type="email"
              fullWidth
              placeholder="admin@shena.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              sx={{ mb: 2 }}
            />
            <TextField
              id="login-password"
              label="Password"
              type="password"
              fullWidth
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={submitting}
              id="btn-login"
              sx={{ py: 1.3 }}
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
