export default function ErrorState({ message = 'Could not load the content. Please try again later.' }) {
  return (
    <div className="public-state public-state--error" role="alert">
      <p>{message}</p>
    </div>
  );
}
