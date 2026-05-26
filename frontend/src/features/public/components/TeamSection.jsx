import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TEAM_MEMBERS } from '../constants/teamMembers';
import PublicSectionHeading from './PublicSectionHeading';
import TeamSectionMemberCard from './TeamSectionMemberCard';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeTeamStaff } from '../i18n/publicHomeContentLocalization';

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
  };
}

export default function TeamSection({ members }) {
  const scrollerRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
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

  const updateBoundaries = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }
    const absScroll = Math.abs(el.scrollLeft);
    setCanScrollPrev(absScroll > 1);
    setCanScrollNext(absScroll < maxScroll - 1);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    updateBoundaries();
    el.addEventListener('scroll', updateBoundaries, { passive: true });
    window.addEventListener('resize', updateBoundaries);
    return () => {
      el.removeEventListener('scroll', updateBoundaries);
      window.removeEventListener('resize', updateBoundaries);
    };
  }, [updateBoundaries, localizedMembers.length]);

  function scrollByCards(delta) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('.public-team-section__card');
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    const dir = direction === 'rtl' ? -delta : delta;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <section
      className="public-section public-section--team-section"
      id="team"
      aria-labelledby="public-team-section-title"
    >
      <div className="public-team-section__inner">
        <PublicSectionHeading
          className="public-team-section__heading"
          eyebrow={t('teamEyebrow')}
          title={t('teamTitle')}
          titleId="public-team-section-title"
          subtitle={t('teamSubtitle')}
        />

        <div className="public-stories-slider">
          <button
            type="button"
            className="public-stories-slider__arrow public-stories-slider__arrow--prev"
            onClick={() => scrollByCards(-1)}
            disabled={!canScrollPrev}
            aria-label="Previous"
          >
            <ChevronRightIcon />
          </button>

          <div className="public-stories-slider__track" ref={scrollerRef}>
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

          <button
            type="button"
            className="public-stories-slider__arrow public-stories-slider__arrow--next"
            onClick={() => scrollByCards(1)}
            disabled={!canScrollNext}
            aria-label="Next"
          >
            <ChevronLeftIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

