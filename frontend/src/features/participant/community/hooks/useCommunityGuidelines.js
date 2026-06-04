import { useEffect, useState } from 'react';
import { auth } from '../../../../firebase';
import {
  COMMUNITY_GUIDELINES_VERSION,
  getAcceptedGuidelinesVersion,
  saveAcceptedGuidelinesVersion,
} from '../communityGuidelinesStorage';
import {
  getCommunityGuidelinesAccepted,
  getCommunitySettingsGuidelines,
  saveCommunityGuidelinesAccepted,
} from '../services/communityService';

export default function useCommunityGuidelines() {
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(
    () => getAcceptedGuidelinesVersion() !== COMMUNITY_GUIDELINES_VERSION,
  );
  const [showFullGuidelinesModal, setShowFullGuidelinesModal] = useState(false);
  const [liveVersion, setLiveVersion] = useState(COMMUNITY_GUIDELINES_VERSION);

  useEffect(() => {
    let cancelled = false;
    const uid = auth.currentUser?.uid;

    Promise.all([
      getCommunitySettingsGuidelines().catch(() => null),
      uid ? getCommunityGuidelinesAccepted(uid).catch(() => null) : Promise.resolve(null),
    ]).then(([settings, firestoreAccepted]) => {
      if (cancelled) return;

      const version = settings?.version ?? COMMUNITY_GUIDELINES_VERSION;
      setLiveVersion(version);

      const localAccepted = getAcceptedGuidelinesVersion();
      const bestAccepted = firestoreAccepted || localAccepted;

      if (bestAccepted && bestAccepted !== localAccepted) {
        saveAcceptedGuidelinesVersion(bestAccepted);
      }

      setShowGuidelinesModal(bestAccepted !== version);
    });

    return () => { cancelled = true; };
  }, []);

  const handleGuidelinesContinue = () => {
    saveAcceptedGuidelinesVersion(liveVersion);
    setShowGuidelinesModal(false);

    const uid = auth.currentUser?.uid;
    if (uid) {
      saveCommunityGuidelinesAccepted(uid, liveVersion).catch(() => {});
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
