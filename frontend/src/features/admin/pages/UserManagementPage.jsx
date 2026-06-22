import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, documentId, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Ban, Pencil, ShieldCheck } from 'lucide-react';
import { db } from '../../../firebase';
import { useAdmin } from '../context/AdminContext';
import { logAuditEvent } from '../services/auditService';
import { listJoinRequests } from '../services/joinRequestAdminService';
import { useAdminLocale } from '../context/AdminLocaleContext';
import JoinRequestsTab from './JoinRequestsTab';
import AdminDetailInfoCard from '../components/AdminDetailInfoCard';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import Avatar from '@mui/material/Avatar';

const ROLES = ['participant', 'admin'];

const ROLE_LABEL_KEYS = {
  participant: 'roleParticipant',
  admin: 'roleAdmin',
};

const ROLE_STYLES = {
  admin: { color: '#15803D', backgroundColor: 'rgba(34, 197, 94, 0.14)' },
  participant: { color: '#6D3CCF', backgroundColor: 'rgba(109, 60, 207, 0.12)' },
};

const actionButtonBaseSx = {
  height: '2rem',
  borderRadius: 2.25,
  px: 1.25,
  fontSize: '0.78125rem',
  fontWeight: 850,
  letterSpacing: 0,
  border: '1px solid transparent',
  boxShadow: '0 8px 18px rgba(91, 57, 145, 0.05)',
  transition: 'transform 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease',
  '& .MuiButton-startIcon': {
    mr: 0.75,
    '& svg': {
      width: '0.9375rem',
      height: '0.9375rem',
      strokeWidth: 2.2,
    },
  },
  '&:hover': {
    transform: 'translateY(-1px)',
  },
};

function formatDateValue(value) {
  if (!value) return '-';
  if (value?.toDate) return value.toDate().toLocaleDateString();
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000).toLocaleDateString();
  }
  return String(value);
}

function getFullName(user, fallback = 'Unnamed user') {
  return user?.fullName || user?.displayName || user?.name || fallback;
}

