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

const normalizeCommunityPosts = (posts) => posts.map((post, index) => ({
  ...post,
  id: post.id ?? `demo-post-${index + 1}`,
  likesCount: post.likesCount ?? post.likes ?? 0,
  isLiked: post.isLiked ?? false,
  comments: Array.isArray(post.comments) ? post.comments : post.previewComments ?? [],
}));

const INITIAL_COMMUNITY_STREAK_COUNT = 0;
const INITIAL_LAST_ACTIVITY_DATE = null;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COMMUNITY_POSTS_STORAGE_KEY = 'community.posts';
const COMMUNITY_STREAK_STORAGE_KEY = 'community.streak';

const canUseLocalStorage = () => (
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
);

const safeReadJson = (storageKey) => {
  if (!canUseLocalStorage()) return null;

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
};

const safeWriteJson = (storageKey, value) => {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Storage can fail in private mode or when quota is exceeded; keep local state working.
  }
};

const getTodayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getDateKeyTimestamp = (dateKey) => {
  if (typeof dateKey !== 'string') return null;

  const dateParts = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateParts) return null;

  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]);
  const day = Number(dateParts[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year
    || parsedDate.getMonth() !== month - 1
    || parsedDate.getDate() !== day
  ) {
    return null;
  }

  return Date.UTC(year, month - 1, day);
};

const getDayDifference = (previousDateKey, currentDateKey = getTodayKey()) => {
  const previousTimestamp = getDateKeyTimestamp(previousDateKey);
  const currentTimestamp = getDateKeyTimestamp(currentDateKey);

  if (previousTimestamp === null || currentTimestamp === null) return null;

  return Math.round((currentTimestamp - previousTimestamp) / MS_PER_DAY);
};

const isStreakAtRiskForDate = (lastActivityDate, todayKey = getTodayKey()) => (
  getDayDifference(lastActivityDate, todayKey) === 2
);

const normalizeComment = (comment, index) => {
  const content = typeof comment?.content === 'string'
    ? comment.content
    : comment?.text ?? '';
  const createdAt = comment?.createdAt ?? null;

  return {
    id: comment?.id ?? `stored-comment-${index + 1}`,
    author: comment?.author ?? 'Current User',
    content,
    createdAt,
    initials: comment?.initials ?? 'CU',
    time: comment?.time ?? 'Just now',
    text: comment?.text ?? content,
  };
};

const normalizeStoredPost = (post, index) => {
  const content = typeof post?.content === 'string' ? post.content : post?.body ?? '';
  const comments = Array.isArray(post?.comments)
    ? post.comments.map(normalizeComment)
    : [];
  const likesCount = Number.isFinite(post?.likesCount)
    ? post.likesCount
    : Number.isFinite(post?.likes)
      ? post.likes
      : 0;

  return {
    ...post,
    id: post?.id ?? `stored-post-${index + 1}`,
    author: post?.author ?? 'Current User',
    content,
    createdAt: post?.createdAt ?? null,
    likesCount,
    isLiked: Boolean(post?.isLiked),
    isAnonymous: Boolean(post?.isAnonymous),
    comments,
    initials: post?.initials ?? (post?.isAnonymous ? 'AU' : 'CU'),
    time: post?.time ?? 'Just now',
    topic: post?.topic ?? 'Community share',
    title: post?.title ?? 'New community post',
    body: post?.body ?? content,
    likes: likesCount,
    support: post?.support ?? 0,
    tone: post?.tone ?? 'pink',
    previewComments: Array.isArray(post?.previewComments) ? post.previewComments : [],
  };
};

