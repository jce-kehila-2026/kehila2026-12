import { useEffect, useMemo, useRef } from 'react';
import { BookOpen, HandHeart, Heart, MessageCircleMore, Sparkles, UsersRound } from 'lucide-react';
import heroSupportJourney from '../../../assets/images/hero-support-journey.png';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeStatistics } from '../i18n/publicHomeContentLocalization';
import { localizeField } from '../../../i18n/localizeField';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import { StatisticsGrid, adaptStatisticForRender } from './StatisticsSection';

const JOURNEY_STEP_ICONS = [MessageCircleMore, Heart, HandHeart, UsersRound];

// Admin-selectable icon per step; falls back to the positional icon for legacy
// content saved before the icon picker existed.
const JOURNEY_STEP_ICON_COMPONENTS = {
  'message-circle': MessageCircleMore,
  heart: Heart,
  'hands-heart': HandHeart,
  'users-round': UsersRound,
  sparkles: Sparkles,
  'book-open': BookOpen,
};

const JOURNEY_STEP_FALLBACK_KEYS = [
  { titleKey: 'heroStepContactTitle' },
  { titleKey: 'heroStepMatchTitle' },
  { titleKey: 'heroStepGuideTitle' },
  { titleKey: 'heroStepTogetherTitle' },
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

/**
 * Resolve a CMS hero content field with localization.
 * Priority: Azure translation for current locale → Hebrew source → static t() fallback
 */
function resolveField(value, translationsObj, fieldName, locale, t, fallbackKey) {
  // For non-Hebrew: prefer Azure-translated value
  if (locale !== 'he') {
    const fromAzure = localizeField(translationsObj?.[fieldName], locale);
    if (fromAzure) return fromAzure;
  }
  // Hebrew or no Azure: use the CMS Hebrew value, then static fallback
  return value || t(fallbackKey);
}

export default function HeroSection({
  hero = {},
  heroContent,
  statistics = [],
  isLoading = false,
  hasError = false,
  onJoinClick,
}) {
  const { locale, t } = usePublicLocale();
  const hc = heroContent || {};
  const hcTranslations = hc.translations || {};

  // Resolve hero text fields with CMS → Azure → static fallback
  const title = resolveField(hc.title, hcTranslations, 'title', locale, t, 'heroJourneyTitle');
  const intro = resolveField(hc.intro, hcTranslations, 'intro', locale, t, 'heroJourneyIntro');
  const ctaJoin = resolveField(hc.ctaJoin, hcTranslations, 'ctaJoin', locale, t, 'heroStartHere');
  const ctaHowItWorks = resolveField(hc.ctaHowItWorks, hcTranslations, 'ctaHowItWorks', locale, t, 'heroHowItWorks');

  // Resolve journey steps with per-step Azure translations
  const steps = useMemo(() => {
    const cmsSteps = Array.isArray(hc.steps) && hc.steps.length > 0 ? hc.steps : null;
    return JOURNEY_STEP_ICONS.map((PositionalIcon, index) => {
      const cmsStep = cmsSteps?.[index];
      const stepTranslations = cmsStep?.translations || {};
      const fallback = JOURNEY_STEP_FALLBACK_KEYS[index];

      let title;
      if (locale !== 'he') {
        const fromAzure = localizeField(stepTranslations.title, locale);
        title = fromAzure || cmsStep?.title || t(fallback.titleKey);
      } else {
        title = cmsStep?.title || t(fallback.titleKey);
      }

      const Icon = JOURNEY_STEP_ICON_COMPONENTS[cmsStep?.iconKey] || PositionalIcon;

      return { Icon, title };
    });
  }, [hc.steps, locale, t]);

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
              {title}
            </h1>
            <p className="public-hero__lead reveal reveal-delay-1">{intro}</p>

            <ol className="public-hero__journey reveal reveal-delay-2" aria-label={t('heroJourneyAriaLabel')}>
              {steps.map(({ Icon, title }, index) => (
                <li className="public-hero__journey-step" key={index}>
                  <div className="public-hero__journey-icon">
                    <Icon aria-hidden="true" strokeWidth={1.7} />
                    <span className="public-hero__journey-number">{index + 1}</span>
                  </div>
                  <h2>{title}</h2>
                </li>
              ))}
            </ol>

            <div className="public-hero__actions reveal reveal-delay-3">
              <a className="public-hero__btn public-hero__btn--secondary" href="#join" onClick={handleJoinClick}>
                {ctaJoin}
              </a>
              <a
                className="public-hero__btn public-hero__btn--secondary"
                href="#support"
                dir={locale === 'en' ? 'ltr' : undefined}
              >
                {ctaHowItWorks}
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
