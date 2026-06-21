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
import { useAdminLocale } from '../context/AdminLocaleContext';
import { localizeField } from '../../../i18n/localizeField';
import {
  createUpdate,
  fetchUpdates,
  archiveUpdate,
  deleteUpdate,
  fetchParticipants,
} from '../services/updatesService';
import './UpdatesPage.css';

const UPDATE_TYPES = [
  { value: 'general', labelKey: 'upTypeGeneral', icon: InfoOutlinedIcon, color: '#6d35b8' },
  { value: 'event_change', labelKey: 'upTypeEventChange', icon: EventNoteOutlinedIcon, color: '#e05297' },
  { value: 'new_event', labelKey: 'upTypeNewEvent', icon: NewReleasesOutlinedIcon, color: '#059669' },
  { value: 'reminder', labelKey: 'upTypeReminder', icon: NotificationsActiveOutlinedIcon, color: '#d97706' },
];

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en-US' };

function typeMeta(type) {
  return UPDATE_TYPES.find((t) => t.value === type) ?? UPDATE_TYPES[0];
}

function relativeTime(ts, t, intlLocale) {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return t('upJustNow');
  if (diff < 3600) return t('upMinAgo').replace('{n}', Math.floor(diff / 60));
  if (diff < 86400) return t('upHourAgo').replace('{n}', Math.floor(diff / 3600));
  if (diff < 172800) return t('upYesterday');
  return date.toLocaleDateString(intlLocale, { month: 'short', day: 'numeric', year: 'numeric' });
}

const BLANK_FORM = { title: '', body: '', type: 'general' };
const SEND_ALL = '__all__';

