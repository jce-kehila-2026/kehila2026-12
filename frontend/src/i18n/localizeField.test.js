import { describe, expect, it } from 'vitest';
import { isLocalizedField, localizeField } from './localizeField';

describe('localizeField', () => {
  it('returns the requested locale', () => {
    expect(localizeField({ he: 'שלום', en: 'Hello', ar: 'مرحبا' }, 'en')).toBe('Hello');
    expect(localizeField({ he: 'שלום', en: 'Hello', ar: 'مرحبا' }, 'ar')).toBe('مرحبا');
  });

  it('falls back to Hebrew when the locale is missing', () => {
    expect(localizeField({ he: 'שלום' }, 'en')).toBe('שלום');
  });

  it('falls back to the first non-empty value when Hebrew is missing', () => {
    expect(localizeField({ he: '', en: '', ar: 'مرحبا' }, 'en')).toBe('مرحبا');
  });

  it('returns plain strings unchanged (back-compat with untranslated content)', () => {
    expect(localizeField('plain text', 'en')).toBe('plain text');
  });

  it('returns an empty string for null/undefined', () => {
    expect(localizeField(null, 'en')).toBe('');
    expect(localizeField(undefined, 'ar')).toBe('');
  });

  it('isLocalizedField distinguishes per-language objects from strings', () => {
    expect(isLocalizedField({ he: 'x' })).toBe(true);
    expect(isLocalizedField('x')).toBe(false);
    expect(isLocalizedField(null)).toBe(false);
    expect(isLocalizedField(['x'])).toBe(false);
  });
});
