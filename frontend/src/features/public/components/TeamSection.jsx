import { useMemo } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TEAM_MEMBERS } from '../constants/teamMembers';
import PublicSectionHeading from './PublicSectionHeading';
import TeamSectionMemberCard from './TeamSectionMemberCard';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeTeamStaff } from '../i18n/publicHomeContentLocalization';
import useHorizontalCardCarousel from '../hooks/useHorizontalCardCarousel';

const TEAM_CARD_STAGGER_MS = 100;

function adaptAdminMember(member) {
  if (!member || typeof member !== 'object') return member;
  return {
    id: member.id,
    name: member.name || '',
    role: member.role || '',
    description: member.bio || member.description || '',
    photo: member.imageUrl || member.photo || '',
    fallbackPhoto: member.fallbackPhoto || '',
    email: member.email || '',
    // Carry Azure translations, remapping the saved `bio` key to `description`
    // so the read localizer can treat all sections uniformly.
    translations: member.translations
      ? { role: member.translations.role, description: member.translations.bio }
      : undefined,
  };
}

export default function TeamSection({ members }) {
  const { locale, t, direction } = usePublicLocale();

  const source = useMemo(() => {
    if (Array.isArray(members) && members.length > 0) {
      return members
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(adaptAdminMember);
    }
    return TEAM_MEMBERS;
  }, [members]);

  const localizedMembers = useMemo(() => localizeTeamStaff(source, locale), [source, locale]);

  const carousel = useHorizontalCardCarousel({
    cardSelector: '.public-team-section__card',
    direction,
    itemCount: localizedMembers.length,
  });

  return (
    <section
      className="public-section public-section--team-section"
      id="team"
      aria-labelledby="public-team-section-title"
    >
      <div className="public-team-section__decor" aria-hidden="true">
        <span className="public-team-section__dots public-team-section__dots--mesh" />
        <span className="public-team-section__blob public-team-section__blob--pink" />
        <span className="public-team-section__blob public-team-section__blob--lavender" />
        <span className="public-team-section__blob public-team-section__blob--purple" />
        <span className="public-team-section__dots public-team-section__dots--one" />
        <span className="public-team-section__dots public-team-section__dots--two" />
      </div>

      <div className="public-team-section__inner">
        <PublicSectionHeading
          className="public-team-section__heading"
          eyebrow={t('teamEyebrow')}
          title={t('teamTitle')}
          titleId="public-team-section-title"
          subtitle={t('teamSubtitle')}
        />

        <div className={[
          'public-stories-slider',
          'public-card-carousel',
          !carousel.showControls ? 'public-card-carousel--without-controls' : '',
          carousel.fadeLeft ? 'public-card-carousel--fade-left' : '',
          carousel.fadeRight ? 'public-card-carousel--fade-right' : '',
        ].filter(Boolean).join(' ')}>
          {carousel.showControls ? <button
            type="button"
            className="public-stories-slider__arrow public-stories-slider__arrow--prev public-card-carousel__button"
            onClick={() => carousel.scrollByCards(-1)}
            disabled={!carousel.canScrollPrev}
            aria-label="Previous"
          >
            {direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button> : null}

          <div className="public-stories-slider__track public-card-carousel__track" ref={carousel.scrollerRef}>
            {localizedMembers.map((member, index) => (
              <TeamSectionMemberCard
                member={member}
                key={member.id}
                revealIndex={index}
                revealVisible
                staggerMs={TEAM_CARD_STAGGER_MS}
              />
            ))}
          </div>

          {carousel.showControls ? <button
            type="button"
            className="public-stories-slider__arrow public-stories-slider__arrow--next public-card-carousel__button"
            onClick={() => carousel.scrollByCards(1)}
            disabled={!carousel.canScrollNext}
            aria-label="Next"
          >
            {direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </button> : null}
        </div>
      </div>
    </section>
  );
}
