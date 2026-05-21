import { useState } from 'react';
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
  commentsCount: post.commentsCount ?? (
    Array.isArray(post.comments) ? post.comments.length : post.comments ?? post.previewComments?.length ?? 0
  ),
}));

export default function CommunityPage() {
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(
    () => getAcceptedGuidelinesVersion() !== COMMUNITY_GUIDELINES_VERSION,
  );
  const [posts, setPosts] = useState(() => normalizeCommunityPosts(communityPosts));
  const [newPostText, setNewPostText] = useState('');
  const [postAnonymously, setPostAnonymously] = useState(false);
  const [postError, setPostError] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

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
  };

  const handleToggleLike = (postId) => {
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
        commentsCount: (post.commentsCount ?? currentComments.length) + 1,
      };
    }));

    setCommentInputs((currentInputs) => ({
      ...currentInputs,
      [postId]: '',
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

          {posts.map((post) => (
            <CommunityPostCard
              commentText={commentInputs[post.id] ?? ''}
              onCommentTextChange={(value) => handleCommentInputChange(post.id, value)}
              onSubmitComment={() => handleSubmitComment(post.id)}
              onToggleLike={handleToggleLike}
              post={post}
              key={post.id}
            />
          ))}
        </main>

        <aside className="community-page__rail" aria-label="Community sidebar">
          <BirthdayCard />
          <CommunityStreakCard />
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
