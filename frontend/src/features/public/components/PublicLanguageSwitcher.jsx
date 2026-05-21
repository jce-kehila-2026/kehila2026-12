import { useEffect, useId, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { PUBLIC_LANGUAGE_OPTIONS } from '../i18n/publicHomeTranslations';

export default function PublicLanguageSwitcher() {
  const { locale, setLocale, t } = usePublicLocale();
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

  return (
    <div className={`public-lang-switcher${isOpen ? ' public-lang-switcher--open' : ''}`} ref={rootRef}>
      <button
        className="public-lang-switcher__trigger"
        type="button"
        aria-label={t('languageMenuLabel')}
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
        aria-label={t('languageMenuLabel')}
        aria-hidden={!isOpen}
      >
        {PUBLIC_LANGUAGE_OPTIONS.map((option) => {
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
                {isSelected ? <Check className="public-lang-switcher__check" strokeWidth={2.25} aria-hidden="true" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
