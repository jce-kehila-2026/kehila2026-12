import { useState } from 'react';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import LocalFloristOutlinedIcon from '@mui/icons-material/LocalFloristOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';

const communityPosts = [
  {
    author: 'Maya',
    initials: 'MA',
    time: 'Today at 9:20',
    topic: 'Support circle',
    title: 'A gentle reminder for this morning',
    body: 'I started the day with five quiet minutes and it helped me feel more present. Sending care to anyone who needs a softer start today.',
    likes: 28,
    comments: 7,
    support: 12,
    tone: 'pink',
  },
  {
    author: 'Anonymous Participant',
    initials: 'AP',
    time: 'Today at 8:10',
    topic: 'Quiet courage',
    title: 'Sharing a small brave step',
    body: 'I was nervous to join a group session, but listening quietly still helped me feel less alone. Taking part can look different for each of us.',
    likes: 22,
    comments: 4,
    support: 18,
    tone: 'lavender',
  },
  {
    author: 'Leah',
    initials: 'LE',
    time: 'Yesterday',
    topic: 'After appointments',
    title: 'What helped me prepare',
    body: 'Writing down three questions before my appointment made the conversation feel calmer. I kept the note simple and brought it with me.',
    likes: 19,
    comments: 5,
    support: 8,
    tone: 'violet',
  },
  {
    author: 'Noa',
    initials: 'NO',
    time: 'Monday',
    topic: 'Daily care',
    title: 'Small wins count',
    body: 'Today my win was asking for help before I felt overwhelmed. It felt vulnerable, but also really grounding.',
    likes: 34,
    comments: 9,
    support: 15,
    tone: 'rose',
  },
];

const supportCircles = [
  { title: 'New Members Circle', meta: '12 members', icon: Diversity3OutlinedIcon },
  { title: 'Mindful Mornings', meta: 'Weekly reflection', icon: SelfImprovementOutlinedIcon },
  { title: 'Care Partners', meta: 'Shared encouragement', icon: VolunteerActivismOutlinedIcon },
];

const communityResources = [
  'Conversation starters for asking for support',
  'Gentle grounding practices from recent workshops',
  'Community notes collected by the She-Na team',
];

function CreatePostCard() {
  const [postAnonymously, setPostAnonymously] = useState(false);

  return (
    <section className="create-post-card" aria-label="Create a community post">
      <div className="create-post-card__body">
        <span className="create-post-card__avatar">ME</span>
        <textarea placeholder="What’s on your mind today?" rows="3" />
      </div>
      <label className="create-post-card__anonymous">
        <input
          type="checkbox"
          checked={postAnonymously}
          onChange={(event) => setPostAnonymously(event.target.checked)}
        />
        <span>Post anonymously</span>
      </label>
      {postAnonymously && (
        <p className="create-post-card__helper">
          Your post will appear as Anonymous Participant to other members.
        </p>
      )}
      <div className="create-post-card__footer">
        <span>Share a thought with the She-Na community.</span>
        <button type="button">Share Post</button>
      </div>
    </section>
  );
}

function CommunityPostCard({ post }) {
  return (
    <article className={`community-page-post community-page-post--${post.tone}`}>
      <header>
        <span className="community-page-post__avatar">{post.initials}</span>
        <div>
          <strong>{post.author}</strong>
          <small>{post.time}</small>
        </div>
        <span className="community-page-post__topic">{post.topic}</span>
      </header>
      <div className="community-page-post__content">
        <h3>{post.title}</h3>
        <p>{post.body}</p>
      </div>
      <footer>
        <button type="button">
          <FavoriteBorderOutlinedIcon fontSize="small" />
          Like
          <span>{post.likes}</span>
        </button>
        <button type="button">
          <ChatBubbleOutlineOutlinedIcon fontSize="small" />
          Comment
          <span>{post.comments}</span>
        </button>
        <button type="button">
          <VolunteerActivismOutlinedIcon fontSize="small" />
          Support
          <span>{post.support}</span>
        </button>
      </footer>
    </article>
  );
}

export default function CommunityPage() {
  return (
    <section className="community-page" aria-labelledby="community-page-title">
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
          <CreatePostCard />

          <section className="community-page-card community-page-card--intro">
            <span className="community-page-card__icon">
              <LocalFloristOutlinedIcon />
            </span>
            <div>
              <h2>Today in the community</h2>
              <p>Stories, reflections, and encouragement from participants walking a similar path.</p>
            </div>
          </section>

          {communityPosts.map((post) => (
            <CommunityPostCard post={post} key={`${post.author}-${post.title}`} />
          ))}
        </main>

        <aside className="community-page__rail" aria-label="Community sidebar">
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
