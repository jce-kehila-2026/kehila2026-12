import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import PublicSectionHeading from './PublicSectionHeading';
import TeamMemberCard from './TeamMemberCard';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeTeamStories } from '../i18n/publicHomeContentLocalization';

function getVisibleTeamMembers(teamMembers, maxItems) {
  return (Array.isArray(teamMembers) ? teamMembers : [])
    .filter((member) => {
      if (!member || typeof member !== 'object') {
        return false;
      }

      const isVisible = member.isVisible !== false && member.visible !== false && member.hidden !== true;
      const isPublished = member.isPublished !== false && member.published !== false;
      const isActive = member.active !== false && member.status !== 'inactive';
      const isDraft = member.status === 'draft' || member.status === 'unpublished';

      return isVisible && isPublished && isActive && !isDraft;
    })
    .slice(0, maxItems);
}

export default function TeamPreviewSection({
  teamMembers = [],
  maxItems = 20,
  isLoading = false,
  hasError = false,
}) {
  const { locale, t, direction } = usePublicLocale();
  const scrollerRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const visibleTeamMembers = useMemo(() => {
    const visible = getVisibleTeamMembers(teamMembers, maxItems);
    return localizeTeamStories(visible, locale);
  }, [locale, maxItems, teamMembers]);

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
  }, [updateBoundaries, visibleTeamMembers.length]);

  function scrollByCards(delta) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('.public-team-card');
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    const dir = direction === 'rtl' ? -delta : delta;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <section className="public-section public-section--team-preview" id="team" aria-labelledby="public-team-title">
      <PublicSectionHeading
        eyebrow={t('storiesEyebrow')}
        title={t('storiesTitle')}
        titleId="public-team-title"
        subtitle={t('storiesSubtitle')}
      />

      {isLoading ? (
        <LoadingState message={t('loadingStories')} />
      ) : hasError ? (
        <ErrorState message={t('errorStories')} />
      ) : visibleTeamMembers.length ? (
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
            {visibleTeamMembers.map((member) => (
              <TeamMemberCard member={member} key={member.id || member.name} />
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
      ) : (
        <EmptyState message={t('emptyStories')} />
      )}
    </section>
  );
}
