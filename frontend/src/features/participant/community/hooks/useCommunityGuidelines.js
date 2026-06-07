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
  // Start hidden and only reveal once the authoritative check (Firestore +
  // live version) resolves in the effect below. Seeding this from the
  // local-only guess caused a flash: the modal would render at first paint,
  // then hide a moment later when the async check confirmed acceptance.
  // Keeping it false means the modal can only go false→true (show once), never
  // true→false (the flash). Do not reintroduce the localStorage-based default.
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
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
