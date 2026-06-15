import { useCallback, useEffect, useRef, useState } from 'react';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ForwardToInboxOutlinedIcon from '@mui/icons-material/ForwardToInboxOutlined';
import CloseIcon from '@mui/icons-material/Close';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useAdmin } from '../context/AdminContext';
import { localizeField } from '../../../i18n/localizeField';
import {
  createUpdate,
  fetchUpdates,
  archiveUpdate,
  deleteUpdate,
  fetchParticipantEmails,
} from '../services/updatesService';
import './UpdatesPage.css';

const UPDATE_TYPES = [
  { value: 'general', label: 'General', icon: InfoOutlinedIcon, color: '#6d35b8' },
  { value: 'event_change', label: 'Event Change', icon: EventNoteOutlinedIcon, color: '#e05297' },
  { value: 'new_event', label: 'New Event', icon: NewReleasesOutlinedIcon, color: '#059669' },
  { value: 'reminder', label: 'Reminder', icon: NotificationsActiveOutlinedIcon, color: '#d97706' },
];

function typeMeta(type) {
  return UPDATE_TYPES.find((t) => t.value === type) ?? UPDATE_TYPES[0];
}

function relativeTime(ts) {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const BLANK_FORM = { title: '', body: '', type: 'general' };

export default function UpdatesPage() {
  const { currentUser } = useAdmin();

  // ── Compose state ────────────────────────────────────────
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const modalRef = useRef(null);

  // ── Email modal state ────────────────────────────────────
  const [emailTarget, setEmailTarget] = useState(null); // the update being emailed
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailList, setEmailList] = useState([]);
  const [emailFetchError, setEmailFetchError] = useState('');

  // ── Data loading ─────────────────────────────────────────
  const loadUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUpdates(!showArchived);
      setUpdates(data);
    } catch (err) {
      console.error('Failed to load updates:', err);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => { loadUpdates(); }, [loadUpdates]);

  // ── Escape closes any open modal ─────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setShowModal(false);
        setEmailTarget(null);
      }
    }
    if (showModal || emailTarget) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal, emailTarget]);

  // ── Compose handlers ─────────────────────────────────────
  function openModal() {
    setForm(BLANK_FORM);
    setError('');
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and body are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createUpdate(form, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email,
      });
      setShowModal(false);
      loadUpdates();
    } catch (err) {
      console.error('Failed to publish update:', err);
      setError('Failed to publish. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive(id) {
    try {
      await archiveUpdate(id);
      loadUpdates();
    } catch (err) {
      console.error('Failed to archive update:', err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Permanently delete this update? This cannot be undone.')) return;
    try {
      await deleteUpdate(id);
      loadUpdates();
    } catch (err) {
      console.error('Failed to delete update:', err);
    }
  }

  // ── Email handlers ───────────────────────────────────────
  async function handleEmailClick(update) {
    setEmailTarget(update);
    setEmailList([]);
    setEmailFetchError('');
    setEmailLoading(true);
    try {
      const emails = await fetchParticipantEmails();
      setEmailList(emails);
    } catch (err) {
      console.error('Failed to fetch participant emails:', err);
      setEmailFetchError('Could not load participant emails. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  }

  function handleProceedEmail() {
    if (!emailTarget || emailList.length === 0) return;
    const bcc = emailList.join(',');
    const subject = encodeURIComponent(`She-Na Update: ${localizeField(emailTarget.title, 'he')}`);
    const body = encodeURIComponent(
      `Hello,\n\n${localizeField(emailTarget.body, 'he')}\n\nBest regards,\nShe-Na Team`
    );
    window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
    setEmailTarget(null);
  }

  // ── Render ───────────────────────────────────────────────
  const visibleUpdates = updates.filter((u) => showArchived || u.active !== false);

  return (
    <div className="updates-page">
      {/* Header */}
      <div className="updates-page__header">
        <div className="updates-page__header-text">
          <div className="updates-page__icon-wrap">
            <CampaignOutlinedIcon />
          </div>
          <div>
            <h1>Updates &amp; Announcements</h1>
            <p>Publish and manage updates that participants see in their notification bell.</p>
          </div>
        </div>
        <div className="updates-page__header-actions">
          <button
            type="button"
            className={`updates-page__toggle-archived${showArchived ? ' is-active' : ''}`}
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? 'Hide archived' : 'Show archived'}
          </button>
          <button type="button" className="updates-page__new-btn" onClick={openModal}>
            <AddIcon fontSize="small" />
            New Update
          </button>
        </div>
      </div>

      {/* List */}
      <div className="updates-page__list">
        {loading && (
          <div className="updates-page__empty">
            <p>Loading updates…</p>
          </div>
        )}

        {!loading && visibleUpdates.length === 0 && (
          <div className="updates-page__empty">
            <CampaignOutlinedIcon className="updates-page__empty-icon" />
            <h3>No updates yet</h3>
            <p>Publish your first announcement and it will appear in participant notifications.</p>
            <button type="button" className="updates-page__new-btn" onClick={openModal}>
              <AddIcon fontSize="small" />
              Publish First Update
            </button>
          </div>
        )}

        {!loading && visibleUpdates.map((update) => {
          const meta = typeMeta(update.type);
          const Icon = meta.icon;
          const archived = update.active === false;
          return (
            <div key={update.id} className={`updates-page__card${archived ? ' is-archived' : ''}`}>
              <div className="updates-page__card-left">
                <span
                  className="updates-page__type-badge"
                  style={{ '--badge-color': meta.color }}
                >
                  <Icon style={{ fontSize: '0.8125rem' }} />
                  {meta.label}
                </span>
                {archived && <span className="updates-page__archived-tag">Archived</span>}
              </div>

              <div className="updates-page__card-body">
                <h3 className="updates-page__card-title">{localizeField(update.title, 'he')}</h3>
                <p className="updates-page__card-text">{localizeField(update.body, 'he')}</p>
                <div className="updates-page__card-meta">
                  <span>{relativeTime(update.createdAt)}</span>
                  {update.createdByName && <span>by {update.createdByName}</span>}
                </div>
              </div>

              <div className="updates-page__card-actions">
                {!archived && (
                  <button
                    type="button"
                    className="updates-page__action-btn updates-page__action-btn--email"
                    onClick={() => handleEmailClick(update)}
                  >
                    <ForwardToInboxOutlinedIcon fontSize="small" />
                    Send Email
                  </button>
                )}
                {!archived && (
                  <button
                    type="button"
                    className="updates-page__action-btn updates-page__action-btn--archive"
                    onClick={() => handleArchive(update.id)}
                  >
                    <ArchiveOutlinedIcon fontSize="small" />
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  className="updates-page__action-btn updates-page__action-btn--delete"
                  title="Delete permanently"
                  onClick={() => handleDelete(update.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compose Modal */}
      {showModal && (
        <div
          className="updates-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="New Update"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="updates-modal" ref={modalRef}>
            <div className="updates-modal__header">
              <h2>New Update</h2>
              <button
                type="button"
                className="updates-modal__close"
                aria-label="Close"
                onClick={() => setShowModal(false)}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <form className="updates-modal__form" onSubmit={handleSubmit}>
              <div className="updates-modal__field">
                <label htmlFor="update-type">Category</label>
                <div className="updates-modal__type-grid">
                  {UPDATE_TYPES.map((t) => {
                    const TIcon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        className={`updates-modal__type-opt${form.type === t.value ? ' is-selected' : ''}`}
                        style={{ '--opt-color': t.color }}
                        onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                      >
                        <TIcon style={{ fontSize: '1.125rem' }} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="updates-modal__field">
                <label htmlFor="update-title">Title</label>
                <input
                  id="update-title"
                  type="text"
                  className="updates-modal__input"
                  placeholder="Short headline, e.g. 'Yoga session moved to Monday'"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={120}
                  required
                />
              </div>

              <div className="updates-modal__field">
                <label htmlFor="update-body">Message</label>
                <textarea
                  id="update-body"
                  className="updates-modal__textarea"
                  placeholder="Full description of the update…"
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  rows={5}
                  required
                />
              </div>

              {error && <p className="updates-modal__error">{error}</p>}

              <div className="updates-modal__footer">
                <button
                  type="button"
                  className="updates-modal__cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="updates-modal__submit"
                  disabled={submitting}
                >
                  {submitting ? 'Publishing…' : 'Publish Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Confirmation Modal */}
      {emailTarget && (
        <div
          className="updates-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Send as Email"
          onClick={(e) => { if (e.target === e.currentTarget) setEmailTarget(null); }}
        >
          <div className="updates-modal">
            <div className="updates-modal__header">
              <div className="updates-email-modal__title">
                <ForwardToInboxOutlinedIcon style={{ fontSize: '1.25rem', color: '#6d35b8' }} />
                <h2>Send as Email</h2>
              </div>
              <button
                type="button"
                className="updates-modal__close"
                aria-label="Close"
                onClick={() => setEmailTarget(null)}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <div className="updates-modal__form">
              {/* Update preview */}
              <div className="updates-email-modal__preview">
                <p className="updates-email-modal__preview-label">Update</p>
                <p className="updates-email-modal__preview-title">{localizeField(emailTarget.title, 'he')}</p>
                <p className="updates-email-modal__preview-body">{localizeField(emailTarget.body, 'he')}</p>
              </div>

              {/* Info / status */}
              <div className="updates-email-modal__info">
                {emailLoading && (
                  <div className="updates-email-modal__status">
                    <span className="updates-email-modal__spinner" />
                    Fetching participant emails…
                  </div>
                )}

                {!emailLoading && emailFetchError && (
                  <p className="updates-modal__error">{emailFetchError}</p>
                )}

                {!emailLoading && !emailFetchError && (
                  <>
                    <div className="updates-email-modal__count">
                      <GroupOutlinedIcon style={{ fontSize: '1.125rem' }} />
                      <span>
                        <strong>{emailList.length}</strong> participant email{emailList.length !== 1 ? 's' : ''} found
                      </span>
                    </div>

                    {emailList.length > 100 && (
                      <div className="updates-email-modal__warning">
                        <WarningAmberOutlinedIcon style={{ fontSize: '1rem' }} />
                        <span>
                          Large recipient list ({emailList.length}). Some email clients may truncate
                          the BCC field. Consider splitting into batches.
                        </span>
                      </div>
                    )}

                    {emailList.length === 0 && (
                      <p className="updates-email-modal__note">
                        No participant accounts found. Make sure participants have an email saved
                        in their profile.
                      </p>
                    )}

                    <p className="updates-email-modal__note">
                      This will open your default email client with all participant emails in the
                      <strong> BCC</strong> field to protect privacy.
                    </p>
                  </>
                )}
              </div>

              <div className="updates-modal__footer">
                <button
                  type="button"
                  className="updates-modal__cancel"
                  onClick={() => setEmailTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="updates-modal__submit updates-email-modal__proceed"
                  disabled={emailLoading || emailList.length === 0 || !!emailFetchError}
                  onClick={handleProceedEmail}
                >
                  <ForwardToInboxOutlinedIcon style={{ fontSize: '1.0625rem' }} />
                  {emailLoading ? 'Loading…' : 'Open Email Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
