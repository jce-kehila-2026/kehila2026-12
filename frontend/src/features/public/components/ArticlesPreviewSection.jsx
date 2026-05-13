import ArticleCard from './ArticleCard';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';

const DEMO_ARTICLES = [
  {
    id: 'demo-article-1',
    title: 'Finding Support in Community',
    description:
      'Simple guidance on reaching out, staying connected, and finding steady support during difficult seasons.',
    isPublished: true,
    active: true,
  },
  {
    id: 'demo-article-2',
    title: 'Practical Steps for Everyday Wellbeing',
    description:
      'Helpful reminders for building calm routines, asking for help, and making space for recovery.',
    isPublished: true,
    active: true,
  },
  {
    id: 'demo-article-3',
    title: 'Understanding Available Resources',
    description:
      'An introduction to the types of community programs, workshops, and support resources that may be available.',
    isPublished: true,
    active: true,
  },
];

function getVisibleArticles(articles, maxItems) {
  return (Array.isArray(articles) ? articles : [])
    .filter((article) => {
      const isPublished = article.isPublished !== false && article.published !== false;
      const isActive = article.active !== false && article.status !== 'inactive';
      const isDraft = article.status === 'draft';

      return isPublished && isActive && !isDraft;
    })
    .slice(0, maxItems);
}

export default function ArticlesPreviewSection({
  articles = DEMO_ARTICLES,
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
        <ErrorState />
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
