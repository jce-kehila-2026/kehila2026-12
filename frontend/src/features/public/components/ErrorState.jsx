export default function ErrorState({ message = 'לא ניתן לטעון את התוכן. נסי שוב מאוחר יותר.' }) {
  return (
    <div className="public-state public-state--error" role="alert">
      <p>{message}</p>
    </div>
  );
}
