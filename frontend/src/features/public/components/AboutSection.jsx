export default function AboutSection({ about = {}, organization, supportAreas = [] }) {
  const visibleSupportAreas = Array.isArray(supportAreas) ? supportAreas.filter(Boolean).slice(0, 3) : [];
  const aboutContent = {
    title: about.title || 'About She-Na',
    intro:
      about.intro ||
      organization?.description ||
      'She-Na provides a welcoming space for programs, resources, and community-led support.',
    body:
      about.body ||
      'The organization supports recovering women as they rebuild daily routines, strengthen wellbeing, and connect with people who understand their journey.',
    supportAreas: visibleSupportAreas,
  };

  return (
    <section className="public-section public-section--about" id="about">
      <div className="public-section__header">
        <p className="public-eyebrow">About</p>
        <h2>{aboutContent.title}</h2>
      </div>
      <div className="public-about__content">
        <p className="public-section__text">{aboutContent.intro}</p>
        <p className="public-section__text">{aboutContent.body}</p>
        {aboutContent.supportAreas.length ? (
          <div className="public-about__cards" aria-label="Main support areas">
            {aboutContent.supportAreas.map((area) => (
              <article className="public-about__card" key={area.id || area.title}>
                <h3>{area.title || 'Support area'}</h3>
                <p>{area.text || area.description || 'Support details will appear here when available.'}</p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
