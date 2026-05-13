const FALLBACK_SUPPORT_AREAS = [
  {
    id: 'independence',
    icon: 'I',
    title: 'Independence',
    description: 'Practical guidance for routines, confidence, and daily decisions.',
  },
  {
    id: 'health',
    icon: 'H',
    title: 'Health',
    description: 'Support that respects care needs, body wellbeing, and personal pace.',
  },
  {
    id: 'emotional-mental-support',
    icon: 'E',
    title: 'Emotional / Mental Support',
    description: 'Listening spaces, encouragement, and steady community connection.',
  },
];

export default function SupportAreasSection({ supportAreas = FALLBACK_SUPPORT_AREAS }) {
  return (
    <section className="public-section public-section--support" id="support">
      <div className="public-section__header">
        <p className="public-eyebrow">Support Areas</p>
        <h2>Focused support for recovery and growth</h2>
      </div>

      <div className="public-support__grid" data-content-source="fallback">
        {supportAreas.map((area) => (
          <article className="public-support__card" key={area.id}>
            <span className="public-support__icon" aria-hidden="true">
              {area.icon}
            </span>
            <h3>{area.title}</h3>
            <p>{area.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
