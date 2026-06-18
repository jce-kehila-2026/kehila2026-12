import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createAdminT } from '../i18n/adminUiTranslations';
import { useDirection } from './DirectionContext';

/**
 * Admin-area locale (English / Hebrew). Mirrors ParticipantLocaleContext, but
 * also pushes the resolved direction into the app-level DirectionContext so the
 * MUI RTL/LTR theme + emotion cache (built in App.jsx) re-render for Hebrew.
 */
const AdminLocaleContext = createContext(null);

const STORAGE_KEY = 'shena-admin-locale';

function isAdminLocale(value) {
  return value === 'en' || value === 'he';
}

function getStoredAdminLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isAdminLocale(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

export function AdminLocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredAdminLocale);
  const { setDirection } = useDirection();

  const direction = locale === 'he' ? 'rtl' : 'ltr';
  const lang = locale === 'he' ? 'he' : 'en';

  const setLocale = (next) => {
    if (!isAdminLocale(next)) return;
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures — in-memory locale still applies this session.
    }
  };

  // Drive the global direction (MUI theme) + <html lang> from the admin locale.
  useEffect(() => {
    setDirection?.(direction);
    document.documentElement.setAttribute('lang', lang);
  }, [direction, lang, setDirection]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      direction,
      lang,
      t: createAdminT(locale),
    }),
    [locale, direction, lang],
  );

  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>;
}

export function useAdminLocale() {
  const context = useContext(AdminLocaleContext);

  if (!context) {
    // Safe default for components rendered outside the provider (e.g. tests).
    return {
      locale: 'en',
      setLocale: () => {},
      direction: 'ltr',
      lang: 'en',
      t: createAdminT('en'),
    };
  }

  return context;
}
