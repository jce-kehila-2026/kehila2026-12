import { useMemo } from 'react';
import heroWomenSupport from '../../../assets/images/hero-women-support.png';
import { resolvePublicDonationHref } from '../constants/publicDonationLink';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { getLocalizedHero } from '../i18n/publicHomeTranslations';

export default function HeroSection({ hero = {}, onJoinClick }) {
  const { locale, t } = usePublicLocale();
  const localizedHero = useMemo(() => getLocalizedHero(hero, locale, t), [hero, locale, t]);
  const backgroundImageUrl = localizedHero.backgroundImageUrl || heroWomenSupport;

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
        <h1 id="public-hero-title">{localizedHero.title}</h1>
        {localizedHero.subtitle ? <p className="public-hero__lead">{localizedHero.subtitle}</p> : null}
        {localizedHero.description ? <p className="public-hero__support">{localizedHero.description}</p> : null}
        <div className="public-hero__actions">
          <a className="public-hero__btn public-hero__btn--primary" href="#join" onClick={handleJoinClick}>
            {t('heroJoinCommunity')}
          </a>
          <a
            className="public-hero__btn public-hero__btn--secondary"
            href={resolvePublicDonationHref()}
          >
            {t('heroDonate')}
          </a>
        </div>
      </div>
    </section>
  );
}
