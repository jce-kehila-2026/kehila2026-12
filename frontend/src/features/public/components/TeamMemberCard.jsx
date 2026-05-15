function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function TeamMemberCard({ member }) {
  const { name, role, description, imageUrl, imageAlt } = member;

  return (
    <article className="public-team-card">
      <div className="public-team-card__media">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt || name} loading="lazy" />
        ) : (
          <div className="public-team-card__placeholder" aria-hidden="true">
            {getInitials(name)}
          </div>
        )}
      </div>

      <div className="public-team-card__body">
        <h3>{name}</h3>
        {role ? <p className="public-team-card__role">{role}</p> : null}
        {description ? <p className="public-team-card__description">{description}</p> : null}
      </div>
    </article>
  );
}
