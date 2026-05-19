import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import { resolveSupportAreaActionPath } from '../constants/supportAreaModalContent';
import SupportAreaCardImage from './SupportAreaCardImage';

const AREA_ICONS = {
  groups: GroupsRoundedIcon,
  workshop: AutoAwesomeRoundedIcon,
  heart: FavoriteBorderRoundedIcon,
  chat: ChatBubbleOutlineRoundedIcon,
  gift: VolunteerActivismRoundedIcon,
  calendar: EventAvailableRoundedIcon,
};

const INFO_POINT_ICONS = {
  'למי זה מתאים': PersonOutlineRoundedIcon,
  'מה מקבלות': CardGiftcardRoundedIcon,
  'איך מצטרפות': LoginRoundedIcon,
};

const DEFAULT_IMAGE_QUOTE = 'כאן תמיד יש מקום ללב, לתקווה ולחיבור אמיתי.';

function getInfoPointIcon(label = '') {
  return INFO_POINT_ICONS[label] || FavoriteBorderRoundedIcon;
}

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

  const AreaIcon = AREA_ICONS[area.icon] || FavoriteBorderRoundedIcon;

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
        <button className="support-area-modal__close" type="button" onClick={onClose} aria-label="סגירת חלון">
          <CloseRoundedIcon fontSize="inherit" aria-hidden="true" />
        </button>

        <div className="support-area-modal__media">
          <SupportAreaCardImage
            src={area.imageUrl}
            alt={area.imageAlt || area.title || ''}
            areaId={area.id}
            position={area.imagePosition}
          />
          <div className="support-area-modal__media-overlay" aria-hidden="true">
            <p className="support-area-modal__quote">{area.imageQuote || DEFAULT_IMAGE_QUOTE}</p>
            <FavoriteBorderRoundedIcon className="support-area-modal__quote-icon" fontSize="small" />
          </div>
        </div>

        <div className="support-area-modal__body" dir="rtl">
          <header className="support-area-modal__header">
            <span className="support-area-modal__title-icon" aria-hidden="true">
              <AreaIcon fontSize="inherit" />
            </span>
            <h2 id={titleId}>{area.title}</h2>
            {area.longDescription ? (
              <p className="support-area-modal__description">{area.longDescription}</p>
            ) : null}
          </header>

          {area.infoPoints?.length ? (
            <ul className="support-area-modal__points">
              {area.infoPoints.map((point) => {
                const PointIcon = getInfoPointIcon(point.label);

                return (
                  <li className="support-area-modal__point" key={point.label}>
                    <span className="support-area-modal__point-icon" aria-hidden="true">
                      <PointIcon fontSize="inherit" />
                    </span>
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
              <span className="support-area-modal__action-label">{area.actionLabel || 'צרי קשר'}</span>
              <FavoriteBorderRoundedIcon fontSize="inherit" aria-hidden="true" />
            </a>
            <button
              type="button"
              className="support-area-modal__action support-area-modal__action--secondary"
              onClick={onClose}
            >
              סגירה
            </button>
          </div>
        </div>
      </article>
    </div>,
    document.body,
  );
}
