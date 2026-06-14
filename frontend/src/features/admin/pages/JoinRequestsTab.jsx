// Membership-applications tab inside the Users page.
//
// Phase 1 (this file): read-only. Lists every public "טופס הצטרפות לעמותה"
// submission so an admin can see who applied, with search, a status filter,
// and a details drawer showing the full application (including the story).
// Accept/Reject actions are added in a later phase.
import { useMemo, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Fade from '@mui/material/Fade';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { JOIN_REQUEST_STATUS } from '../services/joinRequestAdminService';

const STATUS_META = {
  [JOIN_REQUEST_STATUS.NEW]: { label: 'New', color: '#B45309', bg: 'rgba(245, 158, 11, 0.16)' },
  [JOIN_REQUEST_STATUS.APPROVED]: { label: 'Approved', color: '#15803D', bg: 'rgba(34, 197, 94, 0.16)' },
  [JOIN_REQUEST_STATUS.REJECTED]: { label: 'Rejected', color: '#B91C1C', bg: 'rgba(239, 68, 68, 0.14)' },
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

function formatBool(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
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

function StatusChip({ status }) {
  const meta = STATUS_META[status] || STATUS_META[JOIN_REQUEST_STATUS.NEW];
  return (
    <Chip
      label={meta.label}
      size="small"
      sx={{
        color: meta.color,
        bgcolor: meta.bg,
        borderRadius: 999,
        fontWeight: 900,
        border: '1px solid rgba(255,255,255,0.7)',
      }}
    />
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.35,
        borderRadius: '20px',
        border: '1px solid rgba(130, 92, 206, 0.12)',
        bgcolor: 'rgba(255, 255, 255, 0.72)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
      }}
    >
      <Box
        sx={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color: '#7C3AED',
          bgcolor: 'rgba(124, 58, 237, 0.08)',
        }}
      >
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

export default function JoinRequestsTab({ requests = [], loading = false }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  function openDetails(req) {
    setSelected(req);
    setDetailsOpen(true);
  }

  const rowGrid = {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr)',
      md: 'minmax(260px, 1.5fr) 150px 130px 120px 72px',
    },
    alignItems: 'center',
    gap: '1rem',
  };

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'rgba(255, 255, 255, 0.82)',
        border: '1px solid rgba(130, 92, 206, 0.14)',
        borderRadius: '28px',
        boxShadow: '0 28px 74px rgba(91, 57, 145, 0.11)',
        backdropFilter: 'blur(22px)',
        overflow: 'hidden',
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
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
            Membership Applications
          </Typography>
          <Chip
            label={`${requests.length} total`}
            sx={{
              height: '1.875rem',
              bgcolor: '#F2ECFF',
              color: '#6D3CCF',
              fontWeight: 950,
              borderRadius: 999,
              border: '1px solid rgba(124, 58, 237, 0.08)',
            }}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.4} sx={{ flex: 1, justifyContent: 'flex-end' }}>
          <TextField
            placeholder="Search applicants..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{
              minWidth: { md: '20.625rem' },
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
          <FormControl size="small" sx={{ minWidth: '10rem' }}>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{
                height: '3.125rem',
                borderRadius: '16px',
                bgcolor: 'rgba(255,255,255,0.72)',
                fontWeight: 750,
                '& fieldset': { borderColor: 'rgba(130, 92, 206, 0.16)' },
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value={JOIN_REQUEST_STATUS.NEW}>New</MenuItem>
              <MenuItem value={JOIN_REQUEST_STATUS.APPROVED}>Approved</MenuItem>
              <MenuItem value={JOIN_REQUEST_STATUS.REJECTED}>Rejected</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pb: { xs: 2.2, md: 3 },
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
          {['Applicant', 'Phone', 'Submitted', 'Status', ''].map((label, index) => (
            <Typography
              key={label || `col-${index}`}
              variant="caption"
              sx={{
                fontWeight: 950,
                color: '#625B84',
                textTransform: 'uppercase',
                letterSpacing: 0.3,
                textAlign: index === 4 ? 'right' : 'left',
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            maxHeight: 'calc(100vh - 330px)',
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
              filtered.map((req) => (
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
                    <Avatar
                      sx={{
                        width: '3.375rem',
                        height: '3.375rem',
                        bgcolor: '#EEE7FF',
                        color: '#6D3CCF',
                        fontWeight: 950,
                        fontSize: '1.1875rem',
                        boxShadow: '0 10px 24px rgba(109, 60, 207, 0.12)',
                      }}
                    >
                      {initialsOf(req.fullName)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography dir="auto" fontWeight={950} noWrap sx={{ color: '#17122E' }}>
                        {req.fullName || 'Unnamed applicant'}
                      </Typography>
                      <Typography color="#5E587E" noWrap sx={{ fontSize: '0.84375rem' }}>
                        {req.email || 'No email provided'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography fontWeight={800} color="#4F4A70" noWrap dir="ltr">
                    {req.phone || '-'}
                  </Typography>

                  <Typography fontWeight={800} color="#4F4A70">
                    {formatDate(req.createdAt)}
                  </Typography>

                  <Box>
                    <StatusChip status={req.status} />
                  </Box>

                  <Stack direction="row" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} onClick={(event) => event.stopPropagation()}>
                    <IconButton
                      aria-label={`View ${req.fullName || 'application'}`}
                      onClick={() => openDetails(req)}
                      sx={{
                        width: '2.625rem',
                        height: '2.625rem',
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
              ))
            ) : (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography fontWeight={900}>No applications found</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {requests.length === 0
                    ? 'Submissions from the public join form will appear here.'
                    : 'Try changing your search or filter.'}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>

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
                    {selected.fullName || 'Unnamed applicant'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.6 }}>
                    <StatusChip status={selected.status} />
                    <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                      Submitted {formatDate(selected.createdAt)}
                    </Typography>
                  </Stack>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setDetailsOpen(false)}
                  aria-label="Close application details"
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
                <DetailRow icon={<PlaceOutlinedIcon fontSize="small" />} label="Address" value={selected.address} />
                <DetailRow icon={<CakeOutlinedIcon fontSize="small" />} label="Date of Birth" value={formatDate(selected.birthDate)} />
                <DetailRow icon={<EmailOutlinedIcon fontSize="small" />} label="Consent to receive info" value={formatBool(selected.consentToReceiveInfo)} />
                <DetailRow icon={<EmailOutlinedIcon fontSize="small" />} label="Ready to join" value={formatBool(selected.readyToJoin)} />
                {selected.whatsappNote ? (
                  <DetailRow icon={<PhoneOutlinedIcon fontSize="small" />} label="WhatsApp note" value={selected.whatsappNote} />
                ) : null}
                <DetailRow icon={<FavoriteIcon />} label="Story" value={selected.cancerStory} />
              </Stack>
            </Box>
          </Box>
        ) : null}
      </Dialog>
    </Box>
  );
}

function FavoriteIcon() {
  return <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>♥</span>;
}
