const FALLBACK_JOURNEY_STAGES = [
  {
    id: 'before',
    label: 'Before',
    title: 'What was',
    description:
      'A gentle look at the needs, questions, and experiences that may bring someone to seek support.',
  },
  {
    id: 'during',
    label: 'During',
    title: 'What is happening',
    description:
      'Support is offered step by step through listening, guidance, community programs, and steady care.',
  },
  {
    id: 'after',
    label: 'After',
    title: 'What will happen',
    description:
      'The journey continues with practical tools, connection, and space to move forward at a personal pace.',
  },
];

export default function RecoveryJourneySection({ journey = {} }) {
  const stages = Array.isArray(journey.stages) && journey.stages.length
    ? journey.stages
    : FALLBACK_JOURNEY_STAGES;

  return (
    <section className="public-section public-section--journey" id="journey" aria-labelledby="public-journey-title">
      <div className="public-section__header public-section__header--journey">
        <p className="public-eyebrow">{journey.eyebrow || 'Recovery Journey'}</p>
        <h2 id="public-journey-title">{journey.title || 'A steady path of support'}</h2>
        <p className="public-section__text">
          {journey.description ||
            'Every person moves through change differently. She-Na offers a calm, respectful space for each part of the journey.'}
        </p>
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
