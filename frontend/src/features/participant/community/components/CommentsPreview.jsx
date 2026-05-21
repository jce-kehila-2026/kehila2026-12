export default function CommentsPreview({ comments = [] }) {
  const visibleComments = comments.slice(0, 2);

  if (visibleComments.length === 0) return null;

  return (
    <section className="comments-preview" aria-label="Comments preview">
      <div className="comments-preview__list">
        {visibleComments.map((comment) => (
          <article className="comments-preview__item" key={comment.id ?? `${comment.author}-${comment.text}`}>
            <span className="comments-preview__avatar">{comment.initials}</span>
            <div>
              <header>
                <strong>{comment.author}</strong>
                {comment.time && <small>{comment.time}</small>}
              </header>
              <p>{comment.content ?? comment.text}</p>
            </div>
          </article>
        ))}
      </div>
      <button className="comments-preview__view-all" type="button">
        View all comments
      </button>
    </section>
  );
}
