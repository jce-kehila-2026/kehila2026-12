import { publicHomeUiTranslations } from './publicHomeUiTranslations';

export const PUBLIC_LOCALE_STORAGE_KEY = 'shena-public-locale';
export const DEFAULT_PUBLIC_LOCALE = 'he';

export const PUBLIC_LANGUAGE_OPTIONS = [
  { value: 'he', label: 'עברית' },
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

const NAV_LINK_KEYS = [
  { key: 'navHome', href: '#home' },
  { key: 'navLearnTogether', href: '#support' },
  { key: 'navStories', href: '#stories' },
  { key: 'navDonations', href: '__donation__' },
  { key: 'navContact', href: '#contact' },
];

export const publicHomeTranslations = {
  he: {
    navHome: 'הבית',
    navLearnTogether: 'מי אנחנו',
    navStories: 'סיפורי השראה',
    navDonations: 'תרומות',
    navContact: 'צרי קשר',
    navJoin: 'להצטרף',
    navPersonalArea: 'איזור אישי',
    navVolunteer: 'להתנדב',
    heroJoinCommunity: 'להצטרף לקהילה',
    heroDonate: 'לתרומה',
    heroTitle: 'את לא לבד במסע שלך',
    heroSubtitle: 'קהילה תומכת לנשים ולמתמודדות עם סרטן',
    heroDescription: 'מרחב חם, בטוח ומקצועי לתמיכה, ליווי, למידה ותקווה לאורך הדרך.',
    brandHomeAria: 'הבית',
    navAriaLabel: 'ניווט ציבורי',
    actionsAriaLabel: 'פעולות מהירות',
    openMenu: 'פתיחת תפריט ניווט',
    closeMenu: 'סגירת תפריט ניווט',
    languageMenuLabel: 'בחירת שפה',
    skipToContent: 'דילוג לתוכן המרכזי',
  },
  ar: {
    navHome: 'الرئيسية',
    navLearnTogether: 'من نحن',
    navStories: 'قصص ملهمة',
    navDonations: 'تبرعات',
    navContact: 'تواصلي معنا',
    navJoin: 'انضمّي',
    navPersonalArea: 'المنطقة الشخصية',
    navVolunteer: 'تطوّعي',
    heroJoinCommunity: 'انضمّي إلى المجتمع',
    heroDonate: 'تبرّعي',
    heroTitle: 'لستِ وحدك في رحلتك',
    heroSubtitle: 'مجتمع داعم للنساء والمُواجِهات للسرطان',
    heroDescription: 'مساحة دافئة وآمنة ومهنية للدعم والمرافقة والتعلّم والأمل طوال الطريق.',
    brandHomeAria: 'الرئيسية',
    navAriaLabel: 'التنقل العام',
    actionsAriaLabel: 'إجراءات سريعة',
    openMenu: 'فتح قائمة التنقل',
    closeMenu: 'إغلاق قائمة التنقل',
    languageMenuLabel: 'اختيار اللغة',
    skipToContent: 'تخطي إلى المحتوى الرئيسي',
  },
  en: {
    navHome: 'Home',
    navLearnTogether: 'About Us',
    navStories: 'Inspiration Stories',
    navDonations: 'Donate',
    navContact: 'Contact',
    navJoin: 'Join',
    navPersonalArea: 'Personal Area',
    navVolunteer: 'Volunteer',
    heroJoinCommunity: 'Join the Community',
    heroDonate: 'Donate',
    heroTitle: 'You Are Not Alone on Your Journey',
    heroSubtitle: 'A supportive community for women facing cancer',
    heroDescription:
      'A warm, safe, and professional space for support, guidance, learning, and hope along the way.',
    brandHomeAria: 'Home',
    navAriaLabel: 'Public navigation',
    actionsAriaLabel: 'Quick actions',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    languageMenuLabel: 'Choose language',
    skipToContent: 'Skip to main content',
  },
};

export function isPublicLocale(value) {
  return value === 'he' || value === 'ar' || value === 'en';
}

export function getStoredPublicLocale() {
  try {
    const stored = localStorage.getItem(PUBLIC_LOCALE_STORAGE_KEY);
    return isPublicLocale(stored) ? stored : DEFAULT_PUBLIC_LOCALE;
  } catch {
    return DEFAULT_PUBLIC_LOCALE;
  }
}

export function getPublicLocaleDirection(locale) {
  return locale === 'en' ? 'ltr' : 'rtl';
}

export function getPublicLocaleLang(locale) {
  if (locale === 'ar') return 'ar';
  if (locale === 'en') return 'en';
  return 'he';
}

/**
 * @param {'he' | 'ar' | 'en'} locale
 */
export function createPublicT(locale) {
  const baseLocale = publicHomeTranslations[locale] ? locale : 'he';
  const table = {
    ...publicHomeTranslations[baseLocale],
    ...publicHomeUiTranslations[baseLocale],
  };
  const fallback = {
    ...publicHomeTranslations.he,
    ...publicHomeUiTranslations.he,
  };
  return (key) => table[key] ?? fallback[key] ?? key;
}

/**
 * @param {'he' | 'ar' | 'en'} locale
 * @param {(key: string) => string} t
 * @param {string} donationHref
 */
export function getPublicNavLinks(t, donationHref) {
  return NAV_LINK_KEYS.map(({ key, href }) => ({
    label: t(key),
    href: href === '__donation__' ? donationHref : href,
  }));
}

/**
 * @param {object} hero
 * @param {'he' | 'ar' | 'en'} locale
 * @param {(key: string) => string} t
 */
export function getLocalizedHero(hero = {}, locale, t) {
  if (locale === 'he') {
    return {
      ...hero,
      title: hero.title || t('heroTitle'),
      subtitle: hero.subtitle || t('heroSubtitle'),
      description: hero.description || t('heroDescription'),
    };
  }

  return {
    ...hero,
    title: t('heroTitle'),
    subtitle: t('heroSubtitle'),
    description: t('heroDescription'),
  };
}
