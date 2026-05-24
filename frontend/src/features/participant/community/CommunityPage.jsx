import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  getDayDifference,
  getInitialCommunityPreferences,
  getInitialCommunityUserProfile,
  getInitialPosts,
  getInitialStreakState,
  getTodayKey,
  isCommunityContentVisible,
  isStreakAtRiskForDate,
  serializeCommunityPreferences,
  serializeCommunityPost,
  serializeCommunityUserProfile,
} from './communityInteractionHelpers';
import {
  FEED_TABS,
  REPORT_REASON_OPTIONS,
} from './constants/communityConstants';
import {
  filterPostsByTab,
  getEmptyFeedMessage,
  sortFeedPosts,
} from './utils/communityFeedUtils';
import {
  getCommunityBirthday,
  getExistingDisplayName,
  hasRequiredCommunityPersonalDetails,
} from './utils/communityProfileUtils';
import {
  getCurrentCommunityUserId,
  getFollowAuthorKey,
  getPostAuthorId,
  isAuthorCurrentUser,
  isAuthorFollowed,
  isCommentOwnedByCurrentUser,
  isPostOwnedByCurrentUser,
  isPostReportedByUser,
} from './utils/communityModerationUtils';
import {
  loadStoredFollowedAuthors,
  saveStoredCommunityPosts,
  saveStoredCommunityPreferences,
  saveStoredCommunityStreak,
  saveStoredCommunityUserProfile,
  saveStoredFollowedAuthors,
} from './services/communityStorageService';
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
import DeletePostModal from './components/DeletePostModal';
import EditPostModal from './components/EditPostModal';
import FeedTabs from './components/FeedTabs';
import ReportPostModal from './components/ReportPostModal';
import './styles/community.css';

