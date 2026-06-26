// Bug Reports page — in-app problem reports submitted by participants. The
// participant header "Report a problem" button writes to the `bugReports`
// collection (see features/participant/services/bugReportService.js); this page
// lists them and lets an admin mark each handled (or reopen) and delete it.
//
// Styling/structure/behaviour intentionally mirror FormsPage so the admin
// review screens feel like one product.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  BUG_REPORT_STATUS,
  deleteBugReport,
  listBugReports,
  setBugReportHandled,
} from '../services/bugReportAdminService';
import AdminPageHeader from '../components/AdminPageHeader';
import { useAdminLocale } from '../context/AdminLocaleContext';
import './FormsPage.css';

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en-US' };
const PAGE_SIZE = 10;

const CATEGORY_KEYS = {
  bug: 'brCatBug',
  visual: 'brCatVisual',
  content: 'brCatContent',
  performance: 'brCatPerformance',
  other: 'brCatOther',
};

const STATUS_KEYS = {
  [BUG_REPORT_STATUS.NEW]: 'fmStatusNew',
  [BUG_REPORT_STATUS.HANDLED]: 'fmStatusHandled',
};

const CATEGORIES = ['bug', 'visual', 'content', 'performance', 'other'];

function formatTableDate(value) {
  let date = null;
  if (value?.toDate) date = value.toDate();
  else if (value && typeof value === 'object' && typeof value.seconds === 'number') date = new Date(value.seconds * 1000);
  else if (value) date = new Date(value);
  if (!date || Number.isNaN(date.getTime())) return '-';
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
}

