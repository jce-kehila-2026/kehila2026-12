import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  AccessibilityProvider,
  useAccessibility,
  TEXT_SCALE_MIN,
  TEXT_SCALE_MAX,
  TEXT_SCALE_DEFAULT,
} from './AccessibilityContext';

const STORAGE_KEY = 'shena-a11y-prefs';

function Probe() {
  const { prefs, setTextScale, toggle, setContrastScheme, reset } = useAccessibility();
  return (
    <div>
      <span data-testid="textScale">{prefs.textScale}</span>
      <span data-testid="contrastScheme">{prefs.contrastScheme}</span>
      <span data-testid="grayscale">{String(prefs.grayscale)}</span>
      <span data-testid="stopAnimations">{String(prefs.stopAnimations)}</span>
      <button type="button" onClick={() => setTextScale(999)}>tooBig</button>
      <button type="button" onClick={() => setTextScale(-50)}>tooSmall</button>
      <button type="button" onClick={() => toggle('grayscale')}>toggleGray</button>
      <button type="button" onClick={() => setContrastScheme('dark')}>dark</button>
      <button type="button" onClick={() => setContrastScheme('light')}>light</button>
      <button type="button" onClick={() => reset()}>reset</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AccessibilityProvider>
      <Probe />
    </AccessibilityProvider>,
  );
}

describe('AccessibilityContext', () => {
  it('uses defaults when nothing is stored', () => {
    renderProvider();
    expect(screen.getByTestId('textScale')).toHaveTextContent(String(TEXT_SCALE_DEFAULT));
    expect(screen.getByTestId('contrastScheme')).toHaveTextContent('none');
  });

  it('clamps text scale to the allowed range', () => {
    renderProvider();
    fireEvent.click(screen.getByText('tooBig'));
    expect(screen.getByTestId('textScale')).toHaveTextContent(String(TEXT_SCALE_MAX));
    fireEvent.click(screen.getByText('tooSmall'));
    expect(screen.getByTestId('textScale')).toHaveTextContent(String(TEXT_SCALE_MIN));
  });

  it('migrates the legacy textLevel field and clamps the result', () => {
    // 100 + 6*12 = 172 -> clamped to the max (160)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ textLevel: 6 }));
    renderProvider();
    expect(screen.getByTestId('textScale')).toHaveTextContent(String(TEXT_SCALE_MAX));
  });

  it('migrates the legacy highContrast boolean to the dark scheme', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ highContrast: true }));
    renderProvider();
    expect(screen.getByTestId('contrastScheme')).toHaveTextContent('dark');
  });

  it('applies contrast schemes as mutually exclusive body classes', () => {
    renderProvider();
    fireEvent.click(screen.getByText('dark'));
    expect(document.body).toHaveClass('a11y-high-contrast');
    expect(document.body).not.toHaveClass('a11y-contrast-light');
    fireEvent.click(screen.getByText('light'));
    expect(document.body).toHaveClass('a11y-contrast-light');
    expect(document.body).not.toHaveClass('a11y-high-contrast');
  });

  it('toggles grayscale onto the body and persists it', () => {
    renderProvider();
    fireEvent.click(screen.getByText('toggleGray'));
    expect(document.body).toHaveClass('a11y-grayscale');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).grayscale).toBe(true);
  });

  it('applies the text scale to the <html> font-size', () => {
    renderProvider();
    fireEvent.click(screen.getByText('tooBig')); // -> 160
    expect(document.documentElement.style.fontSize).toBe(`${TEXT_SCALE_MAX}%`);
  });

  it('reset returns everything to defaults', () => {
    renderProvider();
    fireEvent.click(screen.getByText('dark'));
    fireEvent.click(screen.getByText('toggleGray'));
    fireEvent.click(screen.getByText('reset'));
    expect(screen.getByTestId('contrastScheme')).toHaveTextContent('none');
    expect(screen.getByTestId('grayscale')).toHaveTextContent('false');
    expect(document.body).not.toHaveClass('a11y-grayscale');
  });

  it('seeds defaults from OS prefers-reduced-motion on first visit', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('reduced-motion'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));
    renderProvider();
    expect(screen.getByTestId('stopAnimations')).toHaveTextContent('true');
    delete window.matchMedia;
  });
});
