import { useEffect, useState } from 'react';
import { usePublicLocale } from '../context/PublicLocaleContext';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1000&q=80';

export default function ArticleCard({ article }) {
  const { t } = usePublicLocale();
  const { title, description, imageUrl, articleUrl } = article || {};
  const trimmedImage = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  const trimmedHref = typeof articleUrl === 'string' ? articleUrl.trim() : '';

  const [imageSrc, setImageSrc] = useState(trimmedImage || FALLBACK_IMAGE);
  const [usedFallback, setUsedFallback] = useState(!trimmedImage);

  useEffect(() => {
    setImageSrc(trimmedImage || FALLBACK_IMAGE);
    setUsedFallback(!trimmedImage);
  }, [trimmedImage]);

  function handleImageError() {
    if (!usedFallback) {
      setUsedFallback(true);
      setImageSrc(FALLBACK_IMAGE);
    }
  }

  return (
    <article className="press-article-card">
      <div className="press-article-card__media">
        <img
          src={imageSrc}
          alt={title || ''}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
      </div>
      <div className="press-article-card__body">
        <div className="press-article-card__text">
          {title ? <h3 className="press-article-card__title">{title}</h3> : null}
          {description ? <p className="press-article-card__description">{description}</p> : null}
        </div>
        {trimmedHref ? (
          <a
            className="press-article-card__cta"
            href={trimmedHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('readMore')}
          </a>
        ) : null}
      </div>
    </article>
  );
}