function formatDateTime(value, intlLocale) {
  let date = null;
  if (value?.toDate) date = value.toDate();
  else if (value && typeof value === 'object' && typeof value.seconds === 'number') date = new Date(value.seconds * 1000);
  else if (value) date = new Date(value);
  if (!date || Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(intlLocale, { dateStyle: 'medium', timeStyle: 'short' });
}

function initialsOf(name) {
  return (
    String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

function DetailLine({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: 'rgba(36, 16, 79, 0.56)', fontSize: '0.72rem', fontWeight: 900 }}>
        {label}
      </Typography>
      <Typography dir="auto" sx={{ mt: 0.2, minWidth: 0, overflowWrap: 'anywhere', color: '#24104f', fontSize: '0.82rem', fontWeight: 750 }}>
        {value || '-'}
      </Typography>
    </Box>
  );
}

export default function BugReportsPage() {
  const { t, lang, direction } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en-US';
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await listBugReports());
    } catch (err) {
      console.error('Failed to fetch bug reports:', err);
      setActionError(t('brLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesCategory = categoryFilter === 'all' || (report.category || 'other') === categoryFilter;
      const matchesStatus = statusFilter === 'all' || (report.status || 'new') === statusFilter;
      const matchesSearch =
        !q ||
        [report.message, report.reporterName, report.reporterEmail, report.route].some(
          (value) => String(value || '').toLowerCase().includes(q),
        );
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [reports, search, categoryFilter, statusFilter]);

  useEffect(() => { setPage(1); }, [search, categoryFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  function openDetails(report) {
    setSelected(report);
    setDetailsOpen(true);
  }

  async function toggleHandled(report) {
    const handled = (report.status || 'new') !== BUG_REPORT_STATUS.HANDLED;
    setBusyId(report.id);
    setActionError('');
    try {
      await setBugReportHandled(report, handled);
      setSelected((current) => (
        current && current.id === report.id
          ? { ...current, status: handled ? BUG_REPORT_STATUS.HANDLED : BUG_REPORT_STATUS.NEW }
          : current
      ));
      await load();
    } catch (err) {
      console.error('Update failed:', err);
      setActionError(t('brActionError'));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setActionError('');
    try {
      await deleteBugReport(deleteTarget);
      setDeleteTarget(null);
      setDetailsOpen(false);
      await load();
    } catch (err) {
      console.error('Delete failed:', err);
      setActionError(t('brActionError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Box component="section" className="forms-admin-page" dir={direction}>
      <AdminPageHeader title={t('brTitle')} className="admin-page-header--no-clip" />

      {actionError ? (
        <Alert severity="error" sx={{ mb: 1, borderRadius: '14px', flex: '0 0 auto' }} onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      ) : null}

      <div className="forms-admin-layout">
        <main className="forms-admin-main">
          <section className="forms-filter-card" aria-label={t('apFiltersAria')}>
            <label className="forms-search-field">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('brSearchPlaceholder')} />
            </label>
            <label className="forms-filter-field">
              <span>{t('brColCategory')}</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">{t('brAllCategories')}</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{t(CATEGORY_KEYS[category])}</option>
                ))}
              </select>
            </label>
            <label className="forms-filter-field">
              <span>{t('brColStatus')}</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">{t('fmAllStatuses')}</option>
                <option value={BUG_REPORT_STATUS.NEW}>{t('fmStatusNew')}</option>
                <option value={BUG_REPORT_STATUS.HANDLED}>{t('fmStatusHandled')}</option>
              </select>
            </label>
            <button type="button" className="forms-filter-clear-btn" onClick={clearFilters}>
              {t('auditClear')}
            </button>
          </section>

          <section className="forms-table-card" aria-busy={loading}>
            <div className="forms-table forms-table--head" dir="ltr">
              <span>{t('brColReporter')}</span>
              <span>{t('brColWhere')}</span>
              <span>{t('brColCategory')}</span>
              <span>{t('brColSubmitted')}</span>
              <span>{t('brColStatus')}</span>
              <span>{t('brColActions')}</span>
            </div>

            <div className="forms-table-body forms-table-wrapper" dir="ltr">
              {loading ? (
                <div className="forms-table-state">
                  <CircularProgress size={26} />
                </div>
              ) : paginated.length > 0 ? (
                paginated.map((report) => {
                  const isHandled = (report.status || 'new') === BUG_REPORT_STATUS.HANDLED;
                  const isBusy = busyId === report.id;
                  return (
                    <div className="forms-table forms-table--row" key={report.id}>
                      <div className="forms-user-cell">
                        <span className="forms-avatar">{initialsOf(report.reporterName || report.reporterEmail)}</span>
                        <strong dir="auto">{report.reporterName || report.reporterEmail || t('fmUnnamed')}</strong>
                      </div>
                      <div className="forms-contact-cell">
                        <span dir="ltr">{report.route || '-'}</span>
                        {report.locale ? <small dir="ltr">{report.locale}</small> : null}
                      </div>
                      <span className="forms-type-badge forms-type-badge--volunteer">
                        {t(CATEGORY_KEYS[report.category] || 'brCatOther')}
                      </span>
                      <span className="forms-date-cell">{formatTableDate(report.createdAt)}</span>
                      <span className={`forms-status forms-status--${report.status || 'new'}`}>
                        {t(STATUS_KEYS[report.status] || 'fmStatusNew')}
                      </span>
                      <span className="forms-actions" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          title={isHandled ? t('fmReopenBtn') : t('fmMarkAsHandled')}
                          aria-label={isHandled ? t('fmReopenBtn') : t('fmMarkAsHandled')}
                          onClick={() => toggleHandled(report)}
                          disabled={isBusy}
                        >
                          {isBusy ? <CircularProgress size={14} color="inherit" /> : isHandled ? <ReplayIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                        </button>
                        <button
                          type="button"
                          className="forms-action-danger"
                          title={t('brDelete')}
                          aria-label={t('brDelete')}
                          onClick={() => setDeleteTarget(report)}
                          disabled={isBusy}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </button>
                        <button
                          type="button"
                          title={t('brViewAria')}
                          aria-label={t('brViewAria')}
                          onClick={() => openDetails(report)}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </button>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="forms-table-state">
                  <strong>{t('brEmpty')}</strong>
                  <span>{reports.length === 0 ? t('brEmptyHint') : t('brEmptyFilter')}</span>
                </div>
              )}
            </div>

            <footer className="forms-table-footer">
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
      </div>

      {detailsOpen && selected ? (
        <Box
          role="dialog"
          aria-modal="true"
          aria-label={t('brDetailsTitle')}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            background: 'rgba(32, 38, 55, 0.38)',
            backdropFilter: 'blur(10px)',
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsOpen(false);
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: 24,
              transform: 'translateY(-50%)',
              display: 'grid',
              gridTemplateRows: 'auto minmax(0, 1fr) auto',
              width: 'min(560px, calc(100vw - 36px))',
              maxHeight: 'calc(100vh - 48px)',
              overflow: 'hidden',
              border: '1px solid rgba(223, 50, 123, 0.14)',
              borderRadius: '24px',
              color: '#24104f',
              background: 'rgba(255, 255, 255, 0.98)',
              boxShadow: '0 24px 56px rgba(31, 12, 42, 0.22)',
            }}
          >
            <IconButton
              onClick={() => setDetailsOpen(false)}
              aria-label={t('brCancel')}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 2,
                width: 38,
                height: 38,
                color: '#5b1e8c',
                background: '#fff',
                border: '1px solid rgba(91, 30, 140, 0.22)',
                boxShadow: '0 8px 18px rgba(91, 30, 140, 0.12)',
                '&:hover, &:focus-visible': {
                  color: '#fff',
                  background: 'linear-gradient(135deg, #df327b, #cf1f70)',
                  borderColor: 'transparent',
                  boxShadow: '0 14px 26px rgba(207, 31, 112, 0.3)',
                  transform: 'translateY(-2px) scale(1.04)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>

            <Box
              sx={{
                display: 'grid',
                justifyItems: 'center',
                gap: 1,
                px: { xs: 5.5, sm: 7 },
                py: 2.2,
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(255, 247, 251, 0.92), rgba(255, 255, 255, 0.98))',
                borderBottom: '1px solid rgba(223, 50, 123, 0.1)',
              }}
            >
              <Typography
                variant="h5"
                sx={{ m: 0, color: '#4b136b', fontSize: { xs: '1.5rem', sm: '1.8rem' }, fontWeight: 900, lineHeight: 1.14, overflowWrap: 'anywhere' }}
              >
                {t('brDetailsTitle')}
              </Typography>
              <span className={`forms-status forms-status--${selected.status || 'new'}`}>
                {t(STATUS_KEYS[selected.status] || 'fmStatusNew')}
              </span>
            </Box>

            <Box sx={{ minHeight: 0, overflowY: 'auto', p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'grid', gap: 1.1 }}>
                <Box
                  component="section"
                  sx={{
                    display: 'grid',
                    gap: 0.65,
                    p: 1.5,
                    border: '1px solid rgba(223, 50, 123, 0.1)',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(255, 247, 251, 0.72), rgba(255, 255, 255, 0.98))',
                  }}
                >
                  <Typography sx={{ m: 0, color: '#4b136b', fontSize: '1.02rem', fontWeight: 900, lineHeight: 1.3 }}>
                    {t('brMessage')}
                  </Typography>
                  <Typography dir="auto" sx={{ color: 'rgba(36, 16, 79, 0.76)', fontSize: '0.95rem', fontWeight: 650, lineHeight: 1.45, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
                    {selected.message || '-'}
                  </Typography>
                </Box>

                <Box
                  component="section"
                  sx={{
                    display: 'grid',
                    gap: 1.2,
                    p: 1.5,
                    border: '1px solid rgba(223, 50, 123, 0.1)',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(255, 247, 251, 0.72), rgba(255, 255, 255, 0.98))',
                  }}
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.15 }}>
                    <DetailLine label={t('brColReporter')} value={selected.reporterName || t('fmUnnamed')} />
                    <DetailLine label={t('fmEmail')} value={selected.reporterEmail} />
                    <DetailLine label={t('brColCategory')} value={t(CATEGORY_KEYS[selected.category] || 'brCatOther')} />
                    <DetailLine label={t('brRoute')} value={selected.route} />
                    <DetailLine label={t('brLocale')} value={selected.locale} />
                    <DetailLine label={t('brColSubmitted')} value={formatDateTime(selected.createdAt, intlLocale)} />
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.25, borderTop: '1px solid rgba(223, 50, 123, 0.1)', background: 'rgba(255, 255, 255, 0.9)' }}>
              <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                <Button
                  onClick={() => toggleHandled(selected)}
                  disabled={Boolean(busyId)}
                  startIcon={(selected.status || 'new') === BUG_REPORT_STATUS.HANDLED ? <ReplayIcon /> : <CheckCircleIcon />}
                  sx={{
                    minHeight: 40,
                    px: 1.7,
                    border: '2px solid rgba(91, 30, 140, 0.2)',
                    borderRadius: 999,
                    color: '#5b1e8c',
                    background: 'rgba(255, 255, 255, 0.97)',
                    boxShadow: '0 9px 24px rgba(91, 30, 140, 0.12)',
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    textTransform: 'none',
                    transition: 'color 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
                    '&:hover, &:focus-visible': {
                      color: '#fff',
                      background: 'linear-gradient(135deg, #e73386, #dc2577)',
                      borderColor: 'transparent',
                      boxShadow: '0 14px 26px rgba(223, 50, 123, 0.24)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {(selected.status || 'new') === BUG_REPORT_STATUS.HANDLED ? t('fmReopenBtn') : t('fmMarkAsHandled')}
                </Button>
                <Button
                  onClick={() => { setDeleteTarget(selected); setDetailsOpen(false); }}
                  startIcon={<DeleteOutlineIcon />}
                  sx={{
                    minHeight: 40,
                    px: 1.7,
                    border: '2px solid rgba(91, 30, 140, 0.2)',
                    borderRadius: 999,
                    color: '#5b1e8c',
                    background: 'rgba(255, 255, 255, 0.97)',
                    boxShadow: '0 9px 24px rgba(91, 30, 140, 0.12)',
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    textTransform: 'none',
                    transition: 'color 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
                    '&:hover, &:focus-visible': {
                      color: '#fff',
                      background: 'linear-gradient(135deg, #e73386, #dc2577)',
                      borderColor: 'transparent',
                      boxShadow: '0 14px 26px rgba(223, 50, 123, 0.24)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {t('brDelete')}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      ) : null}

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => (busyId ? null : setDeleteTarget(null))}
        PaperProps={{ dir: direction, sx: { borderRadius: '24px', width: { xs: 'calc(100vw - 32px)', sm: '30rem' }, maxWidth: 480 } }}
      >
        <DialogTitle sx={{ fontWeight: 950, color: '#100B2F' }}>{t('brDeleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4F4A70' }}>{t('brDeleteConfirm')}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={Boolean(busyId)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: '#6F6890' }}>
            {t('brCancel')}
          </Button>
          <Button
            onClick={confirmDelete}
            disabled={Boolean(busyId)}
            variant="contained"
            color="error"
            startIcon={busyId ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 2.8 }}
          >
            {busyId ? t('brDeleting') : t('brDelete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
