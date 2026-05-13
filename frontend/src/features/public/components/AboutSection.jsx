export default function AboutSection({ organization }) {
  return (
    <section className="public-section public-section--about" id="about">
      <div className="public-section__header">
        <p className="public-eyebrow">About</p>
        <h2>Our Community</h2>
      </div>
      <p className="public-section__text">{organization.description}</p>
    </section>
  );
}
