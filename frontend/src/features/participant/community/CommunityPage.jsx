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

export default function CommunityPage() {
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(
    () => getAcceptedGuidelinesVersion() !== COMMUNITY_GUIDELINES_VERSION,
  );
  const [posts, setPosts] = useState(communityPosts);
  const [newPostText, setNewPostText] = useState('');
  const [postError, setPostError] = useState('');

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
    const newPost = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `community-post-${createdAt.getTime()}`,
      author: 'Current User',
      content,
      createdAt,
      likesCount: 0,
      isLiked: false,
      comments: [],
      initials: 'CU',
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
    setPostError('');
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
            error={postError}
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
            <CommunityPostCard post={post} key={post.id || `${post.author}-${post.title}`} />
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
