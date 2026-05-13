export default function ShenaCenterSection({ center = {} }) {
  const activities = Array.isArray(center.activities) ? center.activities.filter(Boolean) : [];

  return (
    <section className="public-section public-section--center" id="center" aria-labelledby="public-center-title" data-content-source="fallback">
      <div className="public-center__content">
        <p className="public-eyebrow">{center.eyebrow || 'SHEna Center'}</p>
        <h2 id="public-center-title">{center.title || 'A calm recovery center for steady support'}</h2>
        <p className="public-section__text">
          {center.description ||
            'The SHEna center is a respectful place for recovering women to find guidance, practical tools, and community connection.'}
        </p>
        {activities.length ? (
          <ul className="public-center__list" aria-label="SHEna center support activities">
            {activities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
        ) : null}
        <a className="public-button public-button--secondary" href={center.ctaHref || '#contact'}>
          {center.ctaLabel || 'Join / Get Support'}
        </a>
      </div>

      <div className="public-center__visual" aria-labelledby="public-center-card-title">
        <div className="public-center__visual-card">
          <span className="public-center__icon" aria-hidden="true">
            SH
          </span>
          <h3 id="public-center-card-title">Recovery, dignity, and care</h3>
          <p>Center text and imagery can later be managed from Firestore.</p>
        </div>
      </div>
    </section>
  );
}
