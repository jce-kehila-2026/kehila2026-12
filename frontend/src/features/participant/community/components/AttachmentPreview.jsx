import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function AttachmentPreview({
  attachment,
  onRemoveAttachment,
}) {
  const { t } = useParticipantLocale();
  if (!attachment) return null;

  return (
    <div className="create-post-card__attachment-preview">
      {attachment.type === 'image' && (
        <img src={attachment.url} alt={attachment.name || t('attachmentPreviewAlt')} />
      )}
      {attachment.type === 'voice' && (
        <audio controls src={attachment.url} aria-label={t('voiceNotePreviewAria')} />
      )}
      <button type="button" onClick={onRemoveAttachment}>{t('remove')}</button>
    </div>
  );
}
