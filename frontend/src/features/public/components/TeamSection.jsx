export default function TeamSection({ team }) {
  return (
    <section className="public-section" id="team">
      <div className="public-section__header">
        <p className="public-eyebrow">Team</p>
        <h2>People Behind She-Na</h2>
      </div>
      <div className="public-card-grid public-card-grid--team">
        {team.map((member) => (
          <article className="public-card public-card--team" key={member.id}>
            <div className="public-card__avatar" aria-hidden="true">
              {(member.title || member.name || 'S').charAt(0)}
            </div>
            <h3>{member.title || member.name}</h3>
            <p>{member.content || member.role || member.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
