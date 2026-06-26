import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  FileText,
  GripVertical,
  MessageSquare,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  TriangleAlert,
  Undo2,
  X,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useAdminLocale } from '../context/AdminLocaleContext';
import {
  dismissReports,
  getAllPosts,
  getGuidelinesDoc,
  getModerationStats,
  getReportedPosts,
  hardDeletePost,
  hidePost,
  restorePost,
  saveGuidelinesDoc,
} from '../services/communityModerationService';
import AdminPageHeader from '../components/AdminPageHeader';
import './CommunityModerationPage.css';

const TONE_COLORS = {
  pink: '#e05297',
  lavender: '#a78bfa',
  violet: '#7c3aed',
  rose: '#fb7185',
};

const STATUS_FILTERS = ['all', 'active', 'reported', 'hidden', 'deleted'];

const STATUS_LABEL_KEYS = {
  all: 'cmStatusAll',
  active: 'cmStatusActive',
  reported: 'cmStatusReported',
  hidden: 'cmStatusHidden',
  deleted: 'cmStatusDeleted',
};

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en-US' };

function tsToLabel(ts, intlLocale) {
  if (!ts) return '—';
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(intlLocale, { month: 'short', day: 'numeric', year: 'numeric' });
}

function tsToFull(ts, intlLocale) {
  if (!ts) return '—';
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(intlLocale, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function MetricCard({ id, accent, icon, label, value, subtext }) {
  return (
    <article id={id} className={`admin-community-metric admin-community-metric--${accent}`}>
      <div className="admin-community-metric__icon">{icon}</div>
      <div>
        <span className="admin-community-metric__label">{label}</span>
        <strong className="admin-community-metric__value">{value.toLocaleString()}</strong>
        <p className="admin-community-metric__sub">{subtext}</p>
      </div>
    </article>
  );
}

function StatusBadge({ status, hiddenByAdmin, t }) {
  const resolved = hiddenByAdmin ? 'hidden' : (status ?? 'active');
  return (
    <span className={`admin-community-badge admin-community-badge--${resolved}`}>
      {t(STATUS_LABEL_KEYS[resolved] || resolved)}
    </span>
  );
}

function DeleteConfirmRow({ onConfirm, onCancel, t }) {
  return (
    <div className="admin-community-delete-confirm" role="alert">
      <TriangleAlert size={16} />
      <span>{t('cmDeleteConfirmQuestion')}</span>
      <button
        id="btn-confirm-delete-post"
        className="admin-community-btn admin-community-btn--danger"
        type="button"
        onClick={onConfirm}
      >
        {t('cmYesDelete')}
      </button>
      <button
        className="admin-community-btn admin-community-btn--ghost"
        type="button"
        onClick={onCancel}
      >
        {t('cmCancel')}
      </button>
    </div>
  );
}

// ── Reported Posts Tab ────────────────────────────────────────────────────────

function ReportedPostsTab({ onStatsChange }) {
  const { t, lang } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en-US';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [expandedReports, setExpandedReports] = useState({});

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await getReportedPosts();
      setPosts(loaded);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const withProcessing = async (postId, fn) => {
    setProcessing((prev) => ({ ...prev, [postId]: true }));
    try {
      await fn();
      onStatsChange?.();
    } finally {
      setProcessing((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  };

  const handleHide = (postId) => withProcessing(postId, async () => {
    await hidePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  });

  const handleDismiss = (postId) => withProcessing(postId, async () => {
    await dismissReports(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  });

  const handleDeleteConfirm = (postId) => withProcessing(postId, async () => {
    await hardDeletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setConfirmDeleteId(null);
  });

  if (loading) {
    return <p className="admin-community-loading">{t('cmLoadingReported')}</p>;
  }

  if (posts.length === 0) {
    return (
      <div className="admin-community-empty" id="reported-posts-empty">
        <CheckCircle2 size={40} />
        <h3>{t('cmEmptyReportedTitle')}</h3>
        <p>{t('cmEmptyReportedText')}</p>
      </div>
    );
  }

  return (
    <div className="admin-community-reported-list" id="reported-posts-list">
      {posts.map((post) => {
        const toneColor = TONE_COLORS[post.tone] ?? TONE_COLORS.pink;
        const reports = Array.isArray(post.reports) ? post.reports : [];
        const reportsCount = post.reportsCount ?? reports.length;
        const isExpanded = Boolean(expandedReports[post.id]);
        const isBusy = Boolean(processing[post.id]);

        return (
          <article
            key={post.id}
            id={`reported-post-${post.id}`}
            className="admin-community-post-card"
            style={{ '--tone-color': toneColor }}
          >
            <div className="admin-community-post-card__tone-bar" aria-hidden="true" />

            <header className="admin-community-post-card__header">
              <div className="admin-community-post-card__author">
                <div
                  className="admin-community-post-card__avatar"
                  style={{ background: `linear-gradient(135deg, ${toneColor}44, ${toneColor}22)`, color: toneColor }}
                >
                  {post.isAnonymous ? 'AN' : getInitials(post.authorDisplayName)}
                </div>
                <div>
                  <strong>
                    {post.isAnonymous ? t('cmAnonymousUser') : (post.authorDisplayName ?? t('cmUnknown'))}
                  </strong>
                  <span className="admin-community-post-card__meta">
                    {tsToFull(post.createdAt, intlLocale)}
                    {post.isAnonymous && (
                      <span className="admin-community-badge admin-community-badge--anon">{t('cmAnonymous')}</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="admin-community-post-card__badges">
                <span className="admin-community-badge admin-community-badge--reported">
                  <AlertTriangle size={11} />
                  {(reportsCount === 1 ? t('cmReportsCountOne') : t('cmReportsCount')).replace('{n}', reportsCount)}
                </span>
                {post.tone && (
                  <span
                    className="admin-community-badge"
                    style={{ background: `${toneColor}22`, color: toneColor, borderColor: `${toneColor}44` }}
                  >
                    {post.tone}
                  </span>
                )}
              </div>
            </header>

            <p className="admin-community-post-card__content">{post.content}</p>

            {reports.length > 0 && (
              <div className="admin-community-post-card__reports">
                <button
                  className="admin-community-reports-toggle"
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedReports((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                >
                  <Shield size={14} />
                  {(() => {
                    const n = reports.length;
                    const key = isExpanded
                      ? (n === 1 ? 'cmReportDetailsHideOne' : 'cmReportDetailsHide')
                      : (n === 1 ? 'cmReportDetailsShowOne' : 'cmReportDetailsShow');
                    return t(key).replace('{n}', n);
                  })()}
                </button>
                {isExpanded && (
                  <ul className="admin-community-reports-list">
                    {reports.map((report, i) => (
                      <li key={report.id ?? i} className="admin-community-report-item">
                        <span className="admin-community-report-item__reason">{report.reason || t('cmNoReasonGiven')}</span>
                        <span className="admin-community-report-item__who">
                          {t('cmReportBy').replace('{id}', report.reporterUserId?.slice(0, 8) ?? t('cmUnknownReporter'))}
                        </span>
                        <span className="admin-community-report-item__when">
                          {tsToLabel(report.createdAt ?? report.reportedAt, intlLocale)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {confirmDeleteId === post.id ? (
              <DeleteConfirmRow
                onConfirm={() => handleDeleteConfirm(post.id)}
                onCancel={() => setConfirmDeleteId(null)}
                t={t}
              />
            ) : (
              <footer className="admin-community-post-card__actions">
                <button
                  id={`btn-hide-${post.id}`}
                  className="admin-community-btn admin-community-btn--warning"
                  disabled={isBusy}
                  type="button"
                  onClick={() => handleHide(post.id)}
                >
                  <EyeOff size={14} />
                  {t('cmHidePost')}
                </button>
                <button
                  id={`btn-dismiss-${post.id}`}
                  className="admin-community-btn admin-community-btn--success"
                  disabled={isBusy}
                  type="button"
                  onClick={() => handleDismiss(post.id)}
                >
                  <CheckCircle2 size={14} />
                  {t('cmDismissReports')}
                </button>
                <button
                  id={`btn-delete-${post.id}`}
                  className="admin-community-btn admin-community-btn--danger"
                  disabled={isBusy}
                  type="button"
                  onClick={() => setConfirmDeleteId(post.id)}
                >
                  <Trash2 size={14} />
                  {t('cmDeletePost')}
                </button>
              </footer>
            )}
          </article>
        );
      })}
    </div>
  );
}

// ── All Posts Tab ─────────────────────────────────────────────────────────────

function AllPostsTab({ onStatsChange }) {
  const { t, lang } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en-US';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [processing, setProcessing] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await getAllPosts();
      setPosts(loaded);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const withProcessing = async (postId, fn) => {
    setProcessing((prev) => ({ ...prev, [postId]: true }));
    try {
      await fn();
      onStatsChange?.();
    } finally {
      setProcessing((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }
  };

  const handleHide = (postId) => withProcessing(postId, async () => {
    await hidePost(postId);
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, hiddenByAdmin: true, status: 'hidden' } : p));
  });

  const handleRestore = (postId) => withProcessing(postId, async () => {
    await restorePost(postId);
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, hiddenByAdmin: false, status: 'active' } : p));
  });

  const handleDeleteConfirm = (postId) => withProcessing(postId, async () => {
    await hardDeletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setConfirmDeleteId(null);
  });

  const filtered = posts.filter((p) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'hidden') return Boolean(p.hiddenByAdmin);
    return p.status === statusFilter;
  });

  return (
    <div id="all-posts-tab">
      <div className="admin-community-filter-chips" role="group" aria-label={t('cmFilterAria')}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            id={`filter-chip-${f}`}
            className={`admin-community-chip${statusFilter === f ? ' is-active' : ''}`}
            type="button"
            onClick={() => setStatusFilter(f)}
          >
            {t(STATUS_LABEL_KEYS[f] || f)}
            {f !== 'all' && (
              <span className="admin-community-chip__count">
                {posts.filter((p) => {
                  if (f === 'hidden') return Boolean(p.hiddenByAdmin);
                  return p.status === f;
                }).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="admin-community-loading">{t('cmLoadingPosts')}</p>
      ) : (
        <div className="admin-community-table" role="table" aria-label={t('cmTableAria')}>
          <div className="admin-community-table__head" role="row">
            <span role="columnheader">{t('cmColAuthor')}</span>
            <span role="columnheader">{t('cmColContent')}</span>
            <span role="columnheader">{t('cmColStatus')}</span>
            <span role="columnheader">{t('cmColDate')}</span>
            <span role="columnheader">{t('cmColReports')}</span>
            <span role="columnheader">{t('cmColActions')}</span>
          </div>

          {filtered.length === 0 ? (
            <p className="admin-community-loading">{t('cmNoPostsMatch')}</p>
          ) : (
            filtered.map((post) => {
              const isBusy = Boolean(processing[post.id]);
              const isHidden = Boolean(post.hiddenByAdmin);
              const canHide = !isHidden && post.status !== 'deleted';
              const canRestore = isHidden || (post.status === 'hidden' || post.status === 'reported');

              return (
                <div key={post.id} id={`all-post-row-${post.id}`} className="admin-community-table__row" role="row">
                  <div className="admin-community-table__author" role="cell">
                    <div className="admin-community-table__avatar">
                      {post.isAnonymous ? 'AN' : getInitials(post.authorDisplayName)}
                    </div>
                    <span>{post.isAnonymous ? t('cmAnonymous') : (post.authorDisplayName ?? '—')}</span>
                  </div>
                  <div className="admin-community-table__content" role="cell">
                    <p>{String(post.content ?? '').slice(0, 90)}{(post.content?.length ?? 0) > 90 ? '…' : ''}</p>
                  </div>
                  <div role="cell">
                    <StatusBadge status={post.status} hiddenByAdmin={post.hiddenByAdmin} t={t} />
                  </div>
                  <div className="admin-community-table__date" role="cell">
                    {tsToLabel(post.createdAt, intlLocale)}
                  </div>
                  <div role="cell">
                    {(post.reportsCount ?? 0) > 0 ? (
                      <span className="admin-community-badge admin-community-badge--reported">
                        {post.reportsCount}
                      </span>
                    ) : '—'}
                  </div>
                  <div className="admin-community-table__actions" role="cell">
                    {confirmDeleteId === post.id ? (
                      <div className="admin-community-inline-confirm">
                        <button
                          id={`btn-confirm-all-delete-${post.id}`}
                          className="admin-community-btn admin-community-btn--danger admin-community-btn--sm"
                          type="button"
                          onClick={() => handleDeleteConfirm(post.id)}
                        >
                          {t('cmConfirm')}
                        </button>
                        <button
                          className="admin-community-btn admin-community-btn--ghost admin-community-btn--sm"
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          {t('cmCancel')}
                        </button>
                      </div>
                    ) : (
                      <>
                        {canHide && (
                          <button
                            id={`btn-all-hide-${post.id}`}
                            className="admin-community-btn admin-community-btn--warning admin-community-btn--sm"
                            disabled={isBusy}
                            type="button"
                            onClick={() => handleHide(post.id)}
                          >
                            <EyeOff size={13} /> {t('cmHide')}
                          </button>
                        )}
                        {canRestore && (
                          <button
                            id={`btn-all-restore-${post.id}`}
                            className="admin-community-btn admin-community-btn--success admin-community-btn--sm"
                            disabled={isBusy}
                            type="button"
                            onClick={() => handleRestore(post.id)}
                          >
                            <Undo2 size={13} /> {t('cmRestore')}
                          </button>
                        )}
                        {post.status !== 'deleted' && (
                          <button
                            id={`btn-all-delete-${post.id}`}
                            className="admin-community-btn admin-community-btn--danger admin-community-btn--sm"
                            disabled={isBusy}
                            type="button"
                            onClick={() => setConfirmDeleteId(post.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Guidelines Tab ────────────────────────────────────────────────────────────

function GuidelinesTab() {
  const { currentUser } = useAdmin();
  const { t } = useAdminLocale();
  const [shortGuidelines, setShortGuidelines] = useState([]);
  const [fullGuidelines, setFullGuidelines] = useState([]);
  const [currentVersion, setCurrentVersion] = useState('v1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    getGuidelinesDoc().then((data) => {
      if (data) {
        setShortGuidelines(data.shortGuidelines ?? []);
        setFullGuidelines(data.fullGuidelines ?? []);
        setCurrentVersion(data.version ?? 'v1');
      } else {
        setShortGuidelines([
          'Be kind and respectful',
          'Share with honesty and empathy',
          "What's shared here, stays here",
          'No judgment, just support',
        ]);
        setFullGuidelines([
          'Be kind and respectful',
          'Protect your privacy and the privacy of others',
          'Do not share harmful or offensive content',
          'What is shared here should stay within the community',
          'No judgment, only support',
        ]);
        setCurrentVersion('v1');
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    setSaveError(false);
    try {
      const newVersion = await saveGuidelinesDoc({
        shortGuidelines,
        fullGuidelines,
        currentVersion,
      });
      setCurrentVersion(newVersion);
      setSaveError(false);
      setSaveMessage(t('cmSavedAs').replace('{version}', newVersion));
    } catch {
      setSaveError(true);
      setSaveMessage(t('cmSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const makeListHandlers = (list, setList) => ({
    handleChange: (i, value) => setList((prev) => prev.map((item, idx) => idx === i ? value : item)),
    handleAdd: () => setList((prev) => [...prev, '']),
    handleRemove: (i) => setList((prev) => prev.filter((_, idx) => idx !== i)),
    handleMoveUp: (i) => {
      if (i === 0) return;
      setList((prev) => {
        const next = [...prev];
        [next[i - 1], next[i]] = [next[i], next[i - 1]];
        return next;
      });
    },
    handleMoveDown: (i) => {
      setList((prev) => {
        if (i >= prev.length - 1) return prev;
        const next = [...prev];
        [next[i], next[i + 1]] = [next[i + 1], next[i]];
        return next;
      });
    },
  });

  const short = makeListHandlers(shortGuidelines, setShortGuidelines);
  const full = makeListHandlers(fullGuidelines, setFullGuidelines);

  if (loading) return <p className="admin-community-loading">{t('cmLoadingGuidelines')}</p>;

  const renderList = (items, handlers, idPrefix) => (
    <ul className="admin-community-guidelines-list">
      {items.map((item, i) => (
        <li key={i} className="admin-community-guideline-item" id={`${idPrefix}-item-${i}`}>
          <GripVertical size={16} className="admin-community-guideline-drag" aria-hidden="true" />
          <input
            id={`${idPrefix}-input-${i}`}
            className="admin-community-guideline-input"
            type="text"
            value={item}
            aria-label={t('cmGuidelineAria').replace('{n}', i + 1)}
            onChange={(e) => handlers.handleChange(i, e.target.value)}
          />
          <button
            id={`${idPrefix}-up-${i}`}
            className="admin-community-btn admin-community-btn--icon"
            type="button"
            disabled={i === 0}
            aria-label={t('cmMoveUp')}
            onClick={() => handlers.handleMoveUp(i)}
          >
            ↑
          </button>
          <button
            id={`${idPrefix}-down-${i}`}
            className="admin-community-btn admin-community-btn--icon"
            type="button"
            disabled={i === items.length - 1}
            aria-label={t('cmMoveDown')}
            onClick={() => handlers.handleMoveDown(i)}
          >
            ↓
          </button>
          <button
            id={`${idPrefix}-remove-${i}`}
            className="admin-community-btn admin-community-btn--icon admin-community-btn--danger"
            type="button"
            aria-label={t('cmRemoveGuideline')}
            onClick={() => handlers.handleRemove(i)}
          >
            <X size={14} />
          </button>
        </li>
      ))}
      <li>
        <button
          id={`${idPrefix}-add`}
          className="admin-community-btn admin-community-btn--ghost admin-community-btn--add"
          type="button"
          onClick={handlers.handleAdd}
        >
          <Plus size={14} /> {t('cmAddGuideline')}
        </button>
      </li>
    </ul>
  );

  return (
    <div className="admin-community-guidelines-tab" id="guidelines-tab">
      <div className="admin-community-guidelines-header">
        <div className="admin-community-guidelines-version">
          <FileText size={16} />
          {t('cmCurrentVersion')} <strong id="guidelines-current-version">{currentVersion}</strong>
        </div>
        <p className="admin-community-guidelines-warning">
          <AlertTriangle size={14} />
          {t('cmGuidelinesWarning')}
        </p>
      </div>

      <div className="admin-community-guidelines-sections">
        <section className="admin-community-card admin-community-guidelines-section" aria-labelledby="short-guidelines-heading">
          <h3 id="short-guidelines-heading">{t('cmShortGuidelines')} <span>{t('cmShortGuidelinesHint')}</span></h3>
          {renderList(shortGuidelines, short, 'short-gl')}
        </section>

        <section className="admin-community-card admin-community-guidelines-section" aria-labelledby="full-guidelines-heading">
          <h3 id="full-guidelines-heading">{t('cmFullGuidelines')} <span>{t('cmFullGuidelinesHint')}</span></h3>
          {renderList(fullGuidelines, full, 'full-gl')}
        </section>
      </div>

      <div className="admin-community-guidelines-footer">
        {saveMessage && (
          <p
            id="guidelines-save-message"
            className={`admin-community-save-message${saveError ? ' admin-community-save-message--error' : ''}`}
            aria-live="polite"
          >
            {saveError ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {saveMessage}
          </p>
        )}
        <button
          id="btn-save-guidelines"
          className="admin-community-btn admin-community-btn--primary admin-community-btn--save"
          disabled={saving}
          type="button"
          onClick={handleSave}
        >
          {saving ? t('cmSaving') : t('cmSaveGuidelines')}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'reported', labelKey: 'cmTabReported', icon: <AlertTriangle size={15} /> },
  { id: 'all', labelKey: 'cmTabAll', icon: <MessageSquare size={15} /> },
  { id: 'guidelines', labelKey: 'cmTabGuidelines', icon: <Shield size={15} /> },
];

export default function CommunityModerationPage() {
  const { t, direction } = useAdminLocale();
  const [activeTab, setActiveTab] = useState('reported');
  const [stats, setStats] = useState({ total: 0, reported: 0, hidden: 0, active: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getModerationStats();
      setStats(s);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <section className="admin-community-page" dir={direction}>
      <AdminPageHeader
        title={t('cmTitle')}
        actions={(
          <button
            id="btn-refresh-community-stats"
            className="admin-community-refresh-btn"
            type="button"
            disabled={statsLoading}
            aria-label={t('cmRefreshAria')}
            onClick={loadStats}
          >
            <RefreshCw size={15} className={statsLoading ? 'is-spinning' : ''} />
            {t('cmRefresh')}
          </button>
        )}
      />

      <section className="admin-community-metrics" aria-label={t('cmMetricsAria')}>
        <MetricCard
          id="metric-total-posts"
          accent="purple"
          icon={<MessageSquare size={24} />}
          label={t('cmMetricTotal')}
          value={stats.total}
          subtext={t('cmMetricTotalSub')}
        />
        <MetricCard
          id="metric-reported-posts"
          accent="peach"
          icon={<AlertTriangle size={24} />}
          label={t('cmMetricReported')}
          value={stats.reported}
          subtext={t('cmMetricReportedSub')}
        />
        <MetricCard
          id="metric-hidden-posts"
          accent="pink"
          icon={<EyeOff size={24} />}
          label={t('cmMetricHidden')}
          value={stats.hidden}
          subtext={t('cmMetricHiddenSub')}
        />
        <MetricCard
          id="metric-active-posts"
          accent="mint"
          icon={<CheckCircle2 size={24} />}
          label={t('cmMetricActive')}
          value={stats.active}
          subtext={t('cmMetricActiveSub')}
        />
      </section>

      <nav className="admin-community-tabs" aria-label={t('cmTabsAria')}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`admin-community-tab${activeTab === tab.id ? ' is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>

      <div
        id={`tabpanel-${activeTab}`}
        className="admin-community-tabpanel"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'reported' && <ReportedPostsTab onStatsChange={loadStats} />}
        {activeTab === 'all' && <AllPostsTab onStatsChange={loadStats} />}
        {activeTab === 'guidelines' && <GuidelinesTab />}
      </div>
    </section>
  );
}
