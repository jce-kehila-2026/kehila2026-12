export default function AttachmentPreview({
  attachment,
  onRemoveAttachment,
}) {
  if (!attachment) return null;

  return (
    <div className="create-post-card__attachment-preview">
      {attachment.type === 'image' && (
        <img src={attachment.url} alt={attachment.name || 'Selected attachment preview'} />
      )}
      {attachment.type === 'voice' && (
        <audio controls src={attachment.url} aria-label="Voice note preview" />
      )}
      <button type="button" onClick={onRemoveAttachment}>Remove</button>
    </div>
  );
}
