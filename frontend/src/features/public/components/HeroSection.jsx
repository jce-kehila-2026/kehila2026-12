export default function HeroSection({ hero = {}, loading }) {
  const { primaryAction = {}, secondaryAction = {} } = hero;
  const backgroundStyle = hero.imageUrl ? { '--public-hero-image': `url("${hero.imageUrl}")` } : undefined;

  function handleJoinClick(event) {
    event.preventDefault();
  }

  return (
    <section className="public-hero" id="home" aria-labelledby="public-hero-title" style={backgroundStyle}>
      {hero.imageUrl ? <img className="public-hero__image" src={hero.imageUrl} alt={hero.imageAlt || ''} /> : null}
      <div className="public-hero__overlay" aria-hidden="true" />
      <div className="public-hero__content">
        <p className="public-eyebrow">{loading ? 'טוענות את התוכן' : hero.eyebrow}</p>
        <h1 id="public-hero-title">{hero.title}</h1>
        <p className="public-hero__description">{hero.message}</p>
        <div className="public-hero__actions">
          <a className="public-button public-button--primary" href="#join" onClick={handleJoinClick}>
            {primaryAction.label}
          </a>
          <a className="public-button public-button--secondary" href="#donate">
            {secondaryAction.label}
          </a>
        </div>
      </div>
      <span className="public-hero__scroll" aria-hidden="true" />
    </section>
  );
}
