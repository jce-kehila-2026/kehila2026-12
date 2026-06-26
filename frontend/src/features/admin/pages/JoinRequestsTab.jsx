// Membership-applications tab inside the Users page.
//
// Phase 1: read-only list of public "טופס הצטרפות לעמותה" submissions.
// Phase 2 (this update): Accept / Reject actions.
//   - Accept creates the applicant's login account with a temporary password
//     (shown to the admin in a copy-able dialog) and marks the request approved.
//   - Reject records an optional reason.
//   Automatic email of the temp password is added in Phase 3; for now the admin
//   shares it manually.
import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import FormControlLabel from '@mui/material/FormControlLabel';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AdminDetailInfoCard from '../components/AdminDetailInfoCard';
import {
  JOIN_REQUEST_STATUS,
  approveJoinRequest,
  rejectJoinRequest,
} from '../services/joinRequestAdminService';
import {
  isApprovalEmailConfigured,
  isRejectionEmailConfigured,
  sendApprovalEmail,
  sendRejectionEmail,
} from '../services/approvalEmailService';
import { useAdminLocale } from '../context/AdminLocaleContext';

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en-US' };
const PAGE_SIZE = 10;

const STATUS_META = {
  [JOIN_REQUEST_STATUS.NEW]: { labelKey: 'jrStatusNew', color: '#B45309', bg: 'rgba(245, 158, 11, 0.16)' },
  [JOIN_REQUEST_STATUS.APPROVED]: { labelKey: 'jrStatusApproved', color: '#15803D', bg: 'rgba(34, 197, 94, 0.16)' },
  [JOIN_REQUEST_STATUS.REJECTED]: { labelKey: 'jrStatusRejected', color: '#B91C1C', bg: 'rgba(239, 68, 68, 0.14)' },
};

function formatDate(value, intlLocale) {
  if (!value) return '-';
  const formatDayMonthYear = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  };
  if (typeof value.toDate === 'function') return formatDayMonthYear(value.toDate());
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return formatDayMonthYear(new Date(value.seconds * 1000));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : formatDayMonthYear(parsed);
}

