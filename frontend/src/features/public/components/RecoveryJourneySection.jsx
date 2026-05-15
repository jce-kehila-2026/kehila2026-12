export default function RecoveryJourneySection({ journey = {} }) {
  const stages = Array.isArray(journey.stages) ? journey.stages : [];

  return (
    <section className="public-section public-section--journey" id="journey" aria-labelledby="public-journey-title">
      <div className="public-section__header public-section__header--journey">
        <p className="public-eyebrow">{journey.eyebrow}</p>
        <h2 id="public-journey-title">{journey.title}</h2>
        <p className="public-section__text">{journey.description}</p>
      </div>

      <div className="public-journey__timeline" aria-label="Recovery journey stages">
        {stages.map((stage, index) => (
          <article className="public-journey__card" key={stage.id || stage.title}>
            <span className="public-journey__step" aria-hidden="true">
              {index + 1}
            </span>
            <p className="public-journey__label">{stage.label}</p>
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
