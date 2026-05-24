import { EMOJI_GROUPS } from '../utils/postComposerUtils';

export default function EmojiPicker({
  emojiPickerRef,
  onClose,
  onEmojiSelect,
}) {
  return (
    <div
      className="create-post-card__emoji-popover"
      ref={emojiPickerRef}
      role="dialog"
      aria-label="Choose an emoji"
    >
      <div className="create-post-card__emoji-header">
        <strong>Choose an emoji</strong>
        <button type="button" aria-label="Close emoji picker" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="create-post-card__emoji-groups">
        {EMOJI_GROUPS.map((group) => (
          <section className="create-post-card__emoji-group" key={group.label}>
            <h3>{group.label}</h3>
            <div className="create-post-card__emoji-grid">
              {group.emojis.map((emoji) => (
                <button
                  aria-label={`Insert ${emoji} emoji`}
                  type="button"
                  key={`${group.label}-${emoji}`}
                  onClick={() => onEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
