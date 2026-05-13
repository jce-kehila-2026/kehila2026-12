function getEventDateTime(event) {
  const date = event?.dateLabel || event?.date || event?.startDate || '';
  const time = event?.timeLabel || event?.time || event?.startTime || '';

  if (date && time) {
    return `${date} · ${time}`;
  }

  return date || time;
}

export default function EventPreviewCard({ event }) {
  const title = event?.title || 'Community activity';
  const description = event?.description || event?.content || '';
  const dateTime = getEventDateTime(event);
  const location = event?.location || event?.venue || '';
  const imageUrl = event?.imageUrl || event?.image || '';
  const imageAlt = event?.imageAlt || `${title} activity preview`;

  return (
    <article className="public-event-card">
      <div className="public-event-card__media">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt} loading="lazy" />
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

        {(dateTime || location) && (
          <dl className="public-event-card__details">
            {dateTime ? (
              <div>
                <dt>Date</dt>
                <dd>{dateTime}</dd>
              </div>
            ) : null}
            {location ? (
              <div>
                <dt>Location</dt>
                <dd>{location}</dd>
              </div>
            ) : null}
          </dl>
        )}

        <a className="public-button public-button--secondary public-event-card__button" href="/login">
          Login for details
        </a>
      </div>
    </article>
  );
}
