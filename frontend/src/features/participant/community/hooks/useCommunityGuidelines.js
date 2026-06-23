import { useEffect, useState } from 'react';
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

export default function useCommunityGuidelines(uid) {
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
    // Wait for the resolved uid before deciding. Reading auth.currentUser at
    // mount raced Firebase auth init: if the page mounted before auth resolved,
    // the Firestore acceptance check was skipped, we fell back to localStorage
    // only, and the effect never re-ran — so on a fresh device an
    // already-accepted user saw the modal again. Keying the effect on uid makes
    // it re-run when auth lands, and gating on a truthy uid preserves the
    // no-flash guarantee (we still only ever flip false→true, and only once the
    // authoritative Firestore check has run). uid is effectiveUID-aware, so
    // acceptance is also read/written against the impersonated participant
    // rather than the admin's own account.
    if (!uid) return undefined;

    let cancelled = false;

    Promise.all([
      getCommunitySettingsGuidelines().catch(() => null),
      getCommunityGuidelinesAccepted(uid).catch(() => null),
    ]).then(([settings, firestoreAccepted]) => {
      if (cancelled) return;

      const version = settings?.version ?? COMMUNITY_GUIDELINES_VERSION;
      setLiveVersion(version);

      const localAccepted = getAcceptedGuidelinesVersion(uid);
      const bestAccepted = firestoreAccepted || localAccepted;

      if (bestAccepted && bestAccepted !== localAccepted) {
        saveAcceptedGuidelinesVersion(bestAccepted, uid);
      }

      setShowGuidelinesModal(bestAccepted !== version);
    });

    return () => { cancelled = true; };
  }, [uid]);

  const handleGuidelinesContinue = () => {
    saveAcceptedGuidelinesVersion(liveVersion, uid);
    setShowGuidelinesModal(false);

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
