import { useMemo, useRef } from 'react';
import useInViewOnce from '../hooks/useInViewOnce';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeAboutUs } from '../i18n/publicHomeContentLocalization';
import { DEFAULT_ABOUT_US, ABOUT_US_CARD_COUNT } from '../services/publicPagesService';
import { getAboutUsIconComponent } from './cmsIcons';

const ABOUT_ICON_PROPS = {
  className: 'public-about__icon-glyph',
  strokeWidth: 1.5,
  absoluteStrokeWidth: true,
  'aria-hidden': true,
};

const CARD_STAGGER_MS = 90;

function AboutHeaderDivider() {
  return (
    <div className="public-about__divider public-about__divider--title" aria-hidden="true">
      <span className="public-about__divider-line" />
      <span className="public-about__divider-heart">♥</span>
      <span className="public-about__divider-line" />
    </div>
  );
}

export default function AboutSection({ aboutUs }) {
  const cardsRef = useRef(null);
  const cardsInView = useInViewOnce(cardsRef, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  const { locale, t } = usePublicLocale();

  const safeAboutUs = useMemo(() => {
    const source = aboutUs && typeof aboutUs === 'object' ? aboutUs : DEFAULT_ABOUT_US;
    return localizeAboutUs(source, locale);
  }, [aboutUs, locale]);

  const paragraph = safeAboutUs.paragraph || DEFAULT_ABOUT_US.paragraph;
  const incomingCards = Array.isArray(safeAboutUs.cards) ? safeAboutUs.cards : [];
  const cards = Array.from({ length: ABOUT_US_CARD_COUNT }, (_, displayIndex) => {
    const storageIndex = ABOUT_US_CARD_COUNT - 1 - displayIndex;
    const fallback = DEFAULT_ABOUT_US.cards[storageIndex];
    const card = incomingCards[storageIndex] || {};
    return {
      iconKey: card.iconKey || fallback.iconKey,
      title: card.title || fallback.title,
      description: card.description || fallback.description,
    };
  });

  return (
    <section className="public-section public-section--about" id="about" aria-labelledby="public-about-title">
      <svg className="public-about__icon-defs" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="public-about-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="52%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>
        </defs>
      </svg>

      <div className="public-about__decor" aria-hidden="true">
        <span className="public-about__dots" />
        <span className="public-about__blob public-about__blob--lavender" />
        <span className="public-about__blob public-about__blob--pink" />
        <span className="public-about__blob public-about__blob--purple" />
        <span className="public-about__sparkle public-about__sparkle--1" />
        <span className="public-about__sparkle public-about__sparkle--2" />
        <span className="public-about__sparkle public-about__sparkle--3" />
        <span className="public-about__butterfly public-about__butterfly--start" />
        <span className="public-about__butterfly public-about__butterfly--end" />
      </div>

      <div className="public-about__inner">
        <header className="public-about__header reveal">
          <p className="public-about__eyebrow">
            <span className="public-about__eyebrow-line" aria-hidden="true" />
            <span className="public-about__eyebrow-heart" aria-hidden="true">
              ♥
            </span>
            <span className="public-about__eyebrow-text">{t('aboutEyebrow')}</span>
            <span className="public-about__eyebrow-heart" aria-hidden="true">
              ♥
            </span>
            <span className="public-about__eyebrow-line" aria-hidden="true" />
          </p>

          <h2 id="public-about-title" className="public-about__title">
            {t('aboutTitle')}
          </h2>

          <AboutHeaderDivider />

          <p className="public-about__subtitle reveal reveal-delay-1">{paragraph}</p>
        </header>

        <div className="public-about__cards" ref={cardsRef} aria-label={t('aboutCardsAriaLabel')}>
          {cards.map((card, index) => {
            const Icon = getAboutUsIconComponent(card.iconKey);
            return (
              <article
                className={['public-about__card', 'reveal', cardsInView ? 'reveal-visible' : ''].filter(Boolean).join(' ')}
                key={`about-card-${index}`}
                style={{ '--about-card-stagger': `${index * CARD_STAGGER_MS}ms` }}
              >
                <span className="public-about__card-blob public-about__card-blob--start" aria-hidden="true" />
                <span className="public-about__card-blob public-about__card-blob--end" aria-hidden="true" />
                <span className="public-about__icon" aria-hidden="true">
                  <Icon {...ABOUT_ICON_PROPS} />
                </span>
                <h3>{card.title}</h3>
                <p className="public-about__card-text">{card.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
