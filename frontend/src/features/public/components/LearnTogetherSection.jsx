import { useMemo, useRef, useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LearnTogetherCardModal from './LearnTogetherCardModal';
import SupportAreaCardImage from './SupportAreaCardImage';
import { getCmsIconComponent } from './cmsIcons';
import useInViewOnce from '../hooks/useInViewOnce';
import {
  getLearnTogetherCardImageMeta,
} from '../constants/supportAreaImages';

const ICON_PROPS = {
  size: 28,
  strokeWidth: 1.5,
  absoluteStrokeWidth: true,
  'aria-hidden': true,
};

function SupportTitleAccent() {
  return (
    <div className="public-support__title-accent" aria-hidden="true">
      <span className="public-support__title-line" />
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
  const headerRef = useRef(null);
  const headerInView = useInViewOnce(headerRef);
  const [selectedCard, setSelectedCard] = useState(null);
  const eyebrow = learnTogether?.eyebrow || '';
  const paragraph = learnTogether?.paragraph || '';
  const cards = useMemo(
    () =>
      (Array.isArray(learnTogether?.cards) ? learnTogether.cards : [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((card, index) => prepareLearnTogetherCard(card, index)),
    [learnTogether?.cards],
  );

  function handleOpenCard(card) {
    setSelectedCard(card);
  }

  function handleCloseModal() {
    setSelectedCard(null);
  }

  const headerClassName = ['public-support__header', 'reveal', headerInView ? 'reveal-visible' : '']
    .filter(Boolean)
    .join(' ');

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
      </div>

      <div className="public-support__inner">
        <header className={headerClassName} ref={headerRef}>
          <p className="public-support__eyebrow">{eyebrow}</p>
          <h2 id="public-support-title" className="public-support__heading">
            השירותים והפעילויות שלנו
          </h2>
          <SupportTitleAccent />
          <p className="public-support__subtitle">{paragraph}</p>
        </header>

        {cards.length ? (
          <div className="services-grid-wrapper">
            <div className="public-support__grid stagger-children">
              {cards.map((card) => {
                const Icon = getCmsIconComponent(card.iconKey);

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
                    <p className="public-support__excerpt">{card.description}</p>
                    <div className="public-support__actions">
                      <button type="button" className="public-support__more" onClick={() => handleOpenCard(card)}>
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
