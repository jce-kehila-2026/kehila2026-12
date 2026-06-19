import { describe, expect, it } from 'vitest';
import { createParticipantT, participantUiTranslations } from './participantUiTranslations';

describe('createParticipantT', () => {
  it('returns the requested locale', () => {
    expect(createParticipantT('he')('navHome')).toBe('בית');
    expect(createParticipantT('ar')('navHome')).toBe('الرئيسية');
    expect(createParticipantT('en')('navHome')).toBe('Home');
  });

  it('falls back to English for an unknown locale', () => {
    expect(createParticipantT('fr')('navHome')).toBe('Home');
  });

  it('falls back to the raw key when the string is missing', () => {
    expect(createParticipantT('he')('totallyMissingKey')).toBe('totallyMissingKey');
  });

  it('keeps interpolation placeholders intact for the call site to fill', () => {
    expect(createParticipantT('en')('welcomeBackNamed')).toContain('{name}');
    expect(createParticipantT('ar')('timeMinutesAgo')).toContain('{n}');
  });

  it('every locale defines the same set of keys', () => {
    const en = Object.keys(participantUiTranslations.en).sort();
    const he = Object.keys(participantUiTranslations.he).sort();
    const ar = Object.keys(participantUiTranslations.ar).sort();
    expect(he).toEqual(en);
    expect(ar).toEqual(en);
  });
});
