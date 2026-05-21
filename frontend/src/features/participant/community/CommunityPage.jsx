import { useEffect, useState } from 'react';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import LocalFloristOutlinedIcon from '@mui/icons-material/LocalFloristOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import {
  communityPosts,
  communityResources,
  supportCircles,
} from './communityMockData';
import {
  COMMUNITY_POSTS_STORAGE_KEY,
  COMMUNITY_STREAK_STORAGE_KEY,
  createCommentModel,
  createPostModel,
  getDayDifference,
  getInitialPosts,
  getInitialStreakState,
  getTodayKey,
  isStreakAtRiskForDate,
  safeSaveToStorage,
  serializeCommunityPost,
} from './communityInteractionHelpers';
import {
  COMMUNITY_GUIDELINES_VERSION,
  getAcceptedGuidelinesVersion,
  saveAcceptedGuidelinesVersion,
} from './communityGuidelinesStorage';
import BirthdayCard from './components/BirthdayCard';
import CommunityGuidelinesCard from './components/CommunityGuidelinesCard';
import CommunityGuidelinesModal from './components/CommunityGuidelinesModal';
import CommunityPostCard from './components/CommunityPostCard';
import CommunityStreakCard from './components/CommunityStreakCard';
import CreatePostCard from './components/CreatePostCard';

export default function CommunityPage() {
  const [initialStreakState] = useState(getInitialStreakState);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(
    () => getAcceptedGuidelinesVersion() !== COMMUNITY_GUIDELINES_VERSION,
  );
  const [posts, setPosts] = useState(() => getInitialPosts(communityPosts));
  const [newPostText, setNewPostText] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccessMessage, setPostSuccessMessage] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [commentFeedbackByPostId, setCommentFeedbackByPostId] = useState({});
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState({});
  const [communityStreakCount, setCommunityStreakCount] = useState(initialStreakState.streakCount);
  const [lastActivityDate, setLastActivityDate] = useState(initialStreakState.lastActivityDate);
  const [isCommunityStreakAtRisk, setIsCommunityStreakAtRisk] = useState(
    () => isStreakAtRiskForDate(initialStreakState.lastActivityDate),
  );

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

  const handleCreatePost = () => {
    const content = newPostText.trim();

    if (!content) {
      setPostError('Please write something before sharing.');
      setPostSuccessMessage('');
      return;
    }

    const isAnonymous = postAnonymously;
    const author = isAnonymous ? 'Anonymous User' : 'Current User';
    const newPost = createPostModel({
      author,
      content,
      isAnonymous,
    });

    setPosts((currentPosts) => [newPost, ...currentPosts]);
    setNewPostText('');
    setPostAnonymously(false);
    setPostError('');
    setPostSuccessMessage('Post published successfully.');
    registerCommunityActivity();
  };

  const handleToggleLike = (postId) => {
    const postToUpdate = posts.find((post) => post.id === postId);
    const shouldIncreaseStreak = postToUpdate ? !postToUpdate.isLiked : false;

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

  const handleSubmitComment = (postId) => {
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

    const newComment = createCommentModel(content);

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
        <div>
          <span>Participant community</span>
          <h1 id="community-page-title">Community</h1>
          <p>Connect, share, and support each other in a safe space.</p>
        </div>
        <span className="community-page__header-icon" aria-hidden="true">
          <Diversity3OutlinedIcon />
        </span>
      </header>

      <div className="community-page__layout">
        <main className="community-page__feed" aria-label="Community feed">
          <CreatePostCard
            isAnonymous={postAnonymously}
            error={postError}
            onAnonymousChange={setPostAnonymously}
            onPostTextChange={handlePostTextChange}
            onSubmit={handleCreatePost}
            postText={newPostText}
            successMessage={postSuccessMessage}
          />

          <section className="community-page-card community-page-card--intro">
            <span className="community-page-card__icon">
              <LocalFloristOutlinedIcon />
            </span>
            <div>
              <h2>Today in the community</h2>
              <p>Stories, reflections, and encouragement from participants walking a similar path.</p>
            </div>
          </section>

          {posts.length === 0 ? (
            <section className="community-empty-state" aria-label="Empty community feed">
              <h2>No posts yet</h2>
              <p>Be the first to share something with the community.</p>
            </section>
          ) : (
            posts.map((post) => (
              <CommunityPostCard
                commentText={commentInputs[post.id] ?? ''}
                commentFeedback={commentFeedbackByPostId[post.id]}
                isCommentsExpanded={Boolean(expandedCommentPostIds[post.id])}
                onCommentTextChange={(value) => handleCommentInputChange(post.id, value)}
                onSubmitComment={() => handleSubmitComment(post.id)}
                onToggleCommentsExpanded={() => handleToggleCommentsExpanded(post.id)}
                onToggleLike={handleToggleLike}
                post={post}
                key={post.id}
              />
            ))
          )}
        </main>

        <aside className="community-page__rail" aria-label="Community sidebar">
          <BirthdayCard />
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
