import { useEffect, useId, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { getTeamMemberFallbackImage, getTeamMemberInitials } from '../data/teamSectionData';

export default function TeamSectionCard({ member, index = 0 }) {
  const [imageSrc, setImageSrc] = useState(member.image || getTeamMemberFallbackImage(index));
  const [imageFailed, setImageFailed] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const contactRef = useRef(null);
  const emailPopupId = useId();
  const initials = getTeamMemberInitials(member.name);
  const memberEmail = member.email || '';

  function handleImageError() {
    const fallback = getTeamMemberFallbackImage(index);
    if (imageSrc !== fallback) {
      setImageSrc(fallback);
      return;
    }
    setImageFailed(true);
  }

  function toggleEmail() {
    setEmailOpen((current) => !current);
  }

  useEffect(() => {
    if (!emailOpen) return undefined;

    function handlePointerDown(event) {
      if (contactRef.current && !contactRef.current.contains(event.target)) {
        setEmailOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setEmailOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [emailOpen]);

  return (
    <article className="public-team-section__card">
      <Box className="public-team-section__avatar-wrap">
        {imageSrc && !imageFailed ? (
          <img
            className="public-team-section__avatar"
            src={imageSrc}
            alt={member.name}
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <Box
            className="public-team-section__avatar public-team-section__avatar--placeholder"
            component="span"
            aria-hidden="true"
          >
            {initials}
          </Box>
        )}
      </Box>

      <h3 className="public-team-section__name">{member.name}</h3>
      <p className="public-team-section__role">{member.role}</p>
      <p className="public-team-section__description">{member.description}</p>

      <Box ref={contactRef} className="public-team-section__contact">
        <button
          type="button"
          className={`public-team-section__email-btn${emailOpen ? ' is-active' : ''}`}
          onClick={toggleEmail}
          aria-expanded={emailOpen}
          aria-controls={emailPopupId}
          aria-label={emailOpen ? `הסתרת דוא״ל של ${member.name}` : `הצגת דוא״ל של ${member.name}`}
        >
          <EmailOutlinedIcon fontSize="small" />
        </button>

        <Box
          id={emailPopupId}
          className={`public-team-section__email-popup${emailOpen ? ' is-open' : ''}`}
          role="region"
          aria-hidden={!emailOpen}
          aria-live="polite"
        >
          <span className="public-team-section__email-label">דוא״ל</span>
          <a className="public-team-section__email-link" href={`mailto:${memberEmail}`}>
            {memberEmail}
          </a>
        </Box>
      </Box>
    </article>
  );
}
