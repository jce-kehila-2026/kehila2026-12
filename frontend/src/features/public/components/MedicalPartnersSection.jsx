import { useState } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { MEDICAL_PARTNERS } from '../constants/medicalPartners';
import MedicalPartnerModal from './MedicalPartnerModal';
import '../styles/public-medical-partners-section.css';

function TitleAccent() {
  return (
    <div className="medical-partners__title-accent" aria-hidden="true">
      <span className="medical-partners__title-line" />
    </div>
  );
}

export default function MedicalPartnersSection() {
  const [selectedPartner, setSelectedPartner] = useState(null);

  function handleOpenModal(partner) {
    return function onClick(event) {
      event.preventDefault();
      setSelectedPartner(partner);
    };
  }

  function handleCloseModal() {
    setSelectedPartner(null);
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
        <header className="medical-partners__header reveal">
          <p className="medical-partners__eyebrow">המרכזים הרפואיים המלווים אותנו</p>
          <h2 id="medical-partners-title" className="medical-partners__heading">
            השותפים שלנו
          </h2>
          <TitleAccent />
          <p className="medical-partners__subtitle reveal reveal-delay-1">
            אנחנו גאות לשתף פעולה עם בתי חולים מובילים שמעניקים ליווי רפואי מקצועי, חמלה ותמיכה אישית לנשים
            ולמשפחות — בכל שלב בדרך.
          </p>
        </header>

        <div className="medical-partners__grid stagger-children">
          {MEDICAL_PARTNERS.map((partner) => (
            <article className="medical-partners__card reveal" key={partner.id}>
              <div
                className={`medical-partner-logo-wrap${
                  partner.id === 'assuta-ashdod' ? ' medical-partner-logo-wrap--assuta' : ''
                }`}
              >
                <img
                  className="medical-partner-logo"
                  src={partner.logoSrc}
                  alt={`לוגו ${partner.name}`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3 className="medical-partners__name">{partner.name}</h3>
              <span className="medical-partners__card-accent" aria-hidden="true" />
              <p className="medical-partners__excerpt">{partner.shortDescription}</p>
              <button type="button" className="medical-partners__more" onClick={handleOpenModal(partner)}>
                <span className="medical-partners__more-label">לפרטים נוספים</span>
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
