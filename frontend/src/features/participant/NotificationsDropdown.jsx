import { useEffect, useRef, useState } from 'react';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useParticipantLocale } from './context/ParticipantLocaleContext';
import './NotificationsDropdown.css';

const DATE_LOCALE_BY_LANG = { he: 'he-IL', ar: 'ar', en: 'en-US' };

function getLocalizedText(value, lang = 'en') {
  if (typeof value === 'string') return value;
  if (!value) return '';
  if (typeof value === 'object') {
    return String(value[lang] || value.en || value.he || value.ar || '');
  }
  return String(value);
}

const TYPE_META = {
  // Admin announcements
  general: { label: 'General', Icon: InfoOutlinedIcon, color: '#7b3fa1' },
  event_change: { label: 'Event Change', Icon: EventNoteOutlinedIcon, color: '#ec168c' },
  new_event: { label: 'New Event', Icon: NewReleasesOutlinedIcon, color: '#059669' },
  reminder: { label: 'Reminder', Icon: NotificationsActiveOutlinedIcon, color: '#d97706' },
  // Auto-generated community activity
  comment: { label: 'Comment', Icon: ChatBubbleOutlineOutlinedIcon, color: '#ec168c' },
  follow: { label: 'Follow', Icon: PersonAddAltOutlinedIcon, color: '#7b3fa1' },
  like: { label: 'Like', Icon: FavoriteBorderOutlinedIcon, color: '#e11d48' },
  support: { label: 'Support', Icon: VolunteerActivismOutlinedIcon, color: '#7b3fa1' },
  birthday_wish: { label: 'Birthday Wish', Icon: CakeOutlinedIcon, color: '#ec168c' },
  streak_reminder: { label: 'Streak Reminder', Icon: NotificationsActiveOutlinedIcon, color: '#d97706' },
  streak_grace: { label: 'Streak At Risk', Icon: HourglassEmptyOutlinedIcon, color: '#f59e0b' },
  streak_lost: { label: 'Streak Lost', Icon: HourglassEmptyOutlinedIcon, color: '#dc2626' },
};

function relativeTime(ts, t, lang = 'en') {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return t('timeJustNow');
  if (diff < 3600) return t('timeMinutesAgo').replace('{n}', String(Math.floor(diff / 60)));
  if (diff < 86400) return t('timeHoursAgo').replace('{n}', String(Math.floor(diff / 3600)));
  if (diff < 172800) return t('timeYesterday');
  return date.toLocaleDateString(DATE_LOCALE_BY_LANG[lang] || 'en-US', { month: 'short', day: 'numeric' });
}

function isCommunityNotification(update) {
  return update.kind === 'activity';
}

// Community activity and admin announcements track independent "seen" cutoffs.
// Older accounts only have the general cutoff, so community falls back to it.
function isUnread(update, lastSeen) {
  const general = lastSeen?.general ?? null;
  const community = lastSeen?.community ?? general;
  const cutoff = isCommunityNotification(update) ? community : general;
  if (!cutoff) return true;
  const seenMs = cutoff.toMillis ? cutoff.toMillis() : Number(cutoff);
  return (update.createdAt?.toMillis?.() ?? 0) > seenMs;
}

