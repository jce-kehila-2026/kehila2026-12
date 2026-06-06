import { useEffect, useRef, useState } from 'react';
import { isCommunityContentVisible } from '../communityInteractionHelpers';
import { COMMUNITY_POST_STATUS } from '../communityModels';
import {
  createCommunityPost,
  deleteCommunityPost,
  getCommunityPosts,
  toggleCommunityPostLike,
  toggleCommunityPostSupport,
  updateCommunityPost,
} from '../services/communityService';
import {
  getPostReportedAtTime,
  isPostOwnedByCurrentUser,
  REPORTED_POST_HIDE_DELAY_MS,
  shouldHidePostReportedByUser,
} from '../utils/communityModerationUtils';

const normalizeEditablePostText = (value = '') => String(value).replace(/\r\n/g, '\n').trim();

const enrichWithUserState = (posts, userId) => posts.map((post) => ({
  ...post,
  isLiked: Array.isArray(post.likedBy) && post.likedBy.includes(userId),
  isSupported: Array.isArray(post.supportedBy) && post.supportedBy.includes(userId),
}));

export default function useCommunityPosts({
  allowAnonymousPosting,
  communityDisplayName,
  confirmingDeletePostId,
  editPostText,
  editingPostId,
  localUserId,
  postAnonymously,
  postAttachment,
  registerCommunityActivity,
  setPostAnonymously,
  setPostAttachment,
  setPostError,
  setPostSuccessMessage,
  setNewPostText,
  newPostText,
  onCancelDeletePost,
  onCancelEditPost,
  setConfirmingDeletePostId,
  setEditPostError,
  setEditPostText,
  setEditingPostId,
}) {
  const editFeedbackTimersRef = useRef({});
  const postSuccessTimerRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState('');
  const [editFeedbackByPostId, setEditFeedbackByPostId] = useState({});
  const [refreshPulseKey, setRefreshPulseKey] = useState(0);
  const [relativeTimeNow, setRelativeTimeNow] = useState(() => new Date());
  const [reportVisibilityNow, setReportVisibilityNow] = useState(() => Date.now());

  const localUserName = communityDisplayName || 'Current User';

  const refreshCommunityFeed = async ({ showFeedback = false } = {}) => {
    if (showFeedback) {
      setIsRefreshingFeed(true);
      setRefreshFeedback('');
    }

    try {
      const { posts: loadedPosts } = await getCommunityPosts();
      if (Array.isArray(loadedPosts)) {
        setPosts(enrichWithUserState(loadedPosts, localUserId));
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
      .then(({ posts: loadedPosts }) => {
        if (!ignoreResult && Array.isArray(loadedPosts)) {
          setPosts(enrichWithUserState(loadedPosts, localUserId));
          setRelativeTimeNow(new Date());
        }
      })
      .catch(() => {});

    return () => {
      ignoreResult = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setReportVisibilityNow(Date.now());
  }, [posts]);

  useEffect(() => {
    if (!localUserId) return undefined;

    const nextHideDelay = posts.reduce((closestDelay, post) => {
      if (!isCommunityContentVisible(post)) return closestDelay;
      if (shouldHidePostReportedByUser(post, localUserId, reportVisibilityNow)) return closestDelay;

      const reportedAtTime = getPostReportedAtTime(post, localUserId);
      if (reportedAtTime === null) return closestDelay;

      const delay = Math.max(
        reportedAtTime + REPORTED_POST_HIDE_DELAY_MS - reportVisibilityNow,
        0,
      );

      return closestDelay === null ? delay : Math.min(closestDelay, delay);
    }, null);

    if (nextHideDelay === null) return undefined;

    const timerId = window.setTimeout(() => {
      setReportVisibilityNow(Date.now());
    }, nextHideDelay + 25);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [posts, localUserId, reportVisibilityNow]);

  useEffect(() => () => {
    Object.values(editFeedbackTimersRef.current).forEach(window.clearTimeout);
    if (postSuccessTimerRef.current) {
      window.clearTimeout(postSuccessTimerRef.current);
    }
  }, []);

  const clearPostSuccessTimer = () => {
    if (!postSuccessTimerRef.current) return;

    window.clearTimeout(postSuccessTimerRef.current);
    postSuccessTimerRef.current = null;
  };

  const setTemporaryPostSuccessMessage = (message) => {
    clearPostSuccessTimer();
    setPostSuccessMessage(message);
    postSuccessTimerRef.current = window.setTimeout(() => {
      setPostSuccessMessage('');
      postSuccessTimerRef.current = null;
    }, 2500);
  };

  const clearEditFeedbackTimer = (postId) => {
    if (!editFeedbackTimersRef.current[postId]) return;

    window.clearTimeout(editFeedbackTimersRef.current[postId]);
    delete editFeedbackTimersRef.current[postId];
  };

  const clearEditFeedback = (postId) => {
    clearEditFeedbackTimer(postId);
    setEditFeedbackByPostId((currentFeedback) => {
      if (!currentFeedback[postId]) return currentFeedback;

      const nextFeedback = { ...currentFeedback };
      delete nextFeedback[postId];
      return nextFeedback;
    });
  };

  const setTemporaryEditFeedback = (postId, feedback) => {
    if (!postId) return;

    clearEditFeedbackTimer(postId);
    setEditFeedbackByPostId((currentFeedback) => ({
      ...currentFeedback,
      [postId]: feedback,
    }));

    editFeedbackTimersRef.current[postId] = window.setTimeout(() => {
      clearEditFeedback(postId);
    }, 2500);
  };

  const visiblePosts = posts
    .filter(isCommunityContentVisible)
    .filter((post) => !shouldHidePostReportedByUser(post, localUserId, reportVisibilityNow))
    .map((post) => ({
      ...post,
      comments: Array.isArray(post.comments)
        ? post.comments.filter(isCommunityContentVisible)
        : [],
    }));
  const editingPost = posts.find((post) => post.id === editingPostId);
  const isEditPostUnchanged = editingPost
    ? normalizeEditablePostText(editPostText) === normalizeEditablePostText(editingPost.content ?? editingPost.body ?? '')
    : true;

  const updatePostById = (postId, updater) => {
    if (!postId || typeof updater !== 'function') return;

    setPosts((currentPosts) => currentPosts.map((post) => (
      post.id === postId ? updater(post) : post
    )));
  };

  const handleCreatePost = async () => {
    const content = newPostText.trim();

    if (!content && !postAttachment) {
      clearPostSuccessTimer();
      setPostError('Please write something or add a local attachment before sharing.');
      setPostSuccessMessage('');
      return;
    }

    const isAnonymous = allowAnonymousPosting && postAnonymously;
    const author = isAnonymous ? 'Anonymous User' : localUserName;
    let newPost;

    try {
      newPost = await createCommunityPost({
        authorId: localUserId,
        authorDisplayName: author,
        author,
        content,
        isAnonymous,
      });
    } catch {
      clearPostSuccessTimer();
      setPostError('Unable to publish your post right now.');
      setPostSuccessMessage('');
      return;
    }

    setPosts((currentPosts) => [newPost, ...currentPosts]);
    setNewPostText('');
    setPostAttachment(null);
    setPostAnonymously(false);
    setPostError('');
    setTemporaryPostSuccessMessage('Post published successfully.');
    registerCommunityActivity();
  };

  const handleToggleSupport = (postId) => {
    const postToUpdate = posts.find((post) => post.id === postId);
    const shouldIncreaseStreak = postToUpdate ? !postToUpdate.isSupported : false;

    toggleCommunityPostSupport(postId, localUserId, { actorName: localUserName }).catch(() => {});

    updatePostById(postId, (post) => {
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
    });

    if (shouldIncreaseStreak) {
      registerCommunityActivity();
    }
  };

  const handleToggleLike = (postId) => {
    const postToUpdate = posts.find((post) => post.id === postId);
    const shouldIncreaseStreak = postToUpdate ? !postToUpdate.isLiked : false;

    toggleCommunityPostLike(postId, localUserId, { actorName: localUserName }).catch(() => {});

    updatePostById(postId, (post) => {
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
    });

    if (shouldIncreaseStreak) {
      registerCommunityActivity();
    }
  };

  const handleEditPostRequest = (postId) => {
    const postToEdit = posts.find((post) => post.id === postId);

    if (!isPostOwnedByCurrentUser(postToEdit, localUserId, localUserName)) return;

    setEditingPostId(postId);
    setEditPostText(postToEdit.content ?? postToEdit.body ?? '');
    setEditPostError('');
    clearEditFeedback(postId);
  };

  const handleEditPostSubmit = async (event) => {
    event.preventDefault();

    const postToEdit = posts.find((post) => post.id === editingPostId);
    if (!postToEdit) return;

    if (!isPostOwnedByCurrentUser(postToEdit, localUserId, localUserName)) {
      onCancelEditPost();
      return;
    }

    const content = editPostText.trim();

    if (isEditPostUnchanged) return;

    if (!content && !postToEdit.attachment) {
      setEditPostError('Please write something or keep an attachment before saving.');
      return;
    }

    const updatedAt = new Date().toISOString();

    try {
      await updateCommunityPost(editingPostId, { content });
    } catch {
      setTemporaryEditFeedback(editingPostId, {
        type: 'error',
        message: 'Failed to update post.',
      });
      return;
    }

    updatePostById(editingPostId, (post) => ({
      ...post,
      content,
      body: content,
      updatedAt,
    }));
    setTemporaryEditFeedback(editingPostId, {
      type: 'success',
      message: 'Post updated successfully.',
    });
    onCancelEditPost();
  };

  const handleDeletePostRequest = (postId) => {
    const postToDelete = posts.find((post) => post.id === postId);

    if (!isPostOwnedByCurrentUser(postToDelete, localUserId, localUserName)) return;

    setConfirmingDeletePostId(postId);
  };

  const handleConfirmDeletePost = () => {
    const postToDelete = posts.find((post) => post.id === confirmingDeletePostId);

    if (!isPostOwnedByCurrentUser(postToDelete, localUserId, localUserName)) {
      onCancelDeletePost();
      return;
    }

    const updatedAt = new Date().toISOString();

    deleteCommunityPost(confirmingDeletePostId).catch(() => {});

    updatePostById(confirmingDeletePostId, (post) => ({
      ...post,
      status: COMMUNITY_POST_STATUS.deleted,
      updatedAt,
    }));
    onCancelDeletePost();
  };

  return {
    posts,
    updatePostById,
    visiblePosts,
    isRefreshingFeed,
    refreshFeedback,
    editFeedbackByPostId,
    isEditPostUnchanged,
    refreshPulseKey,
    relativeTimeNow,
    refreshCommunityFeed,
    handleCreatePost,
    handleToggleSupport,
    handleToggleLike,
    handleEditPostRequest,
    handleEditPostSubmit,
    handleDeletePostRequest,
    handleConfirmDeletePost,
  };
}
