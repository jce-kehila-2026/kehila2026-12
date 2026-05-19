import { useState } from 'react';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import { enrichSupportAreaForModal } from '../constants/supportAreaModalContent';
import SupportAreaModal from './SupportAreaModal';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';

const ICONS = {
  groups: GroupsRoundedIcon,
  workshop: AutoAwesomeRoundedIcon,
  heart: FavoriteBorderRoundedIcon,
  chat: ChatBubbleOutlineRoundedIcon,
  gift: VolunteerActivismRoundedIcon,
  calendar: EventAvailableRoundedIcon,
};

export default function SupportAreasSection({ supportAreas = [], isLoading = false, hasError = false }) {
  const [selectedArea, setSelectedArea] = useState(null);
  const visibleSupportAreas = Array.isArray(supportAreas) ? supportAreas.filter(Boolean) : [];
  const selectedAreaDetails = selectedArea ? enrichSupportAreaForModal(selectedArea) : null;

  function handleReadMoreClick(area) {
    return function onClick(event) {
      event.preventDefault();
      setSelectedArea(area);
    };
  }

  function handleCloseModal() {
    setSelectedArea(null);
  }

  return (
    <section className="public-section public-section--support" id="support" aria-labelledby="public-support-title">
      <div className="public-section__header public-section__header--centered reveal">
        <p className="public-eyebrow">מרחב של תמיכה והשראה</p>
        <h2 id="public-support-title">מקום של תמיכה, תקווה וקהילה</h2>
        <p className="public-section__text reveal reveal-delay-1">
          כאן תמצאי מרחבים רכים של ליווי, חיבור וחיזוק — בדיוק במקום שבו את נמצאת בדרך.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="טוענות את תחומי התמיכה..." />
      ) : hasError ? (
        <ErrorState message="לא ניתן לטעון את תחומי התמיכה. מציגות תוכן זמין אחר." />
      ) : visibleSupportAreas.length ? (
        <div className="public-support__grid stagger-children">
          {visibleSupportAreas.map((area) => (
            <article className="public-support__card reveal" key={area.id || area.title}>
              <div className="public-support__media">
                {area.imageUrl ? (
                  <img src={area.imageUrl} alt={area.imageAlt || area.title} loading="lazy" />
                ) : (
                  <span className="public-support__image-placeholder" aria-hidden="true" />
                )}
                <span className="public-support__icon" aria-hidden="true">
                  {(() => {
                    const Icon = ICONS[area.icon] || AutoAwesomeRoundedIcon;
                    return <Icon fontSize="inherit" />;
                  })()}
                </span>
              </div>
              <div className="public-support__body">
                <h3>{area.title}</h3>
                <p>{area.description || area.text}</p>
                <button type="button" className="public-support__more" onClick={handleReadMoreClick(area)}>
                  למידע נוסף
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState message="תחומי התמיכה יופיעו כאן כאשר התוכן הציבורי יהיה זמין." />
      )}

      <SupportAreaModal area={selectedAreaDetails} isOpen={Boolean(selectedAreaDetails)} onClose={handleCloseModal} />
    </section>
  );
}
