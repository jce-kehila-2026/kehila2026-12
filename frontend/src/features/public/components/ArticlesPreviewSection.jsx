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
    <section className="public-section public-section--articles public-section--muted" id="articles">
      <div className="public-section__header public-section__header--articles">
        <p className="public-eyebrow">Articles</p>
        <h2>Knowledge &amp; Support</h2>
        <p className="public-section__text">
          Helpful articles, practical resources, and supportive guidance for women and families.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Loading articles..." />
      ) : hasError ? (
        <ErrorState message="Could not load articles. Showing other available content." />
      ) : visibleArticles.length ? (
        <div className="public-articles-grid">
          {visibleArticles.map((article) => (
            <ArticleCard article={article} key={article.id || article.title} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}
