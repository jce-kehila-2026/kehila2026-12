import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../firebase";

/*
  Get participant profile data
*/
export async function getParticipantData(participantId) {
  try {
    const participantRef = doc(db, "participants", participantId);

    const participantSnap = await getDoc(participantRef);

    if (participantSnap.exists()) {
      return participantSnap.data();
    }

    return null;
  } catch (error) {
    console.error("Error fetching participant profile:", error);
    throw error;
  }
}

/*
  Create participant profile
*/
export async function createParticipantProfile(
  participantId,
  profileData
) {
  try {
    const participantRef = doc(db, "participants", participantId);

    await setDoc(participantRef, {
      participantId,
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating participant profile:", error);
    throw error;
  }
}

/*
  Update participant profile
*/
export async function updateParticipantData(
  participantId,
  updates
) {
  try {
    const participantRef = doc(db, "participants", participantId);

    await updateDoc(participantRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error updating participant profile:", error);
    throw error;
  }
}