export default function CommunityPage({
  personalDetails = {},
  isPersonalDetailsLoading = false,
  onGoToSettings,
}) {
  const postInputRef = useRef(null);
  const reportModalRef = useRef(null);
  const deletePostModalRef = useRef(null);
  const deleteCommentModalRef = useRef(null);
  const editPostModalRef = useRef(null);
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
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportReasonError, setReportReasonError] = useState('');
  const [confirmingDeletePostId, setConfirmingDeletePostId] = useState(null);
  const [pendingCommentDeletion, setPendingCommentDeletion] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostText, setEditPostText] = useState('');
  const [editPostError, setEditPostError] = useState('');
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState({});
  const [openCommentPostIds, setOpenCommentPostIds] = useState({});
  const [followedAuthors, setFollowedAuthors] = useState(loadStoredFollowedAuthors);
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
    if (!confirmingReportPostId) return;

    setSelectedReportReason('');
    setReportReasonError('');
    window.setTimeout(() => {
      reportModalRef.current?.focus();
    }, 0);
  }, [confirmingReportPostId]);

  useEffect(() => {
    if (!confirmingDeletePostId) return;

    window.setTimeout(() => {
      deletePostModalRef.current?.focus();
    }, 0);
  }, [confirmingDeletePostId]);

  useEffect(() => {
    if (!pendingCommentDeletion) return;

    window.setTimeout(() => {
      deleteCommentModalRef.current?.focus();
    }, 0);
  }, [pendingCommentDeletion]);

  useEffect(() => {
    if (!editingPostId) return;

    window.setTimeout(() => {
      editPostModalRef.current?.focus();
    }, 0);
  }, [editingPostId]);

  useEffect(() => {
    saveStoredCommunityPosts(posts.map(serializeCommunityPost));
  }, [posts]);

  useEffect(() => {
    saveStoredCommunityStreak({
      streakCount: communityStreakCount,
      lastActivityDate,
      updatedAt: new Date(),
    });
  }, [communityStreakCount, lastActivityDate]);

  useEffect(() => {
    if (!communityPreferences.birthdayVisibilityCompleted) return;

    saveStoredCommunityPreferences(serializeCommunityPreferences(communityPreferences));
  }, [communityPreferences]);

  useEffect(() => {
    if (!communityUserProfile.profileCompleted) return;

    saveStoredCommunityUserProfile(serializeCommunityUserProfile(communityUserProfile));
  }, [communityUserProfile]);

  useEffect(() => {
    saveStoredFollowedAuthors(followedAuthors);
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
  const localUserId = getCurrentCommunityUserId(personalDetails, communityUserProfile);
  const visibleBirthdayUsers = showBirthdayInCommunity && communityBirthday
    ? [{
      id: localUserId,
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
        authorId: localUserId,
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

  const handleToggleFollowAuthor = (post) => {
    if (!post || post.isAnonymous || post.author === 'Anonymous User' || post.author === 'Anonymous Participant') return;
    if (isAuthorCurrentUser(post, localUserId, communityDisplayName || 'Current User')) return;

    const authorKey = getFollowAuthorKey(post);
    if (!authorKey) return;

    setFollowedAuthors((currentAuthors) => (
      isAuthorFollowed(post, currentAuthors)
        ? currentAuthors.filter((currentAuthor) => (
          currentAuthor !== authorKey && currentAuthor !== post.author
        ))
        : [...currentAuthors, authorKey]
    ));
  };

  const handleToggleLike = (postId) => {
    const postToUpdate = posts.find((post) => post.id === postId);
    const shouldIncreaseStreak = postToUpdate ? !postToUpdate.isLiked : false;

    toggleCommunityPostLike(postId, localUserId).catch(() => {
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

    if (isPostOwnedByCurrentUser(postToReport, localUserId, communityDisplayName || 'Current User')) {
      setConfirmingReportPostId(null);
      return;
    }

    if (isPostReportedByUser(postToReport, localUserId)) {
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
    setSelectedReportReason('');
    setReportReasonError('');
  };

  const handleReportModalBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleCancelReportPost();
    }
  };

  const handleReportModalKeyDown = (event) => {
    if (event.key === 'Escape') {
      handleCancelReportPost();
    }
  };

  const handleReportReasonChange = (reason) => {
    setSelectedReportReason(reason);
    if (reportReasonError) setReportReasonError('');
  };

  const handleReportSubmit = (event) => {
    event.preventDefault();

    if (!confirmingReportPostId) return;

    if (!selectedReportReason) {
      setReportReasonError('Please choose a report reason before submitting.');
      return;
    }

    handleConfirmReportPost(confirmingReportPostId, selectedReportReason);
  };

  const handleConfirmReportPost = async (postId, reason) => {
    const postToReport = posts.find((post) => post.id === postId);

    if (!postToReport) return;

    if (isPostOwnedByCurrentUser(postToReport, localUserId, communityDisplayName || 'Current User')) {
      setConfirmingReportPostId(null);
      setSelectedReportReason('');
      setReportReasonError('');
      return;
    }

    if (isPostReportedByUser(postToReport, localUserId)) {
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

    const createdAt = new Date();
    const reportRecord = {
      id: `community-report-${postId}-${localUserId}-${createdAt.getTime()}`,
      postId,
      reporterUserId: localUserId,
      postOwnerId: getPostAuthorId(postToReport) || postToReport.authorDisplayName || postToReport.author || null,
      reason,
      createdAt: createdAt.toISOString(),
    };

    try {
      await reportCommunityPost(postId, reportRecord);
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
        reports: [...(Array.isArray(post.reports) ? post.reports : []), reportRecord],
        status: post.status === COMMUNITY_POST_STATUS.active
          ? COMMUNITY_POST_STATUS.reported
          : post.status ?? COMMUNITY_POST_STATUS.reported,
      };
    }));
    setConfirmingReportPostId(null);
    setSelectedReportReason('');
    setReportReasonError('');
    setReportFeedbackByPostId((currentFeedback) => ({
      ...currentFeedback,
      [postId]: {
        type: 'success',
        message: 'Thanks, your report was saved locally for review.',
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
        authorId: localUserId,
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
        commentsCount: nextComments.filter(isCommunityContentVisible).length,
      };
    }));

    setCommentInputs((currentInputs) => ({
      ...currentInputs,
      [postId]: '',
    }));
    setOpenCommentPostIds((currentPostIds) => ({
      ...currentPostIds,
      [postId]: false,
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
      [postId]: !currentPostIds[postId],
    }));
    setExpandedCommentPostIds((currentPostIds) => ({
      ...currentPostIds,
      [postId]: true,
    }));
  };

  const handleDeleteCommentRequest = (postId, commentId) => {
    const postToUpdate = posts.find((post) => post.id === postId);
    const commentToDelete = Array.isArray(postToUpdate?.comments)
      ? postToUpdate.comments.find((comment) => comment.id === commentId)
      : null;

    if (!isCommentOwnedByCurrentUser(commentToDelete, localUserId, communityDisplayName || 'Current User')) return;

    setPendingCommentDeletion({ postId, commentId });
  };

  const handleCancelDeleteComment = () => {
    setPendingCommentDeletion(null);
  };

  const handleDeleteCommentModalBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleCancelDeleteComment();
    }
  };

  const handleDeleteCommentModalKeyDown = (event) => {
    if (event.key === 'Escape') {
      handleCancelDeleteComment();
    }
  };

  const handleConfirmDeleteComment = () => {
    if (!pendingCommentDeletion) return;

    const { postId, commentId } = pendingCommentDeletion;
    const postToUpdate = posts.find((post) => post.id === postId);
    const commentToDelete = Array.isArray(postToUpdate?.comments)
      ? postToUpdate.comments.find((comment) => comment.id === commentId)
      : null;

    if (!isCommentOwnedByCurrentUser(commentToDelete, localUserId, communityDisplayName || 'Current User')) {
      handleCancelDeleteComment();
      return;
    }

    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== postId) return post;

      const currentComments = Array.isArray(post.comments) ? post.comments : [];
      const nextComments = currentComments.filter((comment) => comment.id !== commentId);

      return {
        ...post,
        comments: nextComments,
        commentsCount: nextComments.filter(isCommunityContentVisible).length,
      };
    }));
    handleCancelDeleteComment();
  };

  const handleEditPostRequest = (postId) => {
    const postToEdit = posts.find((post) => post.id === postId);

    if (!isPostOwnedByCurrentUser(postToEdit, localUserId, communityDisplayName || 'Current User')) return;

    setEditingPostId(postId);
    setEditPostText(postToEdit.content ?? postToEdit.body ?? '');
    setEditPostError('');
  };

  const handleCancelEditPost = () => {
    setEditingPostId(null);
    setEditPostText('');
    setEditPostError('');
  };

  const handleEditPostModalBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleCancelEditPost();
    }
  };

  const handleEditPostModalKeyDown = (event) => {
    if (event.key === 'Escape') {
      handleCancelEditPost();
    }
  };

  const handleEditPostTextChange = (value) => {
    setEditPostText(value);
    if (editPostError) setEditPostError('');
  };

  const handleEditPostSubmit = (event) => {
    event.preventDefault();

    const postToEdit = posts.find((post) => post.id === editingPostId);
    if (!postToEdit) return;

    if (!isPostOwnedByCurrentUser(postToEdit, localUserId, communityDisplayName || 'Current User')) {
      handleCancelEditPost();
      return;
    }

    const content = editPostText.trim();

    if (!content && !postToEdit.attachment) {
      setEditPostError('Please write something or keep an attachment before saving.');
      return;
    }

    const updatedAt = new Date().toISOString();

    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== editingPostId) return post;

      return {
        ...post,
        content,
        body: content,
        updatedAt,
      };
    }));
    handleCancelEditPost();
  };

  const handleDeletePostRequest = (postId) => {
    const postToDelete = posts.find((post) => post.id === postId);

    if (!isPostOwnedByCurrentUser(postToDelete, localUserId, communityDisplayName || 'Current User')) return;

    setConfirmingDeletePostId(postId);
  };

  const handleCancelDeletePost = () => {
    setConfirmingDeletePostId(null);
  };

  const handleDeletePostModalBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleCancelDeletePost();
    }
  };

  const handleDeletePostModalKeyDown = (event) => {
    if (event.key === 'Escape') {
      handleCancelDeletePost();
    }
  };

  const handleConfirmDeletePost = () => {
    const postToDelete = posts.find((post) => post.id === confirmingDeletePostId);

    if (!isPostOwnedByCurrentUser(postToDelete, localUserId, communityDisplayName || 'Current User')) {
      handleCancelDeletePost();
      return;
    }

    const updatedAt = new Date().toISOString();

    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== confirmingDeletePostId) return post;

      return {
        ...post,
        status: COMMUNITY_POST_STATUS.deleted,
        updatedAt,
      };
    }));
    handleCancelDeletePost();
  };

  const reportModal = confirmingReportPostId ? (
    <ReportPostModal
      onBackdropMouseDown={handleReportModalBackdropClick}
      onCancel={handleCancelReportPost}
      onKeyDown={handleReportModalKeyDown}
      onReasonChange={handleReportReasonChange}
      onSubmit={handleReportSubmit}
      reasonError={reportReasonError}
      reasons={REPORT_REASON_OPTIONS}
      reportModalRef={reportModalRef}
      selectedReason={selectedReportReason}
    />
  ) : null;

  const editPostModal = editingPostId ? (
    <EditPostModal
      editModalRef={editPostModalRef}
      error={editPostError}
      onBackdropMouseDown={handleEditPostModalBackdropClick}
      onCancel={handleCancelEditPost}
      onChange={handleEditPostTextChange}
      onKeyDown={handleEditPostModalKeyDown}
      onSubmit={handleEditPostSubmit}
      postText={editPostText}
    />
  ) : null;

  const deletePostModal = confirmingDeletePostId ? (
    <DeletePostModal
      deleteModalRef={deletePostModalRef}
      onBackdropMouseDown={handleDeletePostModalBackdropClick}
      onCancel={handleCancelDeletePost}
      onConfirm={handleConfirmDeletePost}
      onKeyDown={handleDeletePostModalKeyDown}
    />
  ) : null;

  const deleteCommentModal = pendingCommentDeletion ? (
    <DeletePostModal
      closeLabel="Close comment delete confirmation"
      deleteModalRef={deleteCommentModalRef}
      description="Are you sure you want to delete this comment?"
      title="Delete comment"
      titleId="community-delete-comment-title"
      onBackdropMouseDown={handleDeleteCommentModalBackdropClick}
      onCancel={handleCancelDeleteComment}
      onConfirm={handleConfirmDeleteComment}
      onKeyDown={handleDeleteCommentModalKeyDown}
    />
  ) : null;

  return (
    <section className="community-page" aria-labelledby="community-page-title">
      {showGuidelinesModal && <CommunityGuidelinesModal onContinue={handleGuidelinesContinue} />}
      {reportModal && typeof document !== 'undefined' ? createPortal(reportModal, document.body) : reportModal}
      {editPostModal && typeof document !== 'undefined' ? createPortal(editPostModal, document.body) : editPostModal}
      {deletePostModal && typeof document !== 'undefined' ? createPortal(deletePostModal, document.body) : deletePostModal}
      {deleteCommentModal && typeof document !== 'undefined' ? createPortal(deleteCommentModal, document.body) : deleteCommentModal}

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
                <FeedTabs
                  activeTab={activeFeedTab}
                  onTabChange={setActiveFeedTab}
                  tabs={FEED_TABS}
                />

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
                      isFollowingAuthor={isAuthorFollowed(post, followedAuthors)}
                      isOwnPost={isPostOwnedByCurrentUser(post, localUserId, communityDisplayName || 'Current User')}
                      key={post.id}
                      onCommentTextChange={(value) => handleCommentInputChange(post.id, value)}
                      onDeletePost={() => handleDeletePostRequest(post.id)}
                      onEditPost={() => handleEditPostRequest(post.id)}
                      onFollowAuthor={() => handleToggleFollowAuthor(post)}
                      onOpenCommentComposer={() => handleOpenCommentComposer(post.id)}
                      onReportPost={() => handleReportPostRequest(post.id)}
                      onDeleteComment={(commentId) => handleDeleteCommentRequest(post.id, commentId)}
                      onSubmitComment={() => handleSubmitComment(post.id)}
                      onToggleSupport={handleToggleSupport}
                      onToggleCommentsExpanded={() => handleToggleCommentsExpanded(post.id)}
                      onToggleLike={handleToggleLike}
                      post={post}
                      relativeTimeNow={relativeTimeNow}
                      localUserId={localUserId}
                      localUserName={communityDisplayName || 'Current User'}
                      isReportedByCurrentUser={isPostReportedByUser(post, localUserId)}
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
