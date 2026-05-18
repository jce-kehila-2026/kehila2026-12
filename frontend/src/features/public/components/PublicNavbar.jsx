import { useEffect, useState } from 'react';
import sheNaLogo from '../../../assets/she-na-logo.png';

const PUBLIC_LINKS = [
  { label: 'הבית', href: '#home' },
  { label: 'מי אנחנו', href: '#about' },
  { label: 'בואי נלמד ביחד', href: '#support' },
  { label: 'סיפורי השראה', href: '#stories' },
  { label: 'תרומות', href: '#donate' },
  { label: 'צרי קשר', href: '#contact' },
];

export default function PublicNavbar({ organization, onJoinClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const organizationName = organization?.name || 'SHE-NA';
  const menuButtonLabel = isMenuOpen ? 'סגירת תפריט ניווט' : 'פתיחת תפריט ניווט';

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 18);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleVolunteerClick(event) {
    event.preventDefault();
    closeMenu();
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
          <a className="public-navbar__brand" href="#home" aria-label={`${organizationName} הבית`} onClick={closeMenu}>
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
          <nav className="public-navbar__links" aria-label="ניווט ציבורי">
            {PUBLIC_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="public-navbar__actions" aria-label="פעולות מהירות">
            <a className="public-navbar__cta public-navbar__cta--primary" href="#join" onClick={handleJoinClick}>
              להצטרף
            </a>
            <a className="public-navbar__cta public-navbar__cta--highlight" href="/home" onClick={closeMenu}>
              איזור אישי
            </a>
            <a className="public-navbar__cta public-navbar__cta--secondary" href="#volunteer" onClick={handleVolunteerClick}>
              להתנדב
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
