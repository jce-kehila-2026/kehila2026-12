export default function CreatePostCard({
  allowAnonymousPosting = true,
  error = '',
  isAnonymous,
  onAnonymousChange,
  onPostTextChange,
  onSubmit,
  postText,
  successMessage = '',
}) {
  const feedbackId = error ? 'create-post-error' : successMessage ? 'create-post-success' : undefined;

  return (
    <section className="create-post-card" aria-label="Create a community post">
      <div className="create-post-card__body">
        <span className="create-post-card__avatar">ME</span>
        <textarea
          aria-describedby={feedbackId}
          aria-invalid={Boolean(error)}
          onChange={(event) => onPostTextChange(event.target.value)}
          placeholder="What’s on your mind today?"
          rows="3"
          value={postText}
        />
      </div>
      {error && (
        <p className="create-post-card__error" id="create-post-error">
          {error}
        </p>
      )}
      {successMessage && !error && (
        <p className="create-post-card__success" id="create-post-success">
          {successMessage}
        </p>
      )}
      {allowAnonymousPosting && (
        <>
          <label className="create-post-card__anonymous">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => onAnonymousChange(event.target.checked)}
            />
            <span>Post anonymously</span>
          </label>
          {isAnonymous && (
            <p className="create-post-card__helper">
              Your post will appear as Anonymous Participant to other members.
            </p>
          )}
        </>
      )}
      <div className="create-post-card__footer">
        <span>Share a thought with the She-Na community.</span>
        <button type="button" onClick={onSubmit}>Share Post</button>
      </div>
    </section>
  );
}
