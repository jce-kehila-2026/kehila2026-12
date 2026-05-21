import { useCallback, useMemo, useRef, useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { CalendarHeart, HandHeart, Heart, MessageCircle, Sparkles, UsersRound } from 'lucide-react';
import LearnTogetherCardModal from './LearnTogetherCardModal';
import PublicSectionHeading from './PublicSectionHeading';
import SupportAreaCardImage from './SupportAreaCardImage';
import { getLearnTogetherCardImageMeta } from '../constants/supportAreaImages';

const CARD_ICONS = [UsersRound, Sparkles, CalendarHeart, MessageCircle, HandHeart, Heart];

const ICON_PROPS = {
  size: 26,
  strokeWidth: 1.75,
  absoluteStrokeWidth: true,
  'aria-hidden': true,
};

function CardTitleDivider() {
  return (
    <div className="public-support__card-divider" aria-hidden="true">
      <span className="public-support__card-divider-line" />
      <span className="public-support__card-divider-heart">♥</span>
      <span className="public-support__card-divider-line" />
    </div>
  );
}

function prepareLearnTogetherCard(card, index) {
  const imageMeta = getLearnTogetherCardImageMeta(card, index);

  return {
    ...card,
    areaId: imageMeta.id,
    imageUrl: imageMeta.bundledSrc,
    imagePosition: imageMeta.position,
    imageAlt: card.imageAlt || imageMeta.alt || card.title || '',
    cardIcon: CARD_ICONS[index % CARD_ICONS.length],
  };
}

function getCarouselScrollStep(scroller) {
  const firstCard = scroller.querySelector('.public-support__card');
  if (!firstCard) {
    return 0;
  }

  const grid = scroller.querySelector('.public-support__grid');
  const gridStyles = grid ? getComputedStyle(grid) : getComputedStyle(scroller);
  const scrollerStyles = getComputedStyle(scroller);
  const cssGap = parseFloat(scrollerStyles.getPropertyValue('--services-scroll-gap'));
  const gap = Number.isFinite(cssGap)
    ? cssGap
    : parseFloat(gridStyles.columnGap || gridStyles.gap || '0') || 0;

  return firstCard.offsetWidth + gap;
}

function scrollCarouselByDirection(scroller, direction) {
  const scrollAmount = getCarouselScrollStep(scroller);
  if (!scrollAmount) {
    return;
  }

  const isRtl = getComputedStyle(scroller).direction === 'rtl';
  let left = direction === 'next' ? scrollAmount : -scrollAmount;

  if (isRtl) {
    left = -left;
  }

  scroller.scrollBy({
    left,
    behavior: 'smooth',
  });
}

export default function LearnTogetherSection({ learnTogether }) {
  const scrollerRef = useRef(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const eyebrow = learnTogether?.eyebrow || 'מרחב של תמיכה והשראה';
  const paragraph =
    learnTogether?.paragraph ||
    'כאן תמצאי מרחבים רכים של ליווי, חיבור וחיזוק — בדיוק במקום שבו את נמצאת בדרך.';
  const cards = useMemo(
    () =>
      (Array.isArray(learnTogether?.cards) ? learnTogether.cards : [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((card, index) => prepareLearnTogetherCard(card, index)),
    [learnTogether?.cards],
  );

  const scrollCarousel = useCallback((direction) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scrollCarouselByDirection(scroller, direction);
  }, []);

  function handleOpenCard(card) {
    setSelectedCard(card);
  }

  function handleCloseModal() {
    setSelectedCard(null);
  }

  return (
    <section
      className="public-section public-section--support public-section--learn-together"
      id="support"
      aria-labelledby="public-support-title"
    >
      <div className="public-support__decor" aria-hidden="true">
        <span className="public-support__dots public-support__dots--mesh" />
        <span className="public-support__blob public-support__blob--pink" />
        <span className="public-support__blob public-support__blob--lavender" />
        <span className="public-support__blob public-support__blob--purple" />
        <span className="public-support__dots public-support__dots--one" />
        <span className="public-support__dots public-support__dots--two" />
        <span className="public-support__leaf public-support__leaf--start" />
        <span className="public-support__leaf public-support__leaf--end" />
      </div>

      <div className="public-support__inner">
        <PublicSectionHeading
          className="public-support__heading-wrap"
          eyebrow={eyebrow}
          title="השירותים והפעילויות שלנו"
          titleId="public-support-title"
          subtitle={paragraph}
        />

        {cards.length ? (
          <div className="public-support__carousel">
            <button
              type="button"
              className="public-support__scroll-btn public-support__scroll-btn--prev"
              aria-label="גלילה לפעילות הבאה"
              onClick={() => scrollCarousel('prev')}
            >
              <ChevronRightRoundedIcon fontSize="inherit" aria-hidden="true" />
            </button>

            <div className="services-grid-wrapper" ref={scrollerRef}>
              <div className="public-support__grid stagger-children">
                {cards.map((card) => {
                  const Icon = card.cardIcon;

                  return (
                    <article className="public-support__card reveal" key={card.id || card.title}>
                      <div className="public-support__media">
                        <SupportAreaCardImage
                          src={card.imageUrl}
                          alt={card.imageAlt || card.title || ''}
                          areaId={card.areaId || ''}
                          position={card.imagePosition}
                        />
                        <div className="public-support__media-overlay" aria-hidden="true" />
                        <span className="public-support__card-icon" aria-hidden="true">
                          <Icon {...ICON_PROPS} />
                        </span>
                      </div>
                      <div className="public-support__body">
                        <h3 className="public-support__title">{card.title}</h3>
                        <CardTitleDivider />
                        <p className="public-support__excerpt">{card.description}</p>
                        <div className="public-support__actions">
                          <button
                            type="button"
                            className="public-support__more"
                            onClick={() => handleOpenCard(card)}
                          >
                            <span className="public-support__more-icon" aria-hidden="true">
                              <ArrowBackRoundedIcon fontSize="inherit" />
                            </span>
                            <span className="public-support__more-label">למידע נוסף</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="public-support__scroll-btn public-support__scroll-btn--next"
              aria-label="גלילה לפעילות הקודמת"
              onClick={() => scrollCarousel('next')}
            >
              <ChevronLeftRoundedIcon fontSize="inherit" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <LearnTogetherCardModal
        card={selectedCard}
        isOpen={Boolean(selectedCard)}
        onClose={handleCloseModal}
      />
    </section>
  );
}
