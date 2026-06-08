import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import { useAccessibility } from '../context/AccessibilityContext';
import { TEXT_SCALE_MIN, TEXT_SCALE_MAX, TEXT_SCALE_DEFAULT, TEXT_SCALE_STEP } from '../context/AccessibilityContext';
import {
  getParticipantLocaleDirection,
  getParticipantLocaleLang,
  getStoredParticipantLocale,
} from '../features/participant/i18n/participantLocale';
import { getAccessibilityWidgetStrings } from './accessibilityWidgetStrings';

const STORAGE_KEY = 'shena-a11y-widget-top';
const BTN_SIZE = 52;
const LEFT_OFFSET = 16; // 1rem

const SUPPORTED_LOCALES = ['he', 'en', 'ar'];

// The widget is mounted globally, so it follows the language the page is
// currently rendered in. Both the public site and the participant app keep the
// <html lang> attribute in sync with the active locale, so that's the single
// source of truth; fall back to the participant store if it isn't set yet.
function resolveWidgetLocale() {
  const htmlLang = (document.documentElement.getAttribute('lang') || '').slice(0, 2).toLowerCase();
  if (SUPPORTED_LOCALES.includes(htmlLang)) return htmlLang;
  return getStoredParticipantLocale();
}

function getSavedTop() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null) return Number(v);
  } catch { /* ignore */ }
  return null;
}

function clampTop(top) {
  return Math.max(0, Math.min(top, window.innerHeight - BTN_SIZE));
}

function defaultTop() {
  return window.innerHeight - BTN_SIZE - 16;
}

