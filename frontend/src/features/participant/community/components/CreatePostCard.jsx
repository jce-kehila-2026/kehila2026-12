import { useEffect, useRef, useState } from 'react';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import KeyboardVoiceOutlinedIcon from '@mui/icons-material/KeyboardVoiceOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { MAX_LOCAL_MEDIA_BYTES } from '../utils/postComposerUtils';
import AttachmentPreview from './AttachmentPreview';
import EmojiPicker from './EmojiPicker';
import VoiceRecorderControls from './VoiceRecorderControls';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

// `label` stays the stable logic key (drives picker open/close); `labelKey`
// is only for the displayed/aria text.
const composerActions = [
  { label: 'Photo', labelKey: 'actionPhoto', icon: AddPhotoAlternateOutlinedIcon },
  { label: 'Voice', labelKey: 'actionVoice', icon: KeyboardVoiceOutlinedIcon },
  { label: 'Emoji', labelKey: 'actionEmoji', icon: EmojiEmotionsOutlinedIcon },
];

export default function CreatePostCard({
  attachment = null,
  allowAnonymousPosting = true,
  error = '',
  isAnonymous,
  onAnonymousChange,
  onAttachmentChange,
  onPostTextChange,
  onSubmit,
  postInputRef,
  postText,
  successMessage = '',
}) {
  const { t } = useParticipantLocale();
  const [openPicker, setOpenPicker] = useState(null);
  const [localFeedback, setLocalFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStream, setRecordingStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const textareaRef = useRef(null);
  const feedbackId = error ? 'create-post-error' : successMessage ? 'create-post-success' : undefined;
  const setTextareaRef = (element) => {
    textareaRef.current = element;
    if (postInputRef) {
      postInputRef.current = element;
    }
  };

  const closePickers = () => setOpenPicker(null);

  useEffect(() => {
    if (openPicker !== 'Emoji') return undefined;

    const handlePointerDown = (event) => {
      if (
        emojiPickerRef.current?.contains(event.target)
        || emojiButtonRef.current?.contains(event.target)
      ) {
        return;
      }

      setOpenPicker(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [openPicker]);

  const handlePhotoClick = () => {
    closePickers();
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLocalFeedback(t('chooseImageFile'));
      return;
    }

    if (file.size > MAX_LOCAL_MEDIA_BYTES) {
      setLocalFeedback(t('imageTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onAttachmentChange?.({
        type: 'image',
        url: reader.result,
        name: file.name,
      });
      setLocalFeedback('');
    };
    reader.onerror = () => setLocalFeedback(t('unablePreviewImage'));
    reader.readAsDataURL(file);
  };

  const handleEmojiSelect = (emoji) => {
    const input = textareaRef.current;
    const selectionStart = input?.selectionStart ?? postText.length;
    const selectionEnd = input?.selectionEnd ?? postText.length;
    const nextText = `${postText.slice(0, selectionStart)}${emoji}${postText.slice(selectionEnd)}`;

    onPostTextChange(nextText);
    closePickers();

    window.requestAnimationFrame(() => {
      input?.focus();
      const nextCursorPosition = selectionStart + emoji.length;
      input?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const stopRecordingStream = (stream = recordingStream) => {
    stream?.getTracks?.().forEach((track) => track.stop());
    setRecordingStream(null);
  };

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setLocalFeedback(t('voiceUnavailable'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      recordedChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      setRecordingStream(stream);

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        if (audioBlob.size > MAX_LOCAL_MEDIA_BYTES) {
          setLocalFeedback(t('voiceTooLarge'));
          onAttachmentChange?.(null);
          stopRecordingStream(stream);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          onAttachmentChange?.({
            type: 'voice',
            url: reader.result,
            mimeType: audioBlob.type,
            label: 'Voice note',
          });
          setLocalFeedback('');
          stopRecordingStream(stream);
        };
        reader.onerror = () => {
          setLocalFeedback(t('unableSaveVoice'));
          stopRecordingStream(stream);
        };
        reader.readAsDataURL(audioBlob);
      });

      mediaRecorder.start();
      setIsRecording(true);
      setLocalFeedback(t('recordingVoice'));
    } catch {
      setLocalFeedback(t('micPermissionDenied'));
      stopRecordingStream();
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleRemoveAttachment = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
    stopRecordingStream();
    onAttachmentChange?.(null);
    setLocalFeedback('');
  };

  const handleComposerAction = (label) => {
    if (label === 'Photo') {
      handlePhotoClick();
      return;
    }

    setLocalFeedback('');
    setOpenPicker((currentPicker) => (currentPicker === label ? null : label));
  };

  return (
    <section className="create-post-card" aria-label={t('createPostAria')}>
      <input
        accept="image/*"
        className="create-post-card__file-input"
        onChange={handlePhotoSelect}
        ref={fileInputRef}
        type="file"
      />
      <div className="create-post-card__body">
        <span className="create-post-card__avatar">ME</span>
        <div className="create-post-card__input-area">
          <textarea
            aria-label={t('writePostAria')}
            aria-describedby={feedbackId}
            aria-invalid={Boolean(error)}
            onChange={(event) => onPostTextChange(event.target.value)}
            placeholder={t('postPlaceholder')}
            ref={setTextareaRef}
            rows="2"
            value={postText}
          />
        </div>
      </div>
      <AttachmentPreview
        attachment={attachment}
        onRemoveAttachment={handleRemoveAttachment}
      />
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
      <div className="create-post-card__toolbar" aria-label={t('postOptionsAria')}>
        <div className="create-post-card__actions" aria-label={t('attachmentOptionsAria')}>
          {composerActions.map(({ label, labelKey, icon: Icon }) => {
            const displayLabel = t(labelKey);
            return (
              <button
                aria-label={t('addAction').replace('{label}', displayLabel)}
                aria-expanded={openPicker === label}
                className={`create-post-card__action${openPicker === label ? ' is-active' : ''}`}
                key={label}
                onClick={() => handleComposerAction(label)}
                ref={label === 'Emoji' ? emojiButtonRef : undefined}
                type="button"
              >
                <Icon fontSize="small" />
                <span>{displayLabel}</span>
              </button>
            );
          })}
        </div>

        {allowAnonymousPosting && (
          <label className={`create-post-card__anonymous${isAnonymous ? ' is-active' : ''}`}>
            <input
              aria-label={t('postAnonymously')}
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => onAnonymousChange(event.target.checked)}
            />
            <span className="create-post-card__anonymous-icon" aria-hidden="true">
              <LockOutlinedIcon fontSize="small" />
            </span>
            <span className="create-post-card__anonymous-copy">
              <strong>{t('postAnonymously')}</strong>
              <small>{t('anonymousHint')}</small>
            </span>
            <span className="create-post-card__anonymous-switch" aria-hidden="true" />
          </label>
        )}
        <button className="create-post-card__submit" type="button" onClick={onSubmit}>{t('sharePost')}</button>
      </div>
      {openPicker === 'Emoji' && (
        <EmojiPicker
          emojiPickerRef={emojiPickerRef}
          onClose={closePickers}
          onEmojiSelect={handleEmojiSelect}
        />
      )}
      {openPicker === 'Voice' && (
        <VoiceRecorderControls
          isRecording={isRecording}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />
      )}
      {localFeedback && (
        <p className="create-post-card__helper" aria-live="polite">
          {localFeedback}
        </p>
      )}
    </section>
  );
}
