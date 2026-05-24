import { useCallback, useEffect, useRef, useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EmptyState from './EmptyState';
import PublicSectionHeading from './PublicSectionHeading';
import { usePublicLocale } from '../context/PublicLocaleContext';

function getInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function StoryCard({ story }) {
  const { name, story: body, imageUrl, occupation } = story;
  return (
    <article className="public-team-card public-story-card reveal">
      <span className="public-team-card__quote-mark" aria-hidden="true">”</span>
      <div className="public-team-card__media">
        {imageUrl ? (
          <img src={imageUrl} alt={name || ''} loading="lazy" />
        ) : (
          <div className="public-team-card__placeholder" aria-hidden="true">
            {getInitials(name)}
          </div>
        )}
      </div>
      <div className="public-team-card__body">
        {body ? <p className="public-team-card__description">"{body}"</p> : null}
        {name ? <h3>{name}</h3> : null}
        {occupation ? <p className="public-team-card__role">{occupation}</p> : null}
      </div>
    </article>
  );
}

export default function InspirationStoriesSection({ stories = [] }) {
  const { t, direction } = usePublicLocale();
  const scrollerRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

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
  }, [updateBoundaries, stories.length]);

  function scrollByCards(delta) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('.public-story-card');
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    const dir = direction === 'rtl' ? -delta : delta;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  const safeStories = Array.isArray(stories) ? stories : [];
  const hasStories = safeStories.length > 0;

  return (
    <section
      className="public-section public-section--team-preview public-section--stories"
      id="stories"
      aria-labelledby="public-stories-title"
    >
      <PublicSectionHeading
        eyebrow={t('storiesEyebrow')}
        title={t('storiesTitle')}
        titleId="public-stories-title"
        subtitle={t('storiesSubtitle')}
      />

      {!hasStories ? (
        <EmptyState message={t('emptyStories')} />
      ) : (
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
            {safeStories.map((story) => (
              <StoryCard story={story} key={story.id} />
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
      )}
    </section>
  );
}
