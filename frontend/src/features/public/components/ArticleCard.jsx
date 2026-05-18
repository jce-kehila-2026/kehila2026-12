export default function ArticleCard({ article }) {
  const {
    title,
    description,
    content,
    imageUrl,
    imageAlt,
    readMoreUrl,
  } = article;

  const summary = description || content;

  return (
    <article className="public-article-card reveal">
      <div className="public-article-card__media">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt || title} loading="lazy" />
        ) : (
          <div className="public-article-card__placeholder" aria-hidden="true">
            <span />
          </div>
        )}
      </div>
      <div className="public-article-card__body">
        <h3>{title}</h3>
        <p>{summary}</p>
        <a className="public-button public-button--tertiary public-article-card__button" href={readMoreUrl}>
          לקריאה נוספת
        </a>
      </div>
    </article>
  );
}
