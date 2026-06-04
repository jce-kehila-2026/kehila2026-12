import { useEffect, useState } from 'react';
import { auth } from '../../../../firebase';
import {
  COMMUNITY_GUIDELINES_VERSION,
  getAcceptedGuidelinesVersion,
  saveAcceptedGuidelinesVersion,
} from '../communityGuidelinesStorage';
import {
  getCommunityGuidelinesAccepted,
  saveCommunityGuidelinesAccepted,
} from '../services/communityService';

export default function useCommunityGuidelines() {
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(
    () => getAcceptedGuidelinesVersion() !== COMMUNITY_GUIDELINES_VERSION,
  );
  const [showFullGuidelinesModal, setShowFullGuidelinesModal] = useState(false);

  // Verify acceptance against Firestore on mount (cross-device sync).
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getCommunityGuidelinesAccepted(uid).then((firestoreVersion) => {
      if (firestoreVersion === COMMUNITY_GUIDELINES_VERSION) {
        saveAcceptedGuidelinesVersion();
        setShowGuidelinesModal(false);
      }
    }).catch(() => {});
  }, []);

  const handleGuidelinesContinue = () => {
    saveAcceptedGuidelinesVersion();
    setShowGuidelinesModal(false);

    const uid = auth.currentUser?.uid;
    if (uid) {
      saveCommunityGuidelinesAccepted(uid, COMMUNITY_GUIDELINES_VERSION).catch(() => {});
    }
  };

  const handleReadFullGuidelines = () => {
    setShowFullGuidelinesModal(true);
  };

  const handleCloseFullGuidelines = () => {
    setShowFullGuidelinesModal(false);
  };

  return {
    showGuidelinesModal,
    setShowGuidelinesModal,
    showFullGuidelinesModal,
    setShowFullGuidelinesModal,
    handleGuidelinesContinue,
    handleReadFullGuidelines,
    handleCloseFullGuidelines,
  };
}
