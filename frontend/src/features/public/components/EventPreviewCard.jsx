export default function EventPreviewCard({ event }) {
  const title = event.title;
  const description = event.description || event.content;
  const imageUrl = event.imageUrl || event.image;
  const imageAlt = event.imageAlt;

  return (
    <article className="public-event-card reveal">
      <div className="public-event-card__media">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt || title} loading="lazy" />
        ) : (
          <div className="public-event-card__placeholder" aria-hidden="true">
            <span />
          </div>
        )}
      </div>

      <div className="public-event-card__body">
        <div className="public-event-card__content">
          <h3>{title}</h3>
          {description ? <p className="public-event-card__description">{description}</p> : null}
        </div>

        <a className="public-button public-button--secondary public-event-card__button" href="/login">
          כניסה לפרטים
        </a>
      </div>
    </article>
  );
}
