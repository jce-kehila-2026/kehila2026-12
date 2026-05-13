export default function EventsPreview({ events }) {
  return (
    <section className="public-section" id="events">
      <div className="public-section__header">
        <p className="public-eyebrow">Events</p>
        <h2>Upcoming Activities</h2>
      </div>
      <div className="public-card-grid">
        {events.map((event) => (
          <article className="public-card" key={event.id}>
            <p className="public-card__meta">{event.date || 'Coming soon'}</p>
            <h3>{event.title}</h3>
            <p>{event.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
