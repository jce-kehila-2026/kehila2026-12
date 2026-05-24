export default function VoiceRecorderControls({
  isRecording,
  onStartRecording,
  onStopRecording,
}) {
  return (
    <div className="create-post-card__voice-panel" aria-label="Voice note recorder">
      <p>{isRecording ? 'Recording locally. Stop when you are done.' : 'Record a short local voice note.'}</p>
      <div>
        <button type="button" onClick={onStartRecording} disabled={isRecording}>
          Start recording
        </button>
        <button type="button" onClick={onStopRecording} disabled={!isRecording}>
          Stop recording
        </button>
      </div>
    </div>
  );
}
