export default function HeroSection({ organization, loading }) {
  const heroContent = {
    eyebrow: organization?.tagline || 'Support for women in recovery',
    title: organization?.name ? `${organization.name}: support for every step forward` : 'She-Na: support for every step forward',
    message:
      organization?.description ||
      'A warm community helping recovering women find knowledge, care, and steady support.',
  };

  return (
    <section className="public-hero" id="home">
      <div className="public-hero__content">
        <p className="public-eyebrow">{loading ? 'Preparing public content' : heroContent.eyebrow}</p>
        <h1>{heroContent.title}</h1>
        <p className="public-hero__description">{heroContent.message}</p>
        <p className="public-hero__support">
          She-Na supports recovering women with respectful guidance, practical resources, and a caring place to turn to.
        </p>
        <div className="public-hero__actions">
          <a className="public-button public-button--primary" href="#donate">
            Donate
          </a>
          <a className="public-button public-button--secondary" href="#contact">
            Join / Get Support
          </a>
          <a className="public-button public-button--tertiary" href="/login">
            Login
          </a>
        </div>
      </div>
      <div className="public-hero__visual" aria-label="Supportive community visual placeholder">
        <div className="public-hero__visual-card">
          <span className="public-hero__visual-mark">She-Na</span>
          <p>Knowledge, health, and emotional support for recovering women.</p>
        </div>
      </div>
    </section>
  );
}
