import { describe, expect, it } from 'vitest';
import {
  mergeBookingRows,
  normalizeCentralBooking,
  paginateRows,
} from './bookingsPageUtils';

describe('Admin Bookings helpers', () => {
  it('keeps central bookings as the source of truth and removes matching legacy duplicates', () => {
    const central = [{
      id: 'user_event_slot',
      bookingId: 'user_event_slot',
      userId: 'user-1',
      userEmail: 'person@example.com',
      eventId: 'event-1',
      eventTitle: 'Reflexology',
      eventType: 'appointment',
      slotId: 'slot-1',
      selectedDate: '2026-06-20',
      selectedTime: '10:00',
      providerName: 'Margarita',
      status: 'confirmed',
    }];
    const legacy = [{
      id: 'user_event_slot',
      participantId: 'user-1',
      participantEmail: 'person@example.com',
      eventId: 'event-1',
      title: 'Reflexology',
      slotId: 'slot-1',
      date: '2026-06-20',
      time: '10:00',
      providerName: 'Margarita',
    }];

    const rows = mergeBookingRows(central, legacy);

    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe('booking');
    expect(rows[0].status).toBe('approved');
  });

  it('does not invent participant, provider, or date values for incomplete records', () => {
    const row = normalizeCentralBooking({ id: 'booking-1', eventType: 'appointment' });

    expect(row.participantName).toBe('Unknown participant');
    expect(row.participantEmail).toBe('Email unavailable');
    expect(row.providerName).toBe('Provider not assigned');
    expect(row.eventDate).toBeNull();
    expect(row.registeredAt).toBeNull();
  });

  it('returns the correct slice and page metadata', () => {
    const rows = Array.from({ length: 15 }, (_, index) => ({ id: index + 1 }));

    expect(paginateRows(rows, 2, 7)).toEqual({
      page: 2,
      pageCount: 3,
      startIndex: 7,
      rows: rows.slice(7, 14),
    });
    expect(paginateRows(rows, 99, 7).page).toBe(3);
  });
});
