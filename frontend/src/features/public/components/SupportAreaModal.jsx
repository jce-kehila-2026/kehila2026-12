import { useEffect, useId } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function SupportAreaModal({ area, isOpen, onClose }) {
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

  if (!isOpen || !area) {
    return null;
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleActionClick() {
    onClose();
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
        <button className="support-area-modal__close" type="button" onClick={onClose} aria-label="סגירת חלון">
          <CloseRoundedIcon fontSize="small" aria-hidden="true" />
        </button>

        {area.imageUrl ? (
          <div className="support-area-modal__media">
            <img src={area.imageUrl} alt={area.imageAlt || area.title} />
          </div>
        ) : null}

        <div className="support-area-modal__body">
          <h2 id={titleId}>{area.title}</h2>
          {area.longDescription ? <p className="support-area-modal__description">{area.longDescription}</p> : null}

          {area.infoPoints?.length ? (
            <ul className="support-area-modal__points">
              {area.infoPoints.map((point) => (
                <li className="support-area-modal__point" key={point.label}>
                  <strong>{point.label}</strong>
                  <span>{point.text}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <a className="support-area-modal__action" href={area.actionHref || '#contact'} onClick={handleActionClick}>
            {area.actionLabel || 'צרי קשר'}
          </a>
        </div>
      </article>
    </div>
  );
}