export default function UpdatesPage() {
  const { currentUser } = useAdmin();
  const { t, lang, direction } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en';

  // ── Compose state ────────────────────────────────────────
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const modalRef = useRef(null);

  // ── Compose recipient picker state ───────────────────────
  const [composeRecipients, setComposeRecipients] = useState([]);
  const [composeRecipientsLoading, setComposeRecipientsLoading] = useState(false);
  const [composeRecipientsFetchError, setComposeRecipientsFetchError] = useState('');
  const [composeSelectedUids, setComposeSelectedUids] = useState(SEND_ALL);

  // ── Email modal state ────────────────────────────────────
  const [emailTarget, setEmailTarget] = useState(null); // the update being emailed
  const [emailLoading, setEmailLoading] = useState(false);
  const [recipients, setRecipients] = useState([]); // [{ name, email }]
  const [selectedEmails, setSelectedEmails] = useState(() => new Set());
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
  async function openModal() {
    setForm(BLANK_FORM);
    setError('');
    setComposeSelectedUids(SEND_ALL);
    setComposeRecipients([]);
    setComposeRecipientsFetchError('');
    setShowModal(true);

    // Load participants for the recipient picker
    setComposeRecipientsLoading(true);
    try {
      const people = await fetchParticipants();
      setComposeRecipients(people);
    } catch (err) {
      console.error('Failed to fetch participants for compose:', err);
      setComposeRecipientsFetchError(t('upErrLoadParticipants'));
    } finally {
      setComposeRecipientsLoading(false);
    }
  }

  function toggleComposeRecipient(uid) {
    setComposeSelectedUids((prev) => {
      // If switching from "all" to individual selection,
      // start with everyone selected except the toggled one
      if (prev === SEND_ALL) {
        const allUids = new Set(composeRecipients.map((p) => p.uid));
        allUids.delete(uid);
        return allUids;
      }
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      // If all are now selected, switch back to SEND_ALL
      if (next.size === composeRecipients.length) return SEND_ALL;
      return next;
    });
  }

  function toggleComposeSelectAll() {
    setComposeSelectedUids((prev) => {
      if (prev === SEND_ALL) return new Set();
      return SEND_ALL;
    });
  }

  const composeAllSelected = composeSelectedUids === SEND_ALL;
  const composeSelectedCount = composeAllSelected
    ? composeRecipients.length
    : composeSelectedUids.size;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError(t('upErrTitleBodyRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // Build targetUids from the compose recipient selection
      let targetUids;
      if (composeSelectedUids !== SEND_ALL && composeSelectedUids.size > 0) {
        targetUids = Array.from(composeSelectedUids);
      }
      await createUpdate({ ...form, targetUids }, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email,
      });
      setShowModal(false);
      loadUpdates();
    } catch (err) {
      console.error('Failed to publish update:', err);
      setError(t('upErrPublishFailed'));
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
    if (!window.confirm(t('upConfirmDelete'))) return;
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
    setRecipients([]);
    setSelectedEmails(new Set());
    setEmailFetchError('');
    setEmailLoading(true);
    try {
      const people = await fetchParticipants();
      setRecipients(people);
      // Pre-select everyone by default — sending to all is the common case.
      setSelectedEmails(new Set(people.map((p) => p.email)));
    } catch (err) {
      console.error('Failed to fetch participants:', err);
      setEmailFetchError(t('upErrLoadParticipants'));
    } finally {
      setEmailLoading(false);
    }
  }

  function toggleRecipient(email) {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  const allSelected = recipients.length > 0 && selectedEmails.size === recipients.length;

  function toggleSelectAll() {
    setSelectedEmails(allSelected ? new Set() : new Set(recipients.map((p) => p.email)));
  }

  function handleProceedEmail() {
    if (!emailTarget || selectedEmails.size === 0) return;
    const bcc = recipients
      .filter((p) => selectedEmails.has(p.email))
      .map((p) => p.email)
      .join(',');
    const subject = encodeURIComponent(
      t('upEmailSubject').replace('{title}', localizeField(emailTarget.title, 'he'))
    );
    const body = encodeURIComponent(
      t('upEmailBody').replace('{body}', localizeField(emailTarget.body, 'he'))
    );
    window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
    setEmailTarget(null);
  }

  // ── Render ───────────────────────────────────────────────
  const visibleUpdates = updates.filter((u) => showArchived || u.active !== false);

  return (
    <div className="updates-page" dir={direction}>
      {/* Header */}
      <div className="updates-page__header">
        <div className="updates-page__header-text">
          <div className="updates-page__icon-wrap">
            <CampaignOutlinedIcon />
          </div>
          <div>
            <h1>{t('upHeaderTitle')}</h1>
            <p>{t('upHeaderSubtitle')}</p>
          </div>
        </div>
        <div className="updates-page__header-actions">
          <button
            type="button"
            className={`updates-page__toggle-archived${showArchived ? ' is-active' : ''}`}
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? t('upHideArchived') : t('upShowArchived')}
          </button>
          <button type="button" className="updates-page__new-btn" onClick={openModal}>
            <AddIcon fontSize="small" />
            {t('upNewUpdate')}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="updates-page__list">
        {loading && (
          <div className="updates-page__empty">
            <p>{t('upLoading')}</p>
          </div>
        )}

        {!loading && visibleUpdates.length === 0 && (
          <div className="updates-page__empty">
            <CampaignOutlinedIcon className="updates-page__empty-icon" />
            <h3>{t('upEmptyTitle')}</h3>
            <p>{t('upEmptySubtitle')}</p>
            <button type="button" className="updates-page__new-btn" onClick={openModal}>
              <AddIcon fontSize="small" />
              {t('upPublishFirst')}
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
                  {t(meta.labelKey)}
                </span>
                {archived && <span className="updates-page__archived-tag">{t('upArchivedTag')}</span>}
              </div>

              <div className="updates-page__card-body">
                <h3 className="updates-page__card-title">{localizeField(update.title, 'he')}</h3>
                <p className="updates-page__card-text">{localizeField(update.body, 'he')}</p>
                <div className="updates-page__card-meta">
                  <span>{relativeTime(update.createdAt, t, intlLocale)}</span>
                  {update.createdByName && <span>{t('upBy').replace('{name}', update.createdByName)}</span>}
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
                    {t('upSendEmail')}
                  </button>
                )}
                {!archived && (
                  <button
                    type="button"
                    className="updates-page__action-btn updates-page__action-btn--archive"
                    onClick={() => handleArchive(update.id)}
                  >
                    <ArchiveOutlinedIcon fontSize="small" />
                    {t('upArchive')}
                  </button>
                )}
                <button
                  type="button"
                  className="updates-page__action-btn updates-page__action-btn--delete"
                  title={t('upDeletePermanently')}
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
          aria-label={t('upModalTitle')}
          dir={direction}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="updates-modal" ref={modalRef}>
            <div className="updates-modal__header">
              <h2>{t('upModalTitle')}</h2>
              <button
                type="button"
                className="updates-modal__close"
                aria-label={t('upClose')}
                onClick={() => setShowModal(false)}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <form className="updates-modal__form" onSubmit={handleSubmit}>
              <div className="updates-modal__field">
                <label htmlFor="update-type">{t('upCategory')}</label>
                <div className="updates-modal__type-grid">
                  {UPDATE_TYPES.map((opt) => {
                    const TIcon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`updates-modal__type-opt${form.type === opt.value ? ' is-selected' : ''}`}
                        style={{ '--opt-color': opt.color }}
                        onClick={() => setForm((f) => ({ ...f, type: opt.value }))}
                      >
                        <TIcon style={{ fontSize: '1.125rem' }} />
                        {t(opt.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="updates-modal__field">
                <label htmlFor="update-title">{t('upTitleLabel')}</label>
                <input
                  id="update-title"
                  type="text"
                  className="updates-modal__input"
                  placeholder={t('upTitlePlaceholder')}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={120}
                  required
                />
              </div>

              <div className="updates-modal__field">
                <label htmlFor="update-body">{t('upMessageLabel')}</label>
                <textarea
                  id="update-body"
                  className="updates-modal__textarea"
                  placeholder={t('upMessagePlaceholder')}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  rows={5}
                  required
                />
              </div>

              {/* ── Recipient picker ──────────────────────── */}
              <div className="updates-modal__field">
                <label>{t('upRecipientsLabel')}</label>
                <div className="updates-compose-recipients">
                  {composeRecipientsLoading && (
                    <div className="updates-email-modal__status">
                      <span className="updates-email-modal__spinner" />
                      {t('upLoadingShort')}
                    </div>
                  )}

                  {!composeRecipientsLoading && composeRecipientsFetchError && (
                    <p className="updates-modal__error">{composeRecipientsFetchError}</p>
                  )}

                  {!composeRecipientsLoading && !composeRecipientsFetchError && (
                    <>
                      <div className="updates-email-modal__recipients-head">
                        <div className="updates-email-modal__count">
                          <GroupOutlinedIcon style={{ fontSize: '1.125rem' }} />
                          <span>
                            {t('upSelectedCount')
                              .replace('{selected}', composeSelectedCount)
                              .replace('{total}', composeRecipients.length)}
                          </span>
                        </div>
                        {composeRecipients.length > 0 && (
                          <button
                            type="button"
                            className="updates-email-modal__select-all"
                            onClick={toggleComposeSelectAll}
                          >
                            {composeAllSelected ? t('upClearAll') : t('upSelectAll')}
                          </button>
                        )}
                      </div>

                      {composeRecipients.length > 0 && (
                        <ul className="updates-email-modal__recipients">
                          {composeRecipients.map((p) => {
                            const checked = composeAllSelected || (composeSelectedUids instanceof Set && composeSelectedUids.has(p.uid));
                            return (
                              <li key={p.uid}>
                                <label
                                  className={`updates-email-modal__recipient${checked ? ' is-checked' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleComposeRecipient(p.uid)}
                                  />
                                  <span className="updates-email-modal__recipient-info">
                                    <span className="updates-email-modal__recipient-name">{p.name}</span>
                                    <span className="updates-email-modal__recipient-email">{p.email}</span>
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {composeRecipients.length === 0 && (
                        <p className="updates-email-modal__note">
                          {t('upNoAccountsNote')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {error && <p className="updates-modal__error">{error}</p>}

              <div className="updates-modal__footer">
                <button
                  type="button"
                  className="updates-modal__cancel"
                  onClick={() => setShowModal(false)}
                >
                  {t('upCancel')}
                </button>
                <button
                  type="submit"
                  className="updates-modal__submit"
                  disabled={submitting || composeSelectedCount === 0}
                >
                  {submitting ? t('upPublishing') : `${t('upPublishUpdate')}${composeSelectedCount > 0 ? ` (${composeSelectedCount})` : ''}`}
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
          aria-label={t('upEmailModalTitle')}
          dir={direction}
          onClick={(e) => { if (e.target === e.currentTarget) setEmailTarget(null); }}
        >
          <div className="updates-modal">
            <div className="updates-modal__header">
              <div className="updates-email-modal__title">
                <ForwardToInboxOutlinedIcon style={{ fontSize: '1.25rem', color: '#6d35b8' }} />
                <h2>{t('upEmailModalTitle')}</h2>
              </div>
              <button
                type="button"
                className="updates-modal__close"
                aria-label={t('upClose')}
                onClick={() => setEmailTarget(null)}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <div className="updates-modal__form">
              {/* Update preview */}
              <div className="updates-email-modal__preview">
                <p className="updates-email-modal__preview-label">{t('upUpdateLabel')}</p>
                <p className="updates-email-modal__preview-title">{localizeField(emailTarget.title, 'he')}</p>
                <p className="updates-email-modal__preview-body">{localizeField(emailTarget.body, 'he')}</p>
              </div>

              {/* Info / status */}
              <div className="updates-email-modal__info">
                {emailLoading && (
                  <div className="updates-email-modal__status">
                    <span className="updates-email-modal__spinner" />
                    {t('upFetchingEmails')}
                  </div>
                )}

                {!emailLoading && emailFetchError && (
                  <p className="updates-modal__error">{emailFetchError}</p>
                )}

                {!emailLoading && !emailFetchError && (
                  <>
                    <div className="updates-email-modal__recipients-head">
                      <div className="updates-email-modal__count">
                        <GroupOutlinedIcon style={{ fontSize: '1.125rem' }} />
                        <span>
                          {t('upSelectedCount')
                            .replace('{selected}', selectedEmails.size)
                            .replace('{total}', recipients.length)}
                        </span>
                      </div>
                      {recipients.length > 0 && (
                        <button
                          type="button"
                          className="updates-email-modal__select-all"
                          onClick={toggleSelectAll}
                        >
                          {allSelected ? t('upClearAll') : t('upSelectAll')}
                        </button>
                      )}
                    </div>

                    {recipients.length > 0 && (
                      <ul className="updates-email-modal__recipients">
                        {recipients.map((p) => {
                          const checked = selectedEmails.has(p.email);
                          return (
                            <li key={p.email}>
                              <label
                                className={`updates-email-modal__recipient${checked ? ' is-checked' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleRecipient(p.email)}
                                />
                                <span className="updates-email-modal__recipient-info">
                                  <span className="updates-email-modal__recipient-name">{p.name}</span>
                                  <span className="updates-email-modal__recipient-email">{p.email}</span>
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {selectedEmails.size > 100 && (
                      <div className="updates-email-modal__warning">
                        <WarningAmberOutlinedIcon style={{ fontSize: '1rem' }} />
                        <span>
                          {t('upLargeListWarning').replace('{count}', selectedEmails.size)}
                        </span>
                      </div>
                    )}

                    {recipients.length === 0 && (
                      <p className="updates-email-modal__note">
                        {t('upNoAccountsNote')}
                      </p>
                    )}

                    {recipients.length > 0 && (
                      <p className="updates-email-modal__note">
                        {t('upBccNotePre')}
                        <strong> BCC</strong>{t('upBccNotePost')}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="updates-modal__footer">
                <button
                  type="button"
                  className="updates-modal__cancel"
                  onClick={() => setEmailTarget(null)}
                >
                  {t('upCancel')}
                </button>
                <button
                  type="button"
                  className="updates-modal__submit updates-email-modal__proceed"
                  disabled={emailLoading || selectedEmails.size === 0 || !!emailFetchError}
                  onClick={handleProceedEmail}
                >
                  <ForwardToInboxOutlinedIcon style={{ fontSize: '1.0625rem' }} />
                  {emailLoading
                    ? t('upLoadingShort')
                    : `${t('upOpenEmailClient')}${selectedEmails.size ? ` (${selectedEmails.size})` : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
