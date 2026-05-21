import { useMemo, useState } from 'react';
import { CalendarHeart, Heart, UsersRound } from 'lucide-react';
import { getEventPreviewImageMeta } from '../constants/eventPreviewImages';

const EVENT_ICONS = [UsersRound, Heart, CalendarHeart];

const ICON_PROPS = {
  size: 28,
  strokeWidth: 1.85,
  absoluteStrokeWidth: true,
  color: '#ffffff',
  'aria-hidden': true,
};

function CardTitleDivider() {
  return (
    <div className="public-event-card__divider" aria-hidden="true">
      <span className="public-event-card__divider-line" />
      <span className="public-event-card__divider-heart">♥</span>
      <span className="public-event-card__divider-line" />
    </div>
  );
}

export default function EventPreviewCard({ event, index = 0 }) {
  const title = event.title;
  const description = event.description || event.content;
  const imageMeta = useMemo(() => getEventPreviewImageMeta(event, index), [event, index]);
  const [imageSrc, setImageSrc] = useState(imageMeta.src);
  const Icon = EVENT_ICONS[index % EVENT_ICONS.length];

  function handleImageError() {
    if (imageSrc !== imageMeta.fallbackSrc) {
      setImageSrc(imageMeta.fallbackSrc);
    }
  }

  return (
    <article className="public-event-card reveal">
      <div className="public-event-card__media">
        <img
          className="public-event-card__image"
          src={imageSrc}
          alt={imageMeta.alt || title}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: imageMeta.position }}
          onError={handleImageError}
        />
        <div className="public-event-card__media-overlay" aria-hidden="true" />
        <span className="public-event-card__badge" aria-hidden="true">
          <Icon {...ICON_PROPS} />
        </span>
      </div>

      <div className="public-event-card__body">
        <div className="public-event-card__content">
          <h3 className="public-event-card__title">{title}</h3>
          <CardTitleDivider />
          {description ? <p className="public-event-card__description">{description}</p> : null}
        </div>

        <a className="public-event-card__button" href="/login">
          כניסה לפרטים
        </a>
      </div>
    </article>
  );
}
