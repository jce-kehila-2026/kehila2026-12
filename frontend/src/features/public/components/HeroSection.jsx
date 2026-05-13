export default function HeroSection({ hero = {}, organization, loading }) {
  const heroContent = {
    eyebrow: hero.eyebrow || organization?.tagline || 'Support for women in recovery',
    title:
      hero.title ||
      (organization?.name ? `${organization.name}: support for every step forward` : 'She-Na: support for every step forward'),
    message:
      hero.message ||
      organization?.description ||
      'A warm community helping recovering women find knowledge, care, and steady support.',
    supportText:
      hero.supportText ||
      'She-Na supports recovering women with respectful guidance, practical resources, and a caring place to turn to.',
    primaryAction: hero.primaryAction || { label: 'Donate', href: '#donate' },
    secondaryAction: hero.secondaryAction || { label: 'Join / Get Support', href: '#contact' },
  };

  return (
    <section className="public-hero" id="home" aria-labelledby="public-hero-title">
      <div className="public-hero__content">
        <p className="public-eyebrow">{loading ? 'Preparing public content' : heroContent.eyebrow}</p>
        <h1 id="public-hero-title">{heroContent.title}</h1>
        <p className="public-hero__description">{heroContent.message}</p>
        <p className="public-hero__support">{heroContent.supportText}</p>
        <div className="public-hero__actions">
          <a className="public-button public-button--primary" href={heroContent.primaryAction.href || '#donate'}>
            {heroContent.primaryAction.label || 'Donate'}
          </a>
          <a className="public-button public-button--secondary" href={heroContent.secondaryAction.href || '#contact'}>
            {heroContent.secondaryAction.label || 'Join / Get Support'}
          </a>
          <a className="public-button public-button--tertiary" href="/login">
            Login
          </a>
        </div>
      </div>
      <div className="public-hero__visual" aria-labelledby="public-hero-visual-title">
        <div className="public-hero__visual-card">
          <span className="public-hero__visual-mark" id="public-hero-visual-title">
            She-Na
          </span>
          <p>Knowledge, health, and emotional support for recovering women.</p>
        </div>
      </div>
    </section>
  );
}
