export default function LoadingState({ message = 'Loading content...' }) {
  return (
    <div className="public-state public-state--loading" role="status" aria-live="polite">
      <span className="public-state__indicator" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
