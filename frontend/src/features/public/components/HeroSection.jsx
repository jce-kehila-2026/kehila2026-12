import { useEffect, useMemo, useRef } from 'react';
import heroWomenSupport from '../../../assets/images/hero-women-support.png';
import { resolvePublicDonationHref } from '../constants/publicDonationLink';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeStatistics } from '../i18n/publicHomeContentLocalization';
import { getLocalizedHero } from '../i18n/publicHomeTranslations';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import { StatisticsGrid, adaptStatisticForRender } from './StatisticsSection';

function revealHeroElements(root) {
  if (!root) return;

  root.querySelectorAll('.reveal').forEach((element) => {
    element.classList.add('reveal-visible');
  });
}

export default function HeroSection({
  hero = {},
  statistics = [],
  isLoading = false,
  hasError = false,
  onJoinClick,
}) {
  const { locale, t } = usePublicLocale();
  const localizedHero = useMemo(() => getLocalizedHero(hero, locale, t), [hero, locale, t]);
  const adaptedStatistics = useMemo(
    () => (Array.isArray(statistics) ? statistics.map(adaptStatisticForRender) : []),
    [statistics],
  );
  const localizedStatistics = useMemo(
    () => localizeStatistics(adaptedStatistics, locale),
    [adaptedStatistics, locale],
  );
  const backgroundImageUrl = localizedHero.backgroundImageUrl || heroWomenSupport;
  const hasStatistics = localizedStatistics.length > 0;
  const showStatisticsLoading = isLoading && !hasStatistics;
  const heroRef = useRef(null);

  useEffect(() => {
    const root = heroRef.current;
    if (!root) return undefined;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      revealHeroElements(root);
      return undefined;
    }

    const rafId = window.requestAnimationFrame(() => revealHeroElements(root));

    return () => window.cancelAnimationFrame(rafId);
  }, [hasStatistics, localizedStatistics.length]);

  function handleJoinClick(event) {
    event.preventDefault();
    onJoinClick?.();
  }

  return (
    <section
      ref={heroRef}
      className="public-hero"
      id="home"
      aria-labelledby="public-hero-title"
      style={{ '--public-hero-bg-image': `url(${backgroundImageUrl})` }}
    >
      <div className="public-hero__background" aria-hidden="true" />
      <div className="public-hero__overlay public-hero__overlay--tint" aria-hidden="true" />
      <div className="public-hero__overlay public-hero__overlay--readability" aria-hidden="true" />
      <div className="public-hero__overlay public-hero__overlay--stats-readability" aria-hidden="true" />
      <div className="public-hero__overlay public-hero__overlay--navbar-fade" aria-hidden="true" />

      <div className="public-hero__layout">
        <div className="public-hero__content-region">
          <div className="public-hero__content">
            <h1 id="public-hero-title" className="reveal">{localizedHero.title}</h1>
            {localizedHero.subtitle ? <p className="public-hero__lead reveal reveal-delay-1">{localizedHero.subtitle}</p> : null}
            {localizedHero.subtitle && localizedHero.description ? (
              <div className="public-hero__ornament reveal reveal-delay-2" aria-hidden="true">
                <span className="public-hero__ornament-line" />
                <span className="public-hero__ornament-heart">♥</span>
                <span className="public-hero__ornament-line" />
              </div>
            ) : null}
            {localizedHero.description ? <p className="public-hero__support reveal reveal-delay-2">{localizedHero.description}</p> : null}
            <div className="public-hero__actions reveal reveal-delay-3">
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
        </div>

        <div
          className="public-hero__statistics"
          id="statistics"
          aria-label={t('statsAriaLabel')}
        >
          {showStatisticsLoading ? (
            <LoadingState message={t('loadingStats')} />
          ) : hasError ? (
            <ErrorState message={t('errorStats')} />
          ) : hasStatistics ? (
            <StatisticsGrid
              statistics={localizedStatistics}
              countersInView={true}
              animateOnMount
              revealCards
              enableEntranceAnimation={false}
              counterDurationMs={1200}
              counterRunOnce
              ariaLabel={t('statsAriaLabel')}
              gridClassName="public-statistics__grid--hero"
            />
          ) : (
            <EmptyState message={t('emptyStats')} />
          )}
        </div>
      </div>
    </section>
  );
}
