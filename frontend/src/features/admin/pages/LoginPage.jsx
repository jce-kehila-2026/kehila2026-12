import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import sheNaLogo from '../../../assets/she-na-logo.png';
import loginBgImage from '../../../assets/stronger-together-banner.png';
import { auth, googleProvider } from '../../../firebase';
import { ensureParticipantProfile, getPostLoginPath, resolveUserRole } from '../services/authRoleService';
import './LoginPage.css';

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

  const isLogin = authMode === 'login';

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${loginBgImage})` }}
    >
      <div className="login-page__overlay" aria-hidden="true" />

      <div className="login-page__canvas">
        <header className="login-page__page-header">
          <img className="login-page__logo" src={sheNaLogo} alt="She-Na" />
        </header>

        <section className="login-page__hero-panel" aria-label="She-Na welcome">
          <div className="login-page__hero-content">
            <div className="login-page__title-group">
              <span className="login-page__title-accent" aria-hidden="true" />

              <div className="login-page__title-stack">
                <svg className="login-page__heart-doodle" viewBox="0 0 24 22" aria-hidden="true">
                  <path
                    d="M12 19.8C12 19.8 3.8 14.1 3.8 9.2C3.8 6.5 5.9 4.5 8.2 4.5C9.7 4.5 11 5.4 12 6.7C13 5.4 14.3 4.5 15.8 4.5C18.1 4.5 20.2 6.5 20.2 9.2C20.2 14.1 12 19.8 12 19.8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h1 className="login-page__title">ברוכה שוב!</h1>
              </div>

              <span className="login-page__title-accent login-page__title-accent--right" aria-hidden="true" />
            </div>

            <p className="login-page__subtitle">
              התחברי למרחב הבטוח שלך ב-<span className="login-page__brand-mark">She-Na</span>
            </p>

            <div className="login-page__ornament" aria-hidden="true">
              <span className="login-page__ornament-line" />
              <svg className="login-page__ornament-heart" viewBox="0 0 12 11" aria-hidden="true">
                <path
                  d="M6 10.2C6 10.2 1.2 7.1 1.2 4.2C1.2 2.6 2.5 1.3 4 1.3C4.9 1.3 5.7 1.8 6 2.5C6.3 1.8 7.1 1.3 8 1.3C9.5 1.3 10.8 2.6 10.8 4.2C10.8 7.1 6 10.2 6 10.2Z"
                  fill="currentColor"
                />
              </svg>
              <span className="login-page__ornament-line" />
            </div>
          </div>
        </section>

        <aside className="login-page__login-stack">
          <main className="login-page__login-float">
          <div className="login-page__card">
            <span className="login-page__card-leaf" aria-hidden="true" />

            <h2 className="login-page__card-title">{isLogin ? 'התחברי למרחב שלך' : 'יצירת חשבון חדש'}</h2>
            <p className="login-page__card-subtitle">
              {isLogin ? 'המשיכי למרחב She-Na שלך' : 'הירשמי כקהילת She-Na והתחילי את המסע שלך'}
            </p>

            {error ? (
              <div className="login-page__error" id="login-error" role="alert">
                {error}
              </div>
            ) : null}

            <form onSubmit={isLogin ? handleEmailLogin : handleEmailSignUp}>
              {!isLogin ? (
                <div className="login-page__field">
                  <label className="login-page__label" htmlFor="signup-name">
                    שם מלא
                  </label>
                  <div className="login-page__input-wrap">
                    <span className="login-page__input-icon" aria-hidden="true">
                      <PersonOutlineOutlinedIcon fontSize="inherit" />
                    </span>
                    <input
                      id="signup-name"
                      className="login-page__input"
                      type="text"
                      placeholder="הזיני את שמך המלא"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>
              ) : null}

              <div className="login-page__field">
                <label className="login-page__label" htmlFor="login-email">
                  אימייל
                </label>
                <div className="login-page__input-wrap">
                  <span className="login-page__input-icon" aria-hidden="true">
                    <EmailOutlinedIcon fontSize="inherit" />
                  </span>
                  <input
                    id="login-email"
                    className="login-page__input"
                    type="email"
                    placeholder="הזיני את כתובת האימייל"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="login-page__field">
                <label className="login-page__label" htmlFor="login-password">
                  סיסמה
                </label>
                <div className="login-page__input-wrap">
                  <span className="login-page__input-icon" aria-hidden="true">
                    <LockOutlinedIcon fontSize="inherit" />
                  </span>
                  <input
                    id="login-password"
                    className="login-page__input login-page__input--password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="הזיני את הסיסמה"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="login-page__toggle-password"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </button>
                </div>
              </div>

              {isLogin ? (
                <div className="login-page__row">
                  <label className="login-page__remember">
                    <input type="checkbox" />
                    זכור אותי
                  </label>
                  <button type="button" className="login-page__link-btn">
                    שכחת סיסמה?
                  </button>
                </div>
              ) : null}

              <button className="login-page__submit" type="submit" disabled={submitting} id="btn-login">
                <span>{submitting ? 'אנא המתיני...' : isLogin ? 'התחברי' : 'יצירת חשבון'}</span>
                <span className="login-page__submit-arrow" aria-hidden="true">
                  <ArrowBackIcon fontSize="small" />
                </span>
              </button>
            </form>

            <div className="login-page__divider-text">או המשיכי עם</div>

            <button
              type="button"
              className="login-page__google"
              onClick={handleGoogleLogin}
              disabled={submitting}
              id="btn-google-login"
            >
              <GoogleIcon fontSize="small" aria-hidden="true" />
              המשיכי עם Google
            </button>

            <p className="login-page__footer-text">
              {isLogin ? 'אין לך חשבון? ' : 'יש לך כבר חשבון? '}
              <button type="button" className="login-page__footer-link" disabled={submitting} onClick={toggleAuthMode}>
                {isLogin ? 'הירשמי כאן' : 'התחברי כאן'}
              </button>
            </p>
          </div>
        </main>
        </aside>
      </div>

      <button type="button" className="login-page__back-btn" onClick={() => navigate('/')}>
        חזרה לאתר
        <ArrowBackIcon aria-hidden="true" />
      </button>
    </div>
  );
}
