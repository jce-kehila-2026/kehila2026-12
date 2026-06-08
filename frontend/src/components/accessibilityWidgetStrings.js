// UI strings for the floating AccessibilityWidget, keyed by locale.
// Falls back to English for any unknown locale.

const WIDGET_STRINGS = {
  en: {
    triggerLabel: 'Accessibility menu',
    triggerTitle: 'Drag to move, click to open the accessibility menu',
    panelTitle: 'Accessibility options',
    textSize: 'Text size',
    decreaseTextSize: 'Decrease text size',
    resetTextSize: 'Reset text size',
    increaseTextSize: 'Increase text size',
    reset: 'Reset settings',
    statement: 'Accessibility statement',
    toggles: {
      highContrast: 'High contrast',
      grayscale: 'Grayscale',
      highlightLinks: 'Highlight links',
      readableFont: 'Readable font',
      stopAnimations: 'Stop animations',
    },
  },
  he: {
    triggerLabel: 'סרגל נגישות',
    triggerTitle: 'גרור להזזה, לחץ לפתיחת סרגל נגישות',
    panelTitle: 'אפשרויות נגישות',
    textSize: 'גודל טקסט',
    decreaseTextSize: 'הקטנת גודל הטקסט',
    resetTextSize: 'איפוס גודל הטקסט',
    increaseTextSize: 'הגדלת גודל הטקסט',
    reset: 'איפוס הגדרות',
    statement: 'הצהרת נגישות',
    toggles: {
      highContrast: 'ניגודיות גבוהה',
      grayscale: 'גווני אפור',
      highlightLinks: 'הדגשת קישורים',
      readableFont: 'פונט קריא',
      stopAnimations: 'עצירת הבהובים',
    },
  },
  ar: {
    triggerLabel: 'قائمة إمكانية الوصول',
    triggerTitle: 'اسحب للتحريك، انقر لفتح قائمة إمكانية الوصول',
    panelTitle: 'خيارات إمكانية الوصول',
    textSize: 'حجم النص',
    decreaseTextSize: 'تصغير حجم النص',
    resetTextSize: 'إعادة ضبط حجم النص',
    increaseTextSize: 'تكبير حجم النص',
    reset: 'إعادة ضبط الإعدادات',
    statement: 'بيان إمكانية الوصول',
    toggles: {
      highContrast: 'تباين عالٍ',
      grayscale: 'تدرّج رمادي',
      highlightLinks: 'إبراز الروابط',
      readableFont: 'خط مقروء',
      stopAnimations: 'إيقاف الحركة',
    },
  },
};

export function getAccessibilityWidgetStrings(locale) {
  return WIDGET_STRINGS[locale] ?? WIDGET_STRINGS.en;
}
