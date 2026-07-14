import { useEffect, useId, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useAdminLocale } from '../context/AdminLocaleContext';
import '../../public/styles/public-language-switcher.css';

// Admin is English + Hebrew only (no Arabic), unlike the public switcher.
const ADMIN_LANGUAGE_OPTIONS = [
  { value: 'he', label: 'עברית' },
  { value: 'en', label: 'English' },
];

/**
 * Globe-trigger dropdown language switcher, mirroring the public home page
 * (PublicLanguageSwitcher) — same markup + styling, wired to the admin locale.
 * `dropUp`/`align` let the sidebar open the menu upward/toward the page so it
 * isn't clipped at the bottom-left of the rail.
 */
export default function AdminLanguageSwitcher({ dropUp = false, align = 'end' }) {
  const { locale, setLocale, t, direction } = useAdminLocale();
  const isRtl = direction === 'rtl';
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(nextLocale) {
    setLocale(nextLocale);
    setIsOpen(false);
  }

  const menuStyle = {
    ...(dropUp
      ? { insetBlockStart: 'auto', insetBlockEnd: 'calc(100% + 10px)', transformOrigin: 'bottom' }
      : null),
    ...(align === 'start' ? { insetInlineStart: 0, insetInlineEnd: 'auto' } : null),
    // In Hebrew the switcher sits at the top-left of the page, so pin the menu's
    // left edge to the trigger with physical props (logical inset props resolve
    // unreliably here) and let it open rightward, into the page.
    ...(isRtl
      ? { insetInlineStart: 'auto', insetInlineEnd: 'auto', left: 0, right: 'auto' }
      : null),
  };

  const label = t('selectLanguage');

  return (
    <div className={`public-lang-switcher${isOpen ? ' public-lang-switcher--open' : ''}`} ref={rootRef}>
      <button
        className="public-lang-switcher__trigger"
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Globe className="public-lang-switcher__icon" strokeWidth={1.75} aria-hidden="true" />
      </button>

      <ul
        className="public-lang-switcher__menu"
        id={menuId}
        role="listbox"
        aria-label={label}
        aria-hidden={!isOpen}
        style={menuStyle}
      >
        {ADMIN_LANGUAGE_OPTIONS.map((option) => {
          const isSelected = option.value === locale;

          return (
            <li key={option.value} role="none">
              <button
                className={`public-lang-switcher__option${isSelected ? ' public-lang-switcher__option--active' : ''}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
              >
                <span className="public-lang-switcher__option-label">{option.label}</span>
                {isSelected ? (
                  <Check className="public-lang-switcher__check" strokeWidth={2.25} aria-hidden="true" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
