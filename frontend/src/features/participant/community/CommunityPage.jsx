import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
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
  isAuthorFollowed,
  isPostOwnedByCurrentUser,
  isPostReportedByUser,
} from './utils/communityModerationUtils';
import BirthdayCard from './components/BirthdayCard';
import CommunityAccessPanel from './components/CommunityAccessPanel';
import CommunityBirthdayPreferenceCard from './components/CommunityBirthdayPreferenceCard';
import CommunityGuidelinesModal from './components/CommunityGuidelinesModal';
import CommunityPostCard from './components/CommunityPostCard';
import CommunityStreakCard from './components/CommunityStreakCard';
import CreatePostCard from './components/CreatePostCard';
import DeletePostModal from './components/DeletePostModal';
import EditPostModal from './components/EditPostModal';
import FeedTabs from './components/FeedTabs';
import ReportPostModal from './components/ReportPostModal';
import useCommunityComments from './hooks/useCommunityComments';
import useCommunityFollows from './hooks/useCommunityFollows';
import useCommunityGuidelines from './hooks/useCommunityGuidelines';
import useCommunityPosts from './hooks/useCommunityPosts';
import useCommunityProfile from './hooks/useCommunityProfile';
import useCommunityReports from './hooks/useCommunityReports';
import useCommunityStreak from './hooks/useCommunityStreak';
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
  const [newPostText, setNewPostText] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [postAttachment, setPostAttachment] = useState(null);
  const [postError, setPostError] = useState('');
  const [postSuccessMessage, setPostSuccessMessage] = useState('');
  const [activeFeedTab, setActiveFeedTab] = useState('all');
  const [confirmingDeletePostId, setConfirmingDeletePostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostText, setEditPostText] = useState('');
  const [editPostError, setEditPostError] = useState('');
  const {
    showGuidelinesModal,
    showFullGuidelinesModal,
    handleGuidelinesContinue,
    handleReadFullGuidelines,
    handleCloseFullGuidelines,
  } = useCommunityGuidelines();

  useEffect(() => {
    if (!confirmingDeletePostId) return;

    window.setTimeout(() => {
      deletePostModalRef.current?.focus();
    }, 0);
  }, [confirmingDeletePostId]);

  useEffect(() => {
    if (!editingPostId) return;

    window.setTimeout(() => {
      editPostModalRef.current?.focus();
    }, 0);
  }, [editingPostId]);

  const handlePostTextChange = (value) => {
    setNewPostText(value);
    if (postError) setPostError('');
    if (postSuccessMessage) setPostSuccessMessage('');
  };

  const {
    communityDisplayName,
    hasRequiredPersonalDetails,
    hasCommunityAccessDetails,
    hasCompletedCommunitySetup,
    canUseCommunity,
    allowAnonymousPosting,
    localUserId,
    visibleBirthdayUsers,
    profileSuccessMessage,
    handleBirthdayPreferenceSave,
  } = useCommunityProfile({ personalDetails });
  const handleCancelEditPost = () => {
    setEditingPostId(null);
    setEditPostText('');
    setEditPostError('');
  };
  const handleCancelDeletePost = () => {
    setConfirmingDeletePostId(null);
  };
  const {
    communityStreakCount,
    lastActivityDate,
    isCommunityStreakAtRisk,
    registerCommunityActivity,
  } = useCommunityStreak();
  const {
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
  } = useCommunityPosts({
    allowAnonymousPosting,
    communityDisplayName,
    confirmingDeletePostId,
    editPostText,
    editingPostId,
    localUserId,
    newPostText,
    postAnonymously,
    postAttachment,
    registerCommunityActivity,
    setNewPostText,
    setPostAnonymously,
    setPostAttachment,
    setPostError,
    setPostSuccessMessage,
    onCancelDeletePost: handleCancelDeletePost,
    onCancelEditPost: handleCancelEditPost,
    setConfirmingDeletePostId,
    setEditPostError,
    setEditPostText,
    setEditingPostId,
  });
  const {
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
  } = useCommunityComments({
    communityDisplayName,
    localUserId,
    posts,
    registerCommunityActivity,
    updatePostById,
  });
  const {
    reportFeedbackByPostId,
    confirmingReportPostId,
    selectedReportReason,
    reportReasonError,
    handleReportPostRequest,
    handleCancelReportPost,
    handleReportReasonChange,
    handleReportSubmit,
  } = useCommunityReports({
    communityDisplayName,
    localUserId,
    posts,
    updatePostById,
  });
  const {
    followedAuthors,
    handleToggleFollowAuthor,
  } = useCommunityFollows({
    communityDisplayName,
    localUserId,
  });
  useEffect(() => {
    if (!confirmingReportPostId) return;

    window.setTimeout(() => {
      reportModalRef.current?.focus();
    }, 0);
  }, [confirmingReportPostId]);

  useEffect(() => {
    if (!pendingCommentDeletion) return;

    window.setTimeout(() => {
      deleteCommentModalRef.current?.focus();
    }, 0);
  }, [pendingCommentDeletion]);

  const filteredPosts = filterPostsByTab(
    visiblePosts,
    activeFeedTab,
    followedAuthors,
    localUserId,
    communityDisplayName || 'Current User',
  );
  const sortedVisiblePosts = sortFeedPosts(filteredPosts);
  const emptyFeedMessage = getEmptyFeedMessage(activeFeedTab, followedAuthors.length);

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
      feedback={editFeedbackByPostId[editingPostId]}
      isSaveDisabled={isEditPostUnchanged}
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
    <section className="community-page" aria-label="Community">
      {showGuidelinesModal && <CommunityGuidelinesModal onContinue={handleGuidelinesContinue} />}
      {reportModal && typeof document !== 'undefined' ? createPortal(reportModal, document.body) : reportModal}
      {editPostModal && typeof document !== 'undefined' ? createPortal(editPostModal, document.body) : editPostModal}
      {deletePostModal && typeof document !== 'undefined' ? createPortal(deletePostModal, document.body) : deletePostModal}
      {deleteCommentModal && typeof document !== 'undefined' ? createPortal(deleteCommentModal, document.body) : deleteCommentModal}

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
                      postEditFeedback={editFeedbackByPostId[post.id]}
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
            isAtRisk={isCommunityStreakAtRisk}
            lastActivityDate={lastActivityDate}
            streakCount={communityStreakCount}
          />
          <BirthdayCard birthdayUsers={visibleBirthdayUsers} />
        </aside>
      </div>
      <div className="community-guidelines-shortcut">
        <button type="button" onClick={handleReadFullGuidelines}>
          Community Guidelines
        </button>
      </div>
      {showFullGuidelinesModal && (
        <CommunityGuidelinesModal
          mode="read"
          onClose={handleCloseFullGuidelines}
        />
      )}
    </section>
  );
}
