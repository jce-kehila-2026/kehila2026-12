import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

const JOIN_REQUESTS_COLLECTION = 'joinRequests';

export async function createJoinRequest(formValues) {
  const firstName = formValues.firstName.trim();
  const lastName = formValues.lastName.trim();
  const payload = {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    address: formValues.address.trim(),
    birthDate: formValues.birthDate || null,
    cancerStory: formValues.cancerStory.trim(),
    consentToReceiveInfo: formValues.consentToReceiveInfo,
    email: formValues.email.trim(),
    phone: formValues.phone.trim(),
    whatsappNote: formValues.whatsappNote.trim(),
    readyToJoin: formValues.readyToJoin,
    source: 'public-website',
    status: 'new',
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, JOIN_REQUESTS_COLLECTION), payload);

  return {
    id: ref.id,
    ...payload,
    createdAt: new Date().toISOString(),
  };
}
