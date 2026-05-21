import { useEffect, useMemo, useState } from 'react';
import sheNaLogo from '../../../assets/she-na-logo.png';
import { PUBLIC_DONATION_TARGET } from '../constants/publicDonationLink';
import { useAdmin } from '../../admin/context/AdminContext';
import { getPostLoginPath } from '../../admin/services/authRoleService';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { getPublicNavLinks } from '../i18n/publicHomeTranslations';
import PublicLanguageSwitcher from './PublicLanguageSwitcher';

export default function PublicNavbar({ organization, onJoinClick, onVolunteerClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { currentUser, userRole } = useAdmin();
  const { t } = usePublicLocale();
  const organizationName = organization?.name || 'SHE-NA';
  const menuButtonLabel = isMenuOpen ? t('closeMenu') : t('openMenu');
  const personalAreaHref = currentUser ? getPostLoginPath(userRole) : '/home';
  const publicLinks = useMemo(() => getPublicNavLinks(t, PUBLIC_DONATION_TARGET), [t]);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 18);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const contactSection = document.getElementById('contact');

    if (!contactSection || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActiveSection(entry.isIntersecting ? 'contact' : '');
      },
      { threshold: 0.35, rootMargin: '-20% 0px -45% 0px' },
    );

    observer.observe(contactSection);

    return () => observer.disconnect();
  }, []);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleVolunteerClick(event) {
    event.preventDefault();
    closeMenu();
    onVolunteerClick?.();
  }

  function handleJoinClick(event) {
    event.preventDefault();
    closeMenu();
    onJoinClick?.();
  }

  return (
    <header className={`public-navbar${isScrolled ? ' public-navbar--scrolled' : ''}`}>
      <div className="public-navbar__inner">
        <div className="public-navbar__bar">
          <a
            className="public-navbar__brand"
            href="#home"
            aria-label={`${organizationName} ${t('brandHomeAria')}`}
            onClick={closeMenu}
          >
            <img className="public-navbar__brand-image" src={sheNaLogo} alt="She-Na logo" />
          </a>

          <button
            className="public-navbar__toggle"
            type="button"
            aria-controls="public-navigation"
            aria-expanded={isMenuOpen}
            aria-label={menuButtonLabel}
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        <div className={`public-navbar__menu${isMenuOpen ? ' public-navbar__menu--open' : ''}`} id="public-navigation">
          <nav className="public-navbar__links" aria-label={t('navAriaLabel')}>
            {publicLinks.map((link) => {
              const isContactLink = link.href === '#contact';
              const isActive = isContactLink && activeSection === 'contact';

              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={isActive ? 'public-navbar__link--active' : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="public-navbar__actions" aria-label={t('actionsAriaLabel')}>
            <a className="public-navbar__cta public-navbar__cta--primary" href="#join" onClick={handleJoinClick}>
              {t('navJoin')}
            </a>
            <a className="public-navbar__cta public-navbar__cta--highlight" href={personalAreaHref} onClick={closeMenu}>
              {t('navPersonalArea')}
            </a>
            <div className="public-navbar__actions-end">
              <PublicLanguageSwitcher />
              <a className="public-navbar__cta public-navbar__cta--primary" href="#volunteer" onClick={handleVolunteerClick}>
                {t('navVolunteer')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
