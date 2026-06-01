import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, query, updateDoc } from 'firebase/firestore';
import { Ban, Pencil, ShieldCheck } from 'lucide-react';
import { db } from '../../../firebase';
import { logAuditEvent } from '../services/auditService';
import Avatar from '@mui/material/Avatar';
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
import AddIcon from '@mui/icons-material/Add';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonIcon from '@mui/icons-material/Person';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PreviewIcon from '@mui/icons-material/Preview';
import SearchIcon from '@mui/icons-material/Search';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import SortIcon from '@mui/icons-material/Sort';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

const ROLES = ['participant', 'volunteer', 'therapist', 'admin'];

const ROLE_STYLES = {
  admin: { color: '#15803D', backgroundColor: 'rgba(34, 197, 94, 0.14)' },
  participant: { color: '#6D3CCF', backgroundColor: 'rgba(109, 60, 207, 0.12)' },
  volunteer: { color: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.12)' },
  therapist: { color: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.13)' },
  editor: { color: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.13)' },
};

const actionButtonBaseSx = {
  height: 32,
  borderRadius: 2.25,
  px: 1.25,
  fontSize: 12.5,
  fontWeight: 850,
  letterSpacing: 0,
  border: '1px solid transparent',
  boxShadow: '0 8px 18px rgba(91, 57, 145, 0.05)',
  transition: 'transform 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease',
  '& .MuiButton-startIcon': {
    mr: 0.75,
    '& svg': {
      width: 15,
      height: 15,
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

function humanizeValue(value) {
  if (!value) return '-';
  return String(value).replace(/_/g, ' ');
}

function getFullName(user) {
  return user?.fullName || user?.displayName || user?.name || 'Unnamed user';
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

function RoleChip({ role }) {
  const key = role || 'participant';
  const style = ROLE_STYLES[key] || ROLE_STYLES.participant;

  return (
    <Chip
      label={humanizeValue(key)}
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

function getFieldIcon(label) {
  const iconSx = { fontSize: 18 };
  const map = {
    'Full Name': <PersonIcon sx={iconSx} />,
    Email: <EmailOutlinedIcon sx={iconSx} />,
    'Phone Number': <PhoneOutlinedIcon sx={iconSx} />,
    Address: <PlaceOutlinedIcon sx={iconSx} />,
    'Date of Birth': <CakeOutlinedIcon sx={iconSx} />,
    'Emergency Contact': <PhoneOutlinedIcon sx={iconSx} />,
    'How did you hear about us?': <ShareOutlinedIcon sx={iconSx} />,
    'Bio/About': <FavoriteBorderIcon sx={iconSx} />,
  };
  return map[label] || <PersonIcon sx={iconSx} />;
}

function InfoCard({ label, value, icon }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.35,
        width: '100%',
        height: 86,
        flex: '0 0 86px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRadius: '28px',
        border: '1px solid rgba(130, 92, 206, 0.12)',
        bgcolor: 'rgba(255, 255, 255, 0.72)',
        boxShadow: '0 8px 20px rgba(91, 57, 145, 0.045)',
        display: 'flex',
        alignItems: 'center',
        gap: 1.45,
        flexDirection: 'row-reverse',
        justifyContent: 'flex-start',
        textAlign: 'right',
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color: '#7C3AED',
          bgcolor: 'rgba(124, 58, 237, 0.08)',
        }}
      >
        {icon || getFieldIcon(label)}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'block', lineHeight: 1.1, fontSize: 13 }}>
          {label}
        </Typography>
        <Typography
          fontWeight={850}
          noWrap
          title={value || '-'}
          sx={{ color: '#17122E', fontSize: 16, mt: 0.35, lineHeight: 1.3 }}
        >
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  );
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(query(collection(db, 'users'), limit(200)));
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

  async function handleRoleChange(user, newRole) {
    const oldRole = user.role || 'participant';
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
      const role = user.role || 'participant';
      const matchesSearch =
        !q ||
        [getFullName(user), user.email, user.phoneNumber, getAddress(user)]
          .some((value) => String(value || '').toLowerCase().includes(q));
      const matchesRole = roleFilter === 'all' || role === roleFilter;
      return matchesSearch && matchesRole;
    });

    return [...next].sort((left, right) => {
      if (sortBy === 'name') return getFullName(left).localeCompare(getFullName(right));
      if (sortBy === 'role') return (left.role || 'participant').localeCompare(right.role || 'participant');

      const leftDate = getJoinedDate(left)?.toDate?.() || new Date(getJoinedDate(left) || 0);
      const rightDate = getJoinedDate(right)?.toDate?.() || new Date(getJoinedDate(right) || 0);
      return sortBy === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [roleFilter, search, sortBy, users]);

  const personalSections = selectedUser
    ? [
        {
          title: 'Contact Information',
          fields: [
            ['Full Name', getFullName(selectedUser)],
            ['Email', selectedUser.email],
            ['Phone Number', selectedUser.phoneNumber],
            ['Address', getAddress(selectedUser)],
          ],
        },
        {
          title: 'Personal Information',
          fields: [
            ['Date of Birth', formatDateValue(selectedUser.birthDate || selectedUser.dateOfBirth)],
          ],
        },
      ]
    : [];
  const compactDetails = personalSections.flatMap((section) => section.fields);

  const rowGrid = {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr)',
      md: 'minmax(300px, 1.45fr) 170px 150px 180px',
    },
    alignItems: 'center',
    gap: 2,
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
      width: 42,
      height: 42,
      color: palette.color,
      bgcolor: palette.bgcolor,
      border: '1px solid rgba(255, 255, 255, 0.72)',
      boxShadow: '0 10px 22px rgba(91, 57, 145, 0.06)',
      transition: 'transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease',
      '&:hover': {
        bgcolor: palette.hover,
        transform: 'translateY(-1px)',
        boxShadow: '0 14px 28px rgba(91, 57, 145, 0.11)',
      },
    };
  };

  return (
    <Box
      dir="ltr"
      sx={{
        width: '100%',
        maxWidth: 'none',
        minHeight: '100%',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background:
          'radial-gradient(circle at 12% 18%, rgba(223, 50, 123, 0.09), transparent 30%), radial-gradient(circle at 92% 4%, rgba(109, 60, 207, 0.12), transparent 34%), linear-gradient(135deg, #FAF7FF 0%, #FFF9FC 48%, #F7FBFF 100%)',
      }}
    >
      <Stack spacing={2.8} sx={{ width: '100%', maxWidth: 'none', height: '100%', minHeight: 0 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h3" sx={{ fontSize: { xs: 30, md: 39 }, fontWeight: 950, color: '#100B2F', lineHeight: 1.05 }}>
              User Management
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 0.9, color: '#4F4A70', fontWeight: 600 }}>
              Manage participants, admin users, and permissions.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => navigate('/home')}
              sx={{
                height: 48,
                px: 3.2,
                borderRadius: 999,
                borderColor: 'rgba(223, 50, 123, 0.46)',
                color: '#C52A72',
                bgcolor: 'rgba(255,255,255,0.62)',
                fontWeight: 900,
                boxShadow: '0 12px 28px rgba(223, 50, 123, 0.06)',
                '&:hover': {
                  borderColor: 'rgba(223, 50, 123, 0.7)',
                  bgcolor: 'rgba(255, 246, 251, 0.92)',
                },
              }}
            >
              Preview Participant View
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                height: 56,
                px: 3.5,
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #DF327B 0%, #B933C4 100%)',
                boxShadow: '0 18px 38px rgba(188, 48, 160, 0.26)',
                fontWeight: 950,
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #D12B72 0%, #A92DB9 100%)',
                  boxShadow: '0 20px 42px rgba(188, 48, 160, 0.31)',
                },
              }}
            >
              Add User
            </Button>
          </Stack>
        </Stack>

        <Grid
          container
          spacing={0}
          alignItems="flex-start"
          sx={{ width: '100%', maxWidth: 'none', minHeight: 0, flex: 1, m: 0 }}
        >
          <Grid item xs={12} sx={{ width: '100%', maxWidth: 'none', flexBasis: '100%', p: 0 }}>
            <Box
              sx={{
                width: '100%',
                maxWidth: 'none',
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
          <Stack direction={{ xs: 'column', xl: 'row' }} spacing={2} alignItems={{ xl: 'center' }} justifyContent="space-between" sx={{ p: { xs: 2.2, md: 3 }, flexShrink: 0 }}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Typography variant="h5" fontWeight={950} sx={{ color: '#100B2F' }}>Users</Typography>
              <Chip
                label={`${users.length} total`}
                sx={{
                  height: 30,
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
                placeholder="Search users..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{
                  minWidth: { md: 330 },
                  '& .MuiOutlinedInput-root': {
                    height: 50,
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
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  sx={{
                    height: 50,
                    borderRadius: '16px',
                    bgcolor: 'rgba(255,255,255,0.72)',
                    fontWeight: 750,
                    '& fieldset': { borderColor: 'rgba(130, 92, 206, 0.16)' },
                  }}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  {ROLES.map((role) => <MenuItem key={role} value={role}>{humanizeValue(role)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  sx={{
                    height: 50,
                    borderRadius: '16px',
                    bgcolor: 'rgba(255,255,255,0.72)',
                    fontWeight: 750,
                    '& fieldset': { borderColor: 'rgba(130, 92, 206, 0.16)' },
                  }}
                  startAdornment={<SortIcon fontSize="small" sx={{ ml: 1, mr: 0.5, color: '#6D3CCF' }} />}
                >
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="oldest">Oldest</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="role">Role</MenuItem>
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
              {['User', 'Role', 'Joined', 'Actions'].map((label) => (
                <Typography
                  key={label}
                  variant="caption"
                  sx={{
                    fontWeight: 950,
                    color: '#625B84',
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                    textAlign: label === 'Actions' ? 'right' : 'left',
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
                '&::-webkit-scrollbar': { width: 8 },
                '&::-webkit-scrollbar-track': { background: 'rgba(244, 238, 255, 0.45)', borderRadius: 999 },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(167, 139, 250, 0.5)', borderRadius: 999 },
              }}
            >
              <Stack spacing={1.1}>
                {loading ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <CircularProgress />
                  </Box>
                ) : filteredUsers.length > 0 ? filteredUsers.map((user) => (
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
                      px: { xs: 1.7, md: 2.2 },
                      py: 1.8,
                      borderRadius: '22px',
                      border: '1px solid rgba(130, 92, 206, 0.10)',
                      bgcolor: 'rgba(255,255,255,0.72)',
                      cursor: 'pointer',
                      transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease',
                      ...(selectedUser?.id === user.id
                        ? {
                            bgcolor: 'rgba(244, 238, 255, 0.95)',
                            borderColor: 'rgba(124, 58, 237, 0.35)',
                            boxShadow: '0 16px 34px rgba(91, 57, 145, 0.12)',
                          }
                        : {}),
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
                        src={user.avatarUrl || ''}
                        sx={{
                          width: 54,
                          height: 54,
                          bgcolor: '#EEE7FF',
                          color: '#6D3CCF',
                          fontWeight: 950,
                          fontSize: 19,
                          boxShadow: '0 10px 24px rgba(109, 60, 207, 0.12)',
                        }}
                      >
                        {initials(user)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={950} noWrap sx={{ color: '#17122E' }}>{getFullName(user)}</Typography>
                        <Typography color="#5E587E" noWrap sx={{ fontSize: 13.5 }}>{user.email || 'No email provided'}</Typography>
                      </Box>
                    </Stack>

                    <Box onClick={(event) => event.stopPropagation()}>
                      <Select
                        value={user.role || 'participant'}
                        onChange={(event) => handleRoleChange(user, event.target.value)}
                        disabled={saving === user.id}
                        size="small"
                        sx={{
                          minWidth: 150,
                          height: 42,
                          borderRadius: 999,
                          fontWeight: 900,
                          ...(ROLE_STYLES[user.role || 'participant'] || ROLE_STYLES.participant),
                          '& .MuiSelect-select': { py: 1.05 },
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.65)' },
                        }}
                      >
                        {ROLES.map((role) => <MenuItem key={role} value={role}>{humanizeValue(role)}</MenuItem>)}
                      </Select>
                    </Box>

                    <Typography fontWeight={800} color="#4F4A70">{formatDateValue(getJoinedDate(user))}</Typography>

                    <Stack
                      direction="row"
                      spacing={1.1}
                      justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <IconButton aria-label={`View ${getFullName(user)}`} onClick={() => selectUser(user)} sx={actionIconSx('purple')}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label={`Edit ${getFullName(user)}`} onClick={() => selectUser(user)} sx={actionIconSx('purple')}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label={`Delete ${getFullName(user)}`} sx={actionIconSx('pink')}>
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                )) : (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography fontWeight={900}>No users found</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>Try changing your search or filters.</Typography>
                  </Box>
                )}
              </Stack>
            </Box>
            {!loading && filteredUsers.length > 0 ? (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                sx={{ pt: 2, flexShrink: 0 }}
              >
                <Typography color="#4F4A70" fontWeight={750}>
                  Showing 1 to {filteredUsers.length} of {filteredUsers.length} results
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton size="small" disabled sx={{ color: '#B8B0D0' }}>{'<'}</IconButton>
                  <Button
                    variant="contained"
                    disableElevation
                    sx={{
                      minWidth: 42,
                      height: 42,
                      borderRadius: '14px',
                      bgcolor: '#E9D9FF',
                      color: '#6D3CCF',
                      fontWeight: 950,
                      '&:hover': { bgcolor: '#E3D0FF' },
                    }}
                  >
                    1
                  </Button>
                  <IconButton size="small" disabled sx={{ color: '#B8B0D0' }}>{'>'}</IconButton>
                </Stack>
              </Stack>
            ) : null}
          </Box>
            </Box>
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
          dir: 'ltr',
          sx: {
            width: { xs: 'calc(100vw - 24px)', sm: 560 },
            maxWidth: 560,
            m: 0,
            position: 'fixed',
            top: '50%',
            insetInlineStart: '50%',
            transform: 'translate(-50%, -50%)',
            height: { xs: 'auto', sm: 850 },
            maxHeight: { xs: 'calc(100vh - 24px)', md: 850 },
            borderRadius: { xs: '24px', md: '34px' },
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
          <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'auto', sm: 850 }, maxHeight: { xs: 'calc(100vh - 24px)', md: 850 }, background: 'radial-gradient(circle at 50% 0%, rgba(223, 50, 123, 0.08), transparent 32%), linear-gradient(180deg, #FFFFFF 0%, #FFFBFE 100%)' }}>
            <Box sx={{ p: { xs: 2, md: 2.6 }, pb: 1.8, position: 'relative', height: 228, flex: '0 0 228px', boxSizing: 'border-box', overflow: 'hidden' }}>
              <Stack spacing={1.45} alignItems="stretch" textAlign="right">
                <Stack direction="row-reverse" spacing={1.5} alignItems="center" sx={{ width: '100%', pr: 0 }}>
                  <Avatar src={selectedUser.avatarUrl || ''} sx={{ width: 82, height: 82, bgcolor: '#EEE7FF', color: '#6D3CCF', fontSize: 30, fontWeight: 950, boxShadow: '0 14px 30px rgba(109, 60, 207, 0.16)', flexShrink: 0 }}>
                    {initials(selectedUser)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row-reverse" spacing={0.75} alignItems="center" justifyContent="flex-start" flexWrap="nowrap" sx={{ minWidth: 0 }}>
                      <Typography variant="h5" fontWeight={950} noWrap sx={{ fontSize: 21, textAlign: 'right', minWidth: 0, flex: 1 }}>{getFullName(selectedUser)}</Typography>
                      <Box sx={{ flexShrink: 0 }}>
                        <RoleChip role={selectedUser.role || 'participant'} />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={closeDetails}
                        aria-label="Close user details"
                        sx={{
                          width: 30,
                          height: 30,
                          bgcolor: 'rgba(109, 60, 207, 0.06)',
                          color: '#4E466B',
                          '&:hover': { bgcolor: 'rgba(109, 60, 207, 0.12)' },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                      {detailsLoading ? <CircularProgress size={16} /> : null}
                    </Stack>
                    <Typography color="text.secondary" noWrap sx={{ mt: 0.45, fontSize: 13.5, textAlign: 'right' }}>{selectedUser.email || 'No email provided'}</Typography>
                    <Stack direction="row-reverse" spacing={1.1} justifyContent="flex-start" alignItems="center" flexWrap="wrap" sx={{ mt: 0.75 }}>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>Joined {formatDateValue(getJoinedDate(selectedUser))}</Typography>
                    </Stack>
                  </Box>
                </Stack>

                <Stack direction="row-reverse" spacing={0.75} justifyContent="flex-start" flexWrap="wrap">
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
                    Edit
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
                    Change Role
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Ban />}
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
                    Suspend
                  </Button>
                </Stack>
              </Stack>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 2.6 }, borderTop: '1px solid rgba(130, 92, 206, 0.08)' }}>
              <Stack spacing={1.35}>
                {compactDetails.map(([label, value]) => (
                  <Box key={label} sx={{ width: '100%' }}>
                    <InfoCard label={label} value={value} />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        ) : null}
      </Dialog>
    </Box>
  );
}
