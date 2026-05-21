import { useMemo, useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { MEDICAL_PARTNERS } from '../constants/medicalPartners';
import MedicalPartnerModal from './MedicalPartnerModal';
import PublicSectionHeading from './PublicSectionHeading';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeMedicalPartner } from '../i18n/publicHomeContentLocalization';
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

export default function MedicalPartnersSection() {
  const { locale, t } = usePublicLocale();
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const localizedPartners = useMemo(
    () => MEDICAL_PARTNERS.map((partner) => localizeMedicalPartner(partner, locale)),
    [locale],
  );
  const selectedPartner = localizedPartners.find((partner) => partner.id === selectedPartnerId) || null;

  function handleOpenModal(partner) {
    return function onClick(event) {
      event.preventDefault();
      setSelectedPartnerId(partner.id);
    };
  }

  function handleCloseModal() {
    setSelectedPartnerId(null);
  }

  return (
    <>
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

          <div className="medical-partners__grid stagger-children">
            {localizedPartners.map((partner) => (
              <article className="medical-partners__card reveal" key={partner.id}>
                <div
                  className={`medical-partner-logo-wrap${
                    partner.id === 'assuta-ashdod' ? ' medical-partner-logo-wrap--assuta' : ''
                  }`}
                >
                  <img
                    className="medical-partner-logo"
                    src={partner.logoSrc}
                    alt={`${t('medicalLogoAlt')} ${partner.name}`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className="medical-partners__name">{partner.name}</h3>
                <CardDivider />
                <p className="medical-partners__excerpt">{partner.shortDescription}</p>
                <button type="button" className="medical-partners__more" onClick={handleOpenModal(partner)}>
                  <span className="medical-partners__more-label">{t('medicalMore')}</span>
                  <span className="medical-partners__more-icon" aria-hidden="true">
                    <ArrowBackRoundedIcon fontSize="inherit" />
                  </span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {selectedPartner ? (
        <MedicalPartnerModal partner={selectedPartner} isOpen onClose={handleCloseModal} />
      ) : null}
    </>
  );
}
