import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ForwardToInboxOutlinedIcon from '@mui/icons-material/ForwardToInboxOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
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
import AdminPageHeader from '../components/AdminPageHeader';
import './UpdatesPage.css';

const UPDATE_TYPES = [
  { value: 'general', labelKey: 'upTypeGeneral', icon: InfoOutlinedIcon, color: '#6d35b8' },
  { value: 'event_change', labelKey: 'upTypeEventChange', icon: EventNoteOutlinedIcon, color: '#e05297' },
  { value: 'new_event', labelKey: 'upTypeNewEvent', icon: NewReleasesOutlinedIcon, color: '#059669' },
  { value: 'reminder', labelKey: 'upTypeReminder', icon: NotificationsActiveOutlinedIcon, color: '#d97706' },
];

function typeMeta(type) {
  return UPDATE_TYPES.find((t) => t.value === type) ?? UPDATE_TYPES[0];
}

const BLANK_FORM = { title: '', body: '', type: 'general' };
const SEND_ALL = '__all__';
const PAGE_SIZE = 10;

const TABLE_COLUMNS = [
  { key: 'type', labelKey: 'upColType' },
  { key: 'title', labelKey: 'upColTitle' },
  { key: 'audience', labelKey: 'upColAudience' },
  { key: 'created', labelKey: 'upColCreated' },
  { key: 'admin', labelKey: 'upColAdmin' },
  { key: 'actions', labelKey: 'upColActions' },
];

