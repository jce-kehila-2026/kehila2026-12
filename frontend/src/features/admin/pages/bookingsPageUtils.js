function toDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = toDate(value);
  if (!date) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function normalizeTimeKey(value) {
  if (!value) return '';
  if (value?.toDate) {
    const date = value.toDate();
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  const date = toDate(value);
  if (!date) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function normalizeBookingStatus(status) {
  const value = String(status || 'pending').trim().toLowerCase();
  if (value === 'confirmed') return 'approved';
  if (value === 'canceled') return 'cancelled';
  return value;
}

export function normalizeCentralBooking(item, index = 0) {
  const eventType = String(item.eventType || item.type || '').toLowerCase().includes('appointment')
    ? 'Appointment'
    : 'Workshop';
  const bookingId = item.bookingId || item.id || `booking-${index}`;

  return {
    id: `booking-${bookingId}`,
    source: 'booking',
    sourceId: bookingId,
    bookingId,
    userId: item.userId || '',
    eventId: item.eventId || '',
    slotId: item.slotId || '',
    participantName: item.participantName || item.userName || item.name || 'Unknown participant',
    participantEmail: item.participantEmail || item.userEmail || item.email || 'Email unavailable',
    eventType,
    eventName: item.eventTitle || item.title || item.appointmentType || 'Untitled event',
    providerName: item.providerName || item.provider || (eventType === 'Workshop' ? 'She-Na Team' : 'Provider not assigned'),
    eventDate: item.startAt || item.eventDate || item.selectedDate || item.dateKey || item.date || null,
    eventTime: item.selectedTime || item.selectedTimeSlot || item.sessionTime || item.time || item.startAt || '',
    registeredAt: item.registeredAt || item.createdAt || null,
    status: normalizeBookingStatus(item.status),
  };
}

export function normalizeLegacyAppointment(item, index = 0) {
  const sourceId = item.id || `legacy-${index}`;
  return {
    id: `appointment-${sourceId}`,
    source: 'legacyAppointment',
    sourceId,
    bookingId: item.bookingId || '',
    userId: item.userId || item.participantId || '',
    eventId: item.eventId || '',
    slotId: item.slotId || '',
    participantName: item.participantName || item.name || 'Unknown participant',
    participantEmail: item.participantEmail || item.email || 'Email unavailable',
    eventType: 'Appointment',
    eventName: item.eventTitle || item.type || item.appointmentType || item.typeName || item.title || 'Untitled appointment',
    providerName: item.providerName || item.provider || item.therapistName || 'Provider not assigned',
    eventDate: item.startAt || item.date || item.createdAt || null,
    eventTime: item.selectedTime || item.time || item.selectedTimeSlot || item.startTime || '',
    registeredAt: item.registeredAt || item.createdAt || null,
    status: normalizeBookingStatus(item.status),
  };
}

export function getBookingIdentityKeys(row) {
  const keys = [row.bookingId, row.sourceId, row.id]
    .filter(Boolean)
    .map((value) => `id:${String(value).replace(/^(booking|appointment)-/, '')}`);
  const participant = String(row.userId || row.participantEmail || '').trim().toLowerCase();
  const event = String(row.eventId || row.eventName || '').trim().toLowerCase();
  const slot = String(row.slotId || '').trim().toLowerCase();
  const date = normalizeDateKey(row.eventDate);
  const time = normalizeTimeKey(row.eventTime);
  const provider = String(row.providerName || '').trim().toLowerCase();

  if (participant && event && (slot || date || time)) {
    keys.push(`booking:${participant}|${event}|${slot}|${date}|${time}|${provider}`);
  }

  return [...new Set(keys)];
}

export function mergeBookingRows(bookingItems, appointmentItems) {
  const centralRows = bookingItems.map(normalizeCentralBooking);
  const seen = new Set(centralRows.flatMap(getBookingIdentityKeys));
  const rows = [...centralRows];

  appointmentItems.map(normalizeLegacyAppointment).forEach((row) => {
    const keys = getBookingIdentityKeys(row);
    if (keys.some((key) => seen.has(key))) return;
    keys.forEach((key) => seen.add(key));
    rows.push(row);
  });

  return rows.sort((left, right) => {
    const leftTime = toDate(left.registeredAt)?.getTime() || 0;
    const rightTime = toDate(right.registeredAt)?.getTime() || 0;
    return rightTime - leftTime;
  });
}

export function paginateRows(rows, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const startIndex = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    startIndex,
    rows: rows.slice(startIndex, startIndex + pageSize),
  };
}

export const toDateKey = normalizeDateKey;
