import { useMemo, useState } from 'react';
import { getEventPreviewImageMeta } from '../constants/eventPreviewImages';
import { usePublicLocale } from '../context/PublicLocaleContext';

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
  const { t } = usePublicLocale();
  const title = event.title;
  const description = event.description || event.content;
  const imageMeta = useMemo(() => getEventPreviewImageMeta(event, index), [event, index]);
  const [imageSrc, setImageSrc] = useState(imageMeta.src);

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
      </div>

      <div className="public-event-card__body">
        <div className="public-event-card__content">
          <h3 className="public-event-card__title">{title}</h3>
          <CardTitleDivider />
          {description ? <p className="public-event-card__description">{description}</p> : null}
        </div>

        <a className="public-event-card__button" href="/login">
          {t('eventDetails')}
        </a>
      </div>
    </article>
  );
}
