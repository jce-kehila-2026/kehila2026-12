import { useEffect, useRef, useState } from 'react';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import LocalFloristOutlinedIcon from '@mui/icons-material/LocalFloristOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import {
  communityActiveMembers,
  communityPosts,
  communityResources,
  communitySupportSpaces,
} from './communityMockData';
import {
  COMMUNITY_PREFERENCES_STORAGE_KEY,
  COMMUNITY_FOLLOWED_AUTHORS_STORAGE_KEY,
  COMMUNITY_POSTS_STORAGE_KEY,
  COMMUNITY_STREAK_STORAGE_KEY,
  COMMUNITY_USER_PROFILE_STORAGE_KEY,
  getDayDifference,
  getInitialCommunityPreferences,
  getInitialCommunityUserProfile,
  getInitialPosts,
  getInitialStreakState,
  getTodayKey,
  isCommunityContentVisible,
  isStreakAtRiskForDate,
  safeLoadFromStorage,
  safeSaveToStorage,
  serializeCommunityPreferences,
  serializeCommunityPost,
  serializeCommunityUserProfile,
} from './communityInteractionHelpers';
import {
  addCommunityPostComment,
  createCommunityPost,
  getCommunityPosts,
  reportCommunityPost,
  toggleCommunityPostLike,
} from './services/communityService';
import { COMMUNITY_POST_STATUS } from './communityModels';
import {
  COMMUNITY_GUIDELINES_VERSION,
  getAcceptedGuidelinesVersion,
  saveAcceptedGuidelinesVersion,
} from './communityGuidelinesStorage';
import BirthdayCard from './components/BirthdayCard';
import CommunityAccessPanel from './components/CommunityAccessPanel';
import CommunityBirthdayPreferenceCard from './components/CommunityBirthdayPreferenceCard';
import CommunityGuidelinesCard from './components/CommunityGuidelinesCard';
import CommunityGuidelinesModal from './components/CommunityGuidelinesModal';
import CommunityPostCard from './components/CommunityPostCard';
import CommunityStreakCard from './components/CommunityStreakCard';
import CreatePostCard from './components/CreatePostCard';

const FEED_TABS = [
  { id: 'all', label: 'All Posts' },
  { id: 'following', label: 'Following' },
  { id: 'anonymous', label: 'Anonymous' },
];

const getPostCreatedAtTime = (post = {}) => {
  const createdAt = post.createdAt instanceof Date
    ? post.createdAt
    : new Date(post.createdAt ?? 0);
  const timestamp = createdAt.getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const filterPostsByTab = (posts, activeTab, followedAuthors = []) => posts.filter((post) => {
  if (activeTab === 'following') return followedAuthors.includes(post.author);
  if (activeTab === 'anonymous') return post.isAnonymous === true;

  return true;
});

const sortFeedPosts = (posts) => posts
  .map((post, index) => ({ post, index }))
  .sort((firstPost, secondPost) => {
    const dateDifference = getPostCreatedAtTime(secondPost.post) - getPostCreatedAtTime(firstPost.post);
    if (dateDifference !== 0) return dateDifference;

    return firstPost.index - secondPost.index;
  })
  .map(({ post }) => post);

const getEmptyFeedMessage = (activeTab, followedAuthorsCount = 0) => {
  if (activeTab === 'following') {
    if (followedAuthorsCount === 0) {
      return {
        title: 'No followed authors yet',
        description: 'Use the Follow button on posts to build a local following feed on this device.',
      };
    }

    return {
      title: 'No posts from followed authors yet',
      description: 'Posts from authors you follow locally will appear here.',
    };
  }

  if (activeTab === 'anonymous') {
    return {
      title: 'No anonymous posts yet',
      description: 'Anonymous shares will appear here when members choose that option.',
    };
  }

  return {
    title: 'No posts yet',
    description: 'Be the first to share something with the community.',
  };
};

const getExistingDisplayName = (personalDetails = {}) => (
  personalDetails.fullName
  || personalDetails.displayName
  || personalDetails.userName
  || personalDetails.name
  || [personalDetails.firstName, personalDetails.lastName].filter(Boolean).join(' ')
  || ''
).trim();

const formatDateToDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const normalizeCommunityBirthday = (birthdayValue) => {
  if (!birthdayValue) return '';

  if (birthdayValue instanceof Date) {
    return formatDateToDateKey(birthdayValue);
  }

  if (typeof birthdayValue === 'object' && typeof birthdayValue.seconds === 'number') {
    return formatDateToDateKey(new Date(birthdayValue.seconds * 1000));
  }

  if (typeof birthdayValue !== 'string') return '';

  const trimmed = birthdayValue.trim();
  if (!trimmed) return '';

  const dateParts = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateParts) {
    const year = Number(dateParts[1]);
    const month = Number(dateParts[2]);
    const day = Number(dateParts[3]);
    const parsedDate = new Date(year, month - 1, day);

    if (
      parsedDate.getFullYear() === year
      && parsedDate.getMonth() === month - 1
      && parsedDate.getDate() === day
    ) {
      return trimmed;
    }
  }

  const parsedDate = new Date(trimmed);
  return formatDateToDateKey(parsedDate);
};

