import { publicHomeUiTranslations } from './publicHomeUiTranslations';
import { localizeField } from '../../../i18n/localizeField';

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
  { key: 'navStories', href: '/public/stories-articles' },
  { key: 'navDonations', href: '__donation__' },
  { key: 'navContact', href: '#contact' },
];

const NAVBAR_LINK_KEYS = [
  { key: 'navbarStories', href: '/public/stories-articles' },
  { key: 'navbarTeamPartners', href: '/public/team-partners' },
  { key: 'navDonations', href: '__donation__' },
  { key: 'navContact', href: '#contact' },
];

const NAVBAR_HOME_MENU_KEYS = [
  { key: 'navAboutUs', href: '#support' },
  { key: 'navUpcomingEvents', href: '#events' },
];

const NAVBAR_STORIES_MENU_KEYS = [
  { key: 'navbarStoriesMenuStories', href: '#stories' },
  { key: 'navbarStoriesMenuArticles', href: '#articles' },
];

const NAVBAR_TEAM_MENU_KEYS = [
  { key: 'navOurTeam', href: '#team' },
  { key: 'navOurPartners', href: '#medical-partners' },
];

export const publicHomeTranslations = {
  he: {
    navHome: 'הבית',
    navSimpleHome: 'עמוד הבית',
    navLearnTogether: 'מי אנחנו',
    navStories: 'סיפורים ומאמרים',
    navbarStories: 'סיפורים ומאמרים',
    navbarTeamPartners: 'הצוות והשותפים',
    navDonations: 'תרומות',
    navContact: 'צרי קשר',
    navAboutUs: 'מי אנחנו',
    navUpcomingEvents: 'פעילויות קרובות',
    navOurTeam: 'הצוות שלנו',
    navOurPartners: 'השותפים שלנו',
    navHomeMenuLabel: 'תפריט הבית',
    navbarStoriesMenuLabel: 'תפריט סיפורים ומאמרים',
    navbarTeamMenuLabel: 'תפריט הצוות והשותפים',
    navbarStoriesMenuStories: 'סיפורים',
    navbarStoriesMenuArticles: 'מאמרים',
    navJoin: 'להצטרף',
    navPersonalArea: 'איזור אישי',
    navVolunteer: 'להתנדב',
    heroJoinCommunity: 'להצטרף לקהילה',
    heroDonate: 'לתרומה',
    heroTitle: 'את לא לבד במסע שלך',
    heroSubtitle: 'קהילה תומכת לנשים ולמתמודדות עם סרטן',
    heroDescription: 'מרחב חם, בטוח ומקצועי לתמיכה, ליווי, למידה ותקווה לאורך הדרך.',
    heroJourneyTitle: 'אנחנו כאן, מהרגע הראשון',
    heroJourneyTitleAccent: 'אנחנו כאן,',
    heroJourneyTitleRest: 'מהרגע הראשון',
    heroJourneyIntro: 'עמותת SHE-NA מלווה נשים המתמודדות עם סרטן ומעניקה להן תמיכה רגשית, מידע אמין וקהילה שמבינה.',
    heroJourneyAriaLabel: 'מסלול הליווי שלנו',
    heroStepContactTitle: 'יוצרות קשר',
    heroStepContactText: 'פונות אלינו ופותחות את הצעד הראשון.',
    heroStepMatchTitle: 'מתאימות תמיכה',
    heroStepMatchText: 'אנחנו מתאימות עבורך את התמיכה המדויקת לך.',
    heroStepGuideTitle: 'מלוות אותך',
    heroStepGuideText: 'מלוות אותך לאורך הדרך בתמיכה אישית ומקצועית.',
    heroStepTogetherTitle: 'נשארות יחד',
    heroStepTogetherText: 'קהילה תומכת שנשארת לצידך, תמיד.',
    heroStartHere: 'להצטרף',
    heroHowItWorks: 'איך זה עובד?',
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
    navSimpleHome: 'الرئيسية',
    navLearnTogether: 'من نحن',
    navStories: 'قصص ومقالات',
    navbarStories: 'قصص ومقالات',
    navbarTeamPartners: 'الفريق والشركاء',
    navDonations: 'تبرعات',
    navContact: 'تواصلي معنا',
    navAboutUs: 'من نحن',
    navUpcomingEvents: 'الفعاليات القريبة',
    navOurTeam: 'فريقنا',
    navOurPartners: 'شركاؤنا',
    navHomeMenuLabel: 'قائمة الرئيسية',
    navbarStoriesMenuLabel: 'قائمة القصص والمقالات',
    navbarTeamMenuLabel: 'قائمة الفريق والشركاء',
    navbarStoriesMenuStories: 'قصص',
    navbarStoriesMenuArticles: 'مقالات',
    navJoin: 'انضمّي',
    navPersonalArea: 'المنطقة الشخصية',
    navVolunteer: 'تطوّعي',
    heroJoinCommunity: 'انضمّي إلى المجتمع',
    heroDonate: 'تبرّعي',
    heroTitle: 'لستِ وحدك في رحلتك',
    heroSubtitle: 'مجتمع داعم للنساء والمُواجِهات للسرطان',
    heroDescription: 'مساحة دافئة وآمنة ومهنية للدعم والمرافقة والتعلّم والأمل طوال الطريق.',
    heroJourneyTitle: 'نحن هنا، منذ اللحظة الأولى',
    heroJourneyTitleAccent: 'نحن هنا،',
    heroJourneyTitleRest: 'منذ اللحظة الأولى',
    heroJourneyIntro: 'ترافق جمعية SHE-NA النساء اللواتي يواجهن السرطان وتمنحهن دعمًا عاطفيًا، معلومات موثوقة ومجتمعًا يفهمهن.',
    heroJourneyAriaLabel: 'مسار المرافقة لدينا',
    heroStepContactTitle: 'نتواصل',
    heroStepContactText: 'تتواصلين معنا وتبدئين الخطوة الأولى.',
    heroStepMatchTitle: 'نلائم الدعم',
    heroStepMatchText: 'نلائم لكِ الدعم المناسب لاحتياجاتك.',
    heroStepGuideTitle: 'نرافقك',
    heroStepGuideText: 'نرافقك طوال الطريق بدعم شخصي ومهني.',
    heroStepTogetherTitle: 'نبقى معًا',
    heroStepTogetherText: 'مجتمع داعم يبقى إلى جانبك دائمًا.',
    heroStartHere: 'انضمّي',
    heroHowItWorks: 'كيف يعمل؟',
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
    navSimpleHome: 'Home',
    navLearnTogether: 'About Us',
    navStories: 'Stories & Articles',
    navbarStories: 'Stories & Articles',
    navbarTeamPartners: 'Team & Partners',
    navDonations: 'Donate',
    navContact: 'Contact',
    navAboutUs: 'About Us',
    navUpcomingEvents: 'Upcoming Activities',
    navOurTeam: 'Our Team',
    navOurPartners: 'Our Partners',
    navHomeMenuLabel: 'Home menu',
    navbarStoriesMenuLabel: 'Stories and articles menu',
    navbarTeamMenuLabel: 'Team and partners menu',
    navbarStoriesMenuStories: 'Stories',
    navbarStoriesMenuArticles: 'Articles',
    navJoin: 'Join',
    navPersonalArea: 'Personal Area',
    navVolunteer: 'Volunteer',
    heroJoinCommunity: 'Join the Community',
    heroDonate: 'Donate',
    heroTitle: 'You Are Not Alone on Your Journey',
    heroSubtitle: 'A supportive community for women facing cancer',
    heroDescription:
      'A warm, safe, and professional space for support, guidance, learning, and hope along the way.',
    heroJourneyTitle: 'We are here, from the very first moment',
    heroJourneyTitleAccent: 'We are here,',
    heroJourneyTitleRest: 'from the very first moment',
    heroJourneyIntro:
      'SHE-NA accompanies women facing cancer with emotional support, trusted information, and a community that understands.',
    heroJourneyAriaLabel: 'Our support journey',
    heroStepContactTitle: 'Get in touch',
    heroStepContactText: 'Contact us and take the first step.',
    heroStepMatchTitle: 'Match support',
    heroStepMatchText: 'We match you with support tailored to your needs.',
    heroStepGuideTitle: 'Walk with you',
    heroStepGuideText: 'We accompany you with personal, professional support.',
    heroStepTogetherTitle: 'Stay together',
    heroStepTogetherText: 'A supportive community that stays by your side.',
    heroStartHere: 'Join',
    heroHowItWorks: 'How does it work?',
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

export function getPublicNavbarLinks(t, donationHref) {
  return NAVBAR_LINK_KEYS.map(({ key, href }) => ({
    label: t(key),
    href: href === '__donation__' ? donationHref : href,
  }));
}

export function getPublicNavbarHomeMenu(t) {
  return NAVBAR_HOME_MENU_KEYS.map(({ key, href }) => ({
    label: t(key),
    href,
  }));
}

export function getPublicNavbarStoriesMenu(t) {
  return NAVBAR_STORIES_MENU_KEYS.map(({ key, href }) => ({
    label: t(key),
    href,
  }));
}

export function getPublicNavbarTeamMenu(t) {
  return NAVBAR_TEAM_MENU_KEYS.map(({ key, href }) => ({
    label: t(key),
    href,
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

  // Non-Hebrew: prefer the admin's Azure-translated hero text, falling back to
  // the static UI translation when the hero hasn't been translated.
  return {
    ...hero,
    title: localizeField(hero.translations?.title, locale) || t('heroTitle'),
    subtitle: localizeField(hero.translations?.subtitle, locale) || t('heroSubtitle'),
    description: localizeField(hero.translations?.description, locale) || t('heroDescription'),
  };
}
