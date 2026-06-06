import { Bell } from 'lucide-react';
import sheNaLogo from '../../../assets/she-na-logo.png';
import DarkModeToggle from '../../profile/components/DarkModeToggle';
import { PublicSectionHeadingDivider } from '../../public/components/PublicSectionHeading';
import ParticipantLanguageSwitcher from './ParticipantLanguageSwitcher';
import '../../public/styles/public-section-heading.css';
import './ParticipantHeader.css';

export default function ParticipantHeader({
  displayName = '',
  title,
  darkMode = false,
  onDarkModeChange,
  locale = 'en',
  onLocaleChange,
  notificationsBell = null,
  className = '',
}) {
  const headerTitle = title ?? (displayName ? `Welcome back, ${displayName}` : 'Welcome back');

  return (
    <header className={['pd-home__header', className].filter(Boolean).join(' ')}>
      <div className="pd-home__header-copy">
        <h1>{headerTitle}</h1>
        <PublicSectionHeadingDivider />
      </div>

      <div className="pd-home__header-actions">
        {notificationsBell ?? (
          <button type="button" className="pd-header-icon-btn" aria-label="Notifications">
            <Bell size={18} strokeWidth={2.2} />
          </button>
        )}

        <ParticipantLanguageSwitcher locale={locale} onChange={onLocaleChange} />

        <DarkModeToggle
          darkMode={darkMode}
          onChange={onDarkModeChange}
          compact
          ariaLabel="Toggle dark mode"
        />

        <span className="pd-home__header-divider" aria-hidden="true" />

        <img src={sheNaLogo} alt="She-Na" className="pd-home__header-logo" />
      </div>
    </header>
  );
}
