import { useState } from 'react';
import { COMMUNITY_POST_STATUS } from '../communityModels';
import { reportCommunityPost } from '../services/communityService';
import {
  getPostAuthorId,
  isPostOwnedByCurrentUser,
  isPostReportedByUser,
} from '../utils/communityModerationUtils';

export default function useCommunityReports({
  communityDisplayName,
  localUserId,
  posts,
  updatePostById,
}) {
  const [reportFeedbackByPostId, setReportFeedbackByPostId] = useState({});
  const [confirmingReportPostId, setConfirmingReportPostId] = useState(null);
  const [selectedReportReason, setSelectedReportReason] = useState('');
  const [reportReasonError, setReportReasonError] = useState('');

  const localUserName = communityDisplayName || 'Current User';

  const handleReportPostRequest = (postId) => {
    const postToReport = posts.find((post) => post.id === postId);

    if (isPostOwnedByCurrentUser(postToReport, localUserId, localUserName)) {
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

    if (isPostOwnedByCurrentUser(postToReport, localUserId, localUserName)) {
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
    const createdAtIso = createdAt.toISOString();
    const reportRecord = {
      id: `community-report-${postId}-${localUserId}-${createdAt.getTime()}`,
      postId,
      reporterUserId: localUserId,
      postOwnerId: getPostAuthorId(postToReport) || postToReport.authorDisplayName || postToReport.author || null,
      reason,
      createdAt: createdAtIso,
      reportedAt: createdAtIso,
    };

    try {
      await reportCommunityPost(postId, reportRecord);
    } catch {
      // Keep the local placeholder flow responsive; Firebase reporting will handle failures later.
    }

    updatePostById(postId, (post) => {
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
    });
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

  return {
    reportFeedbackByPostId,
    confirmingReportPostId,
    selectedReportReason,
    reportReasonError,
    handleReportPostRequest,
    handleCancelReportPost,
    handleReportReasonChange,
    handleReportSubmit,
  };
}
