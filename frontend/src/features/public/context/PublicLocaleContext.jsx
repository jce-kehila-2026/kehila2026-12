import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createPublicT,
  DEFAULT_PUBLIC_LOCALE,
  getPublicLocaleDirection,
  getPublicLocaleLang,
  getStoredPublicLocale,
  isPublicLocale,
  PUBLIC_LOCALE_STORAGE_KEY,
} from '../i18n/publicHomeTranslations';

const PublicLocaleContext = createContext(null);

export function PublicLocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredPublicLocale);

  const direction = getPublicLocaleDirection(locale);
  const lang = getPublicLocaleLang(locale);
  const t = useMemo(() => createPublicT(locale), [locale]);

  function setLocale(nextLocale) {
    if (!isPublicLocale(nextLocale)) {
      return;
    }

    setLocaleState(nextLocale);

    try {
      localStorage.setItem(PUBLIC_LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // Ignore storage failures — in-memory locale still applies for this session.
    }
  }

  useEffect(() => {
    const html = document.documentElement;
    const previousDir = html.getAttribute('dir');
    const previousLang = html.getAttribute('lang');

    html.setAttribute('dir', direction);
    html.setAttribute('lang', lang);

    return () => {
      if (previousDir) {
        html.setAttribute('dir', previousDir);
      } else {
        html.removeAttribute('dir');
      }

      if (previousLang) {
        html.setAttribute('lang', previousLang);
      } else {
        html.removeAttribute('lang');
      }
    };
  }, [direction, lang]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      direction,
      lang,
      t,
    }),
    [direction, lang, locale, t],
  );

  return <PublicLocaleContext.Provider value={value}>{children}</PublicLocaleContext.Provider>;
}

export function usePublicLocale() {
  const context = useContext(PublicLocaleContext);

  if (!context) {
    return {
      locale: DEFAULT_PUBLIC_LOCALE,
      setLocale: () => {},
      direction: getPublicLocaleDirection(DEFAULT_PUBLIC_LOCALE),
      lang: getPublicLocaleLang(DEFAULT_PUBLIC_LOCALE),
      t: createPublicT(DEFAULT_PUBLIC_LOCALE),
    };
  }

  return context;
}
