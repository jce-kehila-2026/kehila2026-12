import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EmptyState from './EmptyState';
import PublicSectionHeading from './PublicSectionHeading';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeField } from '../../../i18n/localizeField';
import useHorizontalCardCarousel from '../hooks/useHorizontalCardCarousel';

function isEnglishOnlyStory({ name, story, occupation } = {}) {
  const text = [name, occupation, story]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ');

  return /[A-Za-z]/.test(text) && !/[\u0590-\u08ff]/.test(text);
}

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
  const isLtr = isEnglishOnlyStory(story);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return undefined;
    let isMounted = true;

    function check() {
      if (isMounted) {
        setIsOverflowing(el.scrollHeight - el.clientHeight > 1);
      }
    }

    check();
    const frameId = window.requestAnimationFrame(check);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    if (ro) ro.observe(el);
    document.fonts?.ready.then(check);
    window.addEventListener('resize', check);
    return () => {
      isMounted = false;
      window.cancelAnimationFrame(frameId);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [body]);

  return (
    <article
      className={`public-team-card public-story-card reveal${isLtr ? ' public-story-card--ltr' : ''}`}
    >
      <StoryAvatar name={name} imageUrl={imageUrl} />
      {name || occupation ? (
        <div className="public-story-card__identity" dir={isLtr ? 'ltr' : undefined}>
          {name ? <h3>{name}</h3> : null}
          {occupation ? <p className="public-team-card__role">{occupation}</p> : null}
        </div>
      ) : null}
      <div className="public-story-card__content" dir={isLtr ? 'ltr' : undefined}>
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
            <span className="public-story-card__read-more-label">{readMoreLabel}</span>
          </button>
        ) : null}
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
  const isLtr = isEnglishOnlyStory(story);

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
        <div className="public-story-modal__header" dir={isLtr ? 'ltr' : undefined}>
          <StoryAvatar name={name} imageUrl={imageUrl} />
          <div className="public-story-modal__identity">
            {name ? <h3 id={titleId}>{name}</h3> : null}
            {occupation ? <p className="public-team-card__role">{occupation}</p> : null}
          </div>
        </div>
        <div className="public-story-modal__scroll">
          <div
            className={`public-story-modal__body${isLtr ? ' public-story-modal__body--ltr' : ''}`}
            dir={isLtr ? 'ltr' : undefined}
          >
            {body ? (
              <p className="public-team-card__description public-story-modal__text">"{body}"</p>
            ) : null}
          </div>
        </div>
      </article>
    </div>,
    document.body,
  );
}

export default function InspirationStoriesSection({ stories = [] }) {
  const { t, direction, locale } = usePublicLocale();
  const [selectedStory, setSelectedStory] = useState(null);

  // Localize admin-edited story text (occupation + story) for the current
  // locale via the stored translations; personal names are left as-is.
  const safeStories = useMemo(() => {
    const list = Array.isArray(stories) ? stories : [];
    return list.map((story) => ({
      ...story,
      occupation: localizeField(story.translations?.occupation ?? story.occupation, locale),
      story: localizeField(story.translations?.story ?? story.story, locale),
    }));
  }, [stories, locale]);
  const hasStories = safeStories.length > 0;
  const carousel = useHorizontalCardCarousel({
    cardSelector: '.public-story-card',
    direction,
    itemCount: safeStories.length,
  });

  return (
    <section
      className="public-section public-section--team-preview public-section--stories"
      id="stories"
      aria-labelledby="public-stories-title"
    >
      <div className="public-pink-section-decor" aria-hidden="true">
        <span className="public-pink-section-decor__dots public-pink-section-decor__dots--mesh" />
        <span className="public-pink-section-decor__blob public-pink-section-decor__blob--pink" />
        <span className="public-pink-section-decor__blob public-pink-section-decor__blob--lavender" />
        <span className="public-pink-section-decor__blob public-pink-section-decor__blob--purple" />
        <span className="public-pink-section-decor__dots public-pink-section-decor__dots--one" />
        <span className="public-pink-section-decor__dots public-pink-section-decor__dots--two" />
      </div>

      <div className="public-stories-section__inner">
        <PublicSectionHeading
          eyebrow={t('storiesEyebrow')}
          title={t('storiesTitle')}
          titleId="public-stories-title"
          subtitle={t('storiesSubtitle')}
        />

        {!hasStories ? (
          <EmptyState message={t('emptyStories')} />
        ) : (
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
              {safeStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onReadMore={setSelectedStory}
                  readMoreLabel={t('storyReadMore')}
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
        )}
      </div>

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
