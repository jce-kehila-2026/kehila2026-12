import { useState } from 'react';
import {
  COMMUNITY_GUIDELINES_VERSION,
  getAcceptedGuidelinesVersion,
  saveAcceptedGuidelinesVersion,
} from '../communityGuidelinesStorage';

export default function useCommunityGuidelines() {
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(
    () => getAcceptedGuidelinesVersion() !== COMMUNITY_GUIDELINES_VERSION,
  );
  const [showFullGuidelinesModal, setShowFullGuidelinesModal] = useState(false);

  const handleGuidelinesContinue = () => {
    saveAcceptedGuidelinesVersion();
    setShowGuidelinesModal(false);
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
