export default function DailyInspiration({ quote }) {
  if (!quote?.text) return null;

  return (
    <p className="pd-home__inspiration" aria-live="polite">
      &ldquo;{quote.text}&rdquo;
      {quote.author ? <span className="pd-home__inspiration-author"> — {quote.author}</span> : null}
    </p>
  );
}
