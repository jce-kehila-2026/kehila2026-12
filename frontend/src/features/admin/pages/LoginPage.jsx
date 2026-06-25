import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import sheNaLogo from '../../../assets/she-na-logo.png';
import loginBgImage from '../../../assets/stronger-together-banner.png';
import { auth, googleProvider } from '../../../firebase';
import { ensureParticipantProfile, getPostLoginPath, resolveUserRole } from '../services/authRoleService';
import JoinCommunityModal from '../../public/components/JoinCommunityModal';
import PublicCtaButton from '../../../shared/components/PublicCtaButton';
import { PublicLocaleProvider, usePublicLocale } from '../../public/context/PublicLocaleContext';
import PublicLanguageSwitcher from '../../public/components/PublicLanguageSwitcher';
import '../../public/styles/public-language-switcher.css';
import '../../public/styles/join-modal.css';
import './LoginPage.css';

// Login + its embedded join form translate via the shared public locale (he/ar/en),
// using the same globe switcher as every public page.
export default function LoginPage() {
  return (
    <PublicLocaleProvider>
      <LoginPageInner />
    </PublicLocaleProvider>
  );
}

function LoginPageInner() {
  const { t, direction } = usePublicLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const navigate = useNavigate();

  async function handleForgotPassword() {
    setError('');
    setNotice('');

    if (!email) {
      setError(t('loginResetEnterEmail'));
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setNotice(t('loginResetSent'));
    } catch (err) {
      const messages = {
        'auth/invalid-email': t('loginErrInvalidEmail'),
        'auth/user-not-found': t('loginErrUserNotFound'),
        'auth/too-many-requests': t('loginErrTooManyRequests'),
      };
      setError(messages[err.code] || t('loginResetFailed'));
    }
  }

  async function handleEmailLogin(event) {
    event.preventDefault();
    setError('');
    setNotice('');
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
        'auth/user-not-found': t('loginErrUserNotFound'),
        'auth/wrong-password': t('loginErrWrongPassword'),
        'auth/invalid-credential': t('loginErrInvalidCredential'),
        'auth/too-many-requests': t('loginErrTooManyRequests'),
      };
      setError(messages[err.code] || t('loginFailed'));
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
        // Dev/localhost diagnostic — kept in English on purpose (it tells the
        // developer how to authorise the domain in Firebase).
        const localGoogleAuthHint =
          typeof window !== 'undefined'
            ? `Google sign-in is not allowed from ${window.location.host}. Open the app at http://localhost:${window.location.port || '5173'} or add ${window.location.hostname} in Firebase Authentication authorized domains.`
            : 'Google sign-in is not allowed from this address. Open the app at http://localhost:5173 or add this domain in Firebase Authentication authorized domains.';
        const messages = {
          'auth/unauthorized-domain': localGoogleAuthHint,
          'auth/operation-not-allowed': t('loginGoogleNotEnabled'),
          'auth/popup-blocked': t('loginGooglePopupBlocked'),
          'auth/account-exists-with-different-credential': t('loginGoogleAccountExists'),
        };
        setError(messages[err.code] || t('loginGoogleFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function syncParticipantProfile(user) {
    try {
      await ensureParticipantProfile(user);
    } catch (err) {
      console.error('Signed in, but participant profile sync failed:', err);
    }
  }

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${loginBgImage})` }}
    >
      <div className="login-page__overlay" aria-hidden="true" />

      <div className="login-page__lang-switch">
        <PublicLanguageSwitcher />
      </div>

      <div className="login-page__canvas">
        <header className="login-page__page-header">
          <img className="login-page__logo" src={sheNaLogo} alt="She-Na" />
        </header>

        <section className="login-page__hero-panel" aria-label={t('loginWelcomeAria')}>
          <div className="login-page__hero-content" dir={direction}>
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
                <h1 className="login-page__title">{t('loginWelcomeBack')}</h1>
              </div>

              <span className="login-page__title-accent login-page__title-accent--right" aria-hidden="true" />
            </div>

            <p className="login-page__subtitle">
              {t('loginHeroSubtitle')}<span className="login-page__brand-mark">She-Na</span>
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
          <div className="login-page__card public-cta-scope" dir={direction}>
            <span className="login-page__card-leaf" aria-hidden="true" />

            <h2 className="login-page__card-title">{t('loginCardTitle')}</h2>
            <p className="login-page__card-subtitle">{t('loginCardSubtitle')}</p>

            {error ? (
              <div className="login-page__error" id="login-error" role="alert">
                {error}
              </div>
            ) : null}

            {notice ? (
              <div
                id="login-notice"
                role="status"
                style={{
                  margin: '0 0 1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#15803D',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                }}
              >
                {notice}
              </div>
            ) : null}

            <form onSubmit={handleEmailLogin}>
              <div className="login-page__field">
                <label className="login-page__label" htmlFor="login-email">
                  {t('loginEmailLabel')}
                </label>
                <div className="login-page__input-wrap">
                  <span className="login-page__input-icon" aria-hidden="true">
                    <EmailOutlinedIcon fontSize="inherit" />
                  </span>
                  <input
                    id="login-email"
                    className="login-page__input"
                    type="email"
                    placeholder={t('loginEmailPlaceholder')}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="login-page__field">
                <label className="login-page__label" htmlFor="login-password">
                  {t('loginPasswordLabel')}
                </label>
                <div className="login-page__input-wrap">
                  <span className="login-page__input-icon" aria-hidden="true">
                    <LockOutlinedIcon fontSize="inherit" />
                  </span>
                  <input
                    id="login-password"
                    className="login-page__input login-page__input--password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('loginPasswordPlaceholder')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-page__toggle-password"
                    aria-label={showPassword ? t('loginHidePassword') : t('loginShowPassword')}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </button>
                </div>
              </div>

              <div className="login-page__row">
                <button
                  type="button"
                  className="login-page__link-btn"
                  onClick={handleForgotPassword}
                  disabled={submitting}
                >
                  {t('loginForgotPassword')}
                </button>
              </div>

              <PublicCtaButton
                type="submit"
                className="login-page__submit"
                block
                disabled={submitting}
                id="btn-login"
              >
                <span>{submitting ? t('loginSubmitting') : t('loginSubmit')}</span>
              </PublicCtaButton>
            </form>

            <div className="login-page__divider-text">{t('loginOrContinue')}</div>

            <button
              type="button"
              className="login-page__google"
              onClick={handleGoogleLogin}
              disabled={submitting}
              id="btn-google-login"
            >
              <GoogleIcon fontSize="small" aria-hidden="true" />
              {t('loginContinueGoogle')}
            </button>

            <p className="login-page__footer-text">
              {t('loginNoAccount')}
              <button
                type="button"
                className="login-page__footer-link"
                disabled={submitting}
                onClick={() => setIsJoinModalOpen(true)}
              >
                {t('loginRegisterHere')}
              </button>
            </p>
          </div>
        </main>
        </aside>
      </div>

      <div className="login-page__back-cta public-cta-scope" dir={direction}>
        <PublicCtaButton
          type="button"
          className="login-page__back-btn"
          showArrow={false}
          onClick={() => navigate('/')}
        >
          <HomeOutlinedIcon className="login-page__back-btn-icon" aria-hidden="true" />
          <span>{t('loginBackToSite')}</span>
        </PublicCtaButton>
      </div>

      {/* Same membership questionnaire as the public homepage "להצטרף" button.
          The scope wrapper supplies the public theme variables + direction the
          modal styles expect, without touching the login card. */}
      <div className="login-page__join-scope" dir={direction}>
        <JoinCommunityModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
      </div>
    </div>
  );
}
