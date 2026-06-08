import { useEffect, useState } from 'react';
import {
  getCommunityProfile,
  getTodayCommunityBirthdays,
  updateCommunityProfile,
} from '../services/communityService';
import { getCurrentCommunityUserId } from '../utils/communityModerationUtils';
import {
  getCommunityBirthday,
  getExistingDisplayName,
  hasRequiredCommunityPersonalDetails,
} from '../utils/communityProfileUtils';

const isRealUserId = (uid) => Boolean(uid) && uid !== 'current-user';

const defaultProfile = {
  id: 'current-user',
  displayName: '',
  avatarUrl: '',
  birthday: '',
  showBirthday: false,
  allowAnonymousPosting: true,
  communityJoinedAt: new Date(),
  profileCompleted: false,
  role: 'participant',
  status: 'active',
};

const defaultPreferences = {
  birthdayVisibilityCompleted: false,
  showBirthday: false,
};

export default function useCommunityProfile({ personalDetails = {} } = {}) {
  const [communityUserProfile, setCommunityUserProfile] = useState(defaultProfile);
  const [communityPreferences, setCommunityPreferences] = useState(defaultPreferences);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [communityBirthdayUsers, setCommunityBirthdayUsers] = useState([]);

  const uid = personalDetails?.uid ?? null;

  // Load today's community birthdays from Firestore (opted-in members in the
  // shared `users` collection — no separate birthday collection).
  useEffect(() => {
    let cancelled = false;

    getTodayCommunityBirthdays()
      .then((users) => {
        if (!cancelled) setCommunityBirthdayUsers(Array.isArray(users) ? users : []);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!profileSuccessMessage) return undefined;

    const timerId = window.setTimeout(() => {
      setProfileSuccessMessage('');
    }, 3500);

    return () => window.clearTimeout(timerId);
  }, [profileSuccessMessage]);

  useEffect(() => {
    if (!isRealUserId(uid)) return;
    let cancelled = false;

    getCommunityProfile(uid).then((profile) => {
      if (cancelled || !profile) return;

      if (profile.communityProfileCompleted && profile.communityDisplayName) {
        setCommunityUserProfile({
          id: uid,
          displayName: profile.communityDisplayName,
          avatarUrl: '',
          birthday: profile.communityBirthday ?? '',
          showBirthday: Boolean(profile.showBirthdayInCommunity),
          allowAnonymousPosting: profile.allowAnonymousPosting !== false,
          communityJoinedAt: profile.communityJoinedAt ?? new Date(),
          profileCompleted: true,
          role: 'participant',
          status: 'active',
        });
      }

      if (profile.communityProfileCompleted) {
        setCommunityPreferences({
          birthdayVisibilityCompleted: true,
          showBirthday: Boolean(profile.showBirthdayInCommunity),
        });
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [uid]);

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
  // Merge the current user's own entry (so a freshly-saved preference shows
  // immediately, before the next fetch) with the Firestore-backed list, keeping
  // the first occurrence of each id so the user isn't listed twice.
  const currentUserBirthdayEntry = showBirthdayInCommunity && communityBirthday
    ? [{
      id: localUserId,
      name: communityDisplayName || 'Current User',
      birthday: communityBirthday,
    }]
    : [];
  const seenBirthdayIds = new Set();
  const visibleBirthdayUsers = [...currentUserBirthdayEntry, ...communityBirthdayUsers]
    .filter((user) => {
      const key = user.id ?? user.name;
      if (seenBirthdayIds.has(key)) return false;
      seenBirthdayIds.add(key);
      return true;
    });

  const handleBirthdayPreferenceSave = (showBirthday) => {
    const resolvedDisplayName = displayName || communityUserProfile.displayName;
    const resolvedBirthday = birthDate || communityUserProfile.birthday || '';
    const resolvedJoinedAt = communityUserProfile.communityJoinedAt || new Date();
    const resolvedAllowAnon = communityUserProfile.allowAnonymousPosting !== false;

    const nextProfile = {
      id: localUserId,
      displayName: resolvedDisplayName,
      avatarUrl: communityUserProfile.avatarUrl ?? '',
      birthday: resolvedBirthday,
      showBirthday,
      allowAnonymousPosting: resolvedAllowAnon,
      profileCompleted: true,
      communityJoinedAt: resolvedJoinedAt,
      role: communityUserProfile.role ?? 'participant',
      status: communityUserProfile.status ?? 'active',
    };

    setCommunityPreferences({ birthdayVisibilityCompleted: true, showBirthday });
    setCommunityUserProfile(nextProfile);
    setProfileSuccessMessage('Community preference saved.');

    if (isRealUserId(uid)) {
      updateCommunityProfile(uid, {
        communityDisplayName: resolvedDisplayName,
        communityBirthday: resolvedBirthday,
        showBirthdayInCommunity: showBirthday,
        allowAnonymousPosting: resolvedAllowAnon,
        communityProfileCompleted: true,
        communityJoinedAt: resolvedJoinedAt,
      }).catch(() => {});
    }
  };

  const handleBirthdayVisibilityChange = (showBirthday) => {
    setCommunityPreferences({ birthdayVisibilityCompleted: true, showBirthday });
    setCommunityUserProfile((currentProfile) => {
      if (!currentProfile.profileCompleted) return currentProfile;
      return { ...currentProfile, showBirthday };
    });
    setProfileSuccessMessage('Birthday privacy updated.');

    if (isRealUserId(uid)) {
      updateCommunityProfile(uid, { showBirthdayInCommunity: showBirthday }).catch(() => {});
    }
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
