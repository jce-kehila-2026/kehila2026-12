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

    // ── Shared: actions / types / statuses ────────────────────────────────
    actionCreate: 'CREATE',
    actionUpdate: 'UPDATE',
    actionDelete: 'DELETE',
    actionReorder: 'REORDER',
    typeWorkshop: 'Workshop',
    typeAppointment: 'Appointment',
    statusConfirmed: 'confirmed',
    statusPending: 'pending',
    statusCancelled: 'cancelled',
    statusCompleted: 'completed',
    communityMember: 'Community member',
    retry: 'Retry',
    view: 'View',

    // ── Dashboard ─────────────────────────────────────────────────────────
    dashWelcome: 'Welcome back, {name}',
    dashOverviewSubtitle: "Here's an overview of the She-Na platform",
    dashTotalEvents: 'Total Events',
    dashActivePlatformEvents: 'Active platform events',
    dashRegisteredUsers: 'Registered Users',
    dashCommunityMembers: 'Community members',
    dashTotalBookings: 'Total Bookings',
    dashBookingsSubtext: 'Workshop & appointment bookings',
    dashMetricsAria: 'Dashboard metrics',
    dashEventsOverview: 'Events Overview',
    dashViewAllEvents: 'View all events',
    dashTotal: 'Total',
    ovWorkshops: 'Workshops',
    ovAppointments: 'Appointments',
    ovUpcoming: 'Upcoming',
    ovCompleted: 'Completed',
    ovCancelled: 'Cancelled',
    dashRecentBookings: 'Recent Bookings',
    dashViewAllBookings: 'View all bookings',
    dashWorkshopBooking: 'Workshop Booking',
    dashRecentActivity: 'Recent Activity',
    dashViewAllActivity: 'View all activity',
    colTime: 'Time',
    colAdmin: 'Admin',
    colAction: 'Action',
    colTarget: 'Target',
    colDetails: 'Details',

    // ── Audit log: chrome ─────────────────────────────────────────────────
    auditTitle: 'Admin Activity History',
    auditSubtitle: 'Track changes made by admins across the platform.',
    auditSearchPlaceholder: 'Search admin email or name',
    auditActivityType: 'Activity type',
    auditDateFrom: 'Date from',
    auditDateTo: 'Date to',
    auditClear: 'Clear',
    colDateTime: 'Date & Time',
    colActivity: 'Activity',
    colArea: 'Area',
    colSummary: 'Summary',
    auditLoading: 'Loading activity history...',
    auditError: 'Could not load admin activity history.',
    auditNoMatch: 'No admin activity matches these filters.',
    auditDetailsAria: 'Activity details',
    closeActivityDetails: 'Close activity details',
    auditSummaryHeading: 'Summary',
    detailAdmin: 'Admin',
    detailTimestamp: 'Timestamp',
    detailArea: 'Area',
    detailTarget: 'Target',
    detailNotSpecified: 'Not specified',
    whatChanged: 'What changed',
    noFieldDetails: 'No field-level details were saved for this activity.',
    advancedDetails: 'Advanced developer details',
    beforeLabel: 'Before',
    afterLabel: 'After',
    dateUnavailable: 'Date unavailable',

    // ── Audit log: activity filters ───────────────────────────────────────
    filterAll: 'All activities',
    filterEvents: 'Events',
    filterBookings: 'Bookings',
    filterPublicHome: 'Public home page',
    filterUsersRoles: 'Users and roles',
    filterSettings: 'Settings',
    filterCommunity: 'Community',

    // ── Audit log: area labels ────────────────────────────────────────────
    areaEvent: 'Events',
    areaBooking: 'Bookings',
    areaPublic: 'Public home page',
    areaUser: 'Users',
    areaCommunity: 'Community',
    areaSettings: 'Settings',
    areaGeneral: 'General',
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

    // ── Shared: actions / types / statuses ────────────────────────────────
    actionCreate: 'יצירה',
    actionUpdate: 'עדכון',
    actionDelete: 'מחיקה',
    actionReorder: 'סידור מחדש',
    typeWorkshop: 'סדנה',
    typeAppointment: 'פגישה',
    statusConfirmed: 'מאושר',
    statusPending: 'ממתין',
    statusCancelled: 'בוטל',
    statusCompleted: 'הושלם',
    communityMember: 'חברת קהילה',
    retry: 'נסי שוב',
    view: 'צפייה',

    // ── Dashboard ─────────────────────────────────────────────────────────
    dashWelcome: 'טוב שחזרת, {name}',
    dashOverviewSubtitle: 'הנה סקירה כללית של פלטפורמת She-Na',
    dashTotalEvents: 'סך האירועים',
    dashActivePlatformEvents: 'אירועים פעילים בפלטפורמה',
    dashRegisteredUsers: 'משתמשים רשומים',
    dashCommunityMembers: 'חברות הקהילה',
    dashTotalBookings: 'סך ההזמנות',
    dashBookingsSubtext: 'הזמנות לסדנאות ולפגישות',
    dashMetricsAria: 'מדדי לוח הבקרה',
    dashEventsOverview: 'סקירת אירועים',
    dashViewAllEvents: 'צפייה בכל האירועים',
    dashTotal: 'סה"כ',
    ovWorkshops: 'סדנאות',
    ovAppointments: 'פגישות',
    ovUpcoming: 'קרובים',
    ovCompleted: 'הושלמו',
    ovCancelled: 'בוטלו',
    dashRecentBookings: 'הזמנות אחרונות',
    dashViewAllBookings: 'צפייה בכל ההזמנות',
    dashWorkshopBooking: 'הזמנת סדנה',
    dashRecentActivity: 'פעילות אחרונה',
    dashViewAllActivity: 'צפייה בכל הפעילות',
    colTime: 'זמן',
    colAdmin: 'מנהלת',
    colAction: 'פעולה',
    colTarget: 'יעד',
    colDetails: 'פרטים',

    // ── Audit log: chrome ─────────────────────────────────────────────────
    auditTitle: 'היסטוריית פעילות מנהלים',
    auditSubtitle: 'מעקב אחר שינויים שבוצעו על ידי מנהלים בכל הפלטפורמה.',
    auditSearchPlaceholder: 'חיפוש לפי אימייל או שם מנהל',
    auditActivityType: 'סוג פעילות',
    auditDateFrom: 'מתאריך',
    auditDateTo: 'עד תאריך',
    auditClear: 'ניקוי',
    colDateTime: 'תאריך ושעה',
    colActivity: 'פעילות',
    colArea: 'תחום',
    colSummary: 'תקציר',
    auditLoading: 'טוען היסטוריית פעילות...',
    auditError: 'לא ניתן לטעון את היסטוריית פעילות המנהלים.',
    auditNoMatch: 'אין פעילות מנהל התואמת למסננים אלה.',
    auditDetailsAria: 'פרטי פעילות',
    closeActivityDetails: 'סגירת פרטי הפעילות',
    auditSummaryHeading: 'תקציר',
    detailAdmin: 'מנהלת',
    detailTimestamp: 'חותמת זמן',
    detailArea: 'תחום',
    detailTarget: 'יעד',
    detailNotSpecified: 'לא צוין',
    whatChanged: 'מה השתנה',
    noFieldDetails: 'לא נשמרו פרטים ברמת השדה עבור פעילות זו.',
    advancedDetails: 'פרטי מפתח מתקדמים',
    beforeLabel: 'לפני',
    afterLabel: 'אחרי',
    dateUnavailable: 'תאריך לא זמין',

    // ── Audit log: activity filters ───────────────────────────────────────
    filterAll: 'כל הפעילויות',
    filterEvents: 'אירועים',
    filterBookings: 'הזמנות',
    filterPublicHome: 'דף הבית הציבורי',
    filterUsersRoles: 'משתמשים ותפקידים',
    filterSettings: 'הגדרות',
    filterCommunity: 'קהילה',

    // ── Audit log: area labels ────────────────────────────────────────────
    areaEvent: 'אירועים',
    areaBooking: 'הזמנות',
    areaPublic: 'דף הבית הציבורי',
    areaUser: 'משתמשים',
    areaCommunity: 'קהילה',
    areaSettings: 'הגדרות',
    areaGeneral: 'כללי',
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
