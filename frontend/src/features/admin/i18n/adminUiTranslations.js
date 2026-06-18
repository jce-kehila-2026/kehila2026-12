/**
 * Admin view — static UI copy (English / Hebrew).
 *
 * Mirrors the pattern used by `createProfileT` (Settings tab) and
 * `createParticipantT` (participant view): keys are stable, values are UI
 * strings only. Admin-authored *content* is already translated for viewers via
 * the Azure path (translationService) at save time — that is NOT duplicated here.
 *
 * Interpolation: values may contain `{name}` / `{n}` placeholders; resolve them
 * at the call site with `.replace('{name}', value)`.
 */

export const adminUiTranslations = {
  en: {
    // ── Foundation: language switcher ─────────────────────────────────────
    selectLanguage: 'Select language',
    languageEnglish: 'English',
    languageHebrew: 'עברית',

    // ── Shell: sidebar nav ────────────────────────────────────────────────
    navDashboard: 'Dashboard',
    navEvents: 'Events',
    navUsers: 'Users',
    navBookings: 'Bookings',
    navForms: 'Forms',
    navPublicHomePage: 'Public Home-page',
    navCommunity: 'Community',
    navUpdates: 'Updates',
    navAuditLog: 'Audit Log',
    navSettings: 'Settings',
    logout: 'Logout',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    adminBadge: 'ADMIN',

    // ── Shell: impersonation banner ───────────────────────────────────────
    impersonationViewingAs: 'Impersonation Active — Viewing as',
    exitImpersonation: 'Exit Impersonation',
  },
  he: {
    // ── Foundation: language switcher ─────────────────────────────────────
    selectLanguage: 'בחירת שפה',
    languageEnglish: 'English',
    languageHebrew: 'עברית',

    // ── Shell: sidebar nav ────────────────────────────────────────────────
    navDashboard: 'לוח בקרה',
    navEvents: 'אירועים',
    navUsers: 'משתמשים',
    navBookings: 'הזמנות',
    navForms: 'טפסים',
    navPublicHomePage: 'דף הבית הציבורי',
    navCommunity: 'קהילה',
    navUpdates: 'עדכונים',
    navAuditLog: 'יומן פעילות',
    navSettings: 'הגדרות',
    logout: 'התנתקות',
    expandSidebar: 'הרחבת סרגל צד',
    collapseSidebar: 'כיווץ סרגל צד',
    adminBadge: 'מנהלת',

    // ── Shell: impersonation banner ───────────────────────────────────────
    impersonationViewingAs: 'מצב התחזות פעיל — צופה בתור',
    exitImpersonation: 'יציאה מהתחזות',
  },
};

/**
 * Build a translator for the given admin locale. Falls back to the English
 * table, then to the raw key, so a missing string is never blank.
 *
 * @param {'en' | 'he'} locale
 * @returns {(key: keyof typeof adminUiTranslations.en) => string}
 */
export function createAdminT(locale) {
  const table = adminUiTranslations[locale] || adminUiTranslations.en;
  const fallback = adminUiTranslations.en;
  return (key) => table[key] ?? fallback[key] ?? key;
}
