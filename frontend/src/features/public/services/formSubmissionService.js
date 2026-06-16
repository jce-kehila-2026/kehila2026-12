// Public-website writers for the volunteer and donation contact forms.
//
// Both modals (VolunteerModal, DonationModal) collect the same contact fields,
// so their submissions land in a single `formSubmissions` collection with a
// `type` discriminator ('volunteer' | 'donation'). Admins read/manage them from
// the Forms page (features/admin/pages/FormsPage.jsx).
//
// Mirrors features/public/services/joinRequestService.js: an unauthenticated
// public write, constrained by the matching firestore.rules block so the
// endpoint can't be used to write arbitrary/oversized documents.
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

export const FORM_SUBMISSIONS_COLLECTION = 'formSubmissions';

export const FORM_SUBMISSION_TYPE = {
  VOLUNTEER: 'volunteer',
  DONATION: 'donation',
};

// Build the constrained payload shared by both forms. Keep the key set in sync
// with the `formSubmissions` rule in firestore.rules — extra keys are rejected.
function buildPayload(type, formValues) {
  const firstName = String(formValues.firstName || '').trim();
  const lastName = String(formValues.lastName || '').trim();
  return {
    type,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    email: String(formValues.email || '').trim(),
    phone: String(formValues.phone || '').trim(),
    message: String(formValues.message || '').trim(),
    source: 'public-website',
    status: 'new',
    createdAt: serverTimestamp(),
  };
}

async function createSubmission(type, formValues) {
  const payload = buildPayload(type, formValues);
  const ref = await addDoc(collection(db, FORM_SUBMISSIONS_COLLECTION), payload);
  return {
    id: ref.id,
    ...payload,
    createdAt: new Date().toISOString(),
  };
}

export function createVolunteerSubmission(formValues) {
  return createSubmission(FORM_SUBMISSION_TYPE.VOLUNTEER, formValues);
}

export function createDonationSubmission(formValues) {
  return createSubmission(FORM_SUBMISSION_TYPE.DONATION, formValues);
}
