import { describe, expect, it } from 'vitest';
import { getLegacyUserRegistrationIds } from './registrationService';

describe('registration cancellation compatibility cleanup', () => {
  it('builds a unique list of every possible legacy user mirror id', () => {
    expect(getLegacyUserRegistrationIds({
      userMirrorId: 'legacy-mirror',
      slotId: 'event__date__provider__slot',
      sessionEventId: 'event-1',
      eventId: 'event-1',
    }, 'event-1')).toEqual([
      'legacy-mirror',
      'event__date__provider__slot',
      'event-1',
    ]);
  });

  it('still returns the real event id when old mirror metadata is absent', () => {
    expect(getLegacyUserRegistrationIds({}, 'event-2')).toEqual(['event-2']);
  });
});