// Labels are resolved from the active locale at render time (see TOGGLE_KEYS).
const TOGGLE_KEYS = ['grayscale', 'highlightLinks', 'readableFont', 'stopAnimations'];
const CONTRAST_OPTIONS = ['none', 'dark', 'light'];

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(() => {
    const saved = getSavedTop();
    return saved !== null ? saved : defaultTop();
  });
  const [isDragging, setIsDragging] = useState(false);

  const { prefs, setTextScale, toggle, setContrastScheme, reset } = useAccessibility();
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);

  // drag state held in refs so pointer handlers are stable
  const dragRef = useRef({ active: false, startY: 0, startTop: 0, moved: false });

  // Follow the participant's chosen language (he/en/ar). The widget is mounted
  // globally, so it reacts to same-tab changes via the custom locale event and
  // to cross-tab changes via the storage event.
  const [locale, setLocale] = useState(resolveWidgetLocale);
  useEffect(() => {
    const sync = () => setLocale(resolveWidgetLocale());

    // Primary signal: <html lang> changes (set by whichever locale system owns
    // the current page). Fallbacks: same-tab locale switches and cross-tab
    // storage changes.
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    window.addEventListener('shena:locale-change', sync);
    window.addEventListener('storage', sync);

    // Catch a lang attribute that was set before this effect ran.
    sync();

    return () => {
      observer.disconnect();
      window.removeEventListener('shena:locale-change', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const t = getAccessibilityWidgetStrings(locale);
  const dir = getParticipantLocaleDirection(locale);
  const lang = getParticipantLocaleLang(locale);

  const close = useCallback(() => setOpen(false), []);

  // Clamp on resize
  useEffect(() => {
    function onResize() {
      setTop((t) => clampTop(t));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Persist position
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(top)); } catch { /* ignore */ }
  }, [top]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) close();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Focus management: move focus into the panel on open, trap Tab within it,
  // and return focus to the trigger on close (unless the user moved focus to
  // another element, e.g. by clicking outside onto a focusable control).
  useEffect(() => {
    if (!open) return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const getFocusable = () => Array.from(
      dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);

    (getFocusable()[0] ?? dialog).focus();

    function onKeyDown(e) {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialog.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }

    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      const active = document.activeElement;
      if (!active || active === document.body || dialog.contains(active)) {
        triggerRef.current?.focus();
      }
    };
  }, [open]);

  function onPointerDown(e) {
    // Only drag with primary button / single touch
    if (e.button !== undefined && e.button !== 0) return;
    dragRef.current = { active: true, startY: e.clientY, startTop: top, moved: false };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    const d = dragRef.current;
    if (!d.active) return;
    const delta = e.clientY - d.startY;
    if (Math.abs(delta) > 4) d.moved = true;
    if (d.moved) setTop(clampTop(d.startTop + delta));
  }

  function onPointerUp() {
    dragRef.current.active = false;
    setIsDragging(false);
  }

  // If the gesture is cancelled (e.g. interrupted by the OS, or a touch turns
  // into a scroll), end the drag and clear `moved` — otherwise active stays
  // true and a stale `moved` would swallow the next click.
  function onPointerCancel() {
    dragRef.current.active = false;
    dragRef.current.moved = false;
    setIsDragging(false);
  }

  function onClickTrigger() {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    setOpen((v) => !v);
  }


  // Open on whichever side of the button has more room, and cap the panel's
  // height to that space so it always stays on-screen — scrolling internally
  // rather than overflowing the viewport (e.g. at large text scale or on short
  // screens, where the slider + toggles + reset + link would exceed the height).
  const PANEL_GAP = 8;
  const VIEWPORT_PADDING = 8;
  const spaceAbove = top;
  const spaceBelow = window.innerHeight - (top + BTN_SIZE);
  const openAbove = spaceAbove > spaceBelow;
  const maxPanelHeight = Math.max(
    160,
    (openAbove ? spaceAbove : spaceBelow) - PANEL_GAP - VIEWPORT_PADDING,
  );

  return (
    <div
      ref={containerRef}
      className="a11y-widget"
      lang={lang}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${LEFT_OFFSET}px`,
        // Always-on-top: above app modals/overlays (which go up to z-index
        // 10000) so the accessibility controls stay reachable at all times.
        zIndex: 2147483647,
        direction: dir,
        fontFamily: 'Arial, Helvetica, sans-serif',
        width: `${BTN_SIZE}px`,
      }}
    >
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label={t.triggerLabel}
          aria-modal="false"
          tabIndex={-1}
          style={{
            position: 'absolute',
            ...(openAbove
              ? { bottom: `${BTN_SIZE + PANEL_GAP}px` }
              : { top: `${BTN_SIZE + PANEL_GAP}px` }),
            left: 0,
            backgroundColor: '#fff',
            border: '2px solid #333',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            padding: '0.75rem',
            minWidth: '220px',
            maxHeight: `${maxPanelHeight}px`,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <p
            style={{
              margin: '0 0 0.5rem 0',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#111',
              textAlign: 'center',
              borderBottom: '1px solid #ddd',
              paddingBottom: '0.4rem',
            }}
          >
            {t.panelTitle}
          </p>

          {/* Text size slider */}
          <div style={{ padding: '0.3rem 0.75rem 0.5rem', direction: dir }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111' }}>{t.textSize}</span>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: prefs.textScale === TEXT_SCALE_DEFAULT ? '#888' : '#ec168c',
                minWidth: '38px',
                textAlign: 'left',
              }}>
                {prefs.textScale}%
              </span>
            </div>
            <input
              type="range"
              dir="ltr"
              min={TEXT_SCALE_MIN}
              max={TEXT_SCALE_MAX}
              step={TEXT_SCALE_STEP}
              value={prefs.textScale}
              onChange={(e) => setTextScale(Number(e.target.value))}
              aria-label={t.textSize}
              aria-valuemin={TEXT_SCALE_MIN}
              aria-valuemax={TEXT_SCALE_MAX}
              aria-valuenow={prefs.textScale}
              aria-valuetext={`${prefs.textScale}%`}
              style={{ width: '100%', accentColor: '#ec168c', cursor: 'pointer' }}
            />
            <div dir="ltr" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#999', marginTop: '0.15rem' }}>
              <span>80%</span>
              <span>160%</span>
            </div>

            {/* Discrete steppers — easier than the slider for users with limited
                fine motor control. Order is fixed (−, reset, +) regardless of
                direction. */}
            <div
              role="group"
              aria-label={t.textSize}
              dir="ltr"
              style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}
            >
              {[
                { key: 'dec', label: 'A−', aria: t.decreaseTextSize, font: '0.8rem', onClick: () => setTextScale(prefs.textScale - TEXT_SCALE_STEP), disabled: prefs.textScale <= TEXT_SCALE_MIN },
                { key: 'reset', label: 'A', aria: t.resetTextSize, font: '1rem', onClick: () => setTextScale(TEXT_SCALE_DEFAULT), disabled: prefs.textScale === TEXT_SCALE_DEFAULT },
                { key: 'inc', label: 'A+', aria: t.increaseTextSize, font: '1.2rem', onClick: () => setTextScale(prefs.textScale + TEXT_SCALE_STEP), disabled: prefs.textScale >= TEXT_SCALE_MAX },
              ].map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={b.onClick}
                  disabled={b.disabled}
                  aria-label={b.aria}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0',
                    borderRadius: '8px',
                    border: '2px solid #e2e2e2',
                    backgroundColor: '#f5f5f5',
                    color: '#111',
                    cursor: b.disabled ? 'default' : 'pointer',
                    opacity: b.disabled ? 0.45 : 1,
                    fontWeight: 700,
                    fontSize: b.font,
                    lineHeight: 1,
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <hr style={{ margin: '0.1rem 0 0.25rem', borderColor: '#eee' }} />

          {/* Contrast scheme — mutually exclusive (radio), unlike the toggles below. */}
          <div style={{ padding: '0.1rem 0.75rem 0.35rem', direction: dir }}>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#111', marginBottom: '0.35rem' }}>
              {t.contrastLabel}
            </span>
            <div role="radiogroup" aria-label={t.contrastLabel} style={{ display: 'flex', gap: '0.35rem' }}>
              {CONTRAST_OPTIONS.map((scheme) => {
                const selected = prefs.contrastScheme === scheme;
                const label = scheme === 'dark' ? t.contrastDark : scheme === 'light' ? t.contrastLight : t.contrastOff;
                return (
                  <button
                    key={scheme}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setContrastScheme(scheme)}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0',
                      borderRadius: '8px',
                      border: selected ? '2px solid #ec168c' : '2px solid #e2e2e2',
                      backgroundColor: selected ? '#fde7f3' : '#f5f5f5',
                      color: '#111',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: selected ? 700 : 400,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <hr style={{ margin: '0.1rem 0 0.25rem', borderColor: '#eee' }} />

          {TOGGLE_KEYS.map((key) => {
            const active = prefs[key];
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                aria-pressed={active}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: active ? '2px solid #ec168c' : '2px solid transparent',
                  backgroundColor: active ? '#fde7f3' : '#f5f5f5',
                  color: '#111',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 400,
                  textAlign: 'start',
                  width: '100%',
                }}
              >
                <span>{t.toggles[key]}</span>
                {active && (
                  <span aria-hidden="true" style={{ fontSize: '0.75rem', color: '#ec168c' }}>✓</span>
                )}
              </button>
            );
          })}

          <hr style={{ margin: '0.35rem 0', borderColor: '#ddd' }} />

          <button
            onClick={reset}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '2px solid transparent',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              textAlign: 'start',
              width: '100%',
            }}
          >
            {t.reset}
          </button>

          <Link
            to="/accessibility"
            onClick={close}
            style={{
              display: 'block',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: '2px solid transparent',
              backgroundColor: '#f0fdf4',
              color: '#15803d',
              fontSize: '0.85rem',
              fontWeight: 600,
              textAlign: 'start',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            {t.statement}
          </Link>
        </div>
      )}

      <button
        ref={triggerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={onClickTrigger}
        aria-label={t.triggerLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={t.triggerTitle}
        style={{
          width: `${BTN_SIZE}px`,
          height: `${BTN_SIZE}px`,
          borderRadius: '50%',
          border: '3px solid #ec168c',
          backgroundColor: '#fff',
          color: '#ec168c',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <AccessibilityNewIcon aria-hidden="true" style={{ fontSize: '1.85rem' }} />
      </button>
    </div>
  );
}
