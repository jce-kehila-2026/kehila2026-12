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
import AdminPageHeader from '../components/AdminPageHeader';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Avatar from '@mui/material/Avatar';

const PAGE_SIZE = 10;

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

function paginateUserRows(rows, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const startIndex = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    rows: rows.slice(startIndex, startIndex + pageSize),
  };
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
  const [page, setPage] = useState(1);
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

  useEffect(() => {
    setPage(1);
  }, [activeTab, roleFilter, search, sortBy, statusFilter]);

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

  const pagination = useMemo(() => paginateUserRows(filteredUsers, page, PAGE_SIZE), [filteredUsers, page]);

  function clearFilters() {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
  }

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

  const pendingApplications = joinRequests.filter((req) => (req.status || 'new') === 'new').length;

  return (
    <Box
      dir={direction}
      sx={{
        width: '100%',
        maxWidth: '100%',
        height: 'calc(100vh - 6.5rem)',
        maxHeight: 'calc(100vh - 6.5rem)',
        overflow: 'hidden',
        color: '#24104f',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AdminPageHeader title={t('umTitle')} />

      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          mb: '0.875rem',
          p: '0.125rem 0.125rem 0',
          overflow: 'visible',
          flex: '0 0 auto',
        }}
      >
        <Box
          role="tablist"
          aria-label={t('umSectionsAria')}
          sx={{
            width: 'fit-content',
            minHeight: '2.75rem',
            p: '0.25rem',
            border: 0,
            borderRadius: '12px',
            display: 'inline-grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            alignItems: 'center',
            gap: '0.25rem',
            background: '#fdf2f8',
            backdropFilter: 'none',
          }}
        >
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
                  minWidth: '5.375rem',
                  minHeight: '2.25rem',
                  px: '0.9375rem',
                  py: '0.5625rem',
                  border: 0,
                  borderRadius: '9px',
                  color: selected ? '#fff' : '#db4f9f',
                  background: selected ? 'linear-gradient(135deg, #e73386, #dc2577)' : 'transparent',
                  boxShadow: 'none',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease',
                  '&:hover': {
                    color: '#fff',
                    background: 'linear-gradient(135deg, #e73386, #dc2577)',
                    boxShadow: 'none',
                  },
                  '&:focus-visible': {
                    color: '#fff',
                    background: 'linear-gradient(135deg, #e73386, #dc2577)',
                    boxShadow: 'none',
                  },
                }}
              >
                {tab.label}
                {tab.key === 'applications' && pendingApplications > 0 ? (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      px: 0.85,
                      py: 0.1,
                      borderRadius: 999,
                      fontSize: '0.7rem',
                      fontWeight: 900,
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
        </Box>
      </Box>

      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
        {activeTab === 'applications' ? (
          <Box sx={{ minHeight: 0, overflow: 'auto' }}>
            <JoinRequestsTab requests={joinRequests} loading={joinLoading} onChanged={loadJoinRequests} />
          </Box>
        ) : (
          <>
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
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('umSearchPlaceholder')} />
              </Box>
              <Box component="label" sx={filterFieldSx}>
                <span>{t('colRole')}</span>
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="all">{t('umAllRoles')}</option>
                  {ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                </select>
              </Box>
              <Box component="label" sx={filterFieldSx}>
                <span>{t('apColStatus')}</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">{t('umAllStatuses')}</option>
                  <option value="active">{t('umStatusActive')}</option>
                  <option value="inactive">{t('umStatusInactive')}</option>
                </select>
              </Box>
              <Box component="label" sx={filterFieldSx}>
                <span>{t('evSortBy')}</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="oldest">{t('sortOldest')}</option>
                  <option value="name">{t('sortName')}</option>
                  <option value="role">{t('sortRole')}</option>
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
              component="section"
              aria-busy={loading}
              sx={{
                flex: '1 1 auto',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(167, 139, 250, 0.18)',
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.82)',
                boxShadow: 'none',
                backdropFilter: 'blur(18px)',
                overflow: 'hidden',
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
                {[
                  { key: 'user', label: t('colUser') },
                  { key: 'role', label: t('colRole') },
                  { key: 'joined', label: t('colJoined') },
                  { key: 'status', label: t('apColStatus') },
                  { key: 'actions', label: t('colActions') },
                ].map((col) => (
                  <Typography
                    key={col.key}
                    component="span"
                    sx={{
                      fontWeight: 800,
                      color: 'rgba(36, 16, 79, 0.64)',
                      fontSize: '0.8125rem',
                      textAlign: col.key === 'user' ? 'left' : 'center',
                    }}
                  >
                    {col.label}
                  </Typography>
                ))}
              </Box>

              <Box sx={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                {loading ? (
                  <Box sx={{ minHeight: '100%', p: '2rem', display: 'grid', placeContent: 'center', justifyItems: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : pagination.rows.length > 0 ? pagination.rows.map((user) => {
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
                        minHeight: { xs: 'auto', md: '4rem' },
                        px: { xs: 1.7, md: '1.125rem' },
                        py: { xs: 1.35, md: 0 },
                        borderRadius: { xs: '18px', md: 0 },
                        border: 0,
                        borderBottom: '1px solid rgba(167, 139, 250, 0.13)',
                        color: 'rgba(36, 16, 79, 0.78)',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        bgcolor: inactive ? 'rgba(255, 247, 250, 0.62)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 180ms ease',
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
                            width: '2rem',
                            height: '2rem',
                            background: 'linear-gradient(135deg, #fce7f3, #ddd6fe)',
                            color: '#6D3CCF',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            boxShadow: 'none',
                          }}
                        >
                          {initials(user)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={800} noWrap sx={{ color: '#17122E', fontSize: '0.8125rem', lineHeight: 1.2 }}>{getFullName(user, t('umUnnamedUser'))}</Typography>
                          <Typography color="rgba(36, 16, 79, 0.55)" noWrap sx={{ fontSize: '0.75rem', mt: 0.125 }}>{user.email || t('umNoEmail')}</Typography>
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

                      <Typography fontWeight={700} color="rgba(36, 16, 79, 0.72)" sx={{ textAlign: 'center', fontSize: '0.8125rem' }}>{formatDateValue(getJoinedDate(user))}</Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                        <Chip
                          label={inactive ? t('umStatusInactive') : t('umStatusActive')}
                          size="small"
                          sx={{
                            width: 'fit-content',
                            borderRadius: '10px',
                            px: '0.375rem',
                            height: '1.875rem',
                            minWidth: '5.75rem',
                            justifyContent: 'center',
                            color: inactive ? '#C2415B' : '#329143',
                            bgcolor: inactive ? 'rgba(244, 63, 94, 0.10)' : 'rgba(134, 209, 124, 0.22)',
                            border: inactive ? '1px solid rgba(244, 63, 94, 0.16)' : '1px solid rgba(134, 209, 124, 0.18)',
                            fontWeight: 800,
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
                  <Box sx={{ minHeight: '100%', p: '2rem', display: 'grid', placeContent: 'center', justifyItems: 'center', color: 'rgba(36, 16, 79, 0.65)', fontWeight: 800, textAlign: 'center' }}>
                    <Typography fontWeight={900}>{t('umNoUsers')}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>{t('umNoUsersHint')}</Typography>
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
          </>
        )}
      </Box>

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
        slotProps={{
          paper: {
            dir: direction,
            sx: {
              width: { xs: 'calc(100vw - 24px)', sm: 'min(49.5rem, calc(100vw - 32px))' },
              maxWidth: 792,
              m: 0,
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              height: 'auto',
              maxHeight: 'calc(100vh - 24px)',
              borderRadius: { xs: '20px', md: '24px' },
              overflow: 'hidden',
              bgcolor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 30px 86px rgba(32, 20, 67, 0.28)',
            },
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
                  top: '12px',
                  right: '12px',
                  left: 'auto',
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
        slotProps={{
          paper: {
            dir: direction,
            sx: {
              width: { xs: 'calc(100vw - 32px)', sm: '26rem' },
              borderRadius: '24px',
              p: 0,
              overflow: 'hidden',
              bgcolor: 'rgba(255, 255, 255, 0.96)',
              boxShadow: '0 26px 74px rgba(32, 20, 67, 0.24)',
            },
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
