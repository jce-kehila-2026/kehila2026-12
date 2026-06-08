import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import AccessibilityWidget from './AccessibilityWidget';

function renderWidget() {
  return render(
    <MemoryRouter>
      <AccessibilityProvider>
        <AccessibilityWidget />
      </AccessibilityProvider>
    </MemoryRouter>,
  );
}

const openPanel = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Accessibility menu' }));
};

describe('AccessibilityWidget', () => {
  it('opens and closes the panel from the trigger', () => {
    renderWidget();
    expect(screen.queryByRole('dialog')).toBeNull();
    openPanel();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accessibility menu' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('moves focus into the panel on open and restores it to the trigger on Escape', () => {
    renderWidget();
    const trigger = screen.getByRole('button', { name: 'Accessibility menu' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(dialog === document.activeElement || dialog.contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('selects a contrast scheme and applies it to the body', () => {
    renderWidget();
    openPanel();
    const dark = screen.getByRole('radio', { name: 'Dark' });
    fireEvent.click(dark);
    expect(dark).toHaveAttribute('aria-checked', 'true');
    expect(document.body).toHaveClass('a11y-high-contrast');

    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.body).toHaveClass('a11y-contrast-light');
    expect(document.body).not.toHaveClass('a11y-high-contrast');
  });

  it('toggles grayscale', () => {
    renderWidget();
    openPanel();
    const gray = screen.getByRole('button', { name: 'Grayscale' });
    expect(gray).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(gray);
    expect(gray).toHaveAttribute('aria-pressed', 'true');
    expect(document.body).toHaveClass('a11y-grayscale');
  });

  it('steps text size and disables the reset stepper at the default', () => {
    renderWidget();
    openPanel();
    expect(screen.getByRole('button', { name: 'Reset text size' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Increase text size' }));
    expect(screen.getByText('105%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset text size' })).toBeEnabled();
  });

  it('localizes from the <html lang> attribute', () => {
    document.documentElement.setAttribute('lang', 'he');
    renderWidget();
    const trigger = screen.getByRole('button', { name: 'סרגל נגישות' });
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByText('אפשרויות נגישות')).toBeInTheDocument();
  });
});
