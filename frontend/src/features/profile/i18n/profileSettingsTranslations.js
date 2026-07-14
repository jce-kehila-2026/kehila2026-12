/**
 * Profile Settings page — English / Hebrew copy.
 * Keys are stable; values are UI strings only.
 */

export const profileSettingsTranslations = {
  en: {
    profileSettings: "Profile Settings",
    profileSettingsSubtitle: "Manage your personal details and preferences.",
    settingsTitle: "Settings",
    settingsSubtitle: "Manage your account settings and preferences.",
    tabPersonalInfo: "Personal Info",
    tabPrivacy: "Privacy",
    tabPassword: "Password",
    communitySettings: "Community Settings",
    showBirthdayTitle: "Show my birthday in the community",
    showBirthdayDescription:
      "This only controls community visibility. Your birthday stays unchanged in Settings.",
    birthDateLabel: "Birth date",
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
    firstName: "First Name",
    lastName: "Last Name",
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
    newPasswordMustDiffer: "New password must be different from the current password.",
    passwordsDoNotMatch: "Passwords do not match.",
    currentPasswordIncorrect: "Current password is incorrect.",

    validationEmail: "Please enter a valid email address",
    validationEmailRequired: "Email address is required",
    validationPhone: "Please enter a valid Israeli phone number",
    validationPhoneRequired: "Phone number is required",
    validationFullNameRequired: "Full name is required",
    validationCityRequired: "City is required",
    validationStreetAddressRequired: "Street address is required",
    validationBirthDateRequired: "Birth date is required",
    validationPreferredContactRequired: "Preferred contact method is required",
    validationLanguageRequired: "Language is required",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  he: {
    profileSettings: "הגדרות פרופיל",
    profileSettingsSubtitle: "נהל את הפרטים האישיים וההעדפות שלך.",
    settingsTitle: "הגדרות",
    settingsSubtitle: "נהלי את הגדרות החשבון וההעדפות שלך.",
    tabPersonalInfo: "פרטים אישיים",
    tabPrivacy: "פרטיות",
    tabPassword: "סיסמה",
    communitySettings: "הגדרות קהילה",
    showBirthdayTitle: "הציגי את יום ההולדת שלי בקהילה",
    showBirthdayDescription:
      "הגדרה זו משפיעה רק על הנראות בקהילה. תאריך הלידה בפרופיל נשאר ללא שינוי.",
    birthDateLabel: "תאריך לידה",
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
    firstName: "שם פרטי",
    lastName: "שם משפחה",
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
    newPasswordMustDiffer: "הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית.",
    passwordsDoNotMatch: "הסיסמאות אינן תואמות.",
    currentPasswordIncorrect: "הסיסמה הנוכחית שגויה.",

    validationEmail: "נא להזין כתובת דוא\"ל תקינה",
    validationEmailRequired: "כתובת דוא\"ל נדרשת",
    validationPhone: "נא להזין מספר טלפון ישראלי תקין",
    validationPhoneRequired: "מספר טלפון נדרש",
    validationFullNameRequired: "שם מלא נדרש",
    validationCityRequired: "עיר נדרשת",
    validationStreetAddressRequired: "כתובת רחוב נדרשת",
    validationBirthDateRequired: "תאריך לידה נדרש",
    validationPreferredContactRequired: "נא לבחור אמצעי קשר מועדף",
    validationLanguageRequired: "נא לבחור שפה",
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
