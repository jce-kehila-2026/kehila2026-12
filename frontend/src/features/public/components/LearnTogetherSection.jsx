import { useState } from 'react';
import LearnTogetherCardModal from './LearnTogetherCardModal';
import { getCmsIconComponent } from './cmsIcons';

const ICON_PROPS = {
  size: 28,
  strokeWidth: 1.5,
  absoluteStrokeWidth: true,
  'aria-hidden': true,
};

export default function LearnTogetherSection({ learnTogether }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const eyebrow = learnTogether?.eyebrow || '';
  const title = learnTogether?.title || '';
  const paragraph = learnTogether?.paragraph || '';
  const cards = Array.isArray(learnTogether?.cards)
    ? learnTogether.cards
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

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
      <div className="public-section__header public-section__header--centered reveal">
        <p className="public-eyebrow">{eyebrow}</p>
        <h2 id="public-support-title">{title}</h2>
        <p className="public-section__text reveal reveal-delay-1">{paragraph}</p>
      </div>

      {cards.length ? (
        <div className="public-learn-together__scroller">
          <div className="public-learn-together__row stagger-children">
            {cards.map((card) => {
              const Icon = getCmsIconComponent(card.iconKey);
              return (
                <article className="public-support__card public-learn-together__card reveal" key={card.id}>
                  <div className="public-support__media">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.title || ''} loading="lazy" />
                    ) : (
                      <span className="public-support__image-placeholder" aria-hidden="true" />
                    )}
                    <span className="public-support__icon" aria-hidden="true">
                      <Icon {...ICON_PROPS} />
                    </span>
                  </div>
                  <div className="public-support__body">
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                    <button
                      type="button"
                      className="public-support__more"
                      onClick={() => handleOpenCard(card)}
                    >
                      למידע נוסף
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <LearnTogetherCardModal
        card={selectedCard}
        isOpen={Boolean(selectedCard)}
        onClose={handleCloseModal}
      />
    </section>
  );
}
