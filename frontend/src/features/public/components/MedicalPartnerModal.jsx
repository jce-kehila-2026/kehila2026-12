import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import FamilyRestroomOutlinedIcon from '@mui/icons-material/FamilyRestroomOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import { usePublicLocale } from '../context/PublicLocaleContext';
import '../styles/medical-partner-logo.css';
import '../styles/medical-partner-modal.css';

const SERVICE_ICONS = {
  medical: LocalHospitalOutlinedIcon,
  support: PsychologyOutlinedIcon,
  groups: GroupsOutlinedIcon,
  family: FamilyRestroomOutlinedIcon,
  research: BiotechOutlinedIcon,
};

export default function MedicalPartnerModal({ partner, isOpen, onClose }) {
  const titleId = useId();
  const { direction, t } = usePublicLocale();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !partner) {
    return null;
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div className="medical-partner-modal__overlay" role="presentation" onMouseDown={handleBackdropClick}>
      <div
        className="medical-partner-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="medical-partner-modal__close" type="button" onClick={onClose} aria-label={t('closeModal')}>
          <CloseRoundedIcon fontSize="inherit" aria-hidden="true" />
        </button>

        <div className="medical-partner-modal__media">
          <div className="medical-partner-modal__media-frame">
            <img
              className="medical-partner-modal__hero"
              src={partner.heroImage}
              alt={partner.heroAlt || `${t('medicalHeroAlt')} — ${partner.name}`}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="medical-partner-modal__media-overlay" aria-hidden="true">
            <p className="medical-partner-modal__quote">{partner.heroQuote || t('defaultMedicalQuote')}</p>
            <FavoriteBorderRoundedIcon className="medical-partner-modal__quote-icon" fontSize="small" />
          </div>
        </div>

        <div className="medical-partner-modal__body" dir={direction}>
          <header className="medical-partner-modal__header">
            <div className="medical-partner-logo-wrap medical-partner-logo-wrap--modal">
              <img
                className="medical-partner-logo"
                src={partner.logoSrc}
                alt={`${t('medicalLogoAlt')} ${partner.name}`}
                loading="lazy"
                decoding="async"
              />
            </div>
            <h2 id={titleId}>{partner.name}</h2>
            <p className="medical-partner-modal__description">{partner.longDescription}</p>
          </header>

          {partner.services?.length ? (
            <ul className="medical-partner-modal__services" aria-label={t('medicalServicesAria')}>
              {partner.services.map((service) => {
                const Icon = SERVICE_ICONS[service.icon] || LocalHospitalOutlinedIcon;

                return (
                  <li className="medical-partner-modal__service" key={service.id}>
                    <span className="medical-partner-modal__service-icon" aria-hidden="true">
                      <Icon fontSize="inherit" />
                    </span>
                    <span>{service.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <ul className="medical-partner-modal__details">
            <li>
              <PhoneOutlinedIcon fontSize="small" aria-hidden="true" />
              <a href={`tel:${partner.phone?.replace(/[^\d+]/g, '')}`}>{partner.phone}</a>
            </li>
            <li>
              <EmailOutlinedIcon fontSize="small" aria-hidden="true" />
              <a href={`mailto:${partner.email}`}>{partner.email}</a>
            </li>
            <li>
              <ScheduleOutlinedIcon fontSize="small" aria-hidden="true" />
              <span>{partner.hours}</span>
            </li>
            <li>
              <PlaceOutlinedIcon fontSize="small" aria-hidden="true" />
              <span>{partner.address}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
