import { useEffect, useState } from 'react';
import { useParticipantLocale } from '../context/ParticipantLocaleContext';
import SidebarCollapseButton from '../../../shared/components/SidebarCollapseButton';

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
  email = '',
  isLoading = false,
  collapsed = false,
  onToggleCollapse,
}) {
  const { t } = useParticipantLocale();
  const displayName = fullName.trim() || t('participantName');
  const displayEmail = String(email || '').trim() || t('noEmail');
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
          <strong>{isLoading ? t('loading') : displayName}</strong>
          <small title={isLoading ? undefined : displayEmail}>{isLoading ? t('loading') : displayEmail}</small>
        </div>
      </div>

      <SidebarCollapseButton
        collapsed={collapsed}
        onClick={onToggleCollapse}
        expandLabel={t('expandSidebar')}
        collapseLabel={t('collapseSidebar')}
      />
    </div>
  );
}
