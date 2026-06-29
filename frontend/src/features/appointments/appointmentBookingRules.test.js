import { describe, expect, it } from 'vitest';
import {
  APPOINTMENT_BOOKING_CONFLICT,
  buildAppointmentConstraintLocks,
  findAppointmentBookingConflict,
  hasBookableAppointmentOption,
} from './appointmentBookingRules';

function appointment(overrides = {}) {
  return {
    id: 'slot-new',
    slotId: 'slot-new',
    providerId: 'provider-a',
    selectedDate: '2026-07-01',
    startAt: new Date('2026-07-01T10:00:00'),
    endAt: new Date('2026-07-01T11:00:00'),
    status: 'confirmed',
    capacity: 1,
    participants: 0,
    ...overrides,
  };
}

describe('participant appointment booking rules', () => {
  it('blocks another time with the same provider on the same day', () => {
    const conflict = findAppointmentBookingConflict(
      appointment({ startAt: new Date('2026-07-01T13:00:00'), endAt: new Date('2026-07-01T14:00:00') }),
      [appointment({ id: 'existing', slotId: 'existing' })],
    );

    expect(conflict?.code).toBe(APPOINTMENT_BOOKING_CONFLICT.DAY);
  });

  it('blocks an overlapping time with a different provider on the same day', () => {
    const conflict = findAppointmentBookingConflict(
      appointment({ providerId: 'provider-b', startAt: new Date('2026-07-01T10:30:00'), endAt: new Date('2026-07-01T11:30:00') }),
      [appointment({ id: 'existing', slotId: 'existing' })],
    );

    expect(conflict?.code).toBe(APPOINTMENT_BOOKING_CONFLICT.DAY);
  });

  it('blocks a different provider at a different time on the same day', () => {
    const conflict = findAppointmentBookingConflict(
      appointment({ providerId: 'provider-b', startAt: new Date('2026-07-01T12:00:00'), endAt: new Date('2026-07-01T13:00:00') }),
      [appointment({ id: 'existing', slotId: 'existing' })],
    );

    expect(conflict?.code).toBe(APPOINTMENT_BOOKING_CONFLICT.DAY);
  });

  it('allows the same provider on a different day', () => {
    const conflict = findAppointmentBookingConflict(
      appointment({ selectedDate: '2026-07-02', startAt: new Date('2026-07-02T10:00:00'), endAt: new Date('2026-07-02T11:00:00') }),
      [appointment({ id: 'existing', slotId: 'existing' })],
    );

    expect(conflict).toBeNull();
  });

  it('keeps the booking flow available when a later date still has a free slot', () => {
    const options = [
      appointment({ id: 'full-day', slotId: 'full-day', participants: 1 }),
      appointment({ id: 'next-day', slotId: 'next-day', selectedDate: '2026-07-02', startAt: new Date('2026-07-02T10:00:00'), endAt: new Date('2026-07-02T11:00:00') }),
    ];

    expect(hasBookableAppointmentOption(options)).toBe(true);
    expect(hasBookableAppointmentOption(options.map((option) => ({ ...option, participants: 1 })))).toBe(false);
  });

  it('creates one daily lock', () => {
    const locks = buildAppointmentConstraintLocks(appointment());

    expect(locks).toEqual([{
      id: 'day__2026-07-01',
      kind: 'day',
      dateKey: '2026-07-01',
    }]);
  });
});
