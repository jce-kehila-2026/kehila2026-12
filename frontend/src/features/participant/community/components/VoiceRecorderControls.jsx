import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function VoiceRecorderControls({
  isRecording,
  onStartRecording,
  onStopRecording,
}) {
  const { t } = useParticipantLocale();
  return (
    <div className="create-post-card__voice-panel" aria-label={t('voiceRecorderAria')}>
      <p>{isRecording ? t('recordingLocally') : t('recordShortNote')}</p>
      <div>
        <button type="button" onClick={onStartRecording} disabled={isRecording}>
          {t('startRecording')}
        </button>
        <button type="button" onClick={onStopRecording} disabled={!isRecording}>
          {t('stopRecording')}
        </button>
      </div>
    </div>
  );
}
