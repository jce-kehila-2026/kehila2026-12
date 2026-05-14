import { useState } from 'react';

const PUBLIC_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Articles', href: '#articles' },
  { label: 'Team', href: '#team' },
  { label: 'Donate', href: '#donate' },
  { label: 'Contact', href: '#contact' },
];

export default function PublicNavbar({ organization }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const organizationName = organization.name;
  const menuButtonLabel = isMenuOpen ? 'Close public navigation' : 'Open public navigation';

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="public-navbar">
      <div className="public-navbar__bar">
        <a className="public-navbar__brand" href="#home" aria-label={`${organizationName} home`} onClick={closeMenu}>
          <span className="public-navbar__logo" aria-hidden="true">
            S
          </span>
          <span>{organizationName}</span>
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
        <nav className="public-navbar__links" aria-label="Public navigation">
          {PUBLIC_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="public-navbar__login" href="/login" onClick={closeMenu}>
          Login
        </a>
      </div>
    </header>
  );
}
