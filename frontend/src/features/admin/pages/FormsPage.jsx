// Forms page — volunteer & donation contact-form submissions from the public
// website. The public modals write to the `formSubmissions` collection (see
// features/public/services/formSubmissionService.js); this page lists them and
// lets an admin mark each as handled or delete it.
//
// Styling/structure intentionally mirror JoinRequestsTab so the two admin
// review screens feel like one product.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {
  FORM_SUBMISSION_STATUS,
  FORM_SUBMISSION_TYPE,
  deleteSubmission,
  listFormSubmissions,
  setSubmissionHandled,
} from '../services/formSubmissionAdminService';

const STATUS_META = {
  [FORM_SUBMISSION_STATUS.NEW]: { label: 'New', color: '#B45309', bg: 'rgba(245, 158, 11, 0.16)' },
  [FORM_SUBMISSION_STATUS.HANDLED]: { label: 'Handled', color: '#15803D', bg: 'rgba(34, 197, 94, 0.16)' },
};

const TYPE_META = {
  [FORM_SUBMISSION_TYPE.VOLUNTEER]: { label: 'Volunteer', color: '#6D3CCF', bg: 'rgba(124, 58, 237, 0.12)', icon: <VolunteerActivismOutlinedIcon fontSize="small" /> },
  [FORM_SUBMISSION_TYPE.DONATION]: { label: 'Donation', color: '#C52A72', bg: 'rgba(223, 50, 123, 0.12)', icon: <FavoriteBorderIcon fontSize="small" /> },
};

function formatDate(value) {
  if (!value) return '-';
  if (typeof value.toDate === 'function') return value.toDate().toLocaleDateString();
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000).toLocaleDateString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();
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

function StatusChip({ status }) {
  const meta = STATUS_META[status] || STATUS_META[FORM_SUBMISSION_STATUS.NEW];
  return (
    <Chip
      label={meta.label}
      size="small"
      sx={{ color: meta.color, bgcolor: meta.bg, borderRadius: 999, fontWeight: 900, border: '1px solid rgba(255,255,255,0.7)' }}
    />
  );
}

