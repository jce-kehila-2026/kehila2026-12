import { useState } from 'react';

export default function CreatePostCard() {
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
