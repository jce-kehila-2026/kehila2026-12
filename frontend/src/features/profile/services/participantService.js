import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage } from "../../../firebase";

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

const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads an image to Storage at `profile-images/{participantId}/avatar` (overwrites),
 * then saves the download URL on `participants/{participantId}.avatarUrl`.
 * @param {string} participantId
 * @param {File} file
 * @returns {Promise<string>} download URL
 */
export async function uploadParticipantProfileImage(participantId, file) {
  if (!participantId) {
    throw new Error("Missing participant id");
  }
  if (!file || !(file instanceof File)) {
    throw new Error("No file selected");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller");
  }

  const objectRef = ref(storage, `profile-images/${participantId}/avatar`);

  await uploadBytes(objectRef, file, {
    contentType: file.type || "image/jpeg",
  });

  const downloadUrl = await getDownloadURL(objectRef);

  await updateParticipantData(participantId, { avatarUrl: downloadUrl });

  return downloadUrl;
}