import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import { TEXT_SCALE_MIN, TEXT_SCALE_MAX, TEXT_SCALE_DEFAULT, TEXT_SCALE_STEP } from '../context/AccessibilityContext';

const STORAGE_KEY = 'shena-a11y-widget-top';
const BTN_SIZE = 52;
const LEFT_OFFSET = 16; // 1rem

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

const TOGGLE_ITEMS = [
  { id: 'highContrast', label: 'ניגודיות גבוהה', toggleKey: 'highContrast' },
  { id: 'grayscale', label: 'גווני אפור', toggleKey: 'grayscale' },
  { id: 'highlightLinks', label: 'הדגשת קישורים', toggleKey: 'highlightLinks' },
  { id: 'readableFont', label: 'פונט קריא', toggleKey: 'readableFont' },
  { id: 'stopAnimations', label: 'עצירת הבהובים', toggleKey: 'stopAnimations' },
];

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(() => {
    const saved = getSavedTop();
    return saved !== null ? saved : defaultTop();
  });

  const { prefs, setTextScale, toggle, reset } = useAccessibility();
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  // drag state held in refs so pointer handlers are stable
  const dragRef = useRef({ active: false, startY: 0, startTop: 0, moved: false });

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

  function onPointerDown(e) {
    // Only drag with primary button / single touch
    if (e.button !== undefined && e.button !== 0) return;
    dragRef.current = { active: true, startY: e.clientY, startTop: top, moved: false };
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
  }

  function onClickTrigger() {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    setOpen((v) => !v);
  }


  // Open the panel above the button when in the lower half, below when in the upper half
  const openAbove = top > window.innerHeight / 2;

  return (
    <div
      ref={containerRef}
      className="a11y-widget"
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${LEFT_OFFSET}px`,
        zIndex: 9999,
        direction: 'rtl',
        fontFamily: 'Arial, Helvetica, sans-serif',
        width: `${BTN_SIZE}px`,
      }}
    >
      {open && (
        <div
          role="dialog"
          aria-label="סרגל נגישות"
          aria-modal="false"
          style={{
            position: 'absolute',
            ...(openAbove
              ? { bottom: `${BTN_SIZE + 8}px` }
              : { top: `${BTN_SIZE + 8}px` }),
            left: 0,
            backgroundColor: '#fff',
            border: '2px solid #333',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            padding: '0.75rem',
            minWidth: '220px',
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
            אפשרויות נגישות
          </p>

          {/* Text size slider */}
          <div style={{ padding: '0.3rem 0.75rem 0.5rem', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111' }}>גודל טקסט</span>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: prefs.textScale === TEXT_SCALE_DEFAULT ? '#888' : '#1a56a0',
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
              aria-label="גודל טקסט"
              aria-valuemin={TEXT_SCALE_MIN}
              aria-valuemax={TEXT_SCALE_MAX}
              aria-valuenow={prefs.textScale}
              aria-valuetext={`${prefs.textScale}%`}
              style={{ width: '100%', accentColor: '#1a56a0', cursor: 'pointer' }}
            />
            <div dir="ltr" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#999', marginTop: '0.15rem' }}>
              <span>80%</span>
              <span>160%</span>
            </div>
          </div>

          <hr style={{ margin: '0.1rem 0 0.25rem', borderColor: '#eee' }} />

          {TOGGLE_ITEMS.map((item) => {
            const active = prefs[item.toggleKey];
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.toggleKey)}
                aria-pressed={active}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: active ? '2px solid #1a56a0' : '2px solid transparent',
                  backgroundColor: active ? '#dbeafe' : '#f5f5f5',
                  color: '#111',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 400,
                  textAlign: 'right',
                  width: '100%',
                }}
              >
                <span>{item.label}</span>
                {active && (
                  <span aria-hidden="true" style={{ fontSize: '0.75rem', color: '#1a56a0' }}>✓</span>
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
              textAlign: 'right',
              width: '100%',
            }}
          >
            איפוס הגדרות
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
              textAlign: 'right',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            הצהרת נגישות
          </Link>
        </div>
      )}

      <button
        ref={triggerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClickTrigger}
        aria-label="סרגל נגישות"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="גרור להזזה, לחץ לפתיחת סרגל נגישות"
        style={{
          width: `${BTN_SIZE}px`,
          height: `${BTN_SIZE}px`,
          borderRadius: '50%',
          border: '3px solid #1a56a0',
          backgroundColor: '#fff',
          color: '#1a56a0',
          fontSize: '1.6rem',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        ♿
      </button>
    </div>
  );
}
