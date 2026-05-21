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
    tone: 'pink',
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
  return (
    <section className="create-post-card" aria-label="Create a community post">
      <div className="create-post-card__body">
        <span className="create-post-card__avatar">ME</span>
        <textarea placeholder="What’s on your mind today?" rows="3" />
      </div>
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
      <h3>{post.title}</h3>
      <p>{post.body}</p>
      <footer>
        <span>
          <FavoriteBorderOutlinedIcon fontSize="small" />
          {post.likes}
        </span>
        <span>
          <ChatBubbleOutlineOutlinedIcon fontSize="small" />
          {post.comments}
        </span>
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
