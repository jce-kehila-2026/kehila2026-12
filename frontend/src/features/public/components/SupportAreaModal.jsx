import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { resolveSupportAreaActionPath } from '../constants/supportAreaModalContent';
import { usePublicLocale } from '../context/PublicLocaleContext';
import SupportAreaCardImage from './SupportAreaCardImage';

export default function SupportAreaModal({ area, isOpen, onClose }) {
  const titleId = useId();
  const navigate = useNavigate();
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

  if (!isOpen || !area) {
    return null;
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  const actionPath = resolveSupportAreaActionPath(area.actionHref);

  function handlePrimaryActionClick(event) {
    event.preventDefault();
    onClose();

    if (/^https?:\/\//i.test(actionPath)) {
      window.location.assign(actionPath);
      return;
    }

    navigate(actionPath);
  }

  return createPortal(
    <div className="support-area-modal" role="presentation" onMouseDown={handleBackdropClick}>
      <article
        className="support-area-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="support-area-modal__close" type="button" onClick={onClose} aria-label={t('closeModal')}>
          <CloseRoundedIcon fontSize="inherit" aria-hidden="true" />
        </button>

        <div className="support-area-modal__media">
          <SupportAreaCardImage
            src={area.imageUrl}
            alt={area.imageAlt || area.title || ''}
            areaId={area.id}
            position={area.imagePosition}
          />
        </div>

        <div className="support-area-modal__body" dir={direction}>
          <header className="support-area-modal__header">
            <h2 id={titleId}>{area.title}</h2>
            {area.longDescription ? (
              <p className="support-area-modal__description">{area.longDescription}</p>
            ) : null}
          </header>

          {area.infoPoints?.length ? (
            <ul className="support-area-modal__points">
              {area.infoPoints.map((point) => {
                return (
                  <li className="support-area-modal__point" key={point.label}>
                    <div className="support-area-modal__point-content">
                      <strong>{point.label}</strong>
                      <span>{point.text}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className="support-area-modal__actions">
            <a
              className="support-area-modal__action support-area-modal__action--primary"
              href={actionPath}
              onClick={handlePrimaryActionClick}
            >
              <span className="support-area-modal__action-label">{area.actionLabel || t('supportAreaContact')}</span>
            </a>
            <button
              type="button"
              className="support-area-modal__action support-area-modal__action--secondary"
              onClick={onClose}
            >
              {t('closeModal')}
            </button>
          </div>
        </div>
      </article>
    </div>,
    document.body,
  );
}
