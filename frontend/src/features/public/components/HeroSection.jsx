import { useEffect, useMemo, useRef } from 'react';
import { HandHeart, Heart, MessageCircleMore, UsersRound } from 'lucide-react';
import heroSupportJourney from '../../../assets/images/hero-support-journey.png';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeStatistics } from '../i18n/publicHomeContentLocalization';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import { StatisticsGrid, adaptStatisticForRender } from './StatisticsSection';

const JOURNEY_STEPS = [
  { icon: MessageCircleMore, titleKey: 'heroStepContactTitle', textKey: 'heroStepContactText' },
  { icon: Heart, titleKey: 'heroStepMatchTitle', textKey: 'heroStepMatchText' },
  { icon: HandHeart, titleKey: 'heroStepGuideTitle', textKey: 'heroStepGuideText' },
  { icon: UsersRound, titleKey: 'heroStepTogetherTitle', textKey: 'heroStepTogetherText' },
];

const HERO_STATISTIC_VALUES = {
  community_women: 2545,
  annual_events: 120,
  volunteers: 85,
  success_stories: 1500,
};

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
  const adaptedStatistics = useMemo(
    () => (
      Array.isArray(statistics)
        ? statistics.map((statistic) => adaptStatisticForRender({
            ...statistic,
            value: HERO_STATISTIC_VALUES[statistic.id] ?? statistic.value,
          }))
        : []
    ),
    [statistics],
  );
  const localizedStatistics = useMemo(
    () => localizeStatistics(adaptedStatistics, locale),
    [adaptedStatistics, locale],
  );
  const backgroundImageUrl = heroSupportJourney;
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

      <div className="public-hero__layout">
        <div className="public-hero__content-region">
          <div className="public-hero__content">
            <h1 id="public-hero-title" className="reveal">
              <span className="public-hero__title-accent">{t('heroJourneyTitleAccent')}</span>{' '}
              <span>{t('heroJourneyTitleRest')}</span>
            </h1>
            <p className="public-hero__lead reveal reveal-delay-1">{t('heroJourneyIntro')}</p>

            <ol className="public-hero__journey reveal reveal-delay-2" aria-label={t('heroJourneyAriaLabel')}>
              {JOURNEY_STEPS.map(({ icon: Icon, titleKey }, index) => (
                <li className="public-hero__journey-step" key={titleKey}>
                  <div className="public-hero__journey-icon">
                    <Icon aria-hidden="true" strokeWidth={1.7} />
                    <span className="public-hero__journey-number">{index + 1}</span>
                  </div>
                  <h2>{t(titleKey)}</h2>
                </li>
              ))}
            </ol>

            <div className="public-hero__actions reveal reveal-delay-3">
              <a className="public-hero__btn public-hero__btn--secondary" href="#join" onClick={handleJoinClick}>
                {t('heroStartHere')}
              </a>
              <a
                className="public-hero__btn public-hero__btn--secondary"
                href="#support"
                dir={locale === 'en' ? 'ltr' : undefined}
              >
                {t('heroHowItWorks')}
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
