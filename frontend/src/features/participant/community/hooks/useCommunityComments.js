import { useEffect, useRef, useState } from 'react';
import {
  createCommunityComment,
  deleteCommunityComment,
} from '../services/communityService';
import {
  isCommunityContentVisible,
  isCommentOwnedByCurrentUser,
} from '../utils/communityModerationUtils';

export default function useCommunityComments({
  communityDisplayName,
  localUserId,
  posts,
  registerCommunityActivity,
  updatePostById,
}) {
  const commentFeedbackTimersRef = useRef({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentFeedbackByPostId, setCommentFeedbackByPostId] = useState({});
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState({});
  const [openCommentPostIds, setOpenCommentPostIds] = useState({});
  const [pendingCommentDeletion, setPendingCommentDeletion] = useState(null);

  const localUserName = communityDisplayName || 'Current User';

  useEffect(() => () => {
    Object.values(commentFeedbackTimersRef.current).forEach(window.clearTimeout);
  }, []);

  const clearCommentFeedbackTimer = (postId) => {
    if (!commentFeedbackTimersRef.current[postId]) return;

    window.clearTimeout(commentFeedbackTimersRef.current[postId]);
    delete commentFeedbackTimersRef.current[postId];
  };

  const clearCommentFeedback = (postId) => {
    clearCommentFeedbackTimer(postId);
    setCommentFeedbackByPostId((currentFeedback) => {
      if (!currentFeedback[postId]) return currentFeedback;

      const nextFeedback = { ...currentFeedback };
      delete nextFeedback[postId];
      return nextFeedback;
    });
  };

  const setCommentFeedback = (postId, feedback, options = {}) => {
    clearCommentFeedbackTimer(postId);
    setCommentFeedbackByPostId((currentFeedback) => ({
      ...currentFeedback,
      [postId]: feedback,
    }));

    if (!options.autoHide) return;

    commentFeedbackTimersRef.current[postId] = window.setTimeout(() => {
      clearCommentFeedback(postId);
    }, options.autoHide);
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs((currentInputs) => ({
      ...currentInputs,
      [postId]: value,
    }));
    clearCommentFeedback(postId);
  };

  const handleSubmitComment = async (postId) => {
    const content = (commentInputs[postId] ?? '').trim();

    if (!content) {
      setCommentFeedback(postId, {
        type: 'error',
        message: 'Please write a comment before posting.',
      });
      return;
    }
    if (!posts.some((post) => post.id === postId)) return;

    let newComment;

    try {
      newComment = await createCommunityComment(postId, {
        authorId: localUserId,
        author: localUserName,
        authorDisplayName: localUserName,
        content,
      });
    } catch {
      setCommentFeedback(postId, {
        type: 'error',
        message: 'Unable to add your comment right now.',
      });
      return;
    }

    updatePostById(postId, (post) => {
      const currentComments = Array.isArray(post.comments) ? post.comments : [];
      const nextComments = [newComment, ...currentComments];

      return {
        ...post,
        comments: nextComments,
        commentsCount: nextComments.filter(isCommunityContentVisible).length,
      };
    });

    setCommentInputs((currentInputs) => ({
      ...currentInputs,
      [postId]: '',
    }));
    setOpenCommentPostIds((currentPostIds) => ({
      ...currentPostIds,
      [postId]: false,
    }));
    setCommentFeedback(postId, {
      type: 'success',
      message: 'Comment added.',
    }, { autoHide: 2500 });
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

    if (!isCommentOwnedByCurrentUser(commentToDelete, localUserId, localUserName)) return;

    setPendingCommentDeletion({ postId, commentId });
  };

  const handleCancelDeleteComment = () => {
    setPendingCommentDeletion(null);
  };

  const handleConfirmDeleteComment = () => {
    if (!pendingCommentDeletion) return;

    const { postId, commentId } = pendingCommentDeletion;
    const postToUpdate = posts.find((post) => post.id === postId);
    const commentToDelete = Array.isArray(postToUpdate?.comments)
      ? postToUpdate.comments.find((comment) => comment.id === commentId)
      : null;

    if (!isCommentOwnedByCurrentUser(commentToDelete, localUserId, localUserName)) {
      handleCancelDeleteComment();
      return;
    }

    deleteCommunityComment(postId, commentId).catch(() => {
      // Keep the existing local-only delete flow responsive.
    });

    updatePostById(postId, (post) => {
      const currentComments = Array.isArray(post.comments) ? post.comments : [];
      const nextComments = currentComments.filter((comment) => comment.id !== commentId);

      return {
        ...post,
        comments: nextComments,
        commentsCount: nextComments.filter(isCommunityContentVisible).length,
      };
    });
    handleCancelDeleteComment();
  };

  return {
    commentInputs,
    commentFeedbackByPostId,
    expandedCommentPostIds,
    openCommentPostIds,
    pendingCommentDeletion,
    handleCommentInputChange,
    handleSubmitComment,
    handleToggleCommentsExpanded,
    handleOpenCommentComposer,
    handleDeleteCommentRequest,
    handleCancelDeleteComment,
    handleConfirmDeleteComment,
  };
}
