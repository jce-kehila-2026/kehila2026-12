export default function EmptyState({ message = 'No articles are available at the moment.' }) {
  return (
    <div className="public-state public-state--empty">
      <p>{message}</p>
    </div>
  );
}
