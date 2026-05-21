import { useMemo } from 'react';
import ArticleCard from './ArticleCard';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import PublicSectionHeading from './PublicSectionHeading';
import { FALLBACK_PRESS_ARTICLES } from '../constants/pressArticleImages';
import { resolvePressArticleHref } from '../constants/pressArticles';
import '../styles/public-articles-section.css';

function getVisibleArticles(articles, maxItems) {
  return (Array.isArray(articles) ? articles : [])
    .filter((article) => {
      if (!article || typeof article !== 'object') {
        return false;
      }

      const isPublished = article.isPublished !== false && article.published !== false;
      const isActive = article.active !== false && article.status !== 'inactive';
      const isDraft = article.status === 'draft';

      return isPublished && isActive && !isDraft;
    })
    .slice(0, maxItems);
}

export default function ArticlesPreviewSection({
  articles = [],
  maxItems = 4,
  isLoading = false,
  hasError = false,
}) {
  const visibleArticles = getVisibleArticles(articles, maxItems);
  const displayArticles = useMemo(() => {
    if (visibleArticles.length) {
      return visibleArticles;
    }

    return FALLBACK_PRESS_ARTICLES.slice(0, maxItems);
  }, [maxItems, visibleArticles]);

  return (
    <section
      className="public-section public-section--press-articles"
      id="articles"
      aria-labelledby="press-articles-title"
    >
      <div className="press-articles__inner">
        <PublicSectionHeading
          className="press-articles__heading-wrap"
          eyebrow="בתקשורת"
          title="בואי תראי מה כתבו עלינו"
          titleId="press-articles-title"
          subtitle="כתבות, סיקורים וסיפורים מהתקשורת על הקהילה, התמיכה והעשייה שלנו."
        />

        {isLoading ? (
          <div className="press-articles__state">
            <LoadingState message="טוענות כתבות..." />
          </div>
        ) : displayArticles.length ? (
          <>
            {hasError ? (
              <p className="press-articles__notice" role="status">
                לא ניתן לטעון את כל הכתבות. מציגות תוכן זמין.
              </p>
            ) : null}
            <div className="press-articles__grid" role="list">
              {displayArticles.map((article, index) => (
                <ArticleCard
                  article={article}
                  imageIndex={index}
                  key={article.id || `${article.title}-${index}`}
                  readMoreUrl={resolvePressArticleHref(article, index)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="press-articles__state">
            <EmptyState message="כתבות יופיעו כאן כאשר התוכן הציבורי יהיה זמין." />
          </div>
        )}
      </div>
    </section>
  );
}
