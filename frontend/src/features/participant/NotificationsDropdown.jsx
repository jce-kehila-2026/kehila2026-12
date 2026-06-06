import { useEffect, useRef } from 'react';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import './NotificationsDropdown.css';

const TYPE_META = {
  general: { label: 'General', Icon: InfoOutlinedIcon, color: '#7b3fa1' },
  event_change: { label: 'Event Change', Icon: EventNoteOutlinedIcon, color: '#ec168c' },
  new_event: { label: 'New Event', Icon: NewReleasesOutlinedIcon, color: '#059669' },
  reminder: { label: 'Reminder', Icon: NotificationsActiveOutlinedIcon, color: '#d97706' },
};

function relativeTime(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isUnread(update, lastSeenAt) {
  if (!lastSeenAt) return true;
  const seenMs = lastSeenAt.toMillis ? lastSeenAt.toMillis() : Number(lastSeenAt);
  return (update.createdAt?.toMillis?.() ?? 0) > seenMs;
}

export default function NotificationsDropdown({ updates, lastSeenAt, onMarkAllRead, onClose }) {
  const panelRef = useRef(null);

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
    <div className="notif-dropdown" ref={panelRef} role="dialog" aria-label="Notifications">
      <div className="notif-dropdown__header">
        <div className="notif-dropdown__header-left">
          <NotificationsNoneOutlinedIcon className="notif-dropdown__header-icon" />
          <span>Updates</span>
        </div>
        {activeUpdates.length > 0 && (
          <button type="button" className="notif-dropdown__mark-all" onClick={onMarkAllRead}>
            <DoneAllIcon style={{ fontSize: 14 }} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="notif-dropdown__list">
        {activeUpdates.length === 0 && (
          <div className="notif-dropdown__empty">
            <NotificationsNoneOutlinedIcon className="notif-dropdown__empty-icon" />
            <p>You're all caught up!</p>
            <span>No updates from the team yet.</span>
          </div>
        )}

        {activeUpdates.map((update) => {
          const meta = TYPE_META[update.type] ?? TYPE_META.general;
          const { Icon } = meta;
          const unread = isUnread(update, lastSeenAt);
          return (
            <div
              key={update.id}
              className={`notif-dropdown__item${unread ? ' is-unread' : ''}`}
            >
              {unread && <span className="notif-dropdown__unread-dot" style={{ '--dot-color': meta.color }} />}
              <span
                className="notif-dropdown__type-icon"
                style={{ '--icon-color': meta.color }}
              >
                <Icon style={{ fontSize: 16 }} />
              </span>
              <div className="notif-dropdown__item-body">
                <p className="notif-dropdown__item-title">{update.title}</p>
                <p className="notif-dropdown__item-text">{update.body}</p>
                <span className="notif-dropdown__item-time">{relativeTime(update.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
