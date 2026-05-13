export default function HeroSection({ organization, loading }) {
  return (
    <section className="public-hero" id="home">
      <div className="public-hero__content">
        <p className="public-eyebrow">{loading ? 'Loading public content' : organization.tagline}</p>
        <h1>{organization.name}</h1>
        <p className="public-hero__description">{organization.description}</p>
        <div className="public-hero__actions">
          <a className="public-button public-button--primary" href="#contact">
            Contact Us
          </a>
          <a className="public-button public-button--secondary" href="#about">
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
