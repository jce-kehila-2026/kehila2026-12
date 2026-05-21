import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import GifBoxOutlinedIcon from '@mui/icons-material/GifBoxOutlined';
import KeyboardVoiceOutlinedIcon from '@mui/icons-material/KeyboardVoiceOutlined';

const composerActions = [
  { label: 'Photo', icon: AddPhotoAlternateOutlinedIcon },
  { label: 'GIF', icon: GifBoxOutlinedIcon },
  { label: 'Voice', icon: KeyboardVoiceOutlinedIcon },
  { label: 'Emoji', icon: EmojiEmotionsOutlinedIcon },
];

export default function CreatePostCard({
  allowAnonymousPosting = true,
  error = '',
  isAnonymous,
  onAnonymousChange,
  onPostTextChange,
  onSubmit,
  postInputRef,
  postText,
  successMessage = '',
}) {
  const feedbackId = error ? 'create-post-error' : successMessage ? 'create-post-success' : undefined;

  return (
    <section className="create-post-card" aria-label="Create a community post">
      <div className="create-post-card__body">
        <span className="create-post-card__avatar">ME</span>
        <div className="create-post-card__input-area">
          <textarea
            aria-label="Write a community post"
            aria-describedby={feedbackId}
            aria-invalid={Boolean(error)}
            onChange={(event) => onPostTextChange(event.target.value)}
            placeholder="What’s on your mind today?"
            ref={postInputRef}
            rows="2"
            value={postText}
          />
        </div>
      </div>
      {error && (
        <p className="create-post-card__error" id="create-post-error" role="alert">
          {error}
        </p>
      )}
      {successMessage && !error && (
        <p className="create-post-card__success" id="create-post-success" aria-live="polite">
          {successMessage}
        </p>
      )}
      <div className="create-post-card__toolbar" aria-label="Post options">
        <div className="create-post-card__actions" aria-label="Attachment options">
          {composerActions.map(({ label, icon: Icon }) => (
            <button
              aria-label={`Add ${label}`}
              className="create-post-card__action"
              key={label}
              type="button"
            >
              <Icon fontSize="small" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {allowAnonymousPosting && (
          <label className="create-post-card__anonymous">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => onAnonymousChange(event.target.checked)}
            />
            <span>Anonymous</span>
          </label>
        )}
      </div>
      {allowAnonymousPosting && isAnonymous && (
        <p className="create-post-card__helper">
          Your post will appear as Anonymous Participant to other members.
        </p>
      )}
      <div className="create-post-card__footer">
        <button type="button" onClick={onSubmit}>Share Post</button>
      </div>
    </section>
  );
}
