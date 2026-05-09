/**
 * Participant profile service placeholder.
 * This is prepared for future Firebase Firestore integration.
 */

const mockParticipant = {
  id: "participant-001",
  fullName: "Sarah Anderson",
  phoneNumber: "+972501234567",
  email: "sarahanderson@gmail.com",
  streetAddress: "123 Main Street",
  city: "San Francisco",
  birthDate: "05/15/1990",
  preferredContactMethod: "email",
  language: "english",
  avatarUrl: "",
};

export async function getParticipantData(participantId) {
  // TODO: Replace with Firebase getDoc call.
  await new Promise((resolve) => setTimeout(resolve, 150));
  return { ...mockParticipant, id: participantId || mockParticipant.id };
}

export async function updateParticipantData(participantId, updates) {
  // TODO: Replace with Firebase updateDoc call.
  await new Promise((resolve) => setTimeout(resolve, 200));
  Object.assign(mockParticipant, updates);
  return { ...mockParticipant, id: participantId || mockParticipant.id };
}
