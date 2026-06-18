import { useEffect, useRef } from 'react';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
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
  like: { label: 'Like', Icon: FavoriteBorderOutlinedIcon, color: '#e11d48' },
  support: { label: 'Support', Icon: VolunteerActivismOutlinedIcon, color: '#7b3fa1' },
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

function isUnread(update, lastSeenAt) {
  if (!lastSeenAt) return true;
  const seenMs = lastSeenAt.toMillis ? lastSeenAt.toMillis() : Number(lastSeenAt);
  return (update.createdAt?.toMillis?.() ?? 0) > seenMs;
}

export default function NotificationsDropdown({ updates, lastSeenAt, onMarkAllRead, onClose }) {
  const panelRef = useRef(null);
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
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Let the bell-button click land first, then close
        setTimeout(onClose, 0);
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [onClose]);

  const activeUpdates = updates.filter((u) => u.active !== false);

  return (
    <div className="notif-dropdown" ref={panelRef} role="dialog" aria-label={t('notifications')}>
      <div className="notif-dropdown__header">
        <div className="notif-dropdown__header-left">
          <NotificationsNoneOutlinedIcon className="notif-dropdown__header-icon" />
          <span>{t('notifUpdates')}</span>
        </div>
        {activeUpdates.length > 0 && (
          <button type="button" className="notif-dropdown__mark-all" onClick={onMarkAllRead}>
            <DoneAllIcon style={{ fontSize: '0.875rem' }} />
            {t('notifMarkAllRead')}
          </button>
        )}
      </div>

      <div className="notif-dropdown__list">
        {activeUpdates.length === 0 && (
          <div className="notif-dropdown__empty">
            <NotificationsNoneOutlinedIcon className="notif-dropdown__empty-icon" />
            <p>{t('notifCaughtUp')}</p>
            <span>{t('notifNoUpdates')}</span>
          </div>
        )}

        {activeUpdates.map((update) => {
          const meta = TYPE_META[update.type] ?? TYPE_META.general;
          const { Icon } = meta;
          const unread = isUnread(update, lastSeenAt);
          const title = getLocalizedText(update.title, currentLanguage);
          const body = getLocalizedText(update.body || update.text || update.message, currentLanguage);
          return (
            <div
              key={`${update.kind ?? 'update'}-${update.id}`}
              className={`notif-dropdown__item${unread ? ' is-unread' : ''}`}
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
