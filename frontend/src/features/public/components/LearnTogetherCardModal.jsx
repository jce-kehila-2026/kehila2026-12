import { useEffect, useId } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

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
  const sideImage = popup.sideImageUrl || card.imageUrl || '';
  const sections = Array.isArray(popup.sections) ? popup.sections : [];

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
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
          <CloseRoundedIcon fontSize="small" aria-hidden="true" />
        </button>

        <div className="support-area-modal__media">
          {sideImage ? (
            <img src={sideImage} alt={popup.title || card.title || ''} />
          ) : null}
        </div>

        <div className="support-area-modal__body">
          <h2 id={titleId}>{popup.title || card.title}</h2>
          {popup.paragraph ? (
            <p className="support-area-modal__description">{popup.paragraph}</p>
          ) : null}

          {sections.length ? (
            <ul className="support-area-modal__points">
              {sections.map((section, index) => (
                <li className="support-area-modal__point" key={index}>
                  <strong>{section.label}</strong>
                  <span>{section.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    </div>
  );
}
