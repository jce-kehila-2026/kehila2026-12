import { useMemo, useState } from 'react';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import LearnTogetherCardModal from './LearnTogetherCardModal';
import PublicSectionHeading from './PublicSectionHeading';
import SupportAreaCardImage from './SupportAreaCardImage';
import { getLearnTogetherCardImageMeta } from '../constants/supportAreaImages';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeLearnTogether } from '../i18n/publicHomeContentLocalization';
import useHorizontalCardCarousel from '../hooks/useHorizontalCardCarousel';

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
  };
}

export default function LearnTogetherSection({ learnTogether }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const { direction, locale, t } = usePublicLocale();

  const localizedLearnTogether = useMemo(
    () => localizeLearnTogether(learnTogether, locale),
    [learnTogether, locale],
  );

  const eyebrow = localizedLearnTogether?.eyebrow || t('learnTogetherTitle');
  const paragraph = localizedLearnTogether?.paragraph || '';
  const cards = useMemo(
    () =>
      (Array.isArray(localizedLearnTogether?.cards) ? localizedLearnTogether.cards : [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((card, index) => prepareLearnTogetherCard(card, index)),
    [localizedLearnTogether?.cards],
  );

  const carousel = useHorizontalCardCarousel({
    cardSelector: '.public-support__card',
    direction,
    itemCount: cards.length,
  });

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
          title={localizedLearnTogether?.title || t('learnTogetherTitle')}
          titleId="public-support-title"
          subtitle={paragraph}
        />

        {cards.length ? (
          <div className={[
            'public-support__carousel',
            'public-card-carousel',
            !carousel.showControls ? 'public-card-carousel--without-controls' : '',
            carousel.fadeLeft ? 'public-card-carousel--fade-left' : '',
            carousel.fadeRight ? 'public-card-carousel--fade-right' : '',
          ].filter(Boolean).join(' ')}>
            {carousel.showControls ? <button
              type="button"
              className="public-support__scroll-btn public-support__scroll-btn--prev public-card-carousel__button"
              aria-label={t('scrollPrevActivity')}
              onClick={() => carousel.scrollByCards(-1)}
              disabled={!carousel.canScrollPrev}
            >
              {direction === 'rtl' ? (
                <ChevronRightRoundedIcon fontSize="inherit" aria-hidden="true" />
              ) : (
                <ChevronLeftRoundedIcon fontSize="inherit" aria-hidden="true" />
              )}
            </button> : null}

            <div className="services-grid-wrapper public-card-carousel__track" ref={carousel.scrollerRef}>
              <div className="public-support__grid stagger-children">
                {cards.map((card) => (
                  <article className="public-support__card reveal" key={card.id || card.title}>
                    <div className="public-support__media">
                      <SupportAreaCardImage
                        src={card.imageUrl}
                        alt={card.imageAlt || card.title || ''}
                        areaId={card.areaId || ''}
                        position={card.imagePosition}
                      />
                      <div className="public-support__media-overlay" aria-hidden="true" />
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
                          <span className="public-support__more-label">{t('learnMore')}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {carousel.showControls ? <button
              type="button"
              className="public-support__scroll-btn public-support__scroll-btn--next public-card-carousel__button"
              aria-label={t('scrollNextActivity')}
              onClick={() => carousel.scrollByCards(1)}
              disabled={!carousel.canScrollNext}
            >
              {direction === 'rtl' ? (
                <ChevronLeftRoundedIcon fontSize="inherit" aria-hidden="true" />
              ) : (
                <ChevronRightRoundedIcon fontSize="inherit" aria-hidden="true" />
              )}
            </button> : null}
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
