import { createContext, useContext, useMemo } from 'react';
import { createParticipantT } from '../i18n/participantUiTranslations';
import {
  getParticipantLocaleDirection,
  getParticipantLocaleLang,
} from '../i18n/participantLocale';

/**
 * Publishes the participant locale to the (deep) component tree so any
 * descendant can translate static UI via `t('key')` without prop-drilling.
 *
 * Unlike PublicLocaleContext, this provider does NOT own the locale state:
 * ParticipantHome already manages `locale` (with profile-language sync), so we
 * accept it as a prop and just derive `t` / `direction` / `lang` from it.
 */
const ParticipantLocaleContext = createContext(null);

function resolveLocale(locale) {
  return locale === 'he' || locale === 'ar' ? locale : 'en';
}

export function ParticipantLocaleProvider({ locale = 'en', setLocale, children }) {
  const value = useMemo(() => {
    const resolved = resolveLocale(locale);
    return {
      locale: resolved,
      setLocale: typeof setLocale === 'function' ? setLocale : () => {},
      direction: getParticipantLocaleDirection(resolved),
      lang: getParticipantLocaleLang(resolved),
      t: createParticipantT(resolved),
    };
  }, [locale, setLocale]);

  return (
    <ParticipantLocaleContext.Provider value={value}>
      {children}
    </ParticipantLocaleContext.Provider>
  );
}

export function useParticipantLocale() {
  const context = useContext(ParticipantLocaleContext);

  if (!context) {
    // Safe default for components rendered outside the provider (e.g. tests).
    return {
      locale: 'en',
      setLocale: () => {},
      direction: getParticipantLocaleDirection('en'),
      lang: getParticipantLocaleLang('en'),
      t: createParticipantT('en'),
    };
  }

  return context;
}
