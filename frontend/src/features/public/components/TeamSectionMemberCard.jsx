import { useEffect, useId, useRef, useState } from 'react';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

function getPhotoSrc(member, useFallback) {
  if (useFallback && member.fallbackPhoto) {
    return member.fallbackPhoto;
  }

  return member.photo || member.fallbackPhoto || '';
}

export default function TeamSectionMemberCard({
  member,
  revealIndex = 0,
  revealVisible = false,
  staggerMs = 100,
}) {
  const popoverId = useId();
  const emailControlRef = useRef(null);
  const copyResetRef = useRef(null);
  const [photoSrc, setPhotoSrc] = useState(() => getPhotoSrc(member, false));
  const [emailOpen, setEmailOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPhotoSrc(getPhotoSrc(member, false));
  }, [member]);

  useEffect(() => {
    if (!emailOpen) {
      setCopied(false);
      return undefined;
    }

    function handlePointerDown(event) {
      if (emailControlRef.current && !emailControlRef.current.contains(event.target)) {
        setEmailOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setEmailOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [emailOpen]);

  useEffect(
    () => () => {
      if (copyResetRef.current) {
        window.clearTimeout(copyResetRef.current);
      }
    },
    [],
  );

  function handlePhotoError() {
    const fallback = getPhotoSrc(member, true);

    if (fallback && photoSrc !== fallback) {
      setPhotoSrc(fallback);
    }
  }

  function toggleEmailPopover() {
    setEmailOpen((open) => !open);
  }

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(member.email);
      setCopied(true);

      if (copyResetRef.current) {
        window.clearTimeout(copyResetRef.current);
      }

      copyResetRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article
      className={[
        'public-team-section__card',
        'reveal',
        revealVisible ? 'reveal-visible' : '',
        emailOpen ? 'public-team-section__card--email-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--team-card-stagger': `${revealIndex * staggerMs}ms` }}
    >
      <div className="public-team-section__avatar-wrap">
        <div className="public-team-section__avatar-shell">
          {photoSrc ? (
            <img
              className="public-team-section__avatar"
              src={photoSrc}
              alt={member.name}
              width={110}
              height={110}
              loading="lazy"
              decoding="async"
              onError={handlePhotoError}
            />
          ) : null}
        </div>
      </div>

      <h3 className="public-team-section__name">{member.name}</h3>
      <p className="public-team-section__role">{member.role}</p>
      <p className="public-team-section__description">{member.description}</p>

      <div className="public-team-section__social" ref={emailControlRef}>
        <button
          type="button"
          className="public-team-section__email-trigger"
          aria-label={`הצגת כתובת אימייל של ${member.name}`}
          aria-expanded={emailOpen}
          aria-controls={popoverId}
          onClick={toggleEmailPopover}
        >
          <EmailOutlinedIcon className="public-team-section__social-glyph" fontSize="inherit" aria-hidden="true" />
        </button>

        <div
          id={popoverId}
          role="dialog"
          aria-label={`אימייל של ${member.name}`}
          aria-hidden={!emailOpen}
          className={[
            'public-team-section__email-popover',
            emailOpen ? 'public-team-section__email-popover--open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="public-team-section__email-popover-inner">
            <button
              type="button"
              className={[
                'public-team-section__email-copy',
                copied ? 'public-team-section__email-copy--copied' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={handleCopyEmail}
            >
              {copied ? 'הועתק!' : 'העתקת אימייל'}
            </button>
            <div className="public-team-section__email-field">
              <a className="public-team-section__email-value" href={`mailto:${member.email}`} title={member.email}>
                {member.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
