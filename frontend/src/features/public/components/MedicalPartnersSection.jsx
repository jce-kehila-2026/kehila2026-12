import { useRef } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PublicSectionHeading from './PublicSectionHeading';
import { usePublicLocale } from '../context/PublicLocaleContext';
import '../styles/public-medical-partners-section.css';

function CardDivider() {
  return (
    <div className="medical-partners__card-divider" aria-hidden="true">
      <span className="medical-partners__card-divider-line" />
      <span className="medical-partners__card-divider-heart">♥</span>
      <span className="medical-partners__card-divider-line" />
    </div>
  );
}

const SCROLL_AMOUNT = 320;

export default function MedicalPartnersSection({ partners = [] }) {
  const { t } = usePublicLocale();
  const trackRef = useRef(null);

  function scroll(direction) {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: direction * SCROLL_AMOUNT, behavior: 'smooth' });
  }

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

        <div className="medical-partners__carousel">
          <button
            type="button"
            className="medical-partners__nav-btn medical-partners__nav-btn--prev"
            onClick={() => scroll(1)}
            aria-label="הקודם"
          >
            <ChevronRightIcon />
          </button>

          <div className="medical-partners__scroll-track stagger-children" ref={trackRef}>
            {partners.map((partner) => (
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

          <button
            type="button"
            className="medical-partners__nav-btn medical-partners__nav-btn--next"
            onClick={() => scroll(-1)}
            aria-label="הבא"
          >
            <ChevronLeftIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
