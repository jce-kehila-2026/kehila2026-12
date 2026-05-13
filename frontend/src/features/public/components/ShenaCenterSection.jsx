const FALLBACK_CENTER_CONTENT = {
  eyebrow: 'SHEna Center',
  title: 'A calm recovery center for steady support',
  description:
    'The SHEna center is a respectful place for recovering women to find guidance, practical tools, and community connection at a pace that feels safe.',
  activities: [
    'Support circles and listening spaces',
    'Workshops for daily routines and independence',
    'Guidance toward health and emotional wellbeing resources',
  ],
  ctaLabel: 'Join / Get Support',
  ctaHref: '#contact',
};

export default function ShenaCenterSection({ center = FALLBACK_CENTER_CONTENT }) {
  return (
    <section className="public-section public-section--center" id="center" data-content-source="fallback">
      <div className="public-center__content">
        <p className="public-eyebrow">{center.eyebrow}</p>
        <h2>{center.title}</h2>
        <p className="public-section__text">{center.description}</p>
        <ul className="public-center__list" aria-label="SHEna center support activities">
          {center.activities.map((activity) => (
            <li key={activity}>{activity}</li>
          ))}
        </ul>
        <a className="public-button public-button--secondary" href={center.ctaHref}>
          {center.ctaLabel}
        </a>
      </div>

      <div className="public-center__visual" aria-label="SHEna recovery center visual placeholder">
        <div className="public-center__visual-card">
          <span className="public-center__icon" aria-hidden="true">
            SH
          </span>
          <h3>Recovery, dignity, and care</h3>
          <p>Center text and imagery can later be managed from Firestore.</p>
        </div>
      </div>
    </section>
  );
}
