import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'shena-a11y-prefs';

export const TEXT_SCALE_MIN = 80;
export const TEXT_SCALE_MAX = 160;
export const TEXT_SCALE_DEFAULT = 100;
export const TEXT_SCALE_STEP = 5;

const DEFAULT_PREFS = {
  textScale: TEXT_SCALE_DEFAULT, // percentage applied to <html> font-size
  highContrast: false,
  grayscale: false,
  highlightLinks: false,
  readableFont: false,
  stopAnimations: false,
};

// Coerce any stored/migrated value into a valid scale. The legacy
// textLevel→textScale migration (100 + level*12) and corrupt storage can both
// yield out-of-range or non-numeric values, which would otherwise be applied
// verbatim to <html> font-size.
function clampTextScale(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return TEXT_SCALE_DEFAULT;
  return Math.max(TEXT_SCALE_MIN, Math.min(TEXT_SCALE_MAX, n));
}

// On first visit (no saved prefs), seed defaults from the user's OS-level
// accessibility settings so the experience matches their system out of the box.
// Once the user adjusts anything, those saved choices win — we never override
// an explicit preference with the OS value. (prefers-color-scheme has no
// matching control yet; it would map to a future dark scheme.)
function getSystemDefaults() {
  const defaults = { ...DEFAULT_PREFS };
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      defaults.stopAnimations = true;
    }
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      defaults.highContrast = true;
    }
  } catch {
    // matchMedia unavailable — fall back to plain defaults.
  }
  return defaults;
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // migrate old textLevel field
      if ('textLevel' in saved && !('textScale' in saved)) {
        saved.textScale = TEXT_SCALE_DEFAULT + saved.textLevel * 12;
        delete saved.textLevel;
      }
      const merged = { ...DEFAULT_PREFS, ...saved };
      merged.textScale = clampTextScale(merged.textScale);
      return merged;
    }
  } catch {
    // ignore corrupt storage
  }
  return getSystemDefaults();
}

function applyPrefs(prefs) {
  // Scaling via <html> font-size so rem-based units (MUI, etc.) scale too
  document.documentElement.style.fontSize =
    prefs.textScale === TEXT_SCALE_DEFAULT ? '' : `${prefs.textScale}%`;

  const cl = document.body.classList;
  cl.toggle('a11y-high-contrast', prefs.highContrast);
  cl.toggle('a11y-grayscale', prefs.grayscale);
  cl.toggle('a11y-highlight-links', prefs.highlightLinks);
  cl.toggle('a11y-readable-font', prefs.readableFont);
  cl.toggle('a11y-stop-animations', prefs.stopAnimations);
}

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPrefs);

  useEffect(() => {
    applyPrefs(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage errors
    }
  }, [prefs]);

  const setTextScale = useCallback((scale) =>
    setPrefs((p) => ({ ...p, textScale: clampTextScale(scale) })), []);

  const toggle = useCallback((key) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] })), []);

  const reset = useCallback(() => {
    setPrefs({ ...DEFAULT_PREFS });
  }, []);

  return (
    <AccessibilityContext.Provider value={{ prefs, setTextScale, toggle, reset }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used inside AccessibilityProvider');
  return ctx;
}
