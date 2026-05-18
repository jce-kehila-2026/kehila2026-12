import ArticleCard from './ArticleCard';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';

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
  maxItems = 3,
  isLoading = false,
  hasError = false,
}) {
  const visibleArticles = getVisibleArticles(articles, maxItems);

  return (
    <section className="public-section public-section--articles public-section--muted" id="articles" aria-labelledby="public-articles-title">
      <div className="public-section__header public-section__header--articles reveal">
        <p className="public-eyebrow">מאמרים</p>
        <h2 id="public-articles-title">ידע ותמיכה</h2>
        <p className="public-section__text reveal reveal-delay-1">
          מאמרים מועילים, כלים מעשיים ותוכן תומך לנשים ולמשפחות.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="טוענות מאמרים..." />
      ) : hasError ? (
        <ErrorState message="לא ניתן לטעון את המאמרים. מציגות תוכן זמין אחר." />
      ) : visibleArticles.length ? (
        <div className="public-articles-grid stagger-children">
          {visibleArticles.map((article) => (
            <ArticleCard article={article} key={article.id || article.title} />
          ))}
        </div>
      ) : (
        <EmptyState message="מאמרים יופיעו כאן כאשר התוכן הציבורי יהיה זמין." />
      )}
    </section>
  );
}
