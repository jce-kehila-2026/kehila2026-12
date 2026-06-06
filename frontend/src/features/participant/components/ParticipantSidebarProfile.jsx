import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'PA';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function ParticipantSidebarProfile({
  fullName = '',
  avatarUrl = '',
  role = 'Participant',
  isLoading = false,
  collapsed = false,
  onToggleCollapse,
}) {
  const displayName = fullName.trim() || 'Participant';
  const initials = getInitials(displayName);
  const hasCustomAvatar = Boolean(String(avatarUrl || '').trim());
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatarImage = hasCustomAvatar && !avatarFailed;

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  return (
    <div className={`participant-sidebar-profile${collapsed ? ' is-collapsed' : ''}`}>
      <div className="participant-sidebar-profile__main">
        <div className="participant-sidebar-profile__avatar-wrap">
          {isLoading ? (
            <span className="participant-sidebar-profile__avatar participant-sidebar-profile__avatar--loading" aria-hidden="true" />
          ) : showAvatarImage ? (
            <img
              src={avatarUrl}
              alt=""
              className="participant-sidebar-profile__avatar"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <span className="participant-sidebar-profile__avatar participant-sidebar-profile__avatar--fallback" aria-hidden="true">
              {initials}
            </span>
          )}
        </div>

        <div className="participant-sidebar-profile__copy">
          <strong>{isLoading ? 'Loading…' : displayName}</strong>
          <small>{role}</small>
        </div>
      </div>

      <button
        type="button"
        className="participant-sidebar-collapse-btn"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
      >
        <span className="participant-sidebar-collapse-btn__icon" aria-hidden="true">
          {collapsed ? <ChevronRight size={15} strokeWidth={2.25} /> : <ChevronLeft size={15} strokeWidth={2.25} />}
        </span>
      </button>
    </div>
  );
}
