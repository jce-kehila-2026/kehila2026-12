import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
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

function StoryAvatar({ name, imageUrl }) {
  const trimmedUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [trimmedUrl]);

  const showImage = Boolean(trimmedUrl) && !failed;
  return (
    <div className="public-team-card__media">
      {showImage ? (
        <img
          src={trimmedUrl}
          alt={name || ''}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="public-team-card__placeholder" aria-hidden="true">
          {getInitials(name) || '★'}
        </div>
      )}
    </div>
  );
}

function StoryCard({ story, onReadMore, readMoreLabel }) {
  const { name, story: body, imageUrl, occupation } = story;
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return undefined;

    function check() {
      setIsOverflowing(el.scrollHeight - el.clientHeight > 1);
    }

    check();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', check);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [body]);

  return (
    <article className="public-team-card public-story-card reveal">
      <span className="public-team-card__quote-mark" aria-hidden="true">”</span>
      <StoryAvatar name={name} imageUrl={imageUrl} />
      <div className="public-team-card__body">
        {body ? (
          <p
            ref={textRef}
            className="public-team-card__description public-story-card__text"
          >
            "{body}"
          </p>
        ) : null}
        {isOverflowing ? (
          <button
            type="button"
            className="public-story-card__read-more"
            onClick={() => onReadMore(story)}
          >
            <span className="public-story-card__read-more-icon" aria-hidden="true">
              <ArrowBackRoundedIcon fontSize="inherit" />
            </span>
            <span className="public-story-card__read-more-label">{readMoreLabel}</span>
          </button>
        ) : null}
        {name ? <h3>{name}</h3> : null}
        {occupation ? <p className="public-team-card__role">{occupation}</p> : null}
      </div>
    </article>
  );
}

function StoryModal({ story, onClose, closeLabel }) {
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!story) return null;

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose();
  }

  const { name, story: body, imageUrl, occupation } = story;

  return createPortal(
    <div
      className="public-story-modal"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <article
        className="public-story-modal__dialog public-team-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="public-story-modal__close"
          onClick={onClose}
          aria-label={closeLabel}
        >
          <CloseRoundedIcon fontSize="inherit" aria-hidden="true" />
        </button>
        <div className="public-story-modal__header">
          <span className="public-team-card__quote-mark" aria-hidden="true">”</span>
          <StoryAvatar name={name} imageUrl={imageUrl} />
        </div>
        <div className="public-story-modal__scroll">
          <div className="public-team-card__body public-story-modal__body">
            {body ? (
              <p className="public-team-card__description public-story-modal__text">"{body}"</p>
            ) : null}
            {name ? <h3 id={titleId}>{name}</h3> : null}
            {occupation ? <p className="public-team-card__role">{occupation}</p> : null}
          </div>
        </div>
      </article>
    </div>,
    document.body,
  );
}

export default function InspirationStoriesSection({ stories = [] }) {
  const { t, direction } = usePublicLocale();
  const scrollerRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

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
              <StoryCard
                key={story.id}
                story={story}
                onReadMore={setSelectedStory}
                readMoreLabel={t('storyReadMore')}
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
      )}

      {selectedStory ? (
        <StoryModal
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          closeLabel={t('closeModal')}
        />
      ) : null}
    </section>
  );
}
