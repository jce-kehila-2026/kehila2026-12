import { EMOJI_GROUPS } from '../utils/postComposerUtils';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function EmojiPicker({
  emojiPickerRef,
  onClose,
  onEmojiSelect,
}) {
  const { t } = useParticipantLocale();
  return (
    <div
      className="create-post-card__emoji-popover"
      ref={emojiPickerRef}
      role="dialog"
      aria-label={t('chooseEmoji')}
    >
      <div className="create-post-card__emoji-header">
        <strong>{t('chooseEmoji')}</strong>
        <button type="button" aria-label={t('closeEmojiPicker')} onClick={onClose}>
          ×
        </button>
      </div>
      <div className="create-post-card__emoji-groups">
        {EMOJI_GROUPS.map((group) => (
          <section className="create-post-card__emoji-group" key={group.id}>
            <h3>{t(group.labelKey)}</h3>
            <div className="create-post-card__emoji-grid">
              {group.emojis.map((emoji) => (
                <button
                  aria-label={t('insertEmoji').replace('{emoji}', emoji)}
                  type="button"
                  key={`${group.id}-${emoji}`}
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
