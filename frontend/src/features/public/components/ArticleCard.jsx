import { useMemo, useState } from 'react';
import { getPressArticleImageSources } from '../constants/pressArticleImages';
import { usePublicLocale } from '../context/PublicLocaleContext';

function toImageSrc(value) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === 'object' && typeof value.default === 'string') {
    return value.default.trim();
  }

  return '';
}

export default function ArticleCard({ article, readMoreUrl, imageIndex = 0 }) {
  const { t } = usePublicLocale();
  const { title, description, content, imageAlt } = article || {};
  const summary = description || content;
  const href = readMoreUrl || '#';
  const sources = useMemo(
    () => getPressArticleImageSources(article, imageIndex),
    [article, imageIndex],
  );
  const primarySrc = toImageSrc(sources.primary) || toImageSrc(sources.fallback);
  const fallbackSrc = toImageSrc(sources.fallback) || primarySrc;
  const [imageSrc, setImageSrc] = useState(primarySrc);
  const [usedFallback, setUsedFallback] = useState(primarySrc === fallbackSrc);

  function handleImageError() {
    if (!usedFallback && fallbackSrc && imageSrc !== fallbackSrc) {
      setUsedFallback(true);
      setImageSrc(fallbackSrc);
    }
  }

  return (
    <article className="press-article-card">
      <div className="press-article-card__media">
        <img
          src={imageSrc || fallbackSrc}
          alt={imageAlt || title || ''}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
      </div>
      <div className="press-article-card__body">
        <h3 className="press-article-card__title">{title}</h3>
        {summary ? <p className="press-article-card__description">{summary}</p> : null}
        <a
          className="press-article-card__cta"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('readMore')}
        </a>
      </div>
    </article>
  );
}
