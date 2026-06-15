import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import sheNaLogo from '../../../assets/she-na-logo.png';
import { PUBLIC_DONATION_TARGET } from '../constants/publicDonationLink';
import { useAdmin } from '../../admin/context/AdminContext';
import { getPostLoginPath } from '../../admin/services/authRoleService';
import { usePublicLocale } from '../context/PublicLocaleContext';
import {
  getPublicNavbarHomeMenu,
  getPublicNavbarLinks,
  getPublicNavbarStoriesMenu,
} from '../i18n/publicHomeTranslations';
import { scrollToPublicSectionAfterMenuClose } from '../utils/publicSectionScroll';
import PublicLanguageSwitcher from './PublicLanguageSwitcher';

const STORIES_ARTICLES_PATH = '/public/stories-articles';

export default function PublicNavbar({
  organization,
  onJoinClick,
  onVolunteerClick,
  showHomeDropdown = true,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
  const [isStoriesMenuOpen, setIsStoriesMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const homeMenuRef = useRef(null);
  const storiesMenuRef = useRef(null);
  const homeMenuId = useId();
  const storiesMenuId = useId();
  const location = useLocation();
  const { currentUser, userRole } = useAdmin();
  const { t } = usePublicLocale();
  const organizationName = organization?.name || 'SHE-NA';
  const menuButtonLabel = isMenuOpen ? t('closeMenu') : t('openMenu');
  const personalAreaHref = currentUser ? getPostLoginPath(userRole) : '/home';
  const publicLinks = useMemo(() => getPublicNavbarLinks(t, PUBLIC_DONATION_TARGET), [t]);
  const homeMenuLinks = useMemo(() => getPublicNavbarHomeMenu(t), [t]);
  const storiesMenuLinks = useMemo(() => getPublicNavbarStoriesMenu(t), [t]);
  const resolveHomepageHref = (href) => (location.pathname === '/public' ? href : `/public${href}`);
  const resolveStoriesHref = (href) =>
    location.pathname === STORIES_ARTICLES_PATH ? href : `${STORIES_ARTICLES_PATH}${href}`;

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

  useEffect(() => {
    if ((!showHomeDropdown || !isHomeMenuOpen) && !isStoriesMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (isHomeMenuOpen && !homeMenuRef.current?.contains(event.target)) {
        setIsHomeMenuOpen(false);
      }
      if (isStoriesMenuOpen && !storiesMenuRef.current?.contains(event.target)) {
        setIsStoriesMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsHomeMenuOpen(false);
        setIsStoriesMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHomeMenuOpen, isStoriesMenuOpen, showHomeDropdown]);

  function closeMenu() {
    setIsMenuOpen(false);
    setIsHomeMenuOpen(false);
    setIsStoriesMenuOpen(false);
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

  function handleCurrentPageSectionClick(event, href, expectedPath) {
    if (location.pathname !== expectedPath) {
      closeMenu();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    closeMenu();

    const targetId = decodeURIComponent(href.slice(1));
    const willScroll = scrollToPublicSectionAfterMenuClose(targetId);

    if (willScroll) {
      window.history.pushState(null, '', `${location.pathname}${location.search}${href}`);
    }
  }

  return (
    <header
      className={`public-navbar${isScrolled ? ' public-navbar--scrolled' : ''}`}
      data-public-navbar
    >
      <div className="public-navbar__inner">
        <div className="public-navbar__bar">
          <a
            className="public-navbar__brand"
            href={resolveHomepageHref('#home')}
            aria-label={`${organizationName} ${t('brandHomeAria')}`}
            onClick={(event) => handleCurrentPageSectionClick(event, '#home', '/public')}
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
            {showHomeDropdown ? (
              <div
                className={`public-navbar__dropdown${isHomeMenuOpen ? ' public-navbar__dropdown--open' : ''}`}
                ref={homeMenuRef}
              >
                <button
                  className="public-navbar__dropdown-trigger"
                  type="button"
                  aria-label={t('navHomeMenuLabel')}
                  aria-haspopup="menu"
                  aria-expanded={isHomeMenuOpen}
                  aria-controls={homeMenuId}
                  onClick={() => {
                    setIsStoriesMenuOpen(false);
                    setIsHomeMenuOpen((currentValue) => !currentValue);
                  }}
                >
                  <span>{t('navHome')}</span>
                  <ChevronDown aria-hidden="true" strokeWidth={2.25} />
                </button>
                <ul className="public-navbar__dropdown-menu" id={homeMenuId} role="menu" hidden={!isHomeMenuOpen}>
                  {homeMenuLinks.map((link) => (
                    <li key={link.href} role="none">
                      <a
                        href={resolveHomepageHref(link.href)}
                        role="menuitem"
                        onClick={(event) => handleCurrentPageSectionClick(event, link.href, '/public')}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <a href="/public" onClick={closeMenu}>
                {t('navSimpleHome')}
              </a>
            )}
            {publicLinks.map((link) => {
              if (link.href === STORIES_ARTICLES_PATH) {
                return (
                  <div
                    className={`public-navbar__dropdown${isStoriesMenuOpen ? ' public-navbar__dropdown--open' : ''}`}
                    ref={storiesMenuRef}
                    key={link.href}
                  >
                    <button
                      className="public-navbar__dropdown-trigger"
                      type="button"
                      aria-label={t('navbarStoriesMenuLabel')}
                      aria-haspopup="menu"
                      aria-expanded={isStoriesMenuOpen}
                      aria-controls={storiesMenuId}
                      onClick={() => {
                        setIsHomeMenuOpen(false);
                        setIsStoriesMenuOpen((currentValue) => !currentValue);
                      }}
                    >
                      <span>{link.label}</span>
                      <ChevronDown aria-hidden="true" strokeWidth={2.25} />
                    </button>
                    <ul
                      className="public-navbar__dropdown-menu"
                      id={storiesMenuId}
                      role="menu"
                      hidden={!isStoriesMenuOpen}
                    >
                      {storiesMenuLinks.map((menuLink) => (
                        <li key={menuLink.href} role="none">
                          <a
                            href={resolveStoriesHref(menuLink.href)}
                            role="menuitem"
                            onClick={(event) =>
                              handleCurrentPageSectionClick(event, menuLink.href, STORIES_ARTICLES_PATH)
                            }
                          >
                            {menuLink.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }

              const isContactLink = link.href === '#contact';
              const isActive = isContactLink && activeSection === 'contact';
              const href = isContactLink
                ? '#contact'
                : link.href.startsWith('#')
                  ? resolveHomepageHref(link.href)
                  : link.href;

              return (
                <a
                  key={link.href}
                  href={href}
                  className={isActive ? 'public-navbar__link--active' : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(event) => {
                    if (isContactLink) {
                      handleCurrentPageSectionClick(event, link.href, location.pathname);
                      return;
                    }

                    if (link.href.startsWith('#')) {
                      handleCurrentPageSectionClick(event, link.href, '/public');
                      return;
                    }

                    closeMenu();
                  }}
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
              <a className="public-navbar__cta public-navbar__cta--primary" href="#volunteer" onClick={handleVolunteerClick}>
                {t('navVolunteer')}
              </a>
              <PublicLanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
