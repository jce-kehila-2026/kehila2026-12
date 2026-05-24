import { useEffect, useState } from 'react';
import { communityPosts } from '../communityMockData';
import {
  getInitialPosts,
  isCommunityContentVisible,
  serializeCommunityPost,
} from '../communityInteractionHelpers';
import { COMMUNITY_POST_STATUS } from '../communityModels';
import {
  createCommunityPost,
  deleteCommunityPost,
  getCommunityPosts,
  toggleCommunityPostLike,
  toggleCommunityPostSupport,
  updateCommunityPost,
} from '../services/communityService';
import { saveStoredCommunityPosts } from '../services/communityStorageService';
import { isPostOwnedByCurrentUser } from '../utils/communityModerationUtils';

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
  const [posts, setPosts] = useState(() => getInitialPosts(communityPosts));
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState('');
  const [refreshPulseKey, setRefreshPulseKey] = useState(0);
  const [relativeTimeNow, setRelativeTimeNow] = useState(() => new Date());

  const localUserName = communityDisplayName || 'Current User';

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
    saveStoredCommunityPosts(posts.map(serializeCommunityPost));
  }, [posts]);

  const visiblePosts = posts
    .filter(isCommunityContentVisible)
    .map((post) => ({
      ...post,
      comments: Array.isArray(post.comments)
        ? post.comments.filter(isCommunityContentVisible)
        : [],
    }));

  const handleCreatePost = async () => {
    const content = newPostText.trim();

    if (!content && !postAttachment) {
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

    toggleCommunityPostSupport(postId, localUserId).catch(() => {
      // Keep the optimistic local UI update; the local adapter has no remote side effect yet.
    });

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

  const handleEditPostRequest = (postId) => {
    const postToEdit = posts.find((post) => post.id === postId);

    if (!isPostOwnedByCurrentUser(postToEdit, localUserId, localUserName)) return;

    setEditingPostId(postId);
    setEditPostText(postToEdit.content ?? postToEdit.body ?? '');
    setEditPostError('');
  };

  const handleEditPostSubmit = (event) => {
    event.preventDefault();

    const postToEdit = posts.find((post) => post.id === editingPostId);
    if (!postToEdit) return;

    if (!isPostOwnedByCurrentUser(postToEdit, localUserId, localUserName)) {
      onCancelEditPost();
      return;
    }

    const content = editPostText.trim();

    if (!content && !postToEdit.attachment) {
      setEditPostError('Please write something or keep an attachment before saving.');
      return;
    }

    const updatedAt = new Date().toISOString();

    updateCommunityPost(editingPostId, {
      content,
      body: content,
      updatedAt,
    }).catch(() => {
      // Keep the existing local-only edit flow responsive.
    });

    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== editingPostId) return post;

      return {
        ...post,
        content,
        body: content,
        updatedAt,
      };
    }));
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

    deleteCommunityPost(confirmingDeletePostId).catch(() => {
      // Keep the existing local-only delete flow responsive.
    });

    setPosts((currentPosts) => currentPosts.map((post) => {
      if (post.id !== confirmingDeletePostId) return post;

      return {
        ...post,
        status: COMMUNITY_POST_STATUS.deleted,
        updatedAt,
      };
    }));
    onCancelDeletePost();
  };

  return {
    posts,
    setPosts,
    visiblePosts,
    isRefreshingFeed,
    refreshFeedback,
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