function TypeChip({ type }) {
  const meta = TYPE_META[type] || TYPE_META[FORM_SUBMISSION_TYPE.VOLUNTEER];
  return (
    <Chip
      icon={meta.icon}
      label={meta.label}
      size="small"
      sx={{ color: meta.color, bgcolor: meta.bg, borderRadius: 999, fontWeight: 850, border: '1px solid rgba(255,255,255,0.7)', '& .MuiChip-icon': { color: meta.color } }}
    />
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <Box sx={{ px: 2, py: 1.35, borderRadius: '20px', border: '1px solid rgba(130, 92, 206, 0.12)', bgcolor: 'rgba(255, 255, 255, 0.72)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <Box sx={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#7C3AED', bgcolor: 'rgba(124, 58, 237, 0.08)' }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'block', lineHeight: 1.1 }}>
          {label}
        </Typography>
        <Typography dir="auto" fontWeight={750} sx={{ color: '#17122E', mt: 0.35, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  );
}

export default function FormsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const newCount = useMemo(
    () => submissions.filter((s) => (s.status || 'new') === FORM_SUBMISSION_STATUS.NEW).length,
    [submissions],
  );

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
      setActionError(err?.message || 'Could not update this submission. Please try again.');
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
      setActionError(err?.message || 'Could not delete this submission. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  const rowGrid = {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr)',
      md: 'minmax(220px, 1.5fr) 130px 130px 120px 130px',
    },
    alignItems: 'center',
    gap: '1rem',
  };

  return (
    <Box sx={{ minHeight: '100%', color: '#24104f' }}>
      <Box sx={{ mb: 2.75 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 0, color: '#171239' }}>
          Forms
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5, color: 'rgba(36, 16, 79, 0.66)', fontWeight: 600 }} dir="ltr">
          Volunteer and donation enquiries submitted from the public website.
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          bgcolor: 'rgba(255, 255, 255, 0.82)',
          border: '1px solid rgba(130, 92, 206, 0.14)',
          borderRadius: '28px',
          boxShadow: '0 28px 74px rgba(91, 57, 145, 0.11)',
          backdropFilter: 'blur(22px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack
          direction={{ xs: 'column', xl: 'row' }}
          spacing={2}
          alignItems={{ xl: 'center' }}
          justifyContent="space-between"
          sx={{ p: { xs: 2.2, md: 3 }, flexShrink: 0 }}
        >
          <Stack direction="row" spacing={1.1} alignItems="center">
            <Typography variant="h5" fontWeight={950} sx={{ color: '#100B2F' }}>
              Submissions
            </Typography>
            <Chip
              label={`${submissions.length} total`}
              sx={{ height: '1.875rem', bgcolor: '#F2ECFF', color: '#6D3CCF', fontWeight: 950, borderRadius: 999, border: '1px solid rgba(124, 58, 237, 0.08)' }}
            />
            {newCount > 0 ? (
              <Chip
                label={`${newCount} new`}
                sx={{ height: '1.875rem', bgcolor: 'rgba(223, 50, 123, 0.14)', color: '#C52A72', fontWeight: 950, borderRadius: 999, border: '1px solid rgba(223, 50, 123, 0.12)' }}
              />
            ) : null}
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.4} sx={{ flex: 1, justifyContent: 'flex-end' }}>
            <TextField
              placeholder="Search submissions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{
                minWidth: { md: '18rem' },
                '& .MuiOutlinedInput-root': {
                  height: '3.125rem',
                  borderRadius: '16px',
                  bgcolor: 'rgba(255,255,255,0.72)',
                  '& fieldset': { borderColor: 'rgba(130, 92, 206, 0.16)' },
                  '&:hover fieldset': { borderColor: 'rgba(124, 58, 237, 0.28)' },
                  '&.Mui-focused fieldset': { borderColor: '#B57BE8' },
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
            <FormControl size="small" sx={{ minWidth: '9rem' }}>
              <Select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                sx={{ height: '3.125rem', borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.72)', fontWeight: 750, '& fieldset': { borderColor: 'rgba(130, 92, 206, 0.16)' } }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value={FORM_SUBMISSION_TYPE.VOLUNTEER}>Volunteer</MenuItem>
                <MenuItem value={FORM_SUBMISSION_TYPE.DONATION}>Donation</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: '9rem' }}>
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={{ height: '3.125rem', borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.72)', fontWeight: 750, '& fieldset': { borderColor: 'rgba(130, 92, 206, 0.16)' } }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value={FORM_SUBMISSION_STATUS.NEW}>New</MenuItem>
                <MenuItem value={FORM_SUBMISSION_STATUS.HANDLED}>Handled</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {actionError ? (
          <Alert severity="error" sx={{ mx: { xs: 2, md: 3 }, mb: 1, borderRadius: '14px' }} onClose={() => setActionError('')}>
            {actionError}
          </Alert>
        ) : null}

        <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2.2, md: 3 }, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              ...rowGrid,
              px: 2.2,
              py: 1.4,
              display: { xs: 'none', md: 'grid' },
              borderRadius: '18px 18px 0 0',
              border: '1px solid rgba(130, 92, 206, 0.10)',
              borderBottom: 'none',
              bgcolor: 'rgba(255,255,255,0.42)',
              flexShrink: 0,
            }}
          >
            {['Contact', 'Type', 'Submitted', 'Status', 'Actions'].map((label, index) => (
              <Typography
                key={label}
                variant="caption"
                sx={{ fontWeight: 950, color: '#625B84', textTransform: 'uppercase', letterSpacing: 0.3, textAlign: index === 4 ? 'right' : 'left' }}
              >
                {label}
              </Typography>
            ))}
          </Box>

          <Box
            sx={{
              maxHeight: 'calc(100vh - 360px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              pr: '6px',
              mr: '-6px',
              '&::-webkit-scrollbar': { width: '0.5rem' },
              '&::-webkit-scrollbar-track': { background: 'rgba(244, 238, 255, 0.45)', borderRadius: 999 },
              '&::-webkit-scrollbar-thumb': { background: 'rgba(167, 139, 250, 0.5)', borderRadius: 999 },
            }}
          >
            <Stack spacing={1.1}>
              {loading ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : filtered.length > 0 ? (
                filtered.map((sub) => {
                  const isHandled = (sub.status || 'new') === FORM_SUBMISSION_STATUS.HANDLED;
                  const isBusy = busyId === sub.id;
                  return (
                    <Box
                      key={sub.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDetails(sub)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') openDetails(sub);
                      }}
                      sx={{
                        ...rowGrid,
                        px: { xs: 1.7, md: 2.2 },
                        py: 1.8,
                        borderRadius: '22px',
                        border: '1px solid rgba(130, 92, 206, 0.10)',
                        bgcolor: 'rgba(255,255,255,0.72)',
                        cursor: 'pointer',
                        transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease',
                        '&:hover': {
                          bgcolor: 'rgba(255, 250, 254, 0.94)',
                          borderColor: 'rgba(124, 58, 237, 0.18)',
                          boxShadow: '0 16px 34px rgba(91, 57, 145, 0.10)',
                          transform: 'translateY(-2px) scale(1.002)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar sx={{ width: '3.375rem', height: '3.375rem', bgcolor: '#EEE7FF', color: '#6D3CCF', fontWeight: 950, fontSize: '1.1875rem', boxShadow: '0 10px 24px rgba(109, 60, 207, 0.12)' }}>
                          {initialsOf(sub.fullName)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography dir="auto" fontWeight={950} noWrap sx={{ color: '#17122E' }}>
                            {sub.fullName || 'Unnamed'}
                          </Typography>
                          <Typography color="#5E587E" noWrap sx={{ fontSize: '0.84375rem' }}>
                            {sub.email || 'No email provided'}
                          </Typography>
                        </Box>
                      </Stack>

                      <Box>
                        <TypeChip type={sub.type} />
                      </Box>

                      <Typography fontWeight={800} color="#4F4A70">
                        {formatDate(sub.createdAt)}
                      </Typography>

                      <Box>
                        <StatusChip status={sub.status} />
                      </Box>

                      <Stack direction="row" spacing={0.75} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} onClick={(event) => event.stopPropagation()}>
                        <IconButton
                          aria-label={isHandled ? `Reopen ${sub.fullName || 'submission'}` : `Mark ${sub.fullName || 'submission'} handled`}
                          onClick={() => toggleHandled(sub)}
                          disabled={isBusy}
                          sx={{
                            width: '2.5rem',
                            height: '2.5rem',
                            color: isHandled ? '#B45309' : '#15803D',
                            bgcolor: isHandled ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                            border: '1px solid rgba(255,255,255,0.72)',
                            '&:hover': { bgcolor: isHandled ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)' },
                          }}
                        >
                          {isBusy ? <CircularProgress size={16} color="inherit" /> : isHandled ? <ReplayIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                        </IconButton>
                        <IconButton
                          aria-label={`Delete ${sub.fullName || 'submission'}`}
                          onClick={() => setDeleteTarget(sub)}
                          disabled={isBusy}
                          sx={{
                            width: '2.5rem',
                            height: '2.5rem',
                            color: '#B91C1C',
                            bgcolor: 'rgba(239, 68, 68, 0.10)',
                            border: '1px solid rgba(255,255,255,0.72)',
                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.18)' },
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label={`View ${sub.fullName || 'submission'}`}
                          onClick={() => openDetails(sub)}
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
                  <Typography fontWeight={900}>No submissions found</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {submissions.length === 0
                      ? 'Volunteer and donation enquiries from the public website will appear here.'
                      : 'Try changing your search or filters.'}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Details drawer */}
      <Dialog
        open={detailsOpen && Boolean(selected)}
        onClose={() => setDetailsOpen(false)}
        maxWidth={false}
        TransitionComponent={Fade}
        PaperProps={{
          dir: 'ltr',
          sx: {
            width: { xs: 'calc(100vw - 24px)', sm: '37rem' },
            maxWidth: 600,
            m: 0,
            position: 'fixed',
            top: '50%',
            insetInlineStart: '50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: 'calc(100vh - 32px)',
            borderRadius: { xs: '24px', md: '34px' },
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 30px 86px rgba(32, 20, 67, 0.28)',
          },
        }}
        BackdropProps={{ sx: { bgcolor: 'rgba(18, 12, 35, 0.54)', backdropFilter: 'blur(12px)' } }}
      >
        {selected ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 32px)' }}>
            <Box sx={{ p: { xs: 2, md: 2.6 }, pb: 1.6, flexShrink: 0, background: 'radial-gradient(circle at 50% 0%, rgba(223, 50, 123, 0.08), transparent 32%), linear-gradient(180deg, #FFFFFF 0%, #FFFBFE 100%)' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: '4rem', height: '4rem', bgcolor: '#EEE7FF', color: '#6D3CCF', fontSize: '1.5rem', fontWeight: 950 }}>
                  {initialsOf(selected.fullName)}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography dir="auto" variant="h6" fontWeight={950} sx={{ color: '#17122E', lineHeight: 1.15 }}>
                    {selected.fullName || 'Unnamed'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.6 }} flexWrap="wrap" useFlexGap>
                    <TypeChip type={selected.type} />
                    <StatusChip status={selected.status} />
                    <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                      Submitted {formatDate(selected.createdAt)}
                    </Typography>
                  </Stack>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setDetailsOpen(false)}
                  aria-label="Close submission details"
                  sx={{ bgcolor: 'rgba(109, 60, 207, 0.06)', color: '#4E466B', '&:hover': { bgcolor: 'rgba(109, 60, 207, 0.12)' } }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 2.6 }, borderTop: '1px solid rgba(130, 92, 206, 0.08)' }}>
              <Stack spacing={1.35}>
                <DetailRow icon={<EmailOutlinedIcon fontSize="small" />} label="Email" value={selected.email} />
                <DetailRow icon={<PhoneOutlinedIcon fontSize="small" />} label="Phone" value={selected.phone} />
                <DetailRow icon={<ChatBubbleOutlineIcon fontSize="small" />} label="Message" value={selected.message} />
                {selected.status === FORM_SUBMISSION_STATUS.HANDLED ? (
                  <DetailRow
                    icon={<CheckCircleIcon fontSize="small" />}
                    label={`Handled • ${formatDate(selected.handledAt)}`}
                    value={selected.handledBy ? `by ${selected.handledBy}` : '-'}
                  />
                ) : null}
              </Stack>
            </Box>

            <Box sx={{ p: { xs: 2, md: 2.6 }, pt: 1.8, flexShrink: 0, borderTop: '1px solid rgba(130, 92, 206, 0.08)' }}>
              <Stack direction="row" spacing={1.2} justifyContent="flex-end">
                <Button
                  onClick={() => setDeleteTarget(selected)}
                  startIcon={<DeleteOutlineIcon />}
                  sx={{ px: 2.4, height: '2.75rem', borderRadius: 999, fontWeight: 900, textTransform: 'none', color: '#B91C1C', border: '1px solid rgba(239, 68, 68, 0.3)', bgcolor: 'rgba(239, 68, 68, 0.06)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.12)' } }}
                >
                  Delete
                </Button>
                <Button
                  onClick={() => toggleHandled(selected).then(() => setSelected((cur) => (cur ? { ...cur, status: (cur.status || 'new') === FORM_SUBMISSION_STATUS.HANDLED ? FORM_SUBMISSION_STATUS.NEW : FORM_SUBMISSION_STATUS.HANDLED } : cur)))}
                  startIcon={(selected.status || 'new') === FORM_SUBMISSION_STATUS.HANDLED ? <ReplayIcon /> : <CheckCircleIcon />}
                  sx={{
                    px: 2.8,
                    height: '2.75rem',
                    borderRadius: 999,
                    fontWeight: 950,
                    textTransform: 'none',
                    color: '#fff',
                    background: (selected.status || 'new') === FORM_SUBMISSION_STATUS.HANDLED
                      ? 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)'
                      : 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    boxShadow: '0 14px 30px rgba(22, 163, 74, 0.26)',
                  }}
                >
                  {(selected.status || 'new') === FORM_SUBMISSION_STATUS.HANDLED ? 'Reopen' : 'Mark as handled'}
                </Button>
              </Stack>
            </Box>
          </Box>
        ) : null}
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => (busyId ? null : setDeleteTarget(null))}
        PaperProps={{ dir: 'ltr', sx: { borderRadius: '24px', width: { xs: 'calc(100vw - 32px)', sm: '30rem' }, maxWidth: 480 } }}
      >
        <DialogTitle sx={{ fontWeight: 950, color: '#100B2F' }}>Delete submission?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4F4A70' }}>
            Permanently delete the submission from <strong dir="auto">{deleteTarget?.fullName || deleteTarget?.email || 'this contact'}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={Boolean(busyId)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: '#6F6890' }}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            disabled={Boolean(busyId)}
            variant="contained"
            color="error"
            startIcon={busyId ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 2.8 }}
          >
            {busyId ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
