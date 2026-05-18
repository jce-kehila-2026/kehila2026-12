export default function RecoveryJourneySection({ journey = {} }) {
  const stages = Array.isArray(journey.stages) ? journey.stages : [];

  return (
    <section className="public-section public-section--journey" id="journey" aria-labelledby="public-journey-title">
      <div className="public-section__header public-section__header--journey reveal">
        <p className="public-eyebrow">{journey.eyebrow}</p>
        <h2 id="public-journey-title">{journey.title}</h2>
        <p className="public-section__text reveal reveal-delay-1">{journey.description}</p>
      </div>

      <div className="public-journey__timeline stagger-children" aria-label="שלבי מסע ההחלמה">
        {stages.map((stage, index) => (
          <article className="public-journey__card reveal" key={stage.id || stage.title}>
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
