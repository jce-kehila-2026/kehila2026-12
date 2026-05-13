export default function ArticlesPreview({ articles }) {
  return (
    <section className="public-section public-section--muted" id="articles">
      <div className="public-section__header">
        <p className="public-eyebrow">Articles</p>
        <h2>News and Updates</h2>
      </div>
      <div className="public-card-grid">
        {articles.map((article) => (
          <article className="public-card" key={article.id}>
            <h3>{article.title}</h3>
            <p>{article.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
