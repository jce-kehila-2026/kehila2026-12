export default function AboutSection({ organization }) {
  const aboutContent = {
    title: 'About She-Na',
    intro:
      organization?.description ||
      'She-Na provides a welcoming space for programs, resources, and community-led support.',
    body:
      'The organization supports recovering women as they rebuild daily routines, strengthen wellbeing, and connect with people who understand their journey.',
    supportAreas: [
      {
        title: 'Knowledge / Information',
        text: 'Clear guidance, trusted resources, and practical information for the next step.',
      },
      {
        title: 'Health / Body',
        text: 'Support that respects physical wellbeing, care needs, and personal pace.',
      },
      {
        title: 'Emotional / Mental support',
        text: 'A calm place for encouragement, listening, and steady community connection.',
      },
    ],
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
        <div className="public-about__cards" aria-label="Main support areas">
          {aboutContent.supportAreas.map((area) => (
            <article className="public-about__card" key={area.title}>
              <h3>{area.title}</h3>
              <p>{area.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