const serializeCommunityPost = (post) => ({
  id: post.id,
  author: post.author,
  content: post.content ?? post.body ?? '',
  createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt ?? null,
  likesCount: post.likesCount ?? post.likes ?? 0,
  isLiked: Boolean(post.isLiked),
  isAnonymous: Boolean(post.isAnonymous),
  comments: Array.isArray(post.comments) ? post.comments.map((comment) => ({
    id: comment.id,
    author: comment.author,
    content: comment.content ?? comment.text ?? '',
    createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt ?? null,
    initials: comment.initials,
    time: comment.time,
    text: comment.text ?? comment.content ?? '',
  })) : [],
  initials: post.initials,
  time: post.time,
  topic: post.topic,
  title: post.title,
  body: post.body ?? post.content ?? '',
  likes: post.likesCount ?? post.likes ?? 0,
  support: post.support ?? 0,
  tone: post.tone,
  previewComments: Array.isArray(post.previewComments) ? post.previewComments : [],
});

const getInitialPosts = () => {
  const storedPosts = safeReadJson(COMMUNITY_POSTS_STORAGE_KEY);

  if (Array.isArray(storedPosts)) {
    return storedPosts.map(normalizeStoredPost);
  }

  return normalizeCommunityPosts(communityPosts);
};

const getInitialStreakState = () => {
  const storedStreak = safeReadJson(COMMUNITY_STREAK_STORAGE_KEY);
  const storedStreakCount = Number(storedStreak?.streakCount);
  const storedLastActivityDate = storedStreak?.lastActivityDate;

  return {
    streakCount: Number.isFinite(storedStreakCount) && storedStreakCount >= 0
      ? storedStreakCount
      : INITIAL_COMMUNITY_STREAK_COUNT,
    lastActivityDate: getDateKeyTimestamp(storedLastActivityDate) === null
      ? INITIAL_LAST_ACTIVITY_DATE
      : storedLastActivityDate,
  };
};

export default function CommunityPage() {
  const [initialStreakState] = useState(getInitialStreakState);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(
    () => getAcceptedGuidelinesVersion() !== COMMUNITY_GUIDELINES_VERSION,
  );
  const [posts, setPosts] = useState(getInitialPosts);
  const [newPostText, setNewPostText] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [postError, setPostError] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState({});
  const [communityStreakCount, setCommunityStreakCount] = useState(initialStreakState.streakCount);
  const [lastActivityDate, setLastActivityDate] = useState(initialStreakState.lastActivityDate);
  const [isCommunityStreakAtRisk, setIsCommunityStreakAtRisk] = useState(
    () => isStreakAtRiskForDate(initialStreakState.lastActivityDate),
  );

  useEffect(() => {
    safeWriteJson(COMMUNITY_POSTS_STORAGE_KEY, posts.map(serializeCommunityPost));
  }, [posts]);

  useEffect(() => {
    safeWriteJson(COMMUNITY_STREAK_STORAGE_KEY, {
      streakCount: communityStreakCount,
      lastActivityDate,
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
  };

  const handleCreatePost = () => {
    const content = newPostText.trim();

    if (!content) {
      setPostError('Please write something before sharing.');
      return;
    }

    const createdAt = new Date();
    const isAnonymous = postAnonymously;
    const author = isAnonymous ? 'Anonymous User' : 'Current User';
    const newPost = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `community-post-${createdAt.getTime()}`,
      author,
      content,
      createdAt,
      likesCount: 0,
      isLiked: false,
      isAnonymous,
      comments: [],
      commentsCount: 0,
      initials: isAnonymous ? 'AU' : 'CU',
      time: 'Just now',
      topic: 'Community share',
      title: 'New community post',
      body: content,
      likes: 0,
      support: 0,
      tone: 'pink',
      previewComments: [],
    };

    setPosts((currentPosts) => [newPost, ...currentPosts]);
    setNewPostText('');
    setPostAnonymously(false);
    setPostError('');
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
  };

  const handleSubmitComment = (postId) => {
    const content = (commentInputs[postId] ?? '').trim();

    if (!content) return;
    if (!posts.some((post) => post.id === postId)) return;

    const createdAt = new Date();
    const newComment = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `community-comment-${createdAt.getTime()}`,
      author: 'Current User',
      content,
      createdAt,
      initials: 'CU',
      time: 'Just now',
      text: content,
    };

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
