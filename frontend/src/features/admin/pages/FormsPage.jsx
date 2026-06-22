// Forms page — volunteer & donation contact-form submissions from the public
// website. The public modals write to the `formSubmissions` collection (see
// features/public/services/formSubmissionService.js); this page lists them and
// lets an admin mark each as handled or delete it.
//
// Styling/structure intentionally mirror JoinRequestsTab so the two admin
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
  FORM_SUBMISSION_STATUS,
  FORM_SUBMISSION_TYPE,
  deleteSubmission,
  listFormSubmissions,
  setSubmissionHandled,
} from '../services/formSubmissionAdminService';
import { useAdminLocale } from '../context/AdminLocaleContext';
import './FormsPage.css';

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en-US' };
const PAGE_SIZE = 10;

const STATUS_META = {
  [FORM_SUBMISSION_STATUS.NEW]: { labelKey: 'fmStatusNew', color: '#B45309', bg: 'rgba(245, 158, 11, 0.16)' },
  [FORM_SUBMISSION_STATUS.HANDLED]: { labelKey: 'fmStatusHandled', color: '#15803D', bg: 'rgba(34, 197, 94, 0.16)' },
};

const TYPE_META = {
  [FORM_SUBMISSION_TYPE.VOLUNTEER]: { labelKey: 'fmTypeVolunteer' },
  [FORM_SUBMISSION_TYPE.DONATION]: { labelKey: 'fmTypeDonation' },
};

function formatDate(value, intlLocale) {
  if (!value) return '-';
  if (typeof value.toDate === 'function') return value.toDate().toLocaleDateString(intlLocale);
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000).toLocaleDateString(intlLocale);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString(intlLocale);
}

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

const TABLE_COLUMNS = [
  { key: 'user', label: 'User', align: 'left' },
  { key: 'contact', label: 'Contact', align: 'left' },
  { key: 'type', label: 'Type', align: 'center' },
  { key: 'submitted', label: 'Submitted', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'actions', label: 'Actions', align: 'center' },
];

