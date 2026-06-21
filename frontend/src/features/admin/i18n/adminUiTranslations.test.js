import { describe, expect, it } from 'vitest';
import { createAdminT, adminUiTranslations } from './adminUiTranslations';

describe('createAdminT', () => {
  it('returns the requested locale', () => {
    expect(createAdminT('he')('selectLanguage')).toBe('בחירת שפה');
    expect(createAdminT('en')('selectLanguage')).toBe('Select language');
  });

  it('falls back to English for an unknown locale', () => {
    expect(createAdminT('fr')('selectLanguage')).toBe('Select language');
  });

  it('falls back to the raw key when the string is missing', () => {
    expect(createAdminT('he')('totallyMissingKey')).toBe('totallyMissingKey');
  });

  it('every locale defines the same set of keys', () => {
    const en = Object.keys(adminUiTranslations.en).sort();
    const he = Object.keys(adminUiTranslations.he).sort();
    expect(he).toEqual(en);
  });
});
