export default function HeroSection({ hero = {}, loading }) {
  const { primaryAction = {}, secondaryAction = {} } = hero;

  return (
    <section className="public-hero" id="home" aria-labelledby="public-hero-title">
      <div className="public-hero__content">
        <p className="public-eyebrow">{loading ? 'Preparing public content' : hero.eyebrow}</p>
        <h1 id="public-hero-title">{hero.title}</h1>
        <p className="public-hero__description">{hero.message}</p>
        <p className="public-hero__support">{hero.supportText}</p>
        <div className="public-hero__actions">
          <a className="public-button public-button--primary" href={primaryAction.href}>
            {primaryAction.label}
          </a>
          <a className="public-button public-button--secondary" href={secondaryAction.href}>
            {secondaryAction.label}
          </a>
          <a className="public-button public-button--tertiary" href="/login">
            Login
          </a>
        </div>
      </div>
      <div className="public-hero__visual" aria-labelledby="public-hero-visual-title">
        <div className="public-hero__visual-card">
          <span className="public-hero__visual-mark" id="public-hero-visual-title">
            {hero.visualTitle}
          </span>
          <p>{hero.visualText}</p>
        </div>
      </div>
    </section>
  );
}
