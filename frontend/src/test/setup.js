import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom doesn't implement Pointer Capture; stub it so pointer handlers don't throw.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.hasPointerCapture = () => false;
}

// Reset DOM, storage, and global mutations between tests so each one starts clean.
beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('lang');
  document.documentElement.style.fontSize = '';
  document.body.className = '';
});

afterEach(() => {
  cleanup();
});