function initials(user) {
  return getFullName(user)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function getJoinedDate(user) {
  return user?.joinedAt || user?.createdAt || user?.registeredAt;
}

function getAddress(user) {
  return user?.address || [user?.streetAddress, user?.city].filter(Boolean).join(', ');
}

function getEmergencyContact(user) {
  if (user?.emergencyContact) return user.emergencyContact;
  return [user?.emergencyContactName, user?.emergencyPhone].filter(Boolean).join(' ');
}

function normalizeUserRole(role) {
  return role === 'admin' ? 'admin' : 'participant';
}

function RoleChip({ role, t }) {
  const key = normalizeUserRole(role);
  const style = ROLE_STYLES[key] || ROLE_STYLES.participant;

  return (
    <Chip
      label={t(ROLE_LABEL_KEYS[key] || 'roleParticipant')}
      size="small"
      sx={{
        ...style,
        borderRadius: 999,
        fontWeight: 900,
        textTransform: 'capitalize',
        border: '1px solid rgba(255,255,255,0.7)',
      }}
    />
  );
}

function isInactiveUser(user) {
  return user?.isActive === false || String(user?.status || '').toLowerCase() === 'inactive';
}

export default function UserManagementPage() {
  const { currentUser } = useAdmin();
  const { t, direction } = useAdminLocale();
  const roleLabel = (role) => t(ROLE_LABEL_KEYS[normalizeUserRole(role)] || 'roleParticipant');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinLoading, setJoinLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(query(collection(db, 'users'), orderBy(documentId()), limit(100)));
        const nextUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(nextUsers);
        setSelectedUser((current) => current || nextUsers[0] || null);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const loadJoinRequests = useCallback(async () => {
    setJoinLoading(true);
    try {
      const list = await listJoinRequests();
      setJoinRequests(list);
    } catch (err) {
      console.error('Failed to fetch membership applications:', err);
    } finally {
      setJoinLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJoinRequests();
  }, [loadJoinRequests]);

  async function handleRoleChange(user, newRole) {
    const oldRole = normalizeUserRole(user.role);
    if (oldRole === newRole) return;

    setSaving(user.id);
    try {
      await updateDoc(doc(db, 'users', user.id), { role: newRole });
      await logAuditEvent({
        actionType: 'ROLE_CHANGE',
        targetId: user.id,
        details: { before: oldRole, after: newRole, description: `Changed role from ${oldRole} to ${newRole}` },
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      setSelectedUser((prev) => (prev?.id === user.id ? { ...prev, role: newRole } : prev));
    } catch (err) {
      console.error('Role change failed:', err);
    } finally {
      setSaving(null);
    }
  }

  async function confirmDeactivateUser() {
    if (!deactivateTarget?.id || deactivating) return;

    setDeactivating(true);
    try {
      await updateDoc(doc(db, 'users', deactivateTarget.id), {
        isActive: false,
        status: 'inactive',
        deactivatedAt: serverTimestamp(),
        deactivatedBy: currentUser?.uid || null,
      });
      const patch = {
        isActive: false,
        status: 'inactive',
        deactivatedBy: currentUser?.uid || null,
      };
      setUsers((prev) => prev.map((user) => (user.id === deactivateTarget.id ? { ...user, ...patch } : user)));
      setSelectedUser((prev) => (prev?.id === deactivateTarget.id ? { ...prev, ...patch } : prev));
      setDeactivateTarget(null);
    } catch (err) {
      console.error('User deactivation failed:', err);
    } finally {
      setDeactivating(false);
    }
  }

  async function selectUser(user) {
    setSelectedUser(user);
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const snap = await getDoc(doc(db, 'users', user.id));
      if (snap.exists()) {
        setSelectedUser({ id: snap.id, ...snap.data() });
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err);
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    setDetailsOpen(false);
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const next = users.filter((user) => {
      const role = normalizeUserRole(user.role);
      const matchesSearch =
        !q ||
        [getFullName(user), user.email, user.phoneNumber, getAddress(user)]
          .some((value) => String(value || '').toLowerCase().includes(q));
      const matchesRole = roleFilter === 'all' || role === roleFilter;
      const inactive = isInactiveUser(user);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !inactive) ||
        (statusFilter === 'inactive' && inactive);
      return matchesSearch && matchesRole && matchesStatus;
    });

    return [...next].sort((left, right) => {
      if (sortBy === 'name') return getFullName(left).localeCompare(getFullName(right));
      if (sortBy === 'role') return normalizeUserRole(left.role).localeCompare(normalizeUserRole(right.role));

      const leftDate = getJoinedDate(left)?.toDate?.() || new Date(getJoinedDate(left) || 0);
      const rightDate = getJoinedDate(right)?.toDate?.() || new Date(getJoinedDate(right) || 0);
      return sortBy === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [roleFilter, search, sortBy, statusFilter, users]);

  const userDetailRows = selectedUser
    ? [
        [
          { fieldKey: 'fullName', labelKey: 'fieldFullName', value: getFullName(selectedUser, t('umUnnamedUser')) },
          { fieldKey: 'email', labelKey: 'fieldEmail', value: selectedUser.email },
        ],
        [
          { fieldKey: 'phone', labelKey: 'fieldPhone', value: selectedUser.phoneNumber },
          { fieldKey: 'address', labelKey: 'fieldAddress', value: getAddress(selectedUser) },
        ],
        [
          { fieldKey: 'dob', labelKey: 'fieldDOB', value: formatDateValue(selectedUser.birthDate || selectedUser.dateOfBirth) },
          { fieldKey: 'role', labelKey: 'fieldRole', value: roleLabel(selectedUser.role) },
        ],
      ]
    : [];

  const rowGrid = {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr)',
      md: 'minmax(260px, 1.35fr) minmax(150px, 0.72fr) minmax(120px, 0.58fr) minmax(112px, 0.52fr) minmax(92px, 0.42fr)',
    },
    alignItems: 'center',
    columnGap: '0.75rem',
  };

  const actionIconSx = (tone = 'purple') => {
    const tones = {
      purple: {
        color: '#6D3CCF',
        bgcolor: 'rgba(109, 60, 207, 0.09)',
        hover: 'rgba(109, 60, 207, 0.15)',
      },
      pink: {
        color: '#DF327B',
        bgcolor: 'rgba(223, 50, 123, 0.10)',
        hover: 'rgba(223, 50, 123, 0.16)',
      },
    };
    const palette = tones[tone] || tones.purple;

    return {
      width: '2rem',
      height: '2rem',
      color: palette.color,
      bgcolor: 'rgba(255, 255, 255, 0.97)',
      border: 0,
      boxShadow: '0 9px 24px rgba(91, 30, 140, 0.12)',
      transition: 'transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease',
      '&:hover': {
        color: '#fff',
        bgcolor: tone === 'pink' ? '#DF327B' : '#6D3CCF',
        transform: 'translateY(-2px)',
        boxShadow: '0 14px 26px rgba(223, 50, 123, 0.20)',
      },
    };
  };

  const pendingApplications = joinRequests.filter((req) => (req.status || 'new') === 'new').length;

  return (
    <Box
      dir={direction}
      sx={{
        width: '100%',
        maxWidth: 'none',
        minHeight: '100%',
        height: 'auto',
        maxHeight: 'none',
        overflow: 'visible',
        boxSizing: 'border-box',
        mt: { xs: -1.5, md: -2.5 },
      }}
    >
      <Stack spacing={1.25} sx={{ width: '100%', maxWidth: 'none', minHeight: 0 }}>
        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="h3" sx={{ fontSize: { xs: '1.875rem', md: '2.4375rem' }, fontWeight: 950, color: '#100B2F', lineHeight: 1.05 }}>
                {t('umTitle')}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.2} sx={{ flexShrink: 0 }} role="tablist" aria-label={t('umSectionsAria')}>
          {[
            { key: 'users', label: t('tabUsers') },
            { key: 'applications', label: t('tabApplications') },
          ].map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.key)}
                sx={{
                  height: '2.75rem',
                  px: 2.6,
                  borderRadius: 999,
                  textTransform: 'none',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  color: selected ? '#fff' : '#6D3CCF',
                  background: selected
                    ? 'linear-gradient(135deg, #7C3AED 0%, #DF327B 100%)'
                    : 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(124, 58, 237, 0.16)',
                  boxShadow: selected && tab.key === 'applications' ? '0 14px 30px rgba(124, 58, 237, 0.22)' : 'none',
                  '&:hover': {
                    background: selected
                      ? 'linear-gradient(135deg, #6F32D8 0%, #D12B72 100%)'
                      : 'rgba(244, 238, 255, 0.9)',
                  },
                }}
              >
                {tab.label}
                {tab.key === 'applications' && pendingApplications > 0 ? (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      px: 1,
                      py: 0.15,
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 950,
                      bgcolor: selected ? 'rgba(255,255,255,0.26)' : 'rgba(223, 50, 123, 0.14)',
                      color: selected ? '#fff' : '#C52A72',
                    }}
                  >
                    {t('umNewBadge').replace('{n}', pendingApplications)}
                  </Box>
                ) : null}
              </Button>
            );
          })}
          </Stack>
        </Stack>

        <Grid
          container
          spacing={0}
          alignItems="flex-start"
          sx={{ width: '100%', maxWidth: 'none', minHeight: 0, flex: 1, m: 0 }}
        >
          <Grid item xs={12} sx={{ width: '100%', maxWidth: 'none', flexBasis: '100%', p: 0, alignSelf: 'flex-start' }}>
            {activeTab === 'applications' ? (
              <JoinRequestsTab requests={joinRequests} loading={joinLoading} onChanged={loadJoinRequests} />
            ) : (
            <Box
              sx={{
                width: '100%',
                maxWidth: 'none',
                bgcolor: 'rgba(255, 255, 255, 0.82)',
                border: '1px solid rgba(167, 139, 250, 0.18)',
                borderRadius: '24px',
                boxShadow: 'none',
                backdropFilter: 'blur(18px)',
                alignSelf: 'flex-start',
                overflow: 'hidden',
              }}
            >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.5} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ px: { xs: 1, md: 1.35 }, pt: { xs: 0.75, md: 1 }, pb: 0.25, flexShrink: 0 }}>
            <Stack direction="row" spacing={1.1} alignItems="center" sx={{ flexShrink: 0 }}>
              <Typography variant="h5" fontWeight={950} sx={{ color: '#100B2F' }}>{t('umUsersHeading')}</Typography>
              <Chip
                label={t('umTotalChip').replace('{n}', users.length)}
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
              <TextField
                placeholder={t('umSearchPlaceholder')}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{
                  minWidth: { md: '20.625rem' },
                  '& .MuiOutlinedInput-root': {
                    height: '3.125rem',
                    borderRadius: '16px',
                    bgcolor: 'rgba(255,255,255,0.72)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
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
              <FormControl size="small" sx={{ minWidth: '9.375rem' }}>
                <Select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  sx={{
                    height: '3.125rem',
                    borderRadius: '16px',
                    bgcolor: 'rgba(255,255,255,0.72)',
                    fontWeight: 750,
                    '& fieldset': { borderColor: 'rgba(130, 92, 206, 0.16)' },
                  }}
                >
                  <MenuItem value="all">{t('umAllRoles')}</MenuItem>
                  {ROLES.map((role) => <MenuItem key={role} value={role}>{roleLabel(role)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: '9.375rem' }}>
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
                  <MenuItem value="all">{t('umAllStatuses')}</MenuItem>
                  <MenuItem value="active">{t('umStatusActive')}</MenuItem>
                  <MenuItem value="inactive">{t('umStatusInactive')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: '10rem' }}>
                <Select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  sx={{
                    height: '3.125rem',
                    borderRadius: '16px',
                    bgcolor: 'rgba(255,255,255,0.72)',
                    fontWeight: 750,
                    '& fieldset': { borderColor: 'rgba(130, 92, 206, 0.16)' },
                  }}
                  startAdornment={<SortIcon fontSize="small" sx={{ ml: 1, mr: 0.5, color: '#6D3CCF' }} />}
                >
                  <MenuItem value="newest">{t('sortNewest')}</MenuItem>
                  <MenuItem value="oldest">{t('sortOldest')}</MenuItem>
                  <MenuItem value="name">{t('sortName')}</MenuItem>
                  <MenuItem value="role">{t('sortRole')}</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          <Box
            sx={{
              px: 0,
              pb: 0,
            }}
          >
            <Box
              sx={{
                ...rowGrid,
                px: '1.125rem',
                display: { xs: 'none', md: 'grid' },
                minHeight: '3.25rem',
                borderTop: '1px solid rgba(167, 139, 250, 0.13)',
                borderBottom: '1px solid rgba(167, 139, 250, 0.13)',
                bgcolor: 'transparent',
                flexShrink: 0,
              }}
            >
              {[
                { key: 'user', label: t('colUser') },
                { key: 'role', label: t('colRole') },
                { key: 'joined', label: t('colJoined') },
                { key: 'status', label: t('apColStatus') },
                { key: 'actions', label: t('colActions') },
              ].map((col) => (
                <Typography
                  key={col.key}
                  variant="caption"
                  sx={{
                    fontWeight: 950,
                    color: 'rgba(36, 16, 79, 0.64)',
                    textTransform: 'uppercase',
                    letterSpacing: 0,
                    fontSize: '0.8125rem',
                    textAlign: col.key === 'user' ? 'left' : 'center',
                  }}
                >
                  {col.label}
                </Typography>
              ))}
            </Box>

            <Box
              sx={{
                maxHeight: { xs: 'calc(100dvh - 420px)', md: 'calc(100dvh - 360px)' },
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollPaddingBottom: 0,
                '&::-webkit-scrollbar': { width: '0.5rem' },
                '&::-webkit-scrollbar-track': { background: 'rgba(244, 238, 255, 0.45)', borderRadius: 999 },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(167, 139, 250, 0.5)', borderRadius: 999 },
              }}
            >
              <Stack spacing={0} sx={{ pb: 0 }}>
                {loading ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : filteredUsers.length > 0 ? filteredUsers.map((user) => {
                  const inactive = isInactiveUser(user);
                  return (
                  <Box
                    key={user.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectUser(user)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') selectUser(user);
                    }}
                    sx={{
                      ...rowGrid,
                      minHeight: { xs: 'auto', md: '4.35rem' },
                      px: { xs: 1.7, md: '1.125rem' },
                      py: { xs: 1.35, md: 0 },
                      borderRadius: { xs: '18px', md: 0 },
                      border: 0,
                      borderBottom: '1px solid rgba(167, 139, 250, 0.13)',
                      bgcolor: inactive ? 'rgba(255, 247, 250, 0.62)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease',
                      ...(selectedUser?.id === user.id
                        ? {
                            bgcolor: inactive ? 'rgba(255, 239, 245, 0.8)' : 'rgba(244, 238, 255, 0.74)',
                          }
                        : {}),
                      '&:hover': {
                        bgcolor: inactive ? 'rgba(255, 242, 247, 0.86)' : 'rgba(255, 250, 254, 0.82)',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                      <Avatar
                        src={user.avatarUrl || ''}
                        sx={{
                          width: '2.25rem',
                          height: '2.25rem',
                          bgcolor: '#EEE7FF',
                          color: '#6D3CCF',
                          fontWeight: 950,
                          fontSize: '0.8125rem',
                          boxShadow: 'none',
                        }}
                      >
                        {initials(user)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap sx={{ color: '#17122E', fontSize: '0.875rem', lineHeight: 1.2 }}>{getFullName(user, t('umUnnamedUser'))}</Typography>
                        <Typography color="rgba(36, 16, 79, 0.55)" noWrap sx={{ fontSize: '0.75rem', mt: 0.25 }}>{user.email || t('umNoEmail')}</Typography>
                      </Box>
                    </Stack>

                    <Box onClick={(event) => event.stopPropagation()} sx={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                      <Select
                        value={normalizeUserRole(user.role)}
                        onChange={(event) => handleRoleChange(user, event.target.value)}
                        disabled={saving === user.id}
                        size="small"
                        sx={{
                          width: '8.75rem',
                          height: '2.25rem',
                          borderRadius: '10px',
                          fontWeight: 850,
                          fontSize: '0.75rem',
                          ...(ROLE_STYLES[normalizeUserRole(user.role)] || ROLE_STYLES.participant),
                          '& .MuiSelect-select': { py: 0.75, textAlign: 'center' },
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.65)' },
                        }}
                      >
                        {ROLES.map((role) => <MenuItem key={role} value={role}>{roleLabel(role)}</MenuItem>)}
                      </Select>
                    </Box>

                    <Typography fontWeight={800} color="rgba(36, 16, 79, 0.72)" sx={{ textAlign: 'center', fontSize: '0.8125rem' }}>{formatDateValue(getJoinedDate(user))}</Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                      <Chip
                        label={inactive ? t('umStatusInactive') : t('umStatusActive')}
                        size="small"
                        sx={{
                          height: '1.875rem',
                          minWidth: '5.75rem',
                          justifyContent: 'center',
                          borderRadius: '10px',
                          color: inactive ? '#C2415B' : '#329143',
                          bgcolor: inactive ? 'rgba(244, 63, 94, 0.10)' : 'rgba(134, 209, 124, 0.22)',
                          border: inactive ? '1px solid rgba(244, 63, 94, 0.16)' : '1px solid rgba(134, 209, 124, 0.18)',
                          fontWeight: 850,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.75}
                      justifyContent={{ xs: 'flex-start', md: 'center' }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <IconButton aria-label={t('umEditAria').replace('{name}', getFullName(user, t('umUnnamedUser')))} onClick={() => selectUser(user)} sx={actionIconSx('purple')}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={t('umDeactivateAria').replace('{name}', getFullName(user, t('umUnnamedUser')))}
                        disabled={inactive || deactivating}
                        onClick={() => setDeactivateTarget(user)}
                        sx={actionIconSx('pink')}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                  );
                }) : (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography fontWeight={900}>{t('umNoUsers')}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>{t('umNoUsersHint')}</Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Box>
            </Box>
            )}
          </Grid>

        </Grid>
      </Stack>

      <Dialog
        open={detailsOpen && Boolean(selectedUser)}
        onClose={closeDetails}
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
        {selectedUser ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 50% 0%, rgba(223, 50, 123, 0.08), transparent 32%), linear-gradient(180deg, #FFFFFF 0%, #FFFBFE 100%)' }}>
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
                onClick={closeDetails}
                aria-label="Close user details"
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
                    src={selectedUser.avatarUrl || ''}
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
                    {initials(selectedUser)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <RoleChip role={selectedUser.role} t={t} />
                        {isInactiveUser(selectedUser) ? (
                          <Chip
                            label={t('umStatusInactive')}
                            size="small"
                            sx={{
                              height: '1.625rem',
                              borderRadius: 999,
                              color: '#C2415B',
                              bgcolor: 'rgba(244, 63, 94, 0.10)',
                              border: '1px solid rgba(244, 63, 94, 0.16)',
                              fontWeight: 900,
                            }}
                          />
                        ) : null}
                        {detailsLoading ? <CircularProgress size={14} /> : null}
                      </Stack>
                      <Typography variant="h5" fontWeight={950} noWrap sx={{ fontSize: '1.125rem', textAlign: 'left', minWidth: 0, width: '100%' }}>
                        {getFullName(selectedUser, t('umUnnamedUser'))}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', textAlign: 'left', lineHeight: 1.35 }}>
                        {t('umJoinedLabel').replace('{date}', formatDateValue(getJoinedDate(selectedUser)))}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.625} justifyContent="flex-start" flexWrap="wrap" useFlexGap sx={{ mt: 1.125 }}>
                      <Button
                        size="small"
                        startIcon={<Pencil />}
                        sx={{
                          ...actionButtonBaseSx,
                          color: '#6D3CCF',
                          bgcolor: 'rgba(109, 60, 207, 0.09)',
                          borderColor: 'rgba(109, 60, 207, 0.10)',
                          '&:hover': {
                            ...actionButtonBaseSx['&:hover'],
                            bgcolor: 'rgba(109, 60, 207, 0.14)',
                            boxShadow: '0 10px 22px rgba(109, 60, 207, 0.14)',
                          },
                        }}
                      >
                        {t('btnEdit')}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<ShieldCheck />}
                        sx={{
                          ...actionButtonBaseSx,
                          color: '#5B21B6',
                          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.13), rgba(223, 50, 123, 0.12))',
                          borderColor: 'rgba(181, 123, 232, 0.18)',
                          '&:hover': {
                            ...actionButtonBaseSx['&:hover'],
                            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(223, 50, 123, 0.16))',
                            boxShadow: '0 10px 24px rgba(181, 123, 232, 0.20)',
                          },
                        }}
                      >
                        {t('umChangeRole')}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Ban />}
                        disabled={isInactiveUser(selectedUser)}
                        onClick={() => setDeactivateTarget(selectedUser)}
                        sx={{
                          ...actionButtonBaseSx,
                          color: '#C2415B',
                          bgcolor: 'rgba(244, 63, 94, 0.08)',
                          borderColor: 'rgba(244, 63, 94, 0.12)',
                          '&:hover': {
                            ...actionButtonBaseSx['&:hover'],
                            bgcolor: 'rgba(244, 63, 94, 0.13)',
                            boxShadow: '0 10px 22px rgba(244, 63, 94, 0.12)',
                          },
                        }}
                      >
                        {t('umDeactivate')}
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Stack>
            </Box>

            <Box sx={{ flexShrink: 0, px: { xs: 2, sm: 2.25 }, py: { xs: 1.5, sm: 1.875 } }} dir="ltr">
              <Stack spacing={0.875}>
                {userDetailRows.map((row, rowIndex) => (
                  <Box
                    key={rowIndex}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
                      gap: 0.875,
                      alignItems: 'stretch',
                    }}
                  >
                    {row.map(({ fieldKey, labelKey, value }) => (
                      <Box key={fieldKey} sx={{ minWidth: 0, display: 'flex' }}>
                        <AdminDetailInfoCard label={t(labelKey)} value={value} iconKey={fieldKey} />
                      </Box>
                    ))}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(deactivateTarget)}
        onClose={() => {
          if (!deactivating) setDeactivateTarget(null);
        }}
        PaperProps={{
          dir: direction,
          sx: {
            width: { xs: 'calc(100vw - 32px)', sm: '26rem' },
            borderRadius: '24px',
            p: 0,
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.96)',
            boxShadow: '0 26px 74px rgba(32, 20, 67, 0.24)',
          },
        }}
        BackdropProps={{
          sx: {
            bgcolor: 'rgba(18, 12, 35, 0.42)',
            backdropFilter: 'blur(8px)',
          },
        }}
      >
        <Box sx={{ p: { xs: 2.25, sm: 2.75 } }}>
          <Typography variant="h6" fontWeight={950} sx={{ color: '#17122E' }}>
            {t('umDeactivateTitle')}
          </Typography>
          <Typography sx={{ mt: 1, color: '#5E587E', lineHeight: 1.55 }}>
            {t('umDeactivateConfirm')}
          </Typography>
          {deactivateTarget ? (
            <Typography sx={{ mt: 1.25, color: '#17122E', fontWeight: 900 }}>
              {getFullName(deactivateTarget, t('umUnnamedUser'))}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={1.25} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setDeactivateTarget(null)}
              disabled={deactivating}
              sx={{
                borderRadius: 999,
                px: 2.4,
                borderColor: 'rgba(130, 92, 206, 0.18)',
                color: '#5B21B6',
                fontWeight: 900,
              }}
            >
              {t('btnCancel')}
            </Button>
            <Button
              variant="contained"
              onClick={confirmDeactivateUser}
              disabled={deactivating}
              sx={{
                borderRadius: 999,
                px: 2.6,
                bgcolor: '#C52A72',
                color: '#fff',
                fontWeight: 900,
                boxShadow: '0 12px 26px rgba(197, 42, 114, 0.18)',
                '&:hover': { bgcolor: '#B52568' },
              }}
            >
              {deactivating ? t('umDeactivating') : t('umDeactivateConfirmButton')}
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
}