const getCommunityBirthday = (personalDetails = {}) => normalizeCommunityBirthday(
  personalDetails.birthDate
  || personalDetails.birthday
  || personalDetails.dateOfBirth,
);

const hasRequiredCommunityPersonalDetails = (personalDetails = {}) => Boolean(
  getExistingDisplayName(personalDetails) && getCommunityBirthday(personalDetails),
);

const getInitialFollowedAuthors = () => {
  const storedAuthors = safeLoadFromStorage(COMMUNITY_FOLLOWED_AUTHORS_STORAGE_KEY);
  return Array.isArray(storedAuthors)
    ? storedAuthors.filter((author) => typeof author === 'string' && author.trim())
    : [];
};

export default function CommunityPage({
  personalDetails = {},
  isPersonalDetailsLoading = false,
  onGoToSettings,
}) {
  const postInputRef = useRef(null);
  const [initialStreakState] = useState(getInitialStreakState);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(
    () => getAcceptedGuidelinesVersion() !== COMMUNITY_GUIDELINES_VERSION,
  );
  const [posts, setPosts] = useState(() => getInitialPosts(communityPosts));
  const [newPostText, setNewPostText] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [postAttachment, setPostAttachment] = useState(null);
  const [postError, setPostError] = useState('');
  const [postSuccessMessage, setPostSuccessMessage] = useState('');
  const [activeFeedTab, setActiveFeedTab] = useState('all');
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState('');
  const [refreshPulseKey, setRefreshPulseKey] = useState(0);
  const [relativeTimeNow, setRelativeTimeNow] = useState(() => new Date());
  const [supportSpaceFeedback, setSupportSpaceFeedback] = useState('');
  const [communityUserProfile, setCommunityUserProfile] = useState(getInitialCommunityUserProfile);
  const [communityPreferences, setCommunityPreferences] = useState(getInitialCommunityPreferences);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [commentFeedbackByPostId, setCommentFeedbackByPostId] = useState({});
  const [reportFeedbackByPostId, setReportFeedbackByPostId] = useState({});
  const [confirmingReportPostId, setConfirmingReportPostId] = useState(null);
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState({});
  const [openCommentPostIds, setOpenCommentPostIds] = useState({});
  const [followedAuthors, setFollowedAuthors] = useState(getInitialFollowedAuthors);
  const [selectedSupportSpace, setSelectedSupportSpace] = useState(null);
  const [showFullGuidelinesModal, setShowFullGuidelinesModal] = useState(false);
  const [communityStreakCount, setCommunityStreakCount] = useState(initialStreakState.streakCount);
  const [lastActivityDate, setLastActivityDate] = useState(initialStreakState.lastActivityDate);
  const [isCommunityStreakAtRisk, setIsCommunityStreakAtRisk] = useState(
    () => isStreakAtRiskForDate(initialStreakState.lastActivityDate),
  );

  const refreshCommunityFeed = async ({ showFeedback = false } = {}) => {
    if (showFeedback) {
      setIsRefreshingFeed(true);
      setRefreshFeedback('');
    }

    try {
      const loadedPosts = await getCommunityPosts();
      if (Array.isArray(loadedPosts)) {
        setPosts(loadedPosts);
      }
      setRelativeTimeNow(new Date());
      if (showFeedback) {
        setRefreshPulseKey((currentKey) => currentKey + 1);
        setRefreshFeedback('Community feed refreshed');
      }
    } catch {
      if (showFeedback) {
        setRefreshFeedback('Community feed refreshed');
      }
    } finally {
      if (showFeedback) {
        setIsRefreshingFeed(false);
      }
    }
  };

  useEffect(() => {
    let ignoreResult = false;

    getCommunityPosts()
      .then((loadedPosts) => {
        if (!ignoreResult && Array.isArray(loadedPosts)) {
          setPosts(loadedPosts);
          setRelativeTimeNow(new Date());
        }
      })
      .catch(() => {
        // Keep the existing local fallback state if the placeholder service fails.
      });

    return () => {
      ignoreResult = true;
    };
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setRelativeTimeNow(new Date());
    }, 30000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (!refreshFeedback) return undefined;

    const timerId = window.setTimeout(() => {
      setRefreshFeedback('');
    }, 2600);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [refreshFeedback]);

  useEffect(() => {
    safeSaveToStorage(COMMUNITY_POSTS_STORAGE_KEY, posts.map(serializeCommunityPost));
  }, [posts]);

  useEffect(() => {
    safeSaveToStorage(COMMUNITY_STREAK_STORAGE_KEY, {
      streakCount: communityStreakCount,
      lastActivityDate,
      updatedAt: new Date(),
    });
  }, [communityStreakCount, lastActivityDate]);

  useEffect(() => {
    if (!communityPreferences.birthdayVisibilityCompleted) return;

    safeSaveToStorage(
      COMMUNITY_PREFERENCES_STORAGE_KEY,
      serializeCommunityPreferences(communityPreferences),
    );
  }, [communityPreferences]);

  useEffect(() => {
    if (!communityUserProfile.profileCompleted) return;

    safeSaveToStorage(
      COMMUNITY_USER_PROFILE_STORAGE_KEY,
      serializeCommunityUserProfile(communityUserProfile),
    );
  }, [communityUserProfile]);

  useEffect(() => {
    safeSaveToStorage(COMMUNITY_FOLLOWED_AUTHORS_STORAGE_KEY, followedAuthors);
  }, [followedAuthors]);

  const registerCommunityActivity = () => {
    const todayKey = getTodayKey();
    const dayDifference = getDayDifference(lastActivityDate, todayKey);

    if (!lastActivityDate || dayDifference === null || dayDifference >= 3) {
      setCommunityStreakCount(1);
    } else if (dayDifference === 1 || dayDifference === 2) {
      setCommunityStreakCount((currentCount) => currentCount + 1);
    }

    setLastActivityDate(todayKey);
    setIsCommunityStreakAtRisk(false);
  };

  const handleGuidelinesContinue = () => {
    saveAcceptedGuidelinesVersion();
    setShowGuidelinesModal(false);
  };

  const handlePostTextChange = (value) => {
    setNewPostText(value);
    if (postError) setPostError('');
    if (postSuccessMessage) setPostSuccessMessage('');
  };

  const handleSupportSpaceView = (space) => {
    setSelectedSupportSpace(space);
    setSupportSpaceFeedback(`${space.title} details opened.`);
  };

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
  const localUserId = communityUserProfile.id || personalDetails.id || 'current-user';
  const visibleBirthdayUsers = showBirthdayInCommunity && communityBirthday
    ? [{
      id: communityUserProfile.id || personalDetails.id || 'current-user',
      name: communityDisplayName || 'Current User',
      birthday: communityBirthday,
    }]
    : [];
  const visiblePosts = posts
    .filter(isCommunityContentVisible)
    .map((post) => ({
      ...post,
      comments: Array.isArray(post.comments)
        ? post.comments.filter(isCommunityContentVisible)
        : [],
    }));
  const filteredPosts = filterPostsByTab(visiblePosts, activeFeedTab, followedAuthors);
  const sortedVisiblePosts = sortFeedPosts(filteredPosts);
  const emptyFeedMessage = getEmptyFeedMessage(activeFeedTab, followedAuthors.length);

  const handleBirthdayPreferenceSave = (showBirthday) => {
    setCommunityPreferences({
      birthdayVisibilityCompleted: true,
      showBirthday,
    });
    setCommunityUserProfile({
      ...communityUserProfile,
      id: personalDetails.id || communityUserProfile.id || 'current-user',
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

  useEffect(() => {
    if (!allowAnonymousPosting && postAnonymously) {
      setPostAnonymously(false);
    }
  }, [allowAnonymousPosting, postAnonymously]);

  const handleGoToSettings = () => {
    if (onGoToSettings) {
      onGoToSettings();
      return;
    }

    window.location.assign('/profile');
  };

  const handleCreatePost = async () => {
    const content = newPostText.trim();

    if (!content && !postAttachment) {
      setPostError('Please write something or add a local attachment before sharing.');
      setPostSuccessMessage('');
      return;
    }

    const isAnonymous = allowAnonymousPosting && postAnonymously;
    const author = isAnonymous ? 'Anonymous User' : communityDisplayName || 'Current User';
    let newPost;

    try {
      newPost = await createCommunityPost({
        author,
        content,
        isAnonymous,
        attachment: postAttachment,
      });
    } catch {
      setPostError('Unable to publish your post right now.');
      setPostSuccessMessage('');
      return;
    }

    setPosts((currentPosts) => [newPost, ...currentPosts]);
    setNewPostText('');
    setPostAttachment(null);
    setPostAnonymously(false);
    setPostError('');
    setPostSuccessMessage('Post published successfully.');
    registerCommunityActivity();
  };

  const handleToggleSupport = (postId) => {
    const postToUpdate = posts.find((post) => post.id === postId);
    const shouldIncreaseStreak = postToUpdate ? !postToUpdate.isSupported : false;

    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== postId) return post;

      const wasSupported = Boolean(post.isSupported);
      const currentSupportCount = post.supportCount ?? post.support ?? 0;
      const nextSupportCount = wasSupported
        ? Math.max(currentSupportCount - 1, 0)
        : currentSupportCount + 1;

      return {
        ...post,
        isSupported: !wasSupported,
        supportCount: nextSupportCount,
        support: nextSupportCount,
      };
    }));

    if (shouldIncreaseStreak) {
      registerCommunityActivity();
    }
  };

  const handleToggleFollowAuthor = (author) => {
    if (!author || author === 'Anonymous User' || author === 'Anonymous Participant') return;

    setFollowedAuthors((currentAuthors) => (
      currentAuthors.includes(author)
        ? currentAuthors.filter((currentAuthor) => currentAuthor !== author)
        : [...currentAuthors, author]
    ));
  };

  const handleToggleLike = (postId) => {
    const postToUpdate = posts.find((post) => post.id === postId);
    const shouldIncreaseStreak = postToUpdate ? !postToUpdate.isLiked : false;

    toggleCommunityPostLike(postId, 'current-user').catch(() => {
      // Keep the optimistic local UI update; the placeholder service has no remote side effect yet.
    });

    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== postId) return post;

      const wasLiked = post.isLiked;
      const currentLikesCount = post.likesCount ?? post.likes ?? 0;
      const nextLikesCount = wasLiked
        ? Math.max(currentLikesCount - 1, 0)
        : currentLikesCount + 1;

      return {
        ...post,
        isLiked: !wasLiked,
        likesCount: nextLikesCount,
        likes: nextLikesCount,
      };
    }));

    if (shouldIncreaseStreak) {
      registerCommunityActivity();
    }
  };

  const handleReportPostRequest = (postId) => {
    const postToReport = posts.find((post) => post.id === postId);
    const reportedBy = Array.isArray(postToReport?.reportedBy) ? postToReport.reportedBy : [];

    if (reportedBy.includes(localUserId)) {
      setConfirmingReportPostId(null);
      setReportFeedbackByPostId((currentFeedback) => ({
        ...currentFeedback,
        [postId]: {
          type: 'error',
          message: 'You already reported this post.',
        },
      }));
      return;
    }

    setReportFeedbackByPostId((currentFeedback) => {
      if (!currentFeedback[postId]) return currentFeedback;

      const nextFeedback = { ...currentFeedback };
      delete nextFeedback[postId];
      return nextFeedback;
    });
    setConfirmingReportPostId(postId);
  };

  const handleCancelReportPost = () => {
    setConfirmingReportPostId(null);
  };

  const handleConfirmReportPost = async (postId) => {
    const postToReport = posts.find((post) => post.id === postId);
    const reportedBy = Array.isArray(postToReport?.reportedBy) ? postToReport.reportedBy : [];

    if (!postToReport) return;

    if (reportedBy.includes(localUserId)) {
      setConfirmingReportPostId(null);
      setReportFeedbackByPostId((currentFeedback) => ({
        ...currentFeedback,
        [postId]: {
          type: 'error',
          message: 'You already reported this post.',
        },
      }));
      return;
    }

    try {
      await reportCommunityPost(postId, localUserId);
    } catch {
      // Keep the local placeholder flow responsive; Firebase reporting will handle failures later.
    }

    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== postId) return post;

      const currentReportedBy = Array.isArray(post.reportedBy) ? post.reportedBy : [];
      if (currentReportedBy.includes(localUserId)) return post;

      const reportsCount = Number(post.reportsCount);
      const nextReportsCount = Number.isFinite(reportsCount) && reportsCount >= 0
        ? reportsCount + 1
        : 1;

      return {
        ...post,
        reportsCount: nextReportsCount,
        reportedBy: [...currentReportedBy, localUserId],
        status: post.status === COMMUNITY_POST_STATUS.active
          ? COMMUNITY_POST_STATUS.reported
          : post.status ?? COMMUNITY_POST_STATUS.reported,
      };
    }));
    setConfirmingReportPostId(null);
    setReportFeedbackByPostId((currentFeedback) => ({
      ...currentFeedback,
      [postId]: {
        type: 'success',
        message: 'Thanks, your report was saved locally for this device.',
      },
    }));
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs((currentInputs) => ({
      ...currentInputs,
      [postId]: value,
    }));
    setCommentFeedbackByPostId((currentFeedback) => {
      if (!currentFeedback[postId]) return currentFeedback;

      const nextFeedback = { ...currentFeedback };
      delete nextFeedback[postId];
      return nextFeedback;
    });
  };

  const handleSubmitComment = async (postId) => {
    const content = (commentInputs[postId] ?? '').trim();

    if (!content) {
      setCommentFeedbackByPostId((currentFeedback) => ({
        ...currentFeedback,
        [postId]: {
          type: 'error',
          message: 'Please write a comment before posting.',
        },
      }));
      return;
    }
    if (!posts.some((post) => post.id === postId)) return;

    let newComment;

    try {
      newComment = await addCommunityPostComment(postId, {
        author: communityDisplayName || 'Current User',
        authorDisplayName: communityDisplayName || 'Current User',
        content,
      });
    } catch {
      setCommentFeedbackByPostId((currentFeedback) => ({
        ...currentFeedback,
        [postId]: {
          type: 'error',
          message: 'Unable to add your comment right now.',
        },
      }));
      return;
    }

    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== postId) return post;

      const currentComments = Array.isArray(post.comments) ? post.comments : [];
      const nextComments = [newComment, ...currentComments];

      return {
        ...post,
        comments: nextComments,
      };
    }));

    setCommentInputs((currentInputs) => ({
      ...currentInputs,
      [postId]: '',
    }));
    setOpenCommentPostIds((currentPostIds) => ({
      ...currentPostIds,
      [postId]: true,
    }));
    setCommentFeedbackByPostId((currentFeedback) => ({
      ...currentFeedback,
      [postId]: {
        type: 'success',
        message: 'Comment added successfully.',
      },
    }));
    registerCommunityActivity();
  };

  const handleToggleCommentsExpanded = (postId) => {
    setExpandedCommentPostIds((currentPostIds) => ({
      ...currentPostIds,
      [postId]: !currentPostIds[postId],
    }));
  };

  const handleOpenCommentComposer = (postId) => {
    setOpenCommentPostIds((currentPostIds) => ({
      ...currentPostIds,
      [postId]: true,
    }));
    setExpandedCommentPostIds((currentPostIds) => ({
      ...currentPostIds,
      [postId]: true,
    }));
  };

  return (
    <section className="community-page" aria-labelledby="community-page-title">
      {showGuidelinesModal && <CommunityGuidelinesModal onContinue={handleGuidelinesContinue} />}

      <header className="community-page__header">
        <div className="community-page__header-copy">
          <span className="community-page__header-icon" aria-hidden="true">
            <FavoriteBorderOutlinedIcon />
          </span>
          <h1 id="community-page-title">Community</h1>
          <p>Connect, share, and support each other in a safe space.</p>
        </div>
      </header>

      <div className="community-page-shell">
        <main className="community-main-feed" aria-label="Community feed">
          {isPersonalDetailsLoading && (
            <section className="community-profile-setup" aria-label="Loading community profile">
              <div className="community-profile-setup__heading">
                <span className="community-profile-setup__icon" aria-hidden="true">
                  <Diversity3OutlinedIcon />
                </span>
                <div>
                  <span>Community access</span>
                  <h2>Checking your personal details</h2>
                  <p>Preparing your community profile...</p>
                </div>
              </div>
            </section>
          )}
          {!isPersonalDetailsLoading && !hasCommunityAccessDetails && (
            <CommunityAccessPanel onGoToSettings={handleGoToSettings} />
          )}
          {!isPersonalDetailsLoading && hasRequiredPersonalDetails && !hasCompletedCommunitySetup && (
            <CommunityBirthdayPreferenceCard onSave={handleBirthdayPreferenceSave} />
          )}
          {profileSuccessMessage && canUseCommunity && (
            <p className="community-profile-setup__success" aria-live="polite">{profileSuccessMessage}</p>
          )}
          {canUseCommunity && (
            <>
              <CreatePostCard
                attachment={postAttachment}
                allowAnonymousPosting={allowAnonymousPosting}
                isAnonymous={postAnonymously}
                error={postError}
                onAnonymousChange={setPostAnonymously}
                onAttachmentChange={setPostAttachment}
                onPostTextChange={handlePostTextChange}
                onSubmit={handleCreatePost}
                postInputRef={postInputRef}
                postText={newPostText}
                successMessage={postSuccessMessage}
              />

              <section className="community-feed-controls" aria-label="Community feed controls">
                <div className="community-feed-tabs" role="tablist" aria-label="Community feed filters">
                  {FEED_TABS.map((tab) => (
                    <button
                      aria-controls="community-feed-panel"
                      aria-selected={activeFeedTab === tab.id}
                      className={activeFeedTab === tab.id ? 'is-active' : undefined}
                      id={`community-feed-tab-${tab.id}`}
                      key={tab.id}
                      onClick={() => setActiveFeedTab(tab.id)}
                      role="tab"
                      type="button"
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  aria-label="Refresh local community feed"
                  aria-busy={isRefreshingFeed}
                  className={`community-feed-refresh${isRefreshingFeed ? ' is-refreshing' : ''}`}
                  disabled={isRefreshingFeed}
                  title="Refresh local community feed"
                  type="button"
                  onClick={() => refreshCommunityFeed({ showFeedback: true })}
                >
                  <RefreshOutlinedIcon className="community-feed-refresh__icon" fontSize="small" />
                  <span>{isRefreshingFeed ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </section>
              {refreshFeedback && (
                <p className="community-feed-refresh__feedback" aria-live="polite">
                  {refreshFeedback}
                </p>
              )}

              <section className="community-page-card community-page-card--intro">
                <span className="community-page-card__icon">
                  <LocalFloristOutlinedIcon />
                </span>
                <div>
                  <h2>Today in the community</h2>
                  <p>Stories, reflections, and encouragement from participants walking a similar path.</p>
                </div>
              </section>

              {sortedVisiblePosts.length === 0 ? (
                <section
                  aria-labelledby={`community-feed-tab-${activeFeedTab}`}
                  className={`community-empty-state${refreshPulseKey > 0 ? ' community-feed-panel--refreshed' : ''}`}
                  id="community-feed-panel"
                  key={`empty-${activeFeedTab}-${refreshPulseKey}`}
                  role="tabpanel"
                >
                  <h2>{emptyFeedMessage.title}</h2>
                  <p>{emptyFeedMessage.description}</p>
                </section>
              ) : (
                <section
                  aria-labelledby={`community-feed-tab-${activeFeedTab}`}
                  className={`community-post-list${refreshPulseKey > 0 ? ' community-feed-panel--refreshed' : ''}`}
                  id="community-feed-panel"
                  key={`posts-${activeFeedTab}-${refreshPulseKey}`}
                  role="tabpanel"
                >
                  {sortedVisiblePosts.map((post) => (
                    <CommunityPostCard
                      commentText={commentInputs[post.id] ?? ''}
                      commentFeedback={commentFeedbackByPostId[post.id]}
                      isCommentsExpanded={Boolean(expandedCommentPostIds[post.id])}
                      isCommentComposerOpen={Boolean(openCommentPostIds[post.id])}
                      isFollowingAuthor={followedAuthors.includes(post.author)}
                      isReportConfirming={confirmingReportPostId === post.id}
                      key={post.id}
                      onCommentTextChange={(value) => handleCommentInputChange(post.id, value)}
                      onCancelReport={() => handleCancelReportPost(post.id)}
                      onConfirmReport={() => handleConfirmReportPost(post.id)}
                      onFollowAuthor={handleToggleFollowAuthor}
                      onOpenCommentComposer={() => handleOpenCommentComposer(post.id)}
                      onReportPost={() => handleReportPostRequest(post.id)}
                      onSubmitComment={() => handleSubmitComment(post.id)}
                      onToggleSupport={handleToggleSupport}
                      onToggleCommentsExpanded={() => handleToggleCommentsExpanded(post.id)}
                      onToggleLike={handleToggleLike}
                      post={post}
                      relativeTimeNow={relativeTimeNow}
                      isReportedByCurrentUser={Array.isArray(post.reportedBy) && post.reportedBy.includes(localUserId)}
                      reportFeedback={reportFeedbackByPostId[post.id]}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </main>

        <aside className="community-right-sidebar" aria-label="Community sidebar">
          <CommunityStreakCard
            isAtRisk={isCommunityStreakAtRisk || isStreakAtRiskForDate(lastActivityDate)}
            streakCount={communityStreakCount}
          />
          <BirthdayCard birthdayUsers={visibleBirthdayUsers} />

          <section className="community-page-card community-active-widget" aria-labelledby="community-active-members-title">
            <div className="community-page-card__heading">
              <span className="community-page-card__icon">
                <Diversity3OutlinedIcon />
              </span>
              <div>
                <span>{communityActiveMembers.length} members</span>
                <h2 id="community-active-members-title">Active Members</h2>
              </div>
            </div>
            <div className="community-active-members" aria-label="Recently active community members">
              {communityActiveMembers.map((member) => (
                <article className="community-active-member" key={member.id}>
                  <span aria-label={`${member.name}, ${member.status}`} className="community-active-member__avatar">
                    {member.initials}
                  </span>
                  <div>
                    <strong>{member.name}</strong>
                    <small>{member.status}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="community-page-card community-support-spaces-widget" aria-labelledby="community-support-spaces-title">
            <div className="community-page-card__heading">
              <span className="community-page-card__icon">
                <Diversity3OutlinedIcon />
              </span>
              <div>
                <span>Spaces</span>
                <h2 id="community-support-spaces-title">Support Spaces</h2>
              </div>
            </div>
            <div className="community-support-space-list">
              {communitySupportSpaces.map((space) => {
                const Icon = space.icon;
                return (
                  <article className="community-support-space" key={space.title}>
                    <span className="community-support-space__icon" aria-hidden="true">
                      <Icon fontSize="small" />
                    </span>
                    <div>
                      <strong>{space.title}</strong>
                      <small>{space.meta}</small>
                    </div>
                    <button
                      aria-label={`View ${space.title} details`}
                      type="button"
                      onClick={() => handleSupportSpaceView(space)}
                    >
                      View
                    </button>
                  </article>
                );
              })}
            </div>
            {supportSpaceFeedback && (
              <p className="community-support-spaces-widget__feedback" aria-live="polite">
                {supportSpaceFeedback}
              </p>
            )}
          </section>

          {canUseCommunity && (
            <section className="community-page-card community-privacy-card">
              <div className="community-page-card__heading">
                <span className="community-page-card__icon">
                  <Diversity3OutlinedIcon />
                </span>
                <div>
                  <span>Privacy</span>
                  <h2>Community Privacy</h2>
                </div>
              </div>
              <label className="community-privacy-card__toggle">
                <input
                  aria-label="Show my birthday in the community"
                  type="checkbox"
                  checked={showBirthdayInCommunity}
                  onChange={(event) => handleBirthdayVisibilityChange(event.target.checked)}
                />
                <span>Show my birthday in the community</span>
              </label>
              <p>
                This only controls community visibility. Your birthday stays unchanged in Settings.
              </p>
            </section>
          )}
          <CommunityGuidelinesCard onReadFullGuidelines={() => setShowFullGuidelinesModal(true)} />

          <section className="community-page-card community-page-card--soft">
            <div className="community-page-card__heading">
              <span className="community-page-card__icon">
                <MenuBookOutlinedIcon />
              </span>
              <div>
                <span>Shared care</span>
                <h2>Community Resources</h2>
              </div>
            </div>
            <ul className="community-resource-list">
              {communityResources.map((resource) => (
                <li key={resource}>{resource}</li>
              ))}
            </ul>
          </section>

        </aside>
      </div>
      {selectedSupportSpace && (
        <div className="community-local-modal" role="dialog" aria-modal="true" aria-labelledby="community-support-space-modal-title">
          <section className="community-local-modal__panel">
            <button
              aria-label="Close support space details"
              className="community-local-modal__close"
              type="button"
              onClick={() => setSelectedSupportSpace(null)}
            >
              ×
            </button>
            <span className="community-local-modal__eyebrow">Support Space</span>
            <h2 id="community-support-space-modal-title">{selectedSupportSpace.title}</h2>
            <p>{selectedSupportSpace.description}</p>
            <strong>{selectedSupportSpace.schedule}</strong>
            <button type="button" onClick={() => setSelectedSupportSpace(null)}>
              Close
            </button>
          </section>
        </div>
      )}
      {showFullGuidelinesModal && (
        <CommunityGuidelinesModal
          mode="read"
          onClose={() => setShowFullGuidelinesModal(false)}
        />
      )}
    </section>
  );
}
