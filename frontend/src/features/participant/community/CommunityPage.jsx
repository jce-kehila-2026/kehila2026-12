import { useEffect, useRef, useState } from 'react';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import LocalFloristOutlinedIcon from '@mui/icons-material/LocalFloristOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import {
  communityPosts,
  communityResources,
  supportCircles,
} from './communityMockData';
import {
  COMMUNITY_PREFERENCES_STORAGE_KEY,
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
  const [postError, setPostError] = useState('');
  const [postSuccessMessage, setPostSuccessMessage] = useState('');
  const [anonymousShortcutMessage, setAnonymousShortcutMessage] = useState('');
  const [communityUserProfile, setCommunityUserProfile] = useState(getInitialCommunityUserProfile);
  const [communityPreferences, setCommunityPreferences] = useState(getInitialCommunityPreferences);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [commentFeedbackByPostId, setCommentFeedbackByPostId] = useState({});
  const [reportFeedbackByPostId, setReportFeedbackByPostId] = useState({});
  const [confirmingReportPostId, setConfirmingReportPostId] = useState(null);
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState({});
  const [communityStreakCount, setCommunityStreakCount] = useState(initialStreakState.streakCount);
  const [lastActivityDate, setLastActivityDate] = useState(initialStreakState.lastActivityDate);
  const [isCommunityStreakAtRisk, setIsCommunityStreakAtRisk] = useState(
    () => isStreakAtRiskForDate(initialStreakState.lastActivityDate),
  );

  useEffect(() => {
    let ignoreResult = false;

    getCommunityPosts()
      .then((loadedPosts) => {
        if (!ignoreResult && Array.isArray(loadedPosts)) {
          setPosts(loadedPosts);
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
    if (anonymousShortcutMessage) setAnonymousShortcutMessage('');
  };

  const handleWriteAnonymously = () => {
    setPostAnonymously(true);
    setAnonymousShortcutMessage('Anonymous mode enabled.');
    postInputRef.current?.focus();
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

    if (!content) {
      setPostError('Please write something before sharing.');
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
      });
    } catch {
      setPostError('Unable to publish your post right now.');
      setPostSuccessMessage('');
      return;
    }

    setPosts((currentPosts) => [newPost, ...currentPosts]);
    setNewPostText('');
    setPostAnonymously(false);
    setPostError('');
    setPostSuccessMessage('Post published successfully.');
    setAnonymousShortcutMessage('');
    registerCommunityActivity();
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
    const localUserId = communityUserProfile.id || personalDetails.id || 'current-user';
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
    const localUserId = communityUserProfile.id || personalDetails.id || 'current-user';
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
        message: 'Thanks, your report was submitted.',
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
                allowAnonymousPosting={allowAnonymousPosting}
                isAnonymous={postAnonymously}
                error={postError}
                onAnonymousChange={setPostAnonymously}
                onPostTextChange={handlePostTextChange}
                onSubmit={handleCreatePost}
                postInputRef={postInputRef}
                postText={newPostText}
                successMessage={postSuccessMessage}
              />

              {allowAnonymousPosting && (
                <section className="community-anonymous-promo" aria-labelledby="community-anonymous-promo-title">
                  <span className="community-anonymous-promo__icon" aria-hidden="true">
                    <LockOutlinedIcon />
                  </span>
                  <div className="community-anonymous-promo__copy">
                    <h2 id="community-anonymous-promo-title">Share anonymously</h2>
                    <p>Share what’s on your mind without showing your name or profile.</p>
                    {anonymousShortcutMessage && (
                      <span className="community-anonymous-promo__feedback" aria-live="polite">
                        {anonymousShortcutMessage}
                      </span>
                    )}
                  </div>
                  <button
                    aria-label="Write anonymously in the community composer"
                    type="button"
                    onClick={handleWriteAnonymously}
                  >
                    Write Anonymously
                  </button>
                </section>
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

              {visiblePosts.length === 0 ? (
                <section className="community-empty-state" aria-label="Empty community feed">
                  <h2>No posts yet</h2>
                  <p>Be the first to share something with the community.</p>
                </section>
              ) : (
                visiblePosts.map((post) => (
                  <CommunityPostCard
                    commentText={commentInputs[post.id] ?? ''}
                    commentFeedback={commentFeedbackByPostId[post.id]}
                    isCommentsExpanded={Boolean(expandedCommentPostIds[post.id])}
                    isReportConfirming={confirmingReportPostId === post.id}
                    onCommentTextChange={(value) => handleCommentInputChange(post.id, value)}
                    onCancelReport={() => handleCancelReportPost(post.id)}
                    onConfirmReport={() => handleConfirmReportPost(post.id)}
                    onReportPost={() => handleReportPostRequest(post.id)}
                    onSubmitComment={() => handleSubmitComment(post.id)}
                    onToggleCommentsExpanded={() => handleToggleCommentsExpanded(post.id)}
                    onToggleLike={handleToggleLike}
                    post={post}
                    key={post.id}
                    reportFeedback={reportFeedbackByPostId[post.id]}
                  />
                ))
              )}
            </>
          )}
        </main>

        <aside className="community-right-sidebar" aria-label="Community sidebar">
          <BirthdayCard birthdayUsers={visibleBirthdayUsers} />
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
          <CommunityStreakCard
            isAtRisk={isCommunityStreakAtRisk || isStreakAtRiskForDate(lastActivityDate)}
            streakCount={communityStreakCount}
          />
          <CommunityGuidelinesCard />

          <section className="community-page-card">
            <div className="community-page-card__heading">
              <span className="community-page-card__icon">
                <Diversity3OutlinedIcon />
              </span>
              <div>
                <span>Circles</span>
                <h2>Support Spaces</h2>
              </div>
            </div>
            <div className="community-circle-list">
              {supportCircles.map((circle) => {
                const Icon = circle.icon;
                return (
                  <article className="community-circle-item" key={circle.title}>
                    <span>
                      <Icon fontSize="small" />
                    </span>
                    <div>
                      <strong>{circle.title}</strong>
                      <small>{circle.meta}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

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
    </section>
  );
}
