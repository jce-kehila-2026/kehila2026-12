export default function AboutSection({ about = {}, supportAreas = [] }) {
  const visibleSupportAreas = Array.isArray(supportAreas) ? supportAreas.filter(Boolean).slice(0, 3) : [];

  return (
    <section className="public-section public-section--about" id="about" aria-labelledby="public-about-title">
      <div className="public-section__header">
        <p className="public-eyebrow">About</p>
        <h2 id="public-about-title">{about.title}</h2>
      </div>
      <div className="public-about__content">
        <p className="public-section__text">{about.intro}</p>
        <p className="public-section__text">{about.body}</p>
        {visibleSupportAreas.length ? (
          <div className="public-about__cards" aria-label="Main support areas">
            {visibleSupportAreas.map((area) => (
              <article className="public-about__card" key={area.id || area.title}>
                <h3>{area.title}</h3>
                <p>{area.text || area.description}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
