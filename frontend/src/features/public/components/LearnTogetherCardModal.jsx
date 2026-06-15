import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SupportAreaCardImage from './SupportAreaCardImage';
import { getLearnTogetherCardImageMeta } from '../constants/supportAreaImages';
import { usePublicLocale } from '../context/PublicLocaleContext';
import '../styles/support-area-modal.css';

export default function LearnTogetherCardModal({ card, isOpen, onClose }) {
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

  if (!isOpen || !card) {
    return null;
  }

  const popup = card.popup || {};
  const imageMeta = getLearnTogetherCardImageMeta(card, card.order ?? 0);
  const sideImage = imageMeta.bundledSrc;
  const sections = Array.isArray(popup.sections) ? popup.sections : [];

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
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
        <button
          className="support-area-modal__close"
          type="button"
          onClick={onClose}
          aria-label={t('closeModal')}
        >
          <CloseRoundedIcon fontSize="inherit" aria-hidden="true" />
        </button>

        <div className="support-area-modal__media">
          <SupportAreaCardImage
            src={sideImage}
            alt={popup.title || card.title || ''}
            areaId={card.areaId || ''}
            position={card.imagePosition || imageMeta.position}
          />
        </div>

        <div className="support-area-modal__body" dir={direction}>
          <header className="support-area-modal__header">
            <h2 id={titleId}>{popup.title || card.title}</h2>
            {popup.paragraph ? (
              <p className="support-area-modal__description">{popup.paragraph}</p>
            ) : null}
          </header>

          {sections.length ? (
            <ul className="support-area-modal__points">
              {sections.map((section, index) => {
                return (
                  <li className="support-area-modal__point" key={`${section.label}-${index}`}>
                    <div className="support-area-modal__point-content">
                      <strong>{section.label}</strong>
                      <span>{section.text}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </article>
    </div>,
    document.body,
  );
}
