export default function EmptyState({ message = 'אין תוכן זמין כרגע.' }) {
  return (
    <div className="public-state public-state--empty">
      <p>{message}</p>
    </div>
  );
}