export default function NotificationsDropdown({
  updates,
  lastSeen,
  onMarkAllRead,
  onNotificationClick,
  onClose,
  ignoreOutsideClickRef,
}) {
  const panelRef = useRef(null);
  // Open on whichever tab actually has unread items so the bell badge never
  // points at a feed the dropdown isn't showing. Runs once per open (the
  // dropdown remounts each time it's toggled). Defaults to community.
  const [activeTab, setActiveTab] = useState(() => {
    const active = updates.filter((u) => u.active !== false);
    if (active.some((u) => isCommunityNotification(u) && isUnread(u, lastSeen))) return 'community';
    if (active.some((u) => !isCommunityNotification(u) && isUnread(u, lastSeen))) return 'general';
    return 'community';
  });
  const { t, lang: currentLanguage } = useParticipantLocale();

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    function onPointerDown(e) {
      if (
        ignoreOutsideClickRef?.current?.contains(e.target)
        || panelRef.current?.contains(e.target)
      ) {
        return;
      }

      if (panelRef.current) {
        // Let the bell-button click land first, then close
        setTimeout(onClose, 0);
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [ignoreOutsideClickRef, onClose]);

  const activeUpdates = updates.filter((u) => u.active !== false);
  const communityUpdates = activeUpdates.filter(isCommunityNotification);
  const generalUpdates = activeUpdates.filter((update) => !isCommunityNotification(update));
  const visibleUpdates = activeTab === 'community' ? communityUpdates : generalUpdates;
  const unreadCommunityCount = communityUpdates.filter((update) => isUnread(update, lastSeen)).length;
  const unreadGeneralCount = generalUpdates.filter((update) => isUnread(update, lastSeen)).length;
  const unreadTotalCount = unreadCommunityCount + unreadGeneralCount;

  return (
    <div className="notif-dropdown" ref={panelRef} role="dialog" aria-label={t('notifications')}>
      <div className="notif-dropdown__header">
        <div className="notif-dropdown__header-left">
          <NotificationsNoneOutlinedIcon className="notif-dropdown__header-icon" />
          <span>{t('notifUpdates')}</span>
        </div>
        {unreadTotalCount > 0 && (
          <button type="button" className="notif-dropdown__mark-all" onClick={onMarkAllRead}>
            <DoneAllIcon style={{ fontSize: '0.875rem' }} />
            {t('notifMarkAllRead')}
          </button>
        )}
      </div>

      <div className="notif-dropdown__tabs" role="tablist" aria-label={t('notifCategories')}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'community'}
          className={`notif-dropdown__tab${activeTab === 'community' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          <span>{t('notifCommunityUpdates')}</span>
          {unreadCommunityCount > 0 && <strong>{unreadCommunityCount}</strong>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'general'}
          className={`notif-dropdown__tab${activeTab === 'general' ? ' is-active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <span>{t('notifGeneral')}</span>
          {unreadGeneralCount > 0 && <strong>{unreadGeneralCount}</strong>}
        </button>
      </div>

      <div className="notif-dropdown__list">
        {visibleUpdates.length === 0 && (
          <div className="notif-dropdown__empty">
            <NotificationsNoneOutlinedIcon className="notif-dropdown__empty-icon" />
            <p>{t('notifCaughtUp')}</p>
            <span>
              {activeTab === 'community'
                ? t('notifNoCommunityUpdates')
                : t('notifNoGeneralUpdates')}
            </span>
          </div>
        )}

        {visibleUpdates.map((update) => {
          const meta = TYPE_META[update.type] ?? TYPE_META.general;
          const { Icon } = meta;
          const unread = isUnread(update, lastSeen);
          const title = getLocalizedText(update.title, currentLanguage);
          const body = getLocalizedText(update.body || update.text || update.message, currentLanguage);
          const canNavigate = Boolean(update.postId && update.kind === 'activity');
          // Navigable items always act; other items act only while unread, so a
          // click dismisses them (the parent advances the matching feed cutoff).
          const interactive = canNavigate || unread;
          const handleActivate = () => {
            if (interactive) onNotificationClick?.(update);
          };
          const handleItemKeyDown = (event) => {
            if (!interactive || (event.key !== 'Enter' && event.key !== ' ')) return;
            event.preventDefault();
            handleActivate();
          };
          return (
            <div
              key={`${update.kind ?? 'update'}-${update.id}`}
              className={`notif-dropdown__item${unread ? ' is-unread' : ''}${interactive ? ' is-clickable' : ''}`}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={handleActivate}
              onKeyDown={handleItemKeyDown}
            >
              {unread && <span className="notif-dropdown__unread-dot" style={{ '--dot-color': meta.color }} />}
              <span
                className="notif-dropdown__type-icon"
                style={{ '--icon-color': meta.color }}
              >
                <Icon style={{ fontSize: '1rem' }} />
              </span>
              <div className="notif-dropdown__item-body">
                <p className="notif-dropdown__item-title">{title}</p>
                <p className="notif-dropdown__item-text">{body}</p>
                <span className="notif-dropdown__item-time">{relativeTime(update.createdAt, t, currentLanguage)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
