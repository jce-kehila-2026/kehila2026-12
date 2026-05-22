import { useRef, useState } from 'react';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import GifBoxOutlinedIcon from '@mui/icons-material/GifBoxOutlined';
import KeyboardVoiceOutlinedIcon from '@mui/icons-material/KeyboardVoiceOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const composerActions = [
  { label: 'Photo', icon: AddPhotoAlternateOutlinedIcon },
  { label: 'GIF', icon: GifBoxOutlinedIcon },
  { label: 'Voice', icon: KeyboardVoiceOutlinedIcon },
  { label: 'Emoji', icon: EmojiEmotionsOutlinedIcon },
];

const SUPPORTIVE_EMOJIS = ['💜', '🌸', '🤍', '✨', '🙏', '💪', '🫶', '☀️', '🌿', '🎗️'];

const LOCAL_GIF_OPTIONS = [
  { id: 'sparkle-hug', emoji: '🫶', label: 'Sending support' },
  { id: 'gentle-sparkles', emoji: '✨', label: 'Gentle sparkles' },
  { id: 'flower-care', emoji: '🌸', label: 'Blooming care' },
  { id: 'strong-heart', emoji: '💜', label: 'Strong heart' },
];

const MAX_LOCAL_MEDIA_BYTES = 1.5 * 1024 * 1024;

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
  const [openPicker, setOpenPicker] = useState(null);
  const [localFeedback, setLocalFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStream, setRecordingStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const feedbackId = error ? 'create-post-error' : successMessage ? 'create-post-success' : undefined;
  const setTextareaRef = (element) => {
    textareaRef.current = element;
    if (postInputRef) {
      postInputRef.current = element;
    }
  };

  const closePickers = () => setOpenPicker(null);

  const handlePhotoClick = () => {
    closePickers();
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLocalFeedback('Please choose an image file.');
      return;
    }

    if (file.size > MAX_LOCAL_MEDIA_BYTES) {
      setLocalFeedback('Please choose an image smaller than 1.5 MB for local storage.');
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
    reader.onerror = () => setLocalFeedback('Unable to preview this image.');
    reader.readAsDataURL(file);
  };

  const handleGifSelect = (gif) => {
    onAttachmentChange?.({
      type: 'gif',
      id: gif.id,
      emoji: gif.emoji,
      label: gif.label,
    });
    setLocalFeedback('');
    closePickers();
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
      setLocalFeedback('Voice recording is not available in this browser.');
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
          setLocalFeedback('Voice note is too large for local storage. Please record a shorter note.');
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
          setLocalFeedback('Unable to save this voice note locally.');
          stopRecordingStream(stream);
        };
        reader.readAsDataURL(audioBlob);
      });

      mediaRecorder.start();
      setIsRecording(true);
      setLocalFeedback('Recording voice note...');
    } catch {
      setLocalFeedback('Microphone permission was not granted.');
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

  const renderAttachmentPreview = () => {
    if (!attachment) return null;

    return (
      <div className="create-post-card__attachment-preview">
        {attachment.type === 'image' && (
          <img src={attachment.url} alt={attachment.name || 'Selected attachment preview'} />
        )}
        {attachment.type === 'gif' && (
          <div className="community-gif-preview" aria-label={attachment.label}>
            <span>{attachment.emoji}</span>
            <strong>{attachment.label}</strong>
          </div>
        )}
        {attachment.type === 'voice' && (
          <audio controls src={attachment.url} aria-label="Voice note preview" />
        )}
        <button type="button" onClick={handleRemoveAttachment}>Remove</button>
      </div>
    );
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
    <section className="create-post-card" aria-label="Create a community post">
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
            aria-label="Write a community post"
            aria-describedby={feedbackId}
            aria-invalid={Boolean(error)}
            onChange={(event) => onPostTextChange(event.target.value)}
            placeholder="What’s on your mind today?"
            ref={setTextareaRef}
            rows="2"
            value={postText}
          />
        </div>
      </div>
      {renderAttachmentPreview()}
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
      {allowAnonymousPosting && isAnonymous && (
        <div className="create-post-card__anonymous-status" aria-live="polite">
          <LockOutlinedIcon fontSize="inherit" />
          Posting anonymously
        </div>
      )}
      <div className="create-post-card__toolbar" aria-label="Post options">
        <div className="create-post-card__actions" aria-label="Attachment options">
          {composerActions.map(({ label, icon: Icon }) => (
            <button
              aria-label={`Add ${label}`}
              aria-expanded={openPicker === label}
              className={`create-post-card__action${openPicker === label ? ' is-active' : ''}`}
              key={label}
              onClick={() => handleComposerAction(label)}
              type="button"
            >
              <Icon fontSize="small" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {allowAnonymousPosting && (
          <label className={`create-post-card__anonymous${isAnonymous ? ' is-active' : ''}`}>
            <input
              aria-label="Post anonymously"
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => onAnonymousChange(event.target.checked)}
            />
            <span className="create-post-card__anonymous-icon" aria-hidden="true">
              <LockOutlinedIcon fontSize="small" />
            </span>
            <span className="create-post-card__anonymous-copy">
              <strong>Post anonymously</strong>
              <small>Your name and profile will be hidden</small>
            </span>
            <span className="create-post-card__anonymous-switch" aria-hidden="true" />
          </label>
        )}
        <button className="create-post-card__submit" type="button" onClick={onSubmit}>Share Post</button>
      </div>
      {openPicker === 'GIF' && (
        <div className="create-post-card__picker" aria-label="Local GIF picker">
          {LOCAL_GIF_OPTIONS.map((gif) => (
            <button type="button" key={gif.id} onClick={() => handleGifSelect(gif)}>
              <span>{gif.emoji}</span>
              {gif.label}
            </button>
          ))}
        </div>
      )}
      {openPicker === 'Emoji' && (
        <div className="create-post-card__picker create-post-card__picker--emoji" aria-label="Emoji picker">
          {SUPPORTIVE_EMOJIS.map((emoji) => (
            <button type="button" key={emoji} onClick={() => handleEmojiSelect(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
      {openPicker === 'Voice' && (
        <div className="create-post-card__voice-panel" aria-label="Voice note recorder">
          <p>{isRecording ? 'Recording locally. Stop when you are done.' : 'Record a short local voice note.'}</p>
          <div>
            <button type="button" onClick={handleStartRecording} disabled={isRecording}>
              Start recording
            </button>
            <button type="button" onClick={handleStopRecording} disabled={!isRecording}>
              Stop recording
            </button>
          </div>
        </div>
      )}
      {localFeedback && (
        <p className="create-post-card__helper" aria-live="polite">
          {localFeedback}
        </p>
      )}
    </section>
  );
}
