import heroWomenSupport from '../../../assets/images/hero-women-support.png';
import { resolvePublicDonationHref } from '../constants/publicDonationLink';

export default function HeroSection({ hero = {}, onJoinClick }) {
  const backgroundImageUrl = hero.backgroundImageUrl || heroWomenSupport;

  function handleJoinClick(event) {
    event.preventDefault();
    onJoinClick?.();
  }

  return (
    <section
      className="public-hero"
      id="home"
      aria-labelledby="public-hero-title"
      style={{ '--public-hero-bg-image': `url(${backgroundImageUrl})` }}
    >
      <div className="public-hero__background" aria-hidden="true" />
      <div className="public-hero__overlay public-hero__overlay--tint" aria-hidden="true" />
      <div className="public-hero__overlay public-hero__overlay--readability" aria-hidden="true" />
      <div className="public-hero__overlay public-hero__overlay--navbar-fade" aria-hidden="true" />

      <div className="public-hero__content">
        <h1 id="public-hero-title">{hero.title}</h1>
        {hero.subtitle ? <p className="public-hero__lead">{hero.subtitle}</p> : null}
        {hero.description ? <p className="public-hero__support">{hero.description}</p> : null}
        <div className="public-hero__actions">
          <a className="public-hero__btn public-hero__btn--primary" href="#join" onClick={handleJoinClick}>
            להצטרף לקהילה
          </a>
          <a
            className="public-hero__btn public-hero__btn--secondary"
            href={resolvePublicDonationHref()}
          >
            לתרומה
          </a>
        </div>
      </div>
    </section>
  );
}
