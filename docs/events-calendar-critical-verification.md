# Events and Calendar Critical Verification

Run these checks after deploying `firestore.rules`. Use one participant account and one admin account.

## Workshop registration and cancellation

1. As a participant, register for a published workshop with open registration.
2. Confirm the same deterministic `bookingId` exists in:
   - `bookings/{bookingId}`
   - `users/{uid}/bookings/{bookingId}`
   - `events/{eventId}/registrations/{bookingId}`
3. Confirm Admin Events, Admin Bookings, and Dashboard show the registration.
4. Cancel from Registered Events.
5. Confirm the central booking and user booking mirror have `status: cancelled`.
6. Confirm the event roster document was removed.
7. Confirm no cancellation error appears and any old `users/{uid}/registrations` mirror is removed.

## Appointment booking and cancellation

1. Book a published appointment event by selecting provider, date, and time.
2. Confirm `eventId`, `slotId`, `providerId`, `providerName`, `dateKey`, `startAt`, and `selectedTime` are present in all three current booking paths.
3. Confirm the appointment appears once in Admin Bookings and Participant Calendar.
4. Cancel it and verify the same cancellation results as the workshop flow.
5. Rebook the same cancelled slot and verify the deterministic booking is reactivated without creating a duplicate row.

## Duplicate prevention

1. Double-click Confirm Booking or submit the same event and slot twice.
2. Confirm only one deterministic booking document and one event roster document exist.
3. Confirm Admin Bookings displays one row.
4. Note: concurrent capacity protection across different users still requires a server transaction and is not covered by deterministic IDs.

## Participant permissions

Using the Firestore emulator or Rules Playground:

1. Confirm a participant can read only their own central booking and user booking mirror.
2. Confirm they cannot list `events/{eventId}/registrations`.
3. Confirm they cannot read another participant's roster document.
4. Confirm they cannot change `eventId`, `slotId`, provider fields, dates, times, or `checkedIn`.
5. Confirm they can only transition their own active booking to `cancelled`, or reactivate their own cancelled deterministic booking.

## Admin permissions

1. Confirm an admin can list event registrations.
2. Check in a participant from Admin Events.
3. Confirm `checkedIn` updates on the central booking, user booking mirror, and event roster.
4. Confirm Admin Bookings and Dashboard still read the central booking.

## Error and empty states

1. Temporarily deny Firestore access or use an invalid test project.
2. Confirm Events, Calendar, and Admin Bookings show an error with Retry and no fake records.
3. Confirm a valid empty database shows an empty state instead of placeholder names, dates, providers, or events.