function toDateObject(ts) {
  if (!ts) return null;
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatNumericDate(ts) {
  const date = toDateObject(ts);
  if (!date) return '—';
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

function formatDateInputValue(ts) {
  const date = toDateObject(ts);
  if (!date) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatTwentyFourHourTime(ts) {
  const date = toDateObject(ts);
  if (!date) return '—';
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join(':');
}

function formatAdminName(update) {
  const name = String(update.createdByName || update.createdBy || '').trim();
  if (!name) return '—';
  if (name.includes('@')) return name.split('@')[0] || name;
  return name;
}

export default function UpdatesPage() {
  const { currentUser } = useAdmin();
  const { t, direction } = useAdminLocale();

  // ── Compose state ────────────────────────────────────────
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [archiveTab, setArchiveTab] = useState('active');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const modalRef = useRef(null);
  const showArchived = archiveTab === 'archived';

  // ── Compose recipient picker state ───────────────────────
  const [composeRecipients, setComposeRecipients] = useState([]);
  const [composeRecipientsLoading, setComposeRecipientsLoading] = useState(false);
  const [composeRecipientsFetchError, setComposeRecipientsFetchError] = useState('');
  const [composeSelectedUids, setComposeSelectedUids] = useState(SEND_ALL);
  const [composeRecipientSearch, setComposeRecipientSearch] = useState('');

  // ── Email modal state ────────────────────────────────────
  const [emailTarget, setEmailTarget] = useState(null); // the update being emailed
  const [emailLoading, setEmailLoading] = useState(false);
  const [recipients, setRecipients] = useState([]); // [{ name, email }]
  const [selectedEmails, setSelectedEmails] = useState(() => new Set());
  const [emailFetchError, setEmailFetchError] = useState('');
  const [emailRecipientSearch, setEmailRecipientSearch] = useState('');

  // ── Details modal state ─────────────────────────────────
  const [detailTarget, setDetailTarget] = useState(null);
  const [detailRecipients, setDetailRecipients] = useState([]);
  const [detailRecipientsLoading, setDetailRecipientsLoading] = useState(false);
  const [detailRecipientsError, setDetailRecipientsError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

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
        setDetailTarget(null);
        setDeleteTarget(null);
      }
    }
    if (showModal || emailTarget || detailTarget || deleteTarget) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal, emailTarget, detailTarget, deleteTarget]);

  // ── Compose handlers ─────────────────────────────────────
  async function openModal() {
    setForm(BLANK_FORM);
    setError('');
    setComposeSelectedUids(SEND_ALL);
    setComposeRecipientSearch('');
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

  const visibleComposeRecipients = useMemo(() => {
    const q = composeRecipientSearch.trim().toLowerCase();
    if (!q) return composeRecipients;
    return composeRecipients.filter((person) => (
      [person.name, person.email]
        .some((value) => String(value || '').toLowerCase().includes(q))
    ));
  }, [composeRecipients, composeRecipientSearch]);

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

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUpdate(deleteTarget.id);
      setDeleteTarget(null);
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
    setEmailRecipientSearch('');
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

  const visibleEmailRecipients = useMemo(() => {
    const q = emailRecipientSearch.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((person) => (
      [person.name, person.email]
        .some((value) => String(value || '').toLowerCase().includes(q))
    ));
  }, [recipients, emailRecipientSearch]);

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

  async function handleDetailsClick(update) {
    setDetailTarget(update);
    setDetailRecipients([]);
    setDetailRecipientsError('');
    setDetailRecipientsLoading(false);
    const targetUids = Array.isArray(update.targetUids) ? update.targetUids : null;
    if (!targetUids?.length) return;
    setDetailRecipientsLoading(true);
    try {
      const people = await fetchParticipants();
      const targetSet = new Set(targetUids);
      setDetailRecipients(people.filter((person) => targetSet.has(person.uid)));
    } catch (err) {
      console.error('Failed to fetch update detail recipients:', err);
      setDetailRecipientsError(t('upErrLoadParticipants'));
    } finally {
      setDetailRecipientsLoading(false);
    }
  }

  // ── Table filters ───────────────────────────────────────
  const visibleUpdates = useMemo(() => updates.filter((u) => showArchived || u.active !== false), [updates, showArchived]);

  const filteredUpdates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleUpdates.filter((update) => {
      const archived = update.active === false;
      const matchesType = typeFilter === 'all' || (update.type || 'general') === typeFilter;
      const matchesDate = !dateFilter || formatDateInputValue(update.createdAt) === dateFilter;
      const matchesArchiveTab = archiveTab === 'archived' ? archived : !archived;
      const matchesSearch =
        !q ||
        [
          localizeField(update.title, 'he'),
          localizeField(update.body, 'he'),
          update.createdByName,
          t(typeMeta(update.type).labelKey),
        ].some((value) => String(value || '').toLowerCase().includes(q));
      return matchesType && matchesDate && matchesArchiveTab && matchesSearch;
    });
  }, [visibleUpdates, search, typeFilter, dateFilter, archiveTab, t]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, dateFilter, archiveTab]);

  const pageCount = Math.max(1, Math.ceil(filteredUpdates.length / PAGE_SIZE));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paginatedUpdates = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUpdates.slice(start, start + PAGE_SIZE);
  }, [filteredUpdates, page]);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setDateFilter('');
  };

  return (
    <div className="updates-page" dir={direction}>
      {/* Header */}
      <AdminPageHeader
        title={t('upHeaderTitle')}
      />

      <main className="updates-page__main">
        <div className="updates-page__tabs-row">
          <div className="updates-page__tabs" role="tablist" aria-label={t('upArchiveTabsAria')}>
            <button
              type="button"
              role="tab"
              aria-selected={archiveTab === 'active'}
              className={archiveTab === 'active' ? 'is-active' : ''}
              onClick={() => setArchiveTab('active')}
            >
              {t('upStatusActive')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={archiveTab === 'archived'}
              className={archiveTab === 'archived' ? 'is-active' : ''}
              onClick={() => setArchiveTab('archived')}
            >
              {t('upArchivedTag')}
            </button>
          </div>
          <button type="button" className="updates-page__new-btn" onClick={openModal}>
            <span className="updates-page__new-btn-label">{t('upNewUpdate')}</span>
            <span className="updates-page__new-btn-plus">+</span>
          </button>
        </div>

        <section className="updates-page__filters" aria-label={t('upFiltersAria')}>
          <label className="updates-page__search">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('upSearchPlaceholder')}
            />
          </label>
          <label className="updates-page__filter-field">
            <span>{t('upColType')}</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">{t('upAllTypes')}</option>
              {UPDATE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{t(type.labelKey)}</option>
              ))}
            </select>
          </label>
          <label className="updates-page__filter-field updates-page__filter-field--date">
            <span>{t('upDateFilter')}</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              aria-label={t('upDateFilter')}
            />
          </label>
          <button type="button" className="updates-page__clear-filters" onClick={clearFilters}>
            {t('auditClear')}
          </button>
        </section>

        <section className="updates-page__table-card" aria-busy={loading}>
          <div className="updates-page__table updates-page__table--head" dir="ltr">
            {TABLE_COLUMNS.map((column) => (
              <span key={column.key}>{t(column.labelKey)}</span>
            ))}
          </div>

          <div className="updates-page__table-body" dir="ltr">
            {loading ? (
              <div className="updates-page__table-state">
                <CircularProgress size={26} />
                <span>{t('upLoading')}</span>
              </div>
            ) : paginatedUpdates.length > 0 ? (
              paginatedUpdates.map((update) => {
                const meta = typeMeta(update.type);
                const Icon = meta.icon;
                const archived = update.active === false;
                const targetCount = Array.isArray(update.targetUids) ? update.targetUids.length : null;
                return (
                  <div key={update.id} className={`updates-page__table updates-page__table--row${archived ? ' is-archived' : ''}`}>
                    <span
                      className="updates-page__type-badge"
                      style={{ '--badge-color': meta.color }}
                    >
                      <Icon style={{ fontSize: '0.8125rem' }} />
                      {t(meta.labelKey)}
                    </span>
                    <div className="updates-page__update-cell">
                      <strong dir="auto">{localizeField(update.title, 'he')}</strong>
                    </div>
                    <span className="updates-page__audience-cell">
                      {targetCount == null ? t('upAudienceAll') : t('upAudienceCount').replace('{n}', targetCount)}
                    </span>
                    <span className="updates-page__date-cell">{formatNumericDate(update.createdAt)}</span>
                    <span className="updates-page__admin-cell" dir="auto">
                      {formatAdminName(update)}
                    </span>
                    <span className="updates-page__row-actions">
                      <button
                        type="button"
                        className="updates-page__row-action updates-page__row-action--view"
                        title={t('upViewDetails')}
                        aria-label={t('upViewDetails')}
                        onClick={() => handleDetailsClick(update)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </button>
                      {!archived && (
                        <button
                          type="button"
                          className="updates-page__row-action updates-page__row-action--email"
                          title={t('upSendEmail')}
                          aria-label={t('upSendEmail')}
                          onClick={() => handleEmailClick(update)}
                        >
                          <ForwardToInboxOutlinedIcon fontSize="small" />
                        </button>
                      )}
                      {!archived && (
                        <button
                          type="button"
                          className="updates-page__row-action updates-page__row-action--archive"
                          title={t('upArchive')}
                          aria-label={t('upArchive')}
                          onClick={() => handleArchive(update.id)}
                        >
                          <ArchiveOutlinedIcon fontSize="small" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="updates-page__row-action updates-page__row-action--delete"
                        title={t('upDeletePermanently')}
                        aria-label={t('upDeletePermanently')}
                        onClick={() => setDeleteTarget(update)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </button>
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="updates-page__table-state">
                <CampaignOutlinedIcon className="updates-page__empty-icon" />
                <strong>{updates.length === 0 ? t('upEmptyTitle') : t('upNoMatches')}</strong>
                <span>{updates.length === 0 ? t('upEmptySubtitle') : t('upNoMatchesHint')}</span>
                {updates.length === 0 && (
                  <button type="button" className="updates-page__new-btn" onClick={openModal}>
                    <span className="updates-page__new-btn-label">{t('upPublishFirst')}</span>
                    <span className="updates-page__new-btn-plus">+</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <footer className="updates-page__table-footer">
            <Pagination
              count={pageCount}
              page={page}
              onChange={(event, value) => setPage(value)}
              siblingCount={1}
              boundaryCount={1}
              shape="rounded"
            />
          </footer>
        </section>
      </main>

      {/* Details Modal */}
      {detailTarget && (() => {
        const meta = typeMeta(detailTarget.type);
        const DetailIcon = meta.icon;
        const targetUids = Array.isArray(detailTarget.targetUids) ? detailTarget.targetUids : null;
        const archived = detailTarget.active === false;
        return (
          <div
            className="updates-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={t('upDetailsModalTitle')}
            dir={direction}
            onClick={(e) => { if (e.target === e.currentTarget) setDetailTarget(null); }}
          >
            <div className="updates-modal updates-detail-modal">
              <div className="updates-modal__header">
                <div className="updates-email-modal__title">
                  <VisibilityOutlinedIcon style={{ fontSize: '1.25rem', color: '#6d35b8' }} />
                  <h2>{t('upDetailsModalTitle')}</h2>
                </div>
                <button
                  type="button"
                  className="updates-modal__close"
                  aria-label={t('upClose')}
                  onClick={() => setDetailTarget(null)}
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>

              <div className="updates-modal__form updates-detail-modal__body">
                <div className="updates-detail-modal__summary">
                  <span className="updates-page__type-badge" style={{ '--badge-color': meta.color }}>
                    <DetailIcon style={{ fontSize: '0.8125rem' }} />
                    {t(meta.labelKey)}
                  </span>
                  <span className={`updates-page__status updates-page__status--${archived ? 'archived' : 'active'}`}>
                    {archived ? t('upArchivedTag') : t('upStatusActive')}
                  </span>
                </div>

                <div className="updates-detail-modal__grid">
                  <div className="updates-detail-modal__item">
                    <span>{t('upDetailCreatedBy')}</span>
                    <strong dir="auto">{detailTarget.createdByName || detailTarget.createdBy || '—'}</strong>
                  </div>
                  <div className="updates-detail-modal__item">
                    <span>{t('upDetailDate')}</span>
                    <strong dir="ltr">{formatNumericDate(detailTarget.createdAt)}</strong>
                  </div>
                  <div className="updates-detail-modal__item">
                    <span>{t('upDetailTime')}</span>
                    <strong dir="ltr">{formatTwentyFourHourTime(detailTarget.createdAt)}</strong>
                  </div>
                  <div className="updates-detail-modal__item">
                    <span>{t('upDetailType')}</span>
                    <strong>{t(meta.labelKey)}</strong>
                  </div>
                </div>

                <div className="updates-detail-modal__section">
                  <span>{t('upTitleLabel')}</span>
                  <strong dir="auto">{localizeField(detailTarget.title, 'he') || '—'}</strong>
                </div>

                <div className="updates-detail-modal__section">
                  <span>{t('upDetailContent')}</span>
                  <p dir="auto">{localizeField(detailTarget.body, 'he') || '—'}</p>
                </div>

                <div className="updates-detail-modal__section">
                  <span>{t('upDetailSentTo')}</span>
                  {!targetUids?.length ? (
                    <strong>{t('upAudienceAll')}</strong>
                  ) : detailRecipientsLoading ? (
                    <div className="updates-email-modal__status">
                      <span className="updates-email-modal__spinner" />
                      {t('upLoadingShort')}
                    </div>
                  ) : detailRecipientsError ? (
                    <p className="updates-modal__error">{detailRecipientsError}</p>
                  ) : (() => {
                    const peopleByUid = new Map(detailRecipients.map((person) => [person.uid, person]));
                    const recipientRows = targetUids.map((uid) => peopleByUid.get(uid) || { uid, name: uid, email: '' });
                    return (
                    <>
                      <strong>{t('upAudienceCount').replace('{n}', targetUids.length)}</strong>
                      <ul className="updates-detail-modal__recipients">
                        {recipientRows.map((person) => (
                          <li key={person.uid}>
                            <span dir="auto">{person.name}</span>
                            {person.email ? <small dir="ltr">{person.email}</small> : null}
                          </li>
                        ))}
                      </ul>
                    </>
                    );
                  })()}
                </div>

                <div className="updates-modal__footer">
                  <button
                    type="button"
                    className="updates-modal__cancel"
                    onClick={() => setDetailTarget(null)}
                  >
                    {t('upClose')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
          <div className="updates-modal updates-compose-modal" ref={modalRef}>
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

            <form className="updates-modal__form updates-compose-modal__form" onSubmit={handleSubmit}>
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
                        <label className="updates-compose-recipients__search">
                          <GroupOutlinedIcon style={{ fontSize: '1.125rem' }} />
                          <input
                            type="search"
                            value={composeRecipientSearch}
                            onChange={(event) => setComposeRecipientSearch(event.target.value)}
                            placeholder={`${t('upSearchRecipients')} · ${t('upSelectedCount')
                              .replace('{selected}', composeSelectedCount)
                              .replace('{total}', composeRecipients.length)}`}
                            aria-label={t('upSearchRecipients')}
                          />
                        </label>
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
                          {visibleComposeRecipients.map((p) => {
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

                      {composeRecipients.length > 0 && visibleComposeRecipients.length === 0 && (
                        <p className="updates-email-modal__note">
                          {t('upNoRecipientMatches')}
                        </p>
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
                      <label className="updates-compose-recipients__search">
                        <GroupOutlinedIcon style={{ fontSize: '1.125rem' }} />
                        <input
                          type="search"
                          value={emailRecipientSearch}
                          onChange={(event) => setEmailRecipientSearch(event.target.value)}
                          placeholder={`${t('upSearchRecipients')} · ${t('upSelectedCount')
                            .replace('{selected}', selectedEmails.size)
                            .replace('{total}', recipients.length)}`}
                          aria-label={t('upSearchRecipients')}
                        />
                      </label>
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
                        {visibleEmailRecipients.map((p) => {
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

                    {recipients.length > 0 && visibleEmailRecipients.length === 0 && (
                      <p className="updates-email-modal__note">
                        {t('upNoRecipientMatches')}
                      </p>
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="updates-modal-overlay updates-modal-overlay--confirm"
          role="dialog"
          aria-modal="true"
          aria-label={t('upDeletePermanently')}
          dir={direction}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="updates-confirm-modal">
            <div className="updates-confirm-modal__header">
              <h2>{t('upDeletePermanently')}</h2>
              <button
                type="button"
                className="updates-modal__close"
                aria-label={t('upClose')}
                onClick={() => setDeleteTarget(null)}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
            <div className="updates-confirm-modal__content">
              <p>{t('upConfirmDelete')}</p>
              <strong dir="auto">{localizeField(deleteTarget.title, 'he') || '—'}</strong>
            </div>
            <div className="updates-confirm-modal__actions">
              <button
                type="button"
                className="updates-modal__cancel"
                onClick={() => setDeleteTarget(null)}
              >
                {t('upCancel')}
              </button>
              <button
                type="button"
                className="updates-modal__submit updates-modal__submit--danger"
                onClick={confirmDelete}
              >
                <DeleteOutlineIcon fontSize="small" />
                {t('upDeletePermanently')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
