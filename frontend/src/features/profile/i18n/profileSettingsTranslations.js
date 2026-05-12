/**
 * Profile Settings page — English / Hebrew copy.
 * Keys are stable; values are UI strings only.
 */

export const profileSettingsTranslations = {
  en: {
    profileSettings: "Profile Settings",
    profileSettingsSubtitle: "Manage your personal details and preferences.",
    darkMode: "Dark Mode",
    toggleDarkMode: "Toggle dark mode",

    navDashboard: "Dashboard",
    navCommunity: "Community",
    navMessages: "Messages",
    navEvents: "Events",
    navResources: "Resources",
    navSettings: "Settings",

    personalDetails: "Personal Details",
    personalDetailsSubtitle: "Update your information and communication preferences.",
    fullName: "Full Name",
    phoneNumber: "Phone Number",
    emailAddress: "Email Address",
    streetAddress: "Street Address",
    city: "City",
    birthDate: "Birth Date",
    preferredContactMethod: "Preferred Contact Method",
    language: "Language",

    contactEmail: "Email",
    contactPhone: "Phone Call",
    contactSms: "SMS",
    contactWhatsapp: "WhatsApp",

    languageEnglish: "English",
    languageHebrew: "Hebrew",

    editProfile: "Edit Profile",
    languageChipPrefix: "Language:",
    saveChanges: "Save Changes",
    saving: "Saving...",
    logout: "Logout",

    changePassword: "Change Password",
    changePasswordSubtitle: "Update your password to keep your account secure.",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    updatePassword: "Update Password",

    validationEmail: "Please enter a valid email address",
    validationPhone: "Please enter a valid Israeli phone number",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  he: {
    profileSettings: "הגדרות פרופיל",
    profileSettingsSubtitle: "נהל את הפרטים האישיים וההעדפות שלך.",
    darkMode: "מצב כהה",
    toggleDarkMode: "החלפת מצב תצוגה כהה",

    navDashboard: "לוח בקרה",
    navCommunity: "קהילה",
    navMessages: "הודעות",
    navEvents: "אירועים",
    navResources: "משאבים",
    navSettings: "הגדרות",

    personalDetails: "פרטים אישיים",
    personalDetailsSubtitle: "עדכן את המידע והעדפות התקשורת שלך.",
    fullName: "שם מלא",
    phoneNumber: "מספר טלפון",
    emailAddress: "כתובת דוא\"ל",
    streetAddress: "כתובת רחוב",
    city: "עיר",
    birthDate: "תאריך לידה",
    preferredContactMethod: "אמצעי קשר מועדף",
    language: "שפה",

    contactEmail: "דוא\"ל",
    contactPhone: "שיחת טלפון",
    contactSms: "SMS",
    contactWhatsapp: "וואטסאפ",

    languageEnglish: "אנגלית",
    languageHebrew: "עברית",

    editProfile: "עריכת פרופיל",
    languageChipPrefix: "שפה:",
    saveChanges: "שמור שינויים",
    saving: "שומר...",
    logout: "התנתק",

    changePassword: "שינוי סיסמה",
    changePasswordSubtitle: "עדכן את הסיסמה כדי לשמור על חשבון מאובטח.",
    currentPassword: "סיסמה נוכחית",
    newPassword: "סיסמה חדשה",
    confirmNewPassword: "אימות סיסמה חדשה",
    updatePassword: "עדכן סיסמה",

    validationEmail: "נא להזין כתובת דוא\"ל תקינה",
    validationPhone: "נא להזין מספר טלפון ישראלי תקין",
    showPassword: "הצג סיסמה",
    hidePassword: "הסתר סיסמה",
  },
};

/**
 * @param {'en' | 'he'} locale
 * @returns {(key: keyof typeof profileSettingsTranslations.en) => string}
 */
export function createProfileT(locale) {
  const table = profileSettingsTranslations[locale] || profileSettingsTranslations.en;
  const fallback = profileSettingsTranslations.en;
  return (key) => table[key] ?? fallback[key] ?? key;
}
