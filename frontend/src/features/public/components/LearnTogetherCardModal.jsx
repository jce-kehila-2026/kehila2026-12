import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import SupportAreaCardImage from './SupportAreaCardImage';
import { getCmsIconComponent } from './cmsIcons';
import { getLearnTogetherCardImageMeta } from '../constants/supportAreaImages';
import '../styles/support-area-modal.css';

const INFO_POINT_ICONS = {
  'למי זה מתאים': PersonOutlineRoundedIcon,
  'מה מקבלות': CardGiftcardRoundedIcon,
  'איך מצטרפות': LoginRoundedIcon,
};

function getInfoPointIcon(label = '') {
  return INFO_POINT_ICONS[label] || FavoriteBorderRoundedIcon;
}

export default function LearnTogetherCardModal({ card, isOpen, onClose }) {
  const titleId = useId();

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
  const TitleIcon = getCmsIconComponent(card.iconKey);
  const imageQuote = card.description || popup.paragraph || '';

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
          aria-label="סגירת חלון"
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
          <div className="support-area-modal__media-overlay" aria-hidden="true">
            {imageQuote ? <p className="support-area-modal__quote">{imageQuote}</p> : null}
            <FavoriteBorderRoundedIcon className="support-area-modal__quote-icon" fontSize="small" />
          </div>
        </div>

        <div className="support-area-modal__body" dir="rtl">
          <header className="support-area-modal__header">
            <span className="support-area-modal__title-icon" aria-hidden="true">
              <TitleIcon size={22} strokeWidth={1.5} />
            </span>
            <h2 id={titleId}>{popup.title || card.title}</h2>
            {popup.paragraph ? (
              <p className="support-area-modal__description">{popup.paragraph}</p>
            ) : null}
          </header>

          {sections.length ? (
            <ul className="support-area-modal__points">
              {sections.map((section) => {
                const PointIcon = getInfoPointIcon(section.label);

                return (
                  <li className="support-area-modal__point" key={section.label}>
                    <span className="support-area-modal__point-icon" aria-hidden="true">
                      <PointIcon fontSize="inherit" />
                    </span>
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
