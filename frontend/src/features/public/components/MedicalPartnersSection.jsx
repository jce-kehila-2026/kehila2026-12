import { useMemo } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PublicSectionHeading from './PublicSectionHeading';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeField } from '../../../i18n/localizeField';
import '../styles/public-medical-partners-section.css';
import useHorizontalCardCarousel from '../hooks/useHorizontalCardCarousel';

function CardDivider() {
  return (
    <div className="medical-partners__card-divider" aria-hidden="true">
      <span className="medical-partners__card-divider-line" />
      <span className="medical-partners__card-divider-heart">♥</span>
      <span className="medical-partners__card-divider-line" />
    </div>
  );
}

export default function MedicalPartnersSection({ partners = [] }) {
  const { direction, t, locale } = usePublicLocale();

  // Localize admin-edited partner descriptions (org names left as-is).
  const localizedPartners = useMemo(() => {
    const list = Array.isArray(partners) ? partners : [];
    return list.map((partner) => ({
      ...partner,
      description: localizeField(partner.translations?.description ?? partner.description, locale),
    }));
  }, [partners, locale]);

  const carousel = useHorizontalCardCarousel({
    cardSelector: '.medical-partners__card',
    direction,
    itemCount: localizedPartners.length,
  });

  return (
    <section
      className="public-section public-section--medical-partners"
      id="medical-partners"
      aria-labelledby="medical-partners-title"
    >
      <div className="medical-partners__decor" aria-hidden="true">
        <span className="medical-partners__dots medical-partners__dots--mesh" />
        <span className="medical-partners__blob medical-partners__blob--pink" />
        <span className="medical-partners__blob medical-partners__blob--lavender" />
        <span className="medical-partners__blob medical-partners__blob--purple" />
        <span className="medical-partners__dots medical-partners__dots--one" />
        <span className="medical-partners__dots medical-partners__dots--two" />
      </div>

      <div className="medical-partners__inner">
        <PublicSectionHeading
          className="medical-partners__heading-wrap"
          eyebrow={t('medicalEyebrow')}
          title={t('medicalTitle')}
          titleId="medical-partners-title"
          subtitle={t('medicalSubtitle')}
        />

        <div className={[
          'medical-partners__carousel',
          'public-card-carousel',
          !carousel.showControls ? 'public-card-carousel--without-controls' : '',
          carousel.fadeLeft ? 'public-card-carousel--fade-left' : '',
          carousel.fadeRight ? 'public-card-carousel--fade-right' : '',
        ].filter(Boolean).join(' ')}>
          {carousel.showControls ? <button
            type="button"
            className="medical-partners__nav-btn medical-partners__nav-btn--prev public-card-carousel__button"
            onClick={() => carousel.scrollByCards(-1)}
            disabled={!carousel.canScrollPrev}
            aria-label="הקודם"
          >
            {direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button> : null}

          <div className="medical-partners__scroll-track public-card-carousel__track stagger-children" ref={carousel.scrollerRef}>
            {localizedPartners.map((partner) => (
              <article className="medical-partners__card reveal" key={partner.id}>
                <div className="medical-partner-logo-wrap">
                  {partner.logoUrl ? (
                    <img
                      className="medical-partner-logo"
                      src={partner.logoUrl}
                      alt={`${t('medicalLogoAlt')} ${partner.name}`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="medical-partner-logo-placeholder">{partner.name.slice(0, 2)}</span>
                  )}
                </div>
                <h3 className="medical-partners__name">{partner.name}</h3>
                <CardDivider />
                <p className="medical-partners__excerpt">{partner.description}</p>
              </article>
            ))}
          </div>

          {carousel.showControls ? <button
            type="button"
            className="medical-partners__nav-btn medical-partners__nav-btn--next public-card-carousel__button"
            onClick={() => carousel.scrollByCards(1)}
            disabled={!carousel.canScrollNext}
            aria-label="הבא"
          >
            {direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </button> : null}
        </div>
      </div>
    </section>
  );
}
