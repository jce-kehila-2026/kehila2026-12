import { useEffect, useRef, useState } from 'react';
import {
  createCommunityComment,
  deleteCommunityComment,
  getPostComments,
} from '../services/communityService';
import {
  isCommunityContentVisible,
  isCommentOwnedByCurrentUser,
} from '../utils/communityModerationUtils';
import { createParticipantT } from '../../i18n/participantUiTranslations';

export default function useCommunityComments({
  communityDisplayName,
  localUserId,
  posts,
  registerCommunityActivity,
  updatePostById,
  t = createParticipantT('en'),
}) {
  const commentFeedbackTimersRef = useRef({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentFeedbackByPostId, setCommentFeedbackByPostId] = useState({});
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState({});
  const [openCommentPostIds, setOpenCommentPostIds] = useState({});
  const [pendingCommentDeletion, setPendingCommentDeletion] = useState(null);
  const [fetchedCommentPostIds, setFetchedCommentPostIds] = useState({});

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
        message: t('commentRequired'),
      });
      return;
    }
    const targetPost = posts.find((post) => post.id === postId);
    if (!targetPost) return;

    let newComment;

    try {
      newComment = await createCommunityComment(postId, {
        authorId: localUserId,
        author: localUserName,
        authorDisplayName: localUserName,
        content,
        postAuthorId: targetPost.authorId,
        postExcerpt: targetPost.content ?? targetPost.body ?? '',
      });
    } catch {
      setCommentFeedback(postId, {
        type: 'error',
        message: t('commentAddError'),
      });
      return;
    }

    updatePostById(postId, (post) => {
      const currentComments = Array.isArray(post.comments) ? post.comments : [];
      const nextComments = [newComment, ...currentComments];
      const nextCommentsCount = Math.max(
        (post.commentsCount ?? 0) + 1,
        nextComments.filter(isCommunityContentVisible).length,
      );

      return {
        ...post,
        comments: nextComments,
        commentsCount: nextCommentsCount,
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
      message: t('commentAdded'),
    }, { autoHide: 2500 });
    registerCommunityActivity();
  };

  const handleToggleCommentsExpanded = (postId) => {
    const isOpening = !expandedCommentPostIds[postId];

    setExpandedCommentPostIds((currentPostIds) => ({
      ...currentPostIds,
      [postId]: !currentPostIds[postId],
    }));

    if (isOpening && !fetchedCommentPostIds[postId]) {
      setFetchedCommentPostIds((prev) => ({ ...prev, [postId]: true }));

      getPostComments(postId).then((fetchedComments) => {
        updatePostById(postId, (post) => {
          const enriched = fetchedComments.map((c) => ({
            ...c,
            isLocalCurrentUser: c.authorId === localUserId,
          }));
          const fetchedIds = new Set(enriched.map((c) => c.id));
          const localOnly = Array.isArray(post.comments)
            ? post.comments.filter((c) => !fetchedIds.has(c.id))
            : [];
          const allComments = [...enriched, ...localOnly];

          return {
            ...post,
            comments: allComments,
            commentsCount: Math.max(post.commentsCount ?? 0, allComments.length),
          };
        });
      }).catch(() => {});
    }
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

    deleteCommunityComment(postId, commentId).catch(() => {});

    updatePostById(postId, (post) => {
      const currentComments = Array.isArray(post.comments) ? post.comments : [];
      const nextComments = currentComments.filter((comment) => comment.id !== commentId);
      const nextCommentsCount = Math.max(
        (post.commentsCount ?? 0) - 1,
        nextComments.filter(isCommunityContentVisible).length,
        0,
      );

      return {
        ...post,
        comments: nextComments,
        commentsCount: nextCommentsCount,
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