function FormDetailLine({ label, value }) {
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

function getRequestTitle(type) {
  return type === FORM_SUBMISSION_TYPE.DONATION ? 'Donation request' : 'Volunteer join request';
}

function getRequesterLabel(type) {
  return type === FORM_SUBMISSION_TYPE.DONATION ? 'Donor name' : 'Volunteer name';
}

export default function FormsPage() {
  const { t, lang, direction } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en-US';
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
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
      const list = await listFormSubmissions();
      setSubmissions(list);
    } catch (err) {
      console.error('Failed to fetch form submissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((sub) => {
      const matchesType = typeFilter === 'all' || (sub.type || 'volunteer') === typeFilter;
      const matchesStatus = statusFilter === 'all' || (sub.status || 'new') === statusFilter;
      const matchesSearch =
        !q ||
        [sub.fullName, sub.email, sub.phone, sub.message].some((value) => String(value || '').toLowerCase().includes(q));
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [submissions, search, typeFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

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
    setTypeFilter('all');
    setStatusFilter('all');
  };

  function openDetails(sub) {
    setSelected(sub);
    setDetailsOpen(true);
  }

  async function toggleHandled(sub) {
    const handled = (sub.status || 'new') !== FORM_SUBMISSION_STATUS.HANDLED;
    setBusyId(sub.id);
    setActionError('');
    try {
      await setSubmissionHandled(sub, handled);
      await load();
    } catch (err) {
      console.error('Update failed:', err);
      setActionError(err?.message || t('fmErrUpdate'));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setActionError('');
    try {
      await deleteSubmission(deleteTarget);
      setDeleteTarget(null);
      setDetailsOpen(false);
      await load();
    } catch (err) {
      console.error('Delete failed:', err);
      setActionError(err?.message || t('fmErrDelete'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Box component="section" className="forms-admin-page" dir={direction}>
      <h1 className="forms-admin-top-title">{t('fmTitle')}</h1>

      {actionError ? (
        <Alert severity="error" sx={{ mb: 1, borderRadius: '14px', flex: '0 0 auto' }} onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      ) : null}

      <div className="forms-admin-layout">
        <main className="forms-admin-main">
          <section className="forms-filter-card" aria-label={t('apFiltersAria')}>
            <label className="forms-search-field">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('fmSearchPlaceholder')} />
            </label>
            <label className="forms-filter-field">
              <span>{t('apColEventType')}</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">{t('fmAllTypes')}</option>
                <option value={FORM_SUBMISSION_TYPE.VOLUNTEER}>{t('fmTypeVolunteer')}</option>
                <option value={FORM_SUBMISSION_TYPE.DONATION}>{t('fmTypeDonation')}</option>
              </select>
            </label>
            <label className="forms-filter-field">
              <span>{t('apColStatus')}</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">{t('fmAllStatuses')}</option>
                <option value={FORM_SUBMISSION_STATUS.NEW}>{t('fmStatusNew')}</option>
                <option value={FORM_SUBMISSION_STATUS.HANDLED}>{t('fmStatusHandled')}</option>
              </select>
            </label>
            <button type="button" className="forms-filter-clear-btn" onClick={clearFilters}>
              {t('auditClear')}
            </button>
          </section>

          <section className="forms-table-card" aria-busy={loading}>
            <div className="forms-table forms-table--head" dir="ltr">
              {TABLE_COLUMNS.map((column) => (
                <span key={column.key}>{column.label}</span>
              ))}
            </div>

            <div className="forms-table-body forms-table-wrapper" dir="ltr">
              {loading ? (
                <div className="forms-table-state">
                  <CircularProgress size={26} />
                </div>
              ) : paginated.length > 0 ? (
                paginated.map((sub) => {
                  const isHandled = (sub.status || 'new') === FORM_SUBMISSION_STATUS.HANDLED;
                  const isBusy = busyId === sub.id;
                  return (
                    <div className="forms-table forms-table--row" key={sub.id}>
                      <div className="forms-user-cell">
                        <span className="forms-avatar">{initialsOf(sub.fullName)}</span>
                        <strong dir="auto">{sub.fullName || t('fmUnnamed')}</strong>
                      </div>
                      <div className="forms-contact-cell">
                        <span dir="ltr">{sub.email || t('fmNoEmail')}</span>
                        {sub.phone ? <small dir="ltr">{sub.phone}</small> : null}
                      </div>
                      <span className={`forms-type-badge forms-type-badge--${sub.type || FORM_SUBMISSION_TYPE.VOLUNTEER}`}>
                        {t(TYPE_META[sub.type]?.labelKey || TYPE_META[FORM_SUBMISSION_TYPE.VOLUNTEER].labelKey)}
                      </span>
                      <span className="forms-date-cell">{formatTableDate(sub.createdAt)}</span>
                      <span className={`forms-status forms-status--${sub.status || FORM_SUBMISSION_STATUS.NEW}`}>
                        {t(STATUS_META[sub.status]?.labelKey || STATUS_META[FORM_SUBMISSION_STATUS.NEW].labelKey)}
                      </span>
                      <span className="forms-actions" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          aria-label={(isHandled ? t('fmReopenAria') : t('fmMarkHandledAria')).replace('{name}', sub.fullName || t('fmSubmissionWord'))}
                          title={(isHandled ? t('fmReopenBtn') : t('fmMarkAsHandled'))}
                          onClick={() => toggleHandled(sub)}
                          disabled={isBusy}
                        >
                          {isBusy ? <CircularProgress size={14} color="inherit" /> : isHandled ? <ReplayIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                        </button>
                        <button
                          type="button"
                          className="forms-action-danger"
                          aria-label={t('fmDeleteAria').replace('{name}', sub.fullName || t('fmSubmissionWord'))}
                          title={t('fmDeleteBtn')}
                          onClick={() => setDeleteTarget(sub)}
                          disabled={isBusy}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </button>
                        <button
                          type="button"
                          aria-label={t('fmViewAria').replace('{name}', sub.fullName || t('fmSubmissionWord'))}
                          title={t('fmViewAria').replace('{name}', sub.fullName || t('fmSubmissionWord'))}
                          onClick={() => openDetails(sub)}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </button>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="forms-table-state">
                  <strong>{t('fmNoSubmissions')}</strong>
                  <span>{submissions.length === 0 ? t('fmEmptyHint') : t('fmEmptyFilterHint')}</span>
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
          aria-label={t('fmViewAria').replace('{name}', selected.fullName || t('fmSubmissionWord'))}
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
              aria-label={t('fmCloseDetails')}
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
                sx={{
                  m: 0,
                  color: '#4b136b',
                  fontSize: { xs: '1.5rem', sm: '1.8rem' },
                  fontWeight: 900,
                  lineHeight: 1.14,
                  overflowWrap: 'anywhere',
                }}
              >
                {getRequestTitle(selected.type)}
              </Typography>
              <Box
                sx={{
                  display: 'inline-grid',
                  justifyItems: 'center',
                  gap: 0.2,
                  minWidth: { xs: 'min(100%, 16rem)', sm: '18rem' },
                  maxWidth: '100%',
                  borderRadius: '16px',
                  px: 2.2,
                  py: 0.85,
                  background: 'rgba(255, 255, 255, 0.72)',
                  border: '1px solid rgba(223, 50, 123, 0.16)',
                }}
              >
                <Typography sx={{ color: 'rgba(75, 19, 107, 0.52)', fontSize: '0.72rem', fontWeight: 850, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {getRequesterLabel(selected.type)}
                </Typography>
                <Typography dir="auto" sx={{ maxWidth: '100%', color: '#171239', fontSize: '1.05rem', fontWeight: 950, lineHeight: 1.2, overflowWrap: 'anywhere' }}>
                  {selected.fullName || t('fmUnnamed')}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ minHeight: 0, overflowY: 'auto', p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'grid', gap: 1.1 }}>
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
                  <Typography sx={{ m: 0, color: '#4b136b', fontSize: '1.02rem', fontWeight: 900, lineHeight: 1.3 }}>
                    {t('auditDetailsAria')}
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.15 }}>
                    <FormDetailLine label={t('fmEmail')} value={selected.email || t('fmNoEmail')} />
                    <FormDetailLine label={t('fmPhone')} value={selected.phone} />
                    <FormDetailLine label="Type" value={t(TYPE_META[selected.type]?.labelKey || TYPE_META[FORM_SUBMISSION_TYPE.VOLUNTEER].labelKey)} />
                    <FormDetailLine label="Status" value={t(STATUS_META[selected.status]?.labelKey || STATUS_META[FORM_SUBMISSION_STATUS.NEW].labelKey)} />
                    <FormDetailLine label="Submitted" value={formatTableDate(selected.createdAt)} />
                    {selected.status === FORM_SUBMISSION_STATUS.HANDLED ? (
                      <FormDetailLine
                        label={t('fmHandledLabel').replace('{date}', formatDate(selected.handledAt, intlLocale))}
                        value={selected.handledBy ? t('fmHandledBy').replace('{name}', selected.handledBy) : '-'}
                      />
                    ) : null}
                  </Box>
                </Box>

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
                    {t('fmMessage')}
                  </Typography>
                  <Typography dir="auto" sx={{ color: 'rgba(36, 16, 79, 0.76)', fontSize: '0.95rem', fontWeight: 650, lineHeight: 1.45, overflowWrap: 'anywhere' }}>
                    {selected.message || '-'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                px: { xs: 1.5, sm: 2 },
                py: 1.25,
                borderTop: '1px solid rgba(223, 50, 123, 0.1)',
                background: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                <Button
                  onClick={() => toggleHandled(selected).then(() => setSelected((cur) => (cur ? { ...cur, status: (cur.status || 'new') === FORM_SUBMISSION_STATUS.HANDLED ? FORM_SUBMISSION_STATUS.NEW : FORM_SUBMISSION_STATUS.HANDLED } : cur)))}
                  startIcon={(selected.status || 'new') === FORM_SUBMISSION_STATUS.HANDLED ? <ReplayIcon /> : <CheckCircleIcon />}
                  sx={{
                    minHeight: 40,
                    minWidth: 0,
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
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  {(selected.status || 'new') === FORM_SUBMISSION_STATUS.HANDLED ? t('fmReopenBtn') : t('fmMarkAsHandled')}
                </Button>
                <Button
                  onClick={() => {
                    setDeleteTarget(selected);
                    setDetailsOpen(false);
                  }}
                  startIcon={<DeleteOutlineIcon />}
                  sx={{
                    minHeight: 40,
                    minWidth: 0,
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
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  {t('fmDeleteBtn')}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      ) : null}

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => (busyId ? null : setDeleteTarget(null))}
        PaperProps={{ dir: direction, sx: { borderRadius: '24px', width: { xs: 'calc(100vw - 32px)', sm: '30rem' }, maxWidth: 480 } }}
      >
        <DialogTitle sx={{ fontWeight: 950, color: '#100B2F' }}>{t('fmDeleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4F4A70' }}>
            {t('fmDeleteConfirmPre')}<strong dir="auto">{deleteTarget?.fullName || deleteTarget?.email || t('fmThisContact')}</strong>{t('fmDeleteConfirmPost')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={Boolean(busyId)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: '#6F6890' }}>
            {t('fmCancel')}
          </Button>
          <Button
            onClick={confirmDelete}
            disabled={Boolean(busyId)}
            variant="contained"
            color="error"
            startIcon={busyId ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 2.8 }}
          >
            {busyId ? t('fmDeleting') : t('fmDeleteBtn')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
