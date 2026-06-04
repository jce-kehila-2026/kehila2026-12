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
import './CommunityModerationPage.css';

const TONE_COLORS = {
  pink: '#e05297',
  lavender: '#a78bfa',
  violet: '#7c3aed',
  rose: '#fb7185',
};

const STATUS_FILTERS = ['all', 'active', 'reported', 'hidden', 'deleted'];

function tsToLabel(ts) {
  if (!ts) return '—';
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function tsToFull(ts) {
  if (!ts) return '—';
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
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

function StatusBadge({ status, hiddenByAdmin }) {
  const resolved = hiddenByAdmin ? 'hidden' : (status ?? 'active');
  return (
    <span className={`admin-community-badge admin-community-badge--${resolved}`}>
      {resolved}
    </span>
  );
}

function DeleteConfirmRow({ onConfirm, onCancel }) {
  return (
    <div className="admin-community-delete-confirm" role="alert">
      <TriangleAlert size={16} />
      <span>Permanently delete this post?</span>
      <button
        id="btn-confirm-delete-post"
        className="admin-community-btn admin-community-btn--danger"
        type="button"
        onClick={onConfirm}
      >
        Yes, delete
      </button>
      <button
        className="admin-community-btn admin-community-btn--ghost"
        type="button"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

// ── Reported Posts Tab ────────────────────────────────────────────────────────

function ReportedPostsTab({ onStatsChange }) {
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
    return <p className="admin-community-loading">Loading reported posts…</p>;
  }

  if (posts.length === 0) {
    return (
      <div className="admin-community-empty" id="reported-posts-empty">
        <CheckCircle2 size={40} />
        <h3>No reported posts — the community is healthy! 🎉</h3>
        <p>All posts are currently within community guidelines.</p>
      </div>
    );
  }

  return (
    <div className="admin-community-reported-list" id="reported-posts-list">
      {posts.map((post) => {
        const toneColor = TONE_COLORS[post.tone] ?? TONE_COLORS.pink;
        const reports = Array.isArray(post.reports) ? post.reports : [];
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
                    {post.isAnonymous ? 'Anonymous User' : (post.authorDisplayName ?? 'Unknown')}
                  </strong>
                  <span className="admin-community-post-card__meta">
                    {tsToFull(post.createdAt)}
                    {post.isAnonymous && (
                      <span className="admin-community-badge admin-community-badge--anon">Anonymous</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="admin-community-post-card__badges">
                <span className="admin-community-badge admin-community-badge--reported">
                  <AlertTriangle size={11} />
                  {post.reportsCount ?? reports.length} report{(post.reportsCount ?? reports.length) !== 1 ? 's' : ''}
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
                  {isExpanded ? 'Hide' : 'Show'} {reports.length} report detail{reports.length !== 1 ? 's' : ''}
                </button>
                {isExpanded && (
                  <ul className="admin-community-reports-list">
                    {reports.map((report, i) => (
                      <li key={report.id ?? i} className="admin-community-report-item">
                        <span className="admin-community-report-item__reason">{report.reason || 'No reason given'}</span>
                        <span className="admin-community-report-item__who">
                          by {report.reporterUserId?.slice(0, 8) ?? 'unknown'}
                        </span>
                        <span className="admin-community-report-item__when">
                          {tsToLabel(report.createdAt ?? report.reportedAt)}
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
                  Hide Post
                </button>
                <button
                  id={`btn-dismiss-${post.id}`}
                  className="admin-community-btn admin-community-btn--success"
                  disabled={isBusy}
                  type="button"
                  onClick={() => handleDismiss(post.id)}
                >
                  <CheckCircle2 size={14} />
                  Dismiss Reports
                </button>
                <button
                  id={`btn-delete-${post.id}`}
                  className="admin-community-btn admin-community-btn--danger"
                  disabled={isBusy}
                  type="button"
                  onClick={() => setConfirmDeleteId(post.id)}
                >
                  <Trash2 size={14} />
                  Delete Post
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
      <div className="admin-community-filter-chips" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            id={`filter-chip-${f}`}
            className={`admin-community-chip${statusFilter === f ? ' is-active' : ''}`}
            type="button"
            onClick={() => setStatusFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
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
        <p className="admin-community-loading">Loading posts…</p>
      ) : (
        <div className="admin-community-table" role="table" aria-label="Community posts">
          <div className="admin-community-table__head" role="row">
            <span role="columnheader">Author</span>
            <span role="columnheader">Content</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Date</span>
            <span role="columnheader">Reports</span>
            <span role="columnheader">Actions</span>
          </div>

          {filtered.length === 0 ? (
            <p className="admin-community-loading">No posts match this filter.</p>
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
                    <span>{post.isAnonymous ? 'Anonymous' : (post.authorDisplayName ?? '—')}</span>
                  </div>
                  <div className="admin-community-table__content" role="cell">
                    <p>{String(post.content ?? '').slice(0, 90)}{(post.content?.length ?? 0) > 90 ? '…' : ''}</p>
                  </div>
                  <div role="cell">
                    <StatusBadge status={post.status} hiddenByAdmin={post.hiddenByAdmin} />
                  </div>
                  <div className="admin-community-table__date" role="cell">
                    {tsToLabel(post.createdAt)}
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
                          Confirm
                        </button>
                        <button
                          className="admin-community-btn admin-community-btn--ghost admin-community-btn--sm"
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
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
                            <EyeOff size={13} /> Hide
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
                            <Undo2 size={13} /> Restore
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
  const [shortGuidelines, setShortGuidelines] = useState([]);
  const [fullGuidelines, setFullGuidelines] = useState([]);
  const [currentVersion, setCurrentVersion] = useState('v1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

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
    try {
      const newVersion = await saveGuidelinesDoc({
        shortGuidelines,
        fullGuidelines,
        currentVersion,
      });
      setCurrentVersion(newVersion);
      setSaveMessage(`Saved as ${newVersion}. All participants will be asked to re-accept.`);
    } catch {
      setSaveMessage('Failed to save guidelines. Please try again.');
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

  if (loading) return <p className="admin-community-loading">Loading guidelines…</p>;

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
            aria-label={`Guideline ${i + 1}`}
            onChange={(e) => handlers.handleChange(i, e.target.value)}
          />
          <button
            id={`${idPrefix}-up-${i}`}
            className="admin-community-btn admin-community-btn--icon"
            type="button"
            disabled={i === 0}
            aria-label="Move up"
            onClick={() => handlers.handleMoveUp(i)}
          >
            ↑
          </button>
          <button
            id={`${idPrefix}-down-${i}`}
            className="admin-community-btn admin-community-btn--icon"
            type="button"
            disabled={i === items.length - 1}
            aria-label="Move down"
            onClick={() => handlers.handleMoveDown(i)}
          >
            ↓
          </button>
          <button
            id={`${idPrefix}-remove-${i}`}
            className="admin-community-btn admin-community-btn--icon admin-community-btn--danger"
            type="button"
            aria-label="Remove guideline"
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
          <Plus size={14} /> Add guideline
        </button>
      </li>
    </ul>
  );

  return (
    <div className="admin-community-guidelines-tab" id="guidelines-tab">
      <div className="admin-community-guidelines-header">
        <div className="admin-community-guidelines-version">
          <FileText size={16} />
          Current version: <strong id="guidelines-current-version">{currentVersion}</strong>
        </div>
        <p className="admin-community-guidelines-warning">
          <AlertTriangle size={14} />
          Saving will bump the version and require all participants to re-accept the guidelines.
        </p>
      </div>

      <div className="admin-community-guidelines-sections">
        <section className="admin-community-card admin-community-guidelines-section" aria-labelledby="short-guidelines-heading">
          <h3 id="short-guidelines-heading">Short Guidelines <span>(shown in sidebar card)</span></h3>
          {renderList(shortGuidelines, short, 'short-gl')}
        </section>

        <section className="admin-community-card admin-community-guidelines-section" aria-labelledby="full-guidelines-heading">
          <h3 id="full-guidelines-heading">Full Guidelines <span>(shown in acceptance modal)</span></h3>
          {renderList(fullGuidelines, full, 'full-gl')}
        </section>
      </div>

      <div className="admin-community-guidelines-footer">
        {saveMessage && (
          <p
            id="guidelines-save-message"
            className={`admin-community-save-message${saveMessage.includes('Failed') ? ' admin-community-save-message--error' : ''}`}
            aria-live="polite"
          >
            {saveMessage.includes('Failed') ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
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
          {saving ? 'Saving…' : 'Save Guidelines & Bump Version'}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'reported', label: 'Reported Posts', icon: <AlertTriangle size={15} /> },
  { id: 'all', label: 'All Posts', icon: <MessageSquare size={15} /> },
  { id: 'guidelines', label: 'Guidelines', icon: <Shield size={15} /> },
];

export default function CommunityModerationPage() {
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
    <section className="admin-community-page">
      <header className="admin-community-hero">
        <div>
          <h1>Community Moderation</h1>
          <p>Review reported posts, manage content visibility, and edit community guidelines</p>
        </div>
        <button
          id="btn-refresh-community-stats"
          className="admin-community-refresh-btn"
          type="button"
          disabled={statsLoading}
          aria-label="Refresh moderation stats"
          onClick={loadStats}
        >
          <RefreshCw size={15} className={statsLoading ? 'is-spinning' : ''} />
          Refresh
        </button>
      </header>

      <section className="admin-community-metrics" aria-label="Community moderation metrics">
        <MetricCard
          id="metric-total-posts"
          accent="purple"
          icon={<MessageSquare size={24} />}
          label="Total Posts"
          value={stats.total}
          subtext="All community posts"
        />
        <MetricCard
          id="metric-reported-posts"
          accent="peach"
          icon={<AlertTriangle size={24} />}
          label="Reported"
          value={stats.reported}
          subtext="Awaiting review"
        />
        <MetricCard
          id="metric-hidden-posts"
          accent="pink"
          icon={<EyeOff size={24} />}
          label="Hidden"
          value={stats.hidden}
          subtext="Hidden by admin"
        />
        <MetricCard
          id="metric-active-posts"
          accent="mint"
          icon={<CheckCircle2 size={24} />}
          label="Active"
          value={stats.active}
          subtext="Visible to community"
        />
      </section>

      <nav className="admin-community-tabs" aria-label="Community moderation tabs">
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
            {tab.label}
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
