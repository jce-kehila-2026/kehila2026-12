import { lazy, Suspense, useMemo, useState } from 'react';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import {
  getSupportAreaImageAltForCard,
  getSupportAreaImageMeta,
} from '../constants/supportAreaImages';
import { enrichSupportAreaForModal } from '../constants/supportAreaModalContent';
import SupportAreaCardImage from './SupportAreaCardImage';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import '../styles/public-support-section.css';

const SupportAreaModal = lazy(() => import('./SupportAreaModal'));

const ICONS = {
  groups: GroupsRoundedIcon,
  workshop: AutoAwesomeRoundedIcon,
  heart: FavoriteBorderRoundedIcon,
  chat: ChatBubbleOutlineRoundedIcon,
  gift: VolunteerActivismRoundedIcon,
  calendar: EventAvailableRoundedIcon,
};

function SupportTitleAccent() {
  return (
    <div className="public-support__title-accent" aria-hidden="true">
      <span className="public-support__title-line" />
    </div>
  );
}

function prepareSupportArea(area, index) {
  const meta = getSupportAreaImageMeta(area, index);

  return {
    ...area,
    imageUrl: meta.bundledSrc,
    imagePosition: meta.position,
    imageAlt: getSupportAreaImageAltForCard(area, index),
  };
}

export default function SupportAreasSection({ supportAreas = [], isLoading = false, hasError = false }) {
  const [selectedArea, setSelectedArea] = useState(null);
  const visibleSupportAreas = useMemo(
    () => (Array.isArray(supportAreas) ? supportAreas.filter(Boolean).map((area, index) => prepareSupportArea(area, index)) : []),
    [supportAreas],
  );
  const selectedAreaDetails = selectedArea ? enrichSupportAreaForModal(selectedArea) : null;

  function handleReadMoreClick(preparedArea) {
    return function onClick(event) {
      event.preventDefault();
      setSelectedArea(preparedArea);
    };
  }

  function handleCloseModal() {
    setSelectedArea(null);
  }

  return (
    <section className="public-section public-section--support" id="support" aria-labelledby="public-support-title">
      <div className="public-support__decor" aria-hidden="true">
        <span className="public-support__dots public-support__dots--mesh" />
        <span className="public-support__blob public-support__blob--pink" />
        <span className="public-support__blob public-support__blob--lavender" />
        <span className="public-support__blob public-support__blob--purple" />
        <span className="public-support__dots public-support__dots--one" />
        <span className="public-support__dots public-support__dots--two" />
      </div>

      <div className="public-support__inner">
        <header className="public-support__header">
          <p className="public-support__eyebrow">מרחב של תמיכה והשראה</p>
          <h2 id="public-support-title" className="public-support__heading">
            השירותים והפעילויות שלנו
          </h2>
          <SupportTitleAccent />
          <p className="public-support__subtitle">
            כאן תמצאי מרחבים רכים של ליווי, חיבור וחיזוק — בדיוק במקום שבו את נמצאת בדרך.
          </p>
        </header>

        {isLoading ? (
          <LoadingState message="טוענות את תחומי התמיכה..." />
        ) : hasError ? (
          <ErrorState message="לא ניתן לטעון את תחומי התמיכה. מציגות תוכן זמין אחר." />
        ) : visibleSupportAreas.length ? (
          <div className="public-support__grid">
            {visibleSupportAreas.map((area) => (
              <article className="public-support__card" key={area.id || area.title}>
                <div className="public-support__media">
                  <SupportAreaCardImage
                    src={area.imageUrl}
                    alt={area.imageAlt || area.title || ''}
                    areaId={area.id}
                    position={area.imagePosition}
                  />
                  <div className="public-support__media-overlay" aria-hidden="true" />
                  <span className="public-support__card-icon" aria-hidden="true">
                    {(() => {
                      const Icon = ICONS[area.icon] || AutoAwesomeRoundedIcon;
                      return <Icon fontSize="inherit" />;
                    })()}
                  </span>
                </div>
                <div className="public-support__body">
                  <h3 className="public-support__title">{area.title}</h3>
                  <p className="public-support__excerpt">{area.description || area.text}</p>
                  <div className="public-support__actions">
                    <button type="button" className="public-support__more" onClick={handleReadMoreClick(area)}>
                      <span className="public-support__more-icon" aria-hidden="true">
                        <ArrowBackRoundedIcon fontSize="inherit" />
                      </span>
                      <span className="public-support__more-label">למידע נוסף</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="תחומי התמיכה יופיעו כאן כאשר התוכן הציבורי יהיה זמין." />
        )}
      </div>

      {selectedAreaDetails ? (
        <Suspense fallback={null}>
          <SupportAreaModal area={selectedAreaDetails} isOpen onClose={handleCloseModal} />
        </Suspense>
      ) : null}
    </section>
  );
}

