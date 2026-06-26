// Membership-applications tab inside the Users page.
//
// Phase 1: read-only list of public "טופס הצטרפות לעמותה" submissions.
// Phase 2 (this update): Accept / Reject actions.
//   - Accept creates the applicant's login account with a temporary password
//     (shown to the admin in a copy-able dialog) and marks the request approved.
//   - Reject records an optional reason.
//   Automatic email of the temp password is added in Phase 3; for now the admin
//   shares it manually.
import { useMemo, useState } from 'react';
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
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import SearchIcon from '@mui/icons-material/Search';
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

const STATUS_META = {
  [JOIN_REQUEST_STATUS.NEW]: { labelKey: 'jrStatusNew', color: '#B45309', bg: 'rgba(245, 158, 11, 0.16)' },
  [JOIN_REQUEST_STATUS.APPROVED]: { labelKey: 'jrStatusApproved', color: '#15803D', bg: 'rgba(34, 197, 94, 0.16)' },
  [JOIN_REQUEST_STATUS.REJECTED]: { labelKey: 'jrStatusRejected', color: '#B91C1C', bg: 'rgba(239, 68, 68, 0.14)' },
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
    return requests.filter((req) => {
      const matchesStatus = statusFilter === 'all' || (req.status || 'new') === statusFilter;
      const matchesSearch =
        !q ||
        [req.fullName, req.email, req.phone, req.address].some((value) =>
          String(value || '').toLowerCase().includes(q),
        );
      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

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
      const decisionValue = [
        selected.decidedBy && t('jrDecidedBy').replace('{name}', selected.decidedBy),
        selected.rejectionReason && t('jrReason').replace('{reason}', selected.rejectionReason),
      ].filter(Boolean).join('\n') || '-';

      rows.push([
        {
          fieldKey: 'decision',
          label: t('jrDecisionLabel')
            .replace('{label}', (() => {
              const meta = STATUS_META[selected.status];
              return meta ? t(meta.labelKey) : t('jrDecision');
            })())
            .replace('{date}', formatDate(selected.decidedAt, intlLocale)),
          value: decisionValue,
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
      md: 'minmax(240px, 1.5fr) 140px 120px 110px 150px',
    },
    alignItems: 'center',
    gap: '1rem',
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
      <Stack
        direction={{ xs: 'column', xl: 'row' }}
        spacing={1.5}
        alignItems={{ xl: 'center' }}
        justifyContent="space-between"
        sx={{
          border: '1px solid rgba(167, 139, 250, 0.18)',
          borderRadius: '22px',
          background: 'rgba(255, 255, 255, 0.78)',
          boxShadow: 'none',
          backdropFilter: 'blur(18px)',
          p: '1rem',
          flexShrink: 0,
          position: 'relative',
          zIndex: 100,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.4} sx={{ flex: 1, justifyContent: 'flex-end' }}>
          <TextField
            placeholder={t('jrSearchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{
              minWidth: { md: '20.625rem' },
              '& .MuiOutlinedInput-root': {
                height: '2.5rem',
                borderRadius: '18px',
                bgcolor: 'rgba(255, 255, 255, 0.97)',
                '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.32)' },
                '&.Mui-focused fieldset': { borderColor: '#6d35b8', boxShadow: '0 0 0 3px rgba(109, 53, 184, 0.14)' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#6F6890' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: '10rem' }}>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{
                height: '2.5rem',
                borderRadius: '18px',
                bgcolor: 'rgba(255, 255, 255, 0.97)',
                fontWeight: 400,
                '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
              }}
            >
              <MenuItem value="all">{t('jrAllStatuses')}</MenuItem>
              <MenuItem value={JOIN_REQUEST_STATUS.NEW}>{t('jrStatusNew')}</MenuItem>
              <MenuItem value={JOIN_REQUEST_STATUS.APPROVED}>{t('jrStatusApproved')}</MenuItem>
              <MenuItem value={JOIN_REQUEST_STATUS.REJECTED}>{t('jrStatusRejected')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

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
                textAlign: index === 4 ? 'end' : 'start',
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
          <Stack spacing={0}>
            {loading ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : filtered.length > 0 ? (
              filtered.map((req) => {
                const isNew = (req.status || 'new') === JOIN_REQUEST_STATUS.NEW;
                return (
                  <Box
                    key={req.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetails(req)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') openDetails(req);
                    }}
                    sx={{
                      ...rowGrid,
                      minHeight: { xs: 'auto', md: '4rem' },
                      px: { xs: 1.7, md: '1.125rem' },
                      py: { xs: 1.35, md: 0 },
                      borderRadius: { xs: '18px', md: 0 },
                      border: 0,
                      borderBottom: '1px solid rgba(167, 139, 250, 0.13)',
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 180ms ease',
                      '&:hover': {
                        bgcolor: 'rgba(255, 250, 254, 0.82)',
                      },
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
                        <Typography color="rgba(36, 16, 79, 0.55)" noWrap sx={{ fontSize: '0.75rem', mt: 0.125 }}>
                          {req.email || t('jrNoEmail')}
                        </Typography>
                      </Box>
                    </Stack>

                    <Typography fontWeight={800} color="#4F4A70" noWrap dir="ltr">
                      {req.phone || '-'}
                    </Typography>

                    <Typography fontWeight={800} color="#4F4A70">
                      {formatDate(req.createdAt, intlLocale)}
                    </Typography>

                    <Box>
                      <StatusChip status={req.status} t={t} />
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.75}
                      justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {isNew ? (
                        <>
                          <IconButton
                            aria-label={t('jrApproveAria').replace('{name}', req.fullName || t('jrApplicationWord'))}
                            onClick={() => startApprove(req)}
                            sx={{
                              width: '2.5rem',
                              height: '2.5rem',
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
                              width: '2.5rem',
                              height: '2.5rem',
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
                          width: '2.5rem',
                          height: '2.5rem',
                          color: '#6D3CCF',
                          bgcolor: 'rgba(109, 60, 207, 0.09)',
                          border: '1px solid rgba(255, 255, 255, 0.72)',
                          '&:hover': { bgcolor: 'rgba(109, 60, 207, 0.15)' },
                        }}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                );
              })
            ) : (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography fontWeight={900}>{t('jrNoApplications')}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {requests.length === 0
                    ? t('jrEmptyHint')
                    : t('jrEmptyFilterHint')}
                </Typography>
              </Box>
            )}
          </Stack>
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
          },
        }}
        PaperProps={{
          dir: direction,
          sx: {
            width: { xs: 'calc(100vw - 24px)', sm: 'min(49.5rem, calc(100vw - 32px))' },
            maxWidth: 792,
            m: 0,
            position: 'fixed',
            top: '50%',
            insetInlineStart: '50%',
            transform: 'translate(-50%, -50%)',
            height: 'auto',
            maxHeight: 'calc(100vh - 24px)',
            borderRadius: { xs: '20px', md: '24px' },
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 30px 86px rgba(32, 20, 67, 0.28)',
          },
        }}
        BackdropProps={{
          sx: {
            bgcolor: 'rgba(18, 12, 35, 0.54)',
            backdropFilter: 'blur(12px)',
          },
        }}
      >
        {selected ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 24px)', background: 'radial-gradient(circle at 50% 0%, rgba(223, 50, 123, 0.08), transparent 32%), linear-gradient(180deg, #FFFFFF 0%, #FFFBFE 100%)' }}>
            <Box
              sx={{
                px: { xs: 2, sm: 2.25 },
                pt: { xs: 1.5, sm: 1.875 },
                pb: { xs: 1.375, sm: 1.5 },
                position: 'relative',
                flexShrink: 0,
                borderBottom: '1px solid rgba(130, 92, 206, 0.08)',
              }}
            >
              <IconButton
                size="small"
                onClick={() => setDetailsOpen(false)}
                aria-label={t('jrCloseDetails')}
                sx={{
                  position: 'absolute',
                  top: '12px /* @noflip */',
                  right: '12px /* @noflip */',
                  left: 'auto /* @noflip */',
                  width: '1.75rem',
                  height: '1.75rem',
                  bgcolor: 'rgba(109, 60, 207, 0.06)',
                  color: '#4E466B',
                  zIndex: 1,
                  '&:hover': { bgcolor: 'rgba(109, 60, 207, 0.12)' },
                }}
              >
                <CloseIcon sx={{ fontSize: '1rem' }} />
              </IconButton>

              <Stack spacing={1.125} alignItems="stretch" sx={{ pr: 3.5 }} dir="ltr">
                <Stack direction="row" spacing={1.125} alignItems="flex-start" sx={{ width: '100%' }}>
                  <Avatar
                    sx={{
                      width: '3.25rem',
                      height: '3.25rem',
                      bgcolor: '#EEE7FF',
                      color: '#6D3CCF',
                      fontSize: '1.0625rem',
                      fontWeight: 950,
                      boxShadow: '0 10px 22px rgba(109, 60, 207, 0.14)',
                      flexShrink: 0,
                    }}
                  >
                    {initialsOf(selected.fullName)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Typography dir="auto" variant="h5" fontWeight={950} noWrap sx={{ fontSize: '1.125rem', textAlign: 'left', minWidth: 0, width: '100%' }}>
                        {selected.fullName || t('jrUnnamed')}
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', textAlign: 'left', lineHeight: 1.35 }}>
                          {t('jrSubmittedAt').replace('{date}', formatDate(selected.createdAt, intlLocale))}
                        </Typography>
                        <StatusChip status={selected.status} t={t} compact />
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </Stack>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', flexShrink: 0, px: { xs: 2, sm: 2.25 }, py: { xs: 1.5, sm: 1.875 } }} dir="ltr">
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

            {(selected.status || 'new') === JOIN_REQUEST_STATUS.NEW ? (
              <Box sx={{ px: { xs: 2, sm: 2.25 }, py: { xs: 1.5, sm: 1.875 }, flexShrink: 0, borderTop: '1px solid rgba(130, 92, 206, 0.08)' }}>
                <Stack direction="row" spacing={1.2} justifyContent="flex-end">
                  <Button
                    onClick={() => startReject(selected)}
                    startIcon={<DoNotDisturbAltIcon />}
                    sx={{
                      px: 2.4,
                      height: '2.75rem',
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
                      px: 2.8,
                      height: '2.75rem',
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
