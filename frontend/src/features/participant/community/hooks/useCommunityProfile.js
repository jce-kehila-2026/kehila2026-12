import { useEffect, useState } from 'react';
import {
  getInitialCommunityPreferences,
  getInitialCommunityUserProfile,
  serializeCommunityPreferences,
  serializeCommunityUserProfile,
} from '../communityInteractionHelpers';
import {
  saveStoredCommunityPreferences,
  saveStoredCommunityUserProfile,
} from '../services/communityStorageService';
import { getCurrentCommunityUserId } from '../utils/communityModerationUtils';
import {
  getCommunityBirthday,
  getExistingDisplayName,
  hasRequiredCommunityPersonalDetails,
} from '../utils/communityProfileUtils';

export default function useCommunityProfile({ personalDetails = {} } = {}) {
  const [communityUserProfile, setCommunityUserProfile] = useState(getInitialCommunityUserProfile);
  const [communityPreferences, setCommunityPreferences] = useState(getInitialCommunityPreferences);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');

  useEffect(() => {
    if (!communityPreferences.birthdayVisibilityCompleted) return;

    saveStoredCommunityPreferences(serializeCommunityPreferences(communityPreferences));
  }, [communityPreferences]);

  useEffect(() => {
    if (!communityUserProfile.profileCompleted) return;

    saveStoredCommunityUserProfile(serializeCommunityUserProfile(communityUserProfile));
  }, [communityUserProfile]);

  const displayName = getExistingDisplayName(personalDetails);
  const birthDate = getCommunityBirthday(personalDetails);
  const hasCompletedCommunityProfile = communityUserProfile.profileCompleted === true;
  const communityDisplayName = hasCompletedCommunityProfile
    ? communityUserProfile.displayName
    : displayName;
  const communityBirthday = hasCompletedCommunityProfile
    ? communityUserProfile.birthday
    : birthDate;
  const hasRequiredPersonalDetails = hasRequiredCommunityPersonalDetails(personalDetails);
  const hasCommunityAccessDetails = hasRequiredPersonalDetails || hasCompletedCommunityProfile;
  const hasCompletedCommunitySetup = communityPreferences.birthdayVisibilityCompleted || hasCompletedCommunityProfile;
  const canUseCommunity = hasCommunityAccessDetails && hasCompletedCommunitySetup;
  const showBirthdayInCommunity = communityPreferences.birthdayVisibilityCompleted
    ? communityPreferences.showBirthday
    : communityUserProfile.showBirthday;
  const allowAnonymousPosting = communityUserProfile.allowAnonymousPosting !== false;
  const localUserId = getCurrentCommunityUserId(personalDetails, communityUserProfile);
  const visibleBirthdayUsers = showBirthdayInCommunity && communityBirthday
    ? [{
      id: localUserId,
      name: communityDisplayName || 'Current User',
      birthday: communityBirthday,
    }]
    : [];

  const handleBirthdayPreferenceSave = (showBirthday) => {
    setCommunityPreferences({
      birthdayVisibilityCompleted: true,
      showBirthday,
    });
    setCommunityUserProfile({
      ...communityUserProfile,
      id: localUserId,
      displayName: displayName || communityUserProfile.displayName,
      birthday: birthDate || communityUserProfile.birthday || '',
      showBirthday,
      allowAnonymousPosting: communityUserProfile.allowAnonymousPosting !== false,
      profileCompleted: true,
      communityJoinedAt: communityUserProfile.communityJoinedAt || new Date(),
    });
    setProfileSuccessMessage('Community preference saved.');
  };

  const handleBirthdayVisibilityChange = (showBirthday) => {
    setCommunityPreferences({
      birthdayVisibilityCompleted: true,
      showBirthday,
    });
    setCommunityUserProfile((currentProfile) => {
      if (!currentProfile.profileCompleted) return currentProfile;

      return {
        ...currentProfile,
        showBirthday,
      };
    });
    setProfileSuccessMessage('Birthday privacy updated.');
  };

  return {
    communityUserProfile,
    setCommunityUserProfile,
    communityPreferences,
    setCommunityPreferences,
    profileSuccessMessage,
    setProfileSuccessMessage,
    displayName,
    birthDate,
    hasCompletedCommunityProfile,
    communityDisplayName,
    communityBirthday,
    hasRequiredPersonalDetails,
    hasCommunityAccessDetails,
    hasCompletedCommunitySetup,
    canUseCommunity,
    showBirthdayInCommunity,
    allowAnonymousPosting,
    localUserId,
    visibleBirthdayUsers,
    handleBirthdayPreferenceSave,
    handleBirthdayVisibilityChange,
  };
}
