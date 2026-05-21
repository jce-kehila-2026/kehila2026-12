const COMMENTS_PREVIEW_LIMIT = 2;

export default function CommentsPreview({
  comments = [],
  isExpanded = false,
  onToggleExpanded,
}) {
  const hasMoreComments = comments.length > COMMENTS_PREVIEW_LIMIT;
  const visibleComments = isExpanded ? comments : comments.slice(0, COMMENTS_PREVIEW_LIMIT);

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
      {hasMoreComments && (
        <button className="comments-preview__view-all" onClick={onToggleExpanded} type="button">
          {isExpanded ? 'Show less' : 'Show more comments'}
        </button>
      )}
    </section>
  );
}