function formatBool(value, t) {
  if (value === true) return t('jrYes');
  if (value === false) return t('jrNo');
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
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

function getCreatedDateValue(request) {
  const value = request?.createdAt;
  if (!value) return new Date(0);
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function paginateRows(rows, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const startIndex = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    rows: rows.slice(startIndex, startIndex + pageSize),
  };
}

function StatusChip({ status, t, compact = false }) {
  const meta = STATUS_META[status] || STATUS_META[JOIN_REQUEST_STATUS.NEW];
  return (
    <Chip
      label={t(meta.labelKey)}
      size="small"
      sx={{
        color: meta.color,
        bgcolor: meta.bg,
        borderRadius: 999,
        fontWeight: 900,
        border: '1px solid rgba(255,255,255,0.7)',
        ...(compact
          ? {
              height: '1.375rem',
              width: 'fit-content',
              maxWidth: 'fit-content',
              flexShrink: 0,
              '& .MuiChip-label': {
                px: 0.875,
                py: 0,
                fontSize: '0.6875rem',
                fontWeight: 900,
                lineHeight: 1.2,
              },
            }
          : {}),
      }}
    />
  );
}

export default function JoinRequestsTab({ requests = [], loading = false, onChanged }) {
  const { t, lang, direction } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en-US';
  const statusLabel = (s) => {
    const meta = STATUS_META[s];
    return meta ? t(meta.labelKey) : t('jrDecision');
  };
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [readyFilter, setReadyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Approve/reject action state.
  const [actionMode, setActionMode] = useState(null); // 'approve' | 'reject'
  const [actionTarget, setActionTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [notifyOnReject, setNotifyOnReject] = useState(() => isRejectionEmailConfigured());
  const [approveResult, setApproveResult] = useState(null); // { email, tempPassword }
  const [emailStatus, setEmailStatus] = useState('idle'); // 'sending' | 'sent' | 'failed' | 'not-configured'
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const next = requests.filter((req) => {
      const matchesStatus = statusFilter === 'all' || (req.status || 'new') === statusFilter;
      const matchesReady =
        readyFilter === 'all' ||
        (readyFilter === 'yes' && req.readyToJoin === true) ||
        (readyFilter === 'no' && req.readyToJoin === false);
      const matchesSearch =
        !q ||
        [req.fullName, req.email, req.phone, req.address, req.cancerStory].some((value) =>
          String(value || '').toLowerCase().includes(q),
        );
      return matchesStatus && matchesReady && matchesSearch;
    });

    return [...next].sort((left, right) => {
      if (sortBy === 'name') return String(left.fullName || '').localeCompare(String(right.fullName || ''));
      if (sortBy === 'status') {
        const leftStatus = left.status || JOIN_REQUEST_STATUS.NEW;
        const rightStatus = right.status || JOIN_REQUEST_STATUS.NEW;
        return leftStatus.localeCompare(rightStatus);
      }

      const leftDate = getCreatedDateValue(left);
      const rightDate = getCreatedDateValue(right);
      return sortBy === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [readyFilter, requests, search, sortBy, statusFilter]);

  const pagination = useMemo(() => paginateRows(filtered, page, PAGE_SIZE), [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [readyFilter, search, sortBy, statusFilter]);

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setReadyFilter('all');
    setSortBy('newest');
  }

  const applicationDetailRows = useMemo(() => {
    if (!selected) return [];
    const rows = [
      [
        { fieldKey: 'email', labelKey: 'jrEmail', value: selected.email },
        { fieldKey: 'phone', labelKey: 'jrPhone', value: selected.phone },
      ],
      [
        { fieldKey: 'address', labelKey: 'jrAddress', value: selected.address },
        { fieldKey: 'dob', labelKey: 'jrDateOfBirth', value: formatDate(selected.birthDate, intlLocale) },
      ],
      [
        { fieldKey: 'consent', labelKey: 'jrConsent', value: formatBool(selected.consentToReceiveInfo, t) },
        { fieldKey: 'readyToJoin', labelKey: 'jrReadyToJoin', value: formatBool(selected.readyToJoin, t) },
      ],
      [
        { fieldKey: 'whatsappNote', labelKey: 'jrWhatsappNote', value: selected.whatsappNote },
        { fieldKey: 'bio', labelKey: 'jrStory', value: selected.cancerStory },
      ],
    ];

    if (
      selected.status === JOIN_REQUEST_STATUS.APPROVED
      || selected.status === JOIN_REQUEST_STATUS.REJECTED
    ) {
      rows.push([
        {
          fieldKey: 'decision',
          label: `${statusLabel(selected.status)} ${t('jrBy')}`,
          value: [
            selected.decidedBy,
            selected.rejectionReason && t('jrReason').replace('{reason}', selected.rejectionReason),
          ].filter(Boolean).join('\n') || '-',
        },
      ]);
    }

    return rows;
  }, [selected, t, intlLocale]);

  function openDetails(req) {
    setSelected(req);
    setDetailsOpen(true);
  }

  function startApprove(req) {
    setActionTarget(req);
    setActionMode('approve');
    setApproveResult(null);
    setEmailStatus('idle');
    setActionError('');
    setDetailsOpen(false);
  }

  function startReject(req) {
    setActionTarget(req);
    setActionMode('reject');
    setRejectReason('');
    setNotifyOnReject(isRejectionEmailConfigured() && Boolean(req?.email));
    setActionError('');
    setDetailsOpen(false);
  }

  function resetAction() {
    setActionMode(null);
    setActionTarget(null);
    setActionError('');
    setApproveResult(null);
    setEmailStatus('idle');
    setRejectReason('');
    setCopied(false);
  }

  function closeAction() {
    if (actionLoading) return;
    resetAction();
  }

  async function confirmApprove() {
    if (!actionTarget) return;
    setActionLoading(true);
    setActionError('');
    try {
      const result = await approveJoinRequest(actionTarget);
      setApproveResult(result);
      onChanged?.();

      // Send the approval email. Failure here must NOT undo the approval —
      // the account already exists and the password is shown as a fallback.
      if (!isApprovalEmailConfigured()) {
        setEmailStatus('not-configured');
      } else {
        setEmailStatus('sending');
        try {
          await sendApprovalEmail({
            toEmail: result.email,
            fullName: actionTarget.fullName,
            tempPassword: result.tempPassword,
            loginUrl: `${window.location.origin}/login`,
          });
          setEmailStatus('sent');
        } catch (emailErr) {
          console.error('Approval email failed:', emailErr);
          setEmailStatus('failed');
        }
      }
    } catch (err) {
      console.error('Approve failed:', err);
      setActionError(err?.message || t('jrErrApprove'));
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmReject() {
    if (!actionTarget) return;
    setActionLoading(true);
    setActionError('');
    try {
      await rejectJoinRequest(actionTarget, { reason: rejectReason });
      onChanged?.();

      // Optional decline email — best effort; the reject already succeeded.
      if (notifyOnReject && actionTarget.email && isRejectionEmailConfigured()) {
        try {
          await sendRejectionEmail({ toEmail: actionTarget.email, fullName: actionTarget.fullName });
        } catch (emailErr) {
          console.error('Decline email failed:', emailErr);
        }
      }

      resetAction();
    } catch (err) {
      console.error('Reject failed:', err);
      setActionError(err?.message || t('jrErrReject'));
    } finally {
      setActionLoading(false);
    }
  }

  async function copyPassword() {
    if (!approveResult?.tempPassword) return;
    try {
      await navigator.clipboard.writeText(approveResult.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — admin can select the text manually */
    }
  }

  const rowGrid = {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr)',
      md: 'minmax(260px, 1.35fr) minmax(150px, 0.72fr) minmax(120px, 0.58fr) minmax(112px, 0.52fr) 116px',
    },
    alignItems: 'center',
    columnGap: '0.75rem',
  };

  const filterFieldSx = {
    minHeight: '2.5rem',
    border: '1px solid rgba(0, 0, 0, 0.23)',
    borderRadius: '18px',
    background: 'rgba(255, 255, 255, 0.97)',
    color: '#171239',
    boxShadow: 'none',
    transition: 'none',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    px: '0.875rem',
    '&:focus-within': {
      borderColor: '#6d35b8',
      boxShadow: '0 0 0 3px rgba(109, 53, 184, 0.14)',
    },
    '& span': {
      position: 'absolute',
      top: '-0.7rem',
      left: '1rem',
      px: '0.375rem',
      color: '#171239',
      background: 'rgba(255, 255, 255, 0.97)',
      fontSize: '0.8125rem',
      fontWeight: 500,
      lineHeight: 1,
      pointerEvents: 'none',
    },
    '& input': {
      width: '100%',
      border: 0,
      outline: 0,
      background: 'transparent',
      color: 'inherit',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      fontWeight: 400,
    },
    '& select': {
      width: '100%',
      border: 0,
      outline: 0,
      background: 'transparent',
      color: 'inherit',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      fontWeight: 400,
      minWidth: 0,
      cursor: 'pointer',
    },
    '& input::placeholder': {
      color: 'rgba(23, 18, 57, 0.42)',
      opacity: 1,
    },
  };

  return (
    <Box
      dir={direction}
      sx={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minHeight: 0,
      }}
    >
      <Box
        component="section"
        aria-label={t('apFiltersAria')}
        sx={{
          border: '1px solid rgba(167, 139, 250, 0.18)',
          borderRadius: '22px',
          background: 'rgba(255, 255, 255, 0.78)',
          boxShadow: 'none',
          backdropFilter: 'blur(18px)',
          p: '1rem',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(280px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr) minmax(160px, 1fr) auto',
          },
          gap: '0.75rem',
          alignItems: 'center',
          overflow: 'visible',
          position: 'relative',
          zIndex: 100,
          flex: '0 0 auto',
        }}
      >
        <Box component="label" sx={filterFieldSx}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('jrSearchPlaceholder')} />
        </Box>
        <Box component="label" sx={filterFieldSx}>
          <span>{t('jrColStatus')}</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">{t('jrAllStatuses')}</option>
            <option value={JOIN_REQUEST_STATUS.NEW}>{t('jrStatusNew')}</option>
            <option value={JOIN_REQUEST_STATUS.APPROVED}>{t('jrStatusApproved')}</option>
            <option value={JOIN_REQUEST_STATUS.REJECTED}>{t('jrStatusRejected')}</option>
          </select>
        </Box>
        <Box component="label" sx={filterFieldSx}>
          <span>{t('jrReadyToJoin')}</span>
          <select value={readyFilter} onChange={(event) => setReadyFilter(event.target.value)}>
            <option value="all">{t('jrAllReadiness')}</option>
            <option value="yes">{t('jrYes')}</option>
            <option value="no">{t('jrNo')}</option>
          </select>
        </Box>
        <Box component="label" sx={filterFieldSx}>
          <span>{t('evSortBy')}</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="newest">{t('sortNewest')}</option>
            <option value="oldest">{t('sortOldest')}</option>
            <option value="name">{t('sortName')}</option>
            <option value="status">{t('jrColStatus')}</option>
          </select>
        </Box>
        <Button
          type="button"
          onClick={clearFilters}
          sx={{
            minHeight: '2.5rem',
            px: '1.25rem',
            border: '1px solid rgba(0, 0, 0, 0.23)',
            borderRadius: '18px',
            color: '#171239',
            background: 'rgba(255, 255, 255, 0.97)',
            boxShadow: 'none',
            fontFamily: 'inherit',
            fontSize: '1rem',
            fontWeight: 400,
            textTransform: 'none',
            cursor: 'pointer',
            transition: 'color 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
            '&:hover': {
              color: '#fff',
              background: 'linear-gradient(135deg, #e73386, #dc2577)',
              borderColor: 'transparent',
              boxShadow: '0 14px 26px rgba(223, 50, 123, 0.24)',
              transform: 'translateY(-2px)',
            },
            '&:focus-visible': {
              color: '#fff',
              background: 'linear-gradient(135deg, #e73386, #dc2577)',
              borderColor: 'transparent',
              boxShadow: '0 14px 26px rgba(223, 50, 123, 0.24)',
              transform: 'translateY(-2px)',
            },
            '&:active': { transform: 'translateY(0)' },
          }}
        >
          {t('auditClear')}
        </Button>
      </Box>

      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(167, 139, 250, 0.18)',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.82)',
          boxShadow: 'none',
          backdropFilter: 'blur(18px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            ...rowGrid,
            px: '1.125rem',
            display: { xs: 'none', md: 'grid' },
            minHeight: '3.25rem',
            borderBottom: '1px solid rgba(167, 139, 250, 0.13)',
            color: 'rgba(36, 16, 79, 0.64)',
            fontSize: '0.8125rem',
            fontWeight: 800,
            flex: '0 0 auto',
          }}
        >
          {['jrColApplicant', 'jrColPhone', 'jrColSubmitted', 'jrColStatus', 'jrColActions'].map((key, index) => (
            <Typography
              key={key}
              sx={{
                fontWeight: 800,
                color: 'rgba(36, 16, 79, 0.64)',
                fontSize: '0.8125rem',
                textTransform: 'none',
                letterSpacing: 0,
                textAlign: index === 0 ? 'left' : 'center',
              }}
            >
              {t(key)}
            </Typography>
          ))}
        </Box>

        <Box
          sx={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarGutter: 'stable',
            '&::-webkit-scrollbar': { width: '0.5rem' },
            '&::-webkit-scrollbar-track': { background: 'rgba(244, 238, 255, 0.45)', borderRadius: 999 },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(167, 139, 250, 0.5)', borderRadius: 999 },
          }}
        >
            {loading ? (
              <Box sx={{ minHeight: '100%', p: '2rem', display: 'grid', placeContent: 'center', justifyItems: 'center' }}>
                <CircularProgress />
              </Box>
            ) : pagination.rows.length > 0 ? (
              pagination.rows.map((req) => {
                const isNew = (req.status || 'new') === JOIN_REQUEST_STATUS.NEW;
                return (
                  <Box
                    key={req.id}
                    sx={{
                      ...rowGrid,
                      minHeight: { xs: 'auto', md: '4rem' },
                      px: { xs: 1.7, md: '1.125rem' },
                      py: { xs: 1.35, md: 0 },
                      borderRadius: { xs: '18px', md: 0 },
                      border: 0,
                      borderBottom: '1px solid rgba(167, 139, 250, 0.13)',
                      bgcolor: 'transparent',
                      cursor: 'default',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                      <Avatar
                        sx={{
                          width: '2rem',
                          height: '2rem',
                          background: 'linear-gradient(135deg, #fce7f3, #ddd6fe)',
                          color: '#6D3CCF',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          boxShadow: 'none',
                        }}
                      >
                        {initialsOf(req.fullName)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography dir="auto" fontWeight={800} noWrap sx={{ color: '#17122E', fontSize: '0.8125rem', lineHeight: 1.2 }}>
                          {req.fullName || t('jrUnnamed')}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography fontWeight={700} color="rgba(36, 16, 79, 0.72)" noWrap dir="ltr" sx={{ textAlign: 'center', fontSize: '0.8125rem' }}>
                      {req.phone || '-'}
                    </Typography>

                    <Typography fontWeight={700} color="rgba(36, 16, 79, 0.72)" sx={{ textAlign: 'center', fontSize: '0.8125rem' }}>
                      {formatDate(req.createdAt, intlLocale)}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                      <StatusChip status={req.status} t={t} />
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.75}
                      onClick={(event) => event.stopPropagation()}
                      sx={{
                        width: '100%',
                        minWidth: 0,
                        justifyContent: { xs: 'flex-start', md: 'center' },
                        justifySelf: { xs: 'start', md: 'stretch' },
                      }}
                    >
                      {isNew ? (
                        <>
                          <IconButton
                            aria-label={t('jrApproveAria').replace('{name}', req.fullName || t('jrApplicationWord'))}
                            onClick={() => startApprove(req)}
                            sx={{
                              width: '2rem',
                              height: '2rem',
                              color: '#15803D',
                              bgcolor: 'rgba(34, 197, 94, 0.12)',
                              border: '1px solid rgba(255,255,255,0.72)',
                              '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.2)' },
                            }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            aria-label={t('jrRejectAria').replace('{name}', req.fullName || t('jrApplicationWord'))}
                            onClick={() => startReject(req)}
                            sx={{
                              width: '2rem',
                              height: '2rem',
                              color: '#B91C1C',
                              bgcolor: 'rgba(239, 68, 68, 0.10)',
                              border: '1px solid rgba(255,255,255,0.72)',
                              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.18)' },
                            }}
                          >
                            <DoNotDisturbAltIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : null}
                      <IconButton
                        aria-label={t('jrViewAria').replace('{name}', req.fullName || t('jrApplicationWord'))}
                        onClick={() => openDetails(req)}
                        sx={{
                          width: '2rem',
                          height: '2rem',
                          color: '#5b1e8c',
                          bgcolor: 'rgba(255, 255, 255, 0.97)',
                          border: 0,
                          boxShadow: '0 9px 24px rgba(91, 30, 140, 0.12)',
                          transition: 'color 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease',
                          '&:hover, &:focus-visible': {
                            color: '#fff',
                            background: 'linear-gradient(135deg, #e73386, #dc2577)',
                            boxShadow: '0 14px 26px rgba(223, 50, 123, 0.24)',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                );
              })
            ) : (
              <Box sx={{ minHeight: '100%', p: '2rem', display: 'grid', placeContent: 'center', justifyItems: 'center', color: 'rgba(36, 16, 79, 0.65)', fontWeight: 800, textAlign: 'center' }}>
                <Typography fontWeight={900}>{t('jrNoApplications')}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {requests.length === 0
                    ? t('jrEmptyHint')
                    : t('jrEmptyFilterHint')}
                </Typography>
              </Box>
            )}
        </Box>

        <Box
          component="footer"
          sx={{
            flex: '0 0 auto',
            p: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid rgba(167, 139, 250, 0.16)',
            background: 'rgba(255, 255, 255, 0.72)',
            '& .MuiPaginationItem-root': {
              border: '2px solid transparent',
              color: '#5b1e8c',
              background: 'rgba(255, 255, 255, 0.97)',
              boxShadow: '0 9px 24px rgba(91, 30, 140, 0.12)',
              fontWeight: 900,
              transition: 'color 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease',
            },
            '& .MuiPaginationItem-root:hover': {
              color: '#fff',
              background: 'linear-gradient(135deg, #e73386, #dc2577)',
              borderColor: 'transparent',
              boxShadow: '0 14px 26px rgba(223, 50, 123, 0.24)',
              transform: 'translateY(-2px)',
            },
            '& .MuiPaginationItem-root:focus-visible': {
              color: '#fff',
              background: 'linear-gradient(135deg, #e73386, #dc2577)',
              borderColor: 'transparent',
              boxShadow: '0 14px 26px rgba(223, 50, 123, 0.24)',
              transform: 'translateY(-2px)',
            },
            '& .MuiPaginationItem-root:active': { transform: 'translateY(0)' },
            '& .MuiPaginationItem-root.Mui-selected': {
              color: '#fff',
              background: 'linear-gradient(135deg, #e73386, #dc2577)',
              borderColor: 'transparent',
              boxShadow: '0 14px 26px rgba(223, 50, 123, 0.24)',
            },
            '& .MuiPaginationItem-root.Mui-disabled': {
              color: 'rgba(91, 30, 140, 0.38)',
              background: 'rgba(255, 255, 255, 0.72)',
              boxShadow: 'none',
              transform: 'none',
            },
          }}
        >
          <Pagination
            count={pagination.pageCount}
            page={pagination.page}
            onChange={(event, value) => setPage(value)}
            siblingCount={1}
            boundaryCount={1}
            shape="rounded"
          />
        </Box>
      </Box>

      {/* Details drawer */}
      <Dialog
        open={detailsOpen && Boolean(selected)}
        onClose={() => setDetailsOpen(false)}
        maxWidth={false}
        fullScreen={false}
        TransitionComponent={Fade}
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center',
            p: '18px',
          },
        }}
        PaperProps={{
          dir: direction,
          sx: {
            width: 'min(640px, calc(100vw - 36px))',
            height: 'calc(100vh - 36px)',
            maxHeight: 'calc(100vh - 36px)',
            m: 0,
            border: '1px solid rgba(223, 50, 123, 0.14)',
            borderRadius: '24px',
            overflow: 'hidden',
            color: '#24104f',
            bgcolor: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 24px 56px rgba(31, 12, 42, 0.22)',
          },
        }}
        BackdropProps={{
          sx: {
            bgcolor: 'rgba(32, 38, 55, 0.38)',
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        {selected ? (
          <Box sx={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', height: '100%', minHeight: 0 }}>
            <Box
              sx={{
                px: { xs: 5.5, sm: 7 },
                py: { xs: 2, sm: 2.2 },
                position: 'relative',
                flexShrink: 0,
                display: 'grid',
                justifyItems: 'center',
                gap: 1,
                textAlign: 'center',
                borderBottom: '1px solid rgba(223, 50, 123, 0.1)',
                background: 'linear-gradient(180deg, rgba(255, 247, 251, 0.92), rgba(255, 255, 255, 0.98))',
              }}
            >
              <IconButton
                onClick={() => setDetailsOpen(false)}
                aria-label={t('jrCloseDetails')}
                sx={{
                  position: 'absolute',
                  top: '16px /* @noflip */',
                  right: '16px /* @noflip */',
                  left: 'auto /* @noflip */',
                  width: 38,
                  height: 38,
                  color: '#5b1e8c',
                  background: '#fff',
                  border: '1px solid rgba(91, 30, 140, 0.22)',
                  boxShadow: '0 8px 18px rgba(91, 30, 140, 0.12)',
                  zIndex: 1,
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

              <Avatar
                sx={{
                  width: '3.25rem',
                  height: '3.25rem',
                  bgcolor: '#EEE7FF',
                  color: '#6D3CCF',
                  fontSize: '1.0625rem',
                  fontWeight: 950,
                  boxShadow: '0 10px 22px rgba(109, 60, 207, 0.14)',
                }}
              >
                {initialsOf(selected.fullName)}
              </Avatar>
              <Typography
                id="join-request-details-title"
                dir="auto"
                variant="h5"
                sx={{
                  m: 0,
                  color: '#4b136b',
                  fontSize: { xs: '1.45rem', sm: '1.8rem' },
                  fontWeight: 900,
                  lineHeight: 1.14,
                  overflowWrap: 'anywhere',
                }}
              >
                {selected.fullName || t('jrUnnamed')}
              </Typography>
              <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" flexWrap="wrap" useFlexGap>
                <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.35 }}>
                  {t('jrSubmittedAt').replace('{date}', formatDate(selected.createdAt, intlLocale))}
                </Typography>
                <StatusChip status={selected.status} t={t} compact />
              </Stack>
            </Box>

            <Box sx={{ minHeight: 0, overflowY: 'auto', p: { xs: 1.5, sm: 2 } }} dir="ltr">
              <Box
                component="section"
                sx={{
                  display: 'grid',
                  gap: 1.15,
                  p: 1.5,
                  border: '1px solid rgba(223, 50, 123, 0.1)',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(255, 247, 251, 0.72), rgba(255, 255, 255, 0.98))',
                }}
              >
                <Typography sx={{ m: 0, color: '#4b136b', fontSize: '1.02rem', fontWeight: 900, lineHeight: 1.3 }}>
                  {t('auditDetailsAria')}
                </Typography>
                <Stack spacing={0.875}>
                  {applicationDetailRows.map((row, rowIndex) => (
                    <Box
                      key={rowIndex}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
                        gap: 0.875,
                        alignItems: 'stretch',
                      }}
                    >
                      {row.map(({ fieldKey, labelKey, label, value }) => (
                        <Box key={fieldKey} sx={{ minWidth: 0, display: 'flex' }}>
                          <AdminDetailInfoCard
                            label={labelKey ? t(labelKey) : label}
                            value={value}
                            iconKey={fieldKey}
                          />
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>

            {(selected.status || 'new') === JOIN_REQUEST_STATUS.NEW ? (
              <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.25, borderTop: '1px solid rgba(223, 50, 123, 0.1)', background: 'rgba(255, 255, 255, 0.9)' }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                  <Button
                    onClick={() => startReject(selected)}
                    startIcon={<DoNotDisturbAltIcon />}
                    sx={{
                      minHeight: 40,
                      px: 1.7,
                      borderRadius: 999,
                      fontWeight: 900,
                      textTransform: 'none',
                      color: '#B91C1C',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      bgcolor: 'rgba(239, 68, 68, 0.06)',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.12)' },
                    }}
                  >
                    {t('jrRejectBtn')}
                  </Button>
                  <Button
                    onClick={() => startApprove(selected)}
                    startIcon={<CheckCircleIcon />}
                    sx={{
                      minHeight: 40,
                      px: 1.7,
                      borderRadius: 999,
                      fontWeight: 950,
                      textTransform: 'none',
                      color: '#fff',
                      background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                      boxShadow: '0 14px 30px rgba(22, 163, 74, 0.26)',
                      '&:hover': { background: 'linear-gradient(135deg, #15A046 0%, #137034 100%)' },
                    }}
                  >
                    {t('jrApproveCreate')}
                  </Button>
                </Stack>
              </Box>
            ) : null}
          </Box>
        ) : null}
      </Dialog>

      {/* Approve dialog: confirm, then show the temp password */}
      <Dialog
        open={actionMode === 'approve' && Boolean(actionTarget)}
        onClose={closeAction}
        PaperProps={{ dir: direction, sx: { borderRadius: '24px', width: { xs: 'calc(100vw - 32px)', sm: '30rem' }, maxWidth: 480 } }}
      >
        {approveResult ? (
          <>
            <DialogTitle sx={{ fontWeight: 950, color: '#15803D', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon /> {t('jrAccountCreated')}
            </DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 1.5, color: '#4F4A70' }}>
                {t('jrShareCredentialsPre')}<strong dir="auto">{actionTarget?.fullName || approveResult.email}</strong>{t('jrShareCredentialsPost')}
              </Typography>
              <Box sx={{ borderRadius: '16px', border: '1px solid rgba(130, 92, 206, 0.18)', bgcolor: 'rgba(244, 238, 255, 0.6)', p: 2 }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary">{t('jrEmailLabel')}</Typography>
                <Typography dir="ltr" fontWeight={850} sx={{ mb: 1.2, wordBreak: 'break-all' }}>{approveResult.email}</Typography>
                <Typography variant="caption" fontWeight={800} color="text.secondary">{t('jrTempPassword')}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography dir="ltr" fontFamily="monospace" fontWeight={850} sx={{ fontSize: '1.05rem' }}>{approveResult.tempPassword}</Typography>
                  <IconButton size="small" onClick={copyPassword} aria-label={t('jrCopyPassword')} sx={{ color: '#6D3CCF' }}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  {copied ? <Typography variant="caption" color="#15803D" fontWeight={800}>{t('jrCopied')}</Typography> : null}
                </Stack>
              </Box>
              {emailStatus === 'sending' ? (
                <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ mt: 2, borderRadius: '14px' }}>
                  {t('jrSendingEmail')}
                </Alert>
              ) : emailStatus === 'sent' ? (
                <Alert severity="success" sx={{ mt: 2, borderRadius: '14px' }}>
                  {t('jrEmailSent').replace('{email}', approveResult.email)}
                </Alert>
              ) : emailStatus === 'failed' ? (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: '14px' }}>
                  {t('jrEmailFailed')}
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mt: 2, borderRadius: '14px' }}>
                  {t('jrEmailNotConfigured')}
                </Alert>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.4 }}>
              <Button onClick={resetAction} variant="contained" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 3, background: 'linear-gradient(135deg, #7C3AED 0%, #DF327B 100%)' }}>
                {t('jrDone')}
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ fontWeight: 950, color: '#100B2F' }}>{t('jrApproveTitle')}</DialogTitle>
            <DialogContent>
              <Typography sx={{ color: '#4F4A70' }}>
                {t('jrApproveConfirmPre')}<strong dir="auto">{actionTarget?.fullName || actionTarget?.email}</strong>{t('jrApproveConfirmPost')}
              </Typography>
              {actionError ? <Alert severity="error" sx={{ mt: 2, borderRadius: '14px' }}>{actionError}</Alert> : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.4 }}>
              <Button onClick={closeAction} disabled={actionLoading} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: '#6F6890' }}>
                {t('jrCancel')}
              </Button>
              <Button
                onClick={confirmApprove}
                disabled={actionLoading}
                variant="contained"
                startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 2.8, background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', '&:hover': { background: 'linear-gradient(135deg, #15A046 0%, #137034 100%)' } }}
              >
                {actionLoading ? t('jrCreating') : t('jrApproveCreate')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reject dialog */}
      <Dialog
        open={actionMode === 'reject' && Boolean(actionTarget)}
        onClose={closeAction}
        PaperProps={{ dir: direction, sx: { borderRadius: '24px', width: { xs: 'calc(100vw - 32px)', sm: '30rem' }, maxWidth: 480 } }}
      >
        <DialogTitle sx={{ fontWeight: 950, color: '#100B2F' }}>{t('jrRejectTitle')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4F4A70', mb: 2 }}>
            {t('jrRejectConfirmPre')}<strong dir="auto">{actionTarget?.fullName || actionTarget?.email}</strong>{t('jrRejectConfirmPost')}
          </Typography>
          <TextField
            label={t('jrReasonLabel')}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
          />
          <FormControlLabel
            sx={{ mt: 1, alignItems: 'center' }}
            control={
              <Checkbox
                checked={notifyOnReject}
                onChange={(event) => setNotifyOnReject(event.target.checked)}
                disabled={!isRejectionEmailConfigured() || !actionTarget?.email}
              />
            }
            label={
              isRejectionEmailConfigured()
                ? t('jrEmailDecline')
                : t('jrEmailDeclineDisabled')
            }
          />
          {actionError ? <Alert severity="error" sx={{ mt: 2, borderRadius: '14px' }}>{actionError}</Alert> : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button onClick={closeAction} disabled={actionLoading} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: '#6F6890' }}>
            {t('jrCancel')}
          </Button>
          <Button
            onClick={confirmReject}
            disabled={actionLoading}
            variant="contained"
            color="error"
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <DoNotDisturbAltIcon />}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 2.8 }}
          >
            {actionLoading ? t('jrRejecting') : t('jrRejectBtn')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
