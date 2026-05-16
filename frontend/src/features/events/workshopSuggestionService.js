import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const WORKSHOP_SUGGESTIONS_COLLECTION = 'workshop_suggestions';

export async function createWorkshopSuggestion(form, user) {
  const payload = {
    userId: form.anonymous ? null : user?.uid || null,
    title: form.title.trim(),
    category: form.category,
    description: form.description.trim(),
    reason: form.reason.trim(),
    anonymous: form.anonymous,
    createdAt: serverTimestamp(),
    status: 'new',
  };

  const ref = await addDoc(collection(db, WORKSHOP_SUGGESTIONS_COLLECTION), payload);

  return {
    id: ref.id,
    ...payload,
    createdAt: new Date().toISOString(),
  };
}
