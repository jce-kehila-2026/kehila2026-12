export default function ShenaCenterSection({ center = {} }) {
  const activities = Array.isArray(center.activities) ? center.activities.filter(Boolean) : [];

  return (
    <section className="public-section public-section--center" id="center" aria-labelledby="public-center-title">
      <div className="public-center__content">
        <p className="public-eyebrow">{center.eyebrow}</p>
        <h2 id="public-center-title">{center.title}</h2>
        <p className="public-section__text">{center.description}</p>
        {activities.length ? (
          <ul className="public-center__list" aria-label="SHEna center support activities">
            {activities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
        ) : null}
        <a className="public-button public-button--secondary" href={center.ctaHref}>
          {center.ctaLabel}
        </a>
      </div>

      <div className="public-center__visual" aria-labelledby="public-center-card-title">
        <div className="public-center__visual-card">
          <span className="public-center__icon" aria-hidden="true">
            {center.visualIcon}
          </span>
          <h3 id="public-center-card-title">{center.visualTitle}</h3>
          <p>{center.visualText}</p>
        </div>
      </div>
    </section>
  );
}
