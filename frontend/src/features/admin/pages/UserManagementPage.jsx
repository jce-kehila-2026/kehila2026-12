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
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonIcon from '@mui/icons-material/Person';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PreviewIcon from '@mui/icons-material/Preview';
import SearchIcon from '@mui/icons-material/Search';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import SortIcon from '@mui/icons-material/Sort';

const ROLES = ['participant', 'volunteer', 'therapist', 'admin'];

const ROLE_STYLES = {
  admin: { color: '#C02666', backgroundColor: 'rgba(233, 75, 147, 0.13)' },
  participant: { color: '#6D3CCF', backgroundColor: 'rgba(109, 60, 207, 0.12)' },
  volunteer: { color: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.12)' },
  therapist: { color: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.13)' },
  editor: { color: '#7C3AED', backgroundColor: 'rgba(124, 58, 237, 0.13)' },
};

const TAB_SX = {
  '& .MuiTabs-indicator': {
    height: 2,
    borderRadius: 999,
    background: 'linear-gradient(90deg, #7C3AED, #DF327B)',
    boxShadow: '0 0 10px rgba(124, 58, 237, 0.22)',
    transition: 'all 240ms ease',
  },
  '& .MuiTab-root': {
    minHeight: 38,
    px: 1.6,
    textTransform: 'none',
    fontWeight: 850,
    fontSize: 13,
    color: '#7B7397',
    transition: 'color 180ms ease, transform 180ms ease',
    '&:hover': { color: '#6D3CCF', transform: 'translateY(-1px)' },
  },
  '& .Mui-selected': { color: '#6D3CCF' },
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
        px: 1.4,
        py: 1.15,
        minHeight: 58,
        borderRadius: 3.2,
        border: '1px solid rgba(130, 92, 206, 0.12)',
        bgcolor: 'rgba(255, 255, 255, 0.72)',
        boxShadow: '0 8px 20px rgba(91, 57, 145, 0.045)',
        display: 'flex',
        alignItems: 'center',
        gap: 1.15,
        flexDirection: 'row-reverse',
        justifyContent: 'flex-start',
        textAlign: 'right',
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 2.2,
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
        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'block', lineHeight: 1.1 }}>
          {label}
        </Typography>
        <Typography fontWeight={850} sx={{ color: '#17122E', wordBreak: 'break-word', fontSize: 14, mt: 0.25, lineHeight: 1.3 }}>
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
  const [mainTab, setMainTab] = useState('users');
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
      const matchesTab = mainTab === 'users' || role !== 'participant';
      return matchesSearch && matchesRole && matchesTab;
    });

    return [...next].sort((left, right) => {
      if (sortBy === 'name') return getFullName(left).localeCompare(getFullName(right));
      if (sortBy === 'role') return (left.role || 'participant').localeCompare(right.role || 'participant');

      const leftDate = getJoinedDate(left)?.toDate?.() || new Date(getJoinedDate(left) || 0);
      const rightDate = getJoinedDate(right)?.toDate?.() || new Date(getJoinedDate(right) || 0);
      return sortBy === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [mainTab, roleFilter, search, sortBy, users]);

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
      md: 'minmax(260px, 1.5fr) 150px 140px',
    },
    alignItems: 'center',
    gap: 2,
  };

  return (
    <Box
      dir="ltr"
      sx={{
        mx: { xs: -2, sm: -3, md: -4 },
        my: { xs: -2, sm: -3, md: -4 },
        minHeight: 'calc(100vh - 64px)',
        p: { xs: 2, sm: 3, md: 4 },
        background:
          'radial-gradient(circle at 12% 18%, rgba(223, 50, 123, 0.09), transparent 30%), radial-gradient(circle at 92% 4%, rgba(109, 60, 207, 0.12), transparent 34%), linear-gradient(135deg, #FAF7FF 0%, #FFF9FC 48%, #F7FBFF 100%)',
      }}
    >
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
          <Box>
            <Typography variant="h3" sx={{ fontSize: { xs: 30, md: 38 }, fontWeight: 950 }}>
              User Management
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 0.8 }}>
              Manage participants, admin users, and permissions.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<PreviewIcon />} onClick={() => navigate('/home')} sx={{ alignSelf: { md: 'center' }, borderRadius: 999 }}>
            Preview Participant View
          </Button>
        </Stack>

        <Tabs value={mainTab} onChange={(_, value) => setMainTab(value)} sx={{ ...TAB_SX, borderBottom: '1px solid rgba(130, 92, 206, 0.14)' }}>
          <Tab value="users" label="Users" />
          <Tab value="roles" label="Roles & Permissions" />
        </Tabs>

        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12}>
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.82)',
                border: '1px solid rgba(130, 92, 206, 0.14)',
                borderRadius: '24px',
                boxShadow: '0 26px 70px rgba(91, 57, 145, 0.10)',
                backdropFilter: 'blur(22px)',
                overflow: 'hidden',
              }}
            >
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }} justifyContent="space-between" sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography variant="h5" fontWeight={950}>Users</Typography>
              <Chip label={`${users.length} total`} sx={{ bgcolor: '#F2ECFF', color: '#6D3CCF', fontWeight: 900, borderRadius: 999 }} />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                placeholder="Search users..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: { md: 260 }, '& .MuiOutlinedInput-root': { borderRadius: 999 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} sx={{ borderRadius: 999 }}>
                  <MenuItem value="all">All Roles</MenuItem>
                  {ROLES.map((role) => <MenuItem key={role} value={role}>{humanizeValue(role)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)} sx={{ borderRadius: 999 }} startAdornment={<SortIcon fontSize="small" sx={{ ml: 1, color: '#6D3CCF' }} />}>
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="oldest">Oldest</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="role">Role</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 999, px: 2.6, background: 'linear-gradient(135deg, #7C3AED, #DF327B)', boxShadow: '0 14px 30px rgba(124, 58, 237, 0.22)' }}>
                Add User
              </Button>
            </Stack>
          </Stack>

          <Box sx={{ px: 3, pb: 3 }}>
            <Box sx={{ ...rowGrid, px: 2, py: 1.5, display: { xs: 'none', md: 'grid' } }}>
              {['User', 'Role', 'Joined'].map((label) => (
                <Typography key={label} variant="caption" sx={{ fontWeight: 900, color: '#6F6890', textTransform: 'uppercase' }}>
                  {label}
                </Typography>
              ))}
            </Box>

            <Stack spacing={1.2}>
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
                    p: 2,
                    borderRadius: '22px',
                    border: '1px solid rgba(130, 92, 206, 0.08)',
                    bgcolor: 'rgba(255,255,255,0.66)',
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
                      bgcolor: 'rgba(244, 238, 255, 0.88)',
                      borderColor: 'rgba(124, 58, 237, 0.18)',
                      boxShadow: '0 16px 34px rgba(91, 57, 145, 0.10)',
                      transform: 'translateY(-2px) scale(1.002)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                    <Avatar src={user.avatarUrl || ''} sx={{ width: 46, height: 46, bgcolor: '#EEE7FF', color: '#6D3CCF', fontWeight: 900 }}>
                      {initials(user)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900} noWrap>{getFullName(user)}</Typography>
                      <Typography color="text.secondary" noWrap>{user.email || 'No email provided'}</Typography>
                    </Box>
                  </Stack>

                  <Box onClick={(event) => event.stopPropagation()}>
                    <Select
                      value={user.role || 'participant'}
                      onChange={(event) => handleRoleChange(user, event.target.value)}
                      disabled={saving === user.id}
                      size="small"
                      sx={{
                        minWidth: 140,
                        borderRadius: 999,
                        fontWeight: 900,
                        ...(ROLE_STYLES[user.role || 'participant'] || ROLE_STYLES.participant),
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                      }}
                    >
                      {ROLES.map((role) => <MenuItem key={role} value={role}>{humanizeValue(role)}</MenuItem>)}
                    </Select>
                  </Box>

                  <Typography fontWeight={700} color="text.secondary">{formatDateValue(getJoinedDate(user))}</Typography>
                </Box>
              )) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography fontWeight={900}>No users found</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>Try changing your search or filters.</Typography>
                </Box>
              )}
            </Stack>
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
            width: { xs: 'calc(100vw - 24px)', sm: 420 },
            maxWidth: 420,
            m: 0,
            position: 'fixed',
            top: '50%',
            insetInlineStart: '50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: { xs: 'calc(100vh - 24px)', md: '82vh' },
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
          <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: { xs: 'calc(100vh - 24px)', md: '82vh' }, background: 'radial-gradient(circle at 50% 0%, rgba(223, 50, 123, 0.08), transparent 32%), linear-gradient(180deg, #FFFFFF 0%, #FFFBFE 100%)' }}>
            <Box sx={{ p: { xs: 2, md: 2.35 }, pb: 1.45, position: 'relative' }}>
              <Stack spacing={1.45} alignItems="stretch" textAlign="right">
                <Stack direction="row-reverse" spacing={1.5} alignItems="center" sx={{ width: '100%', pr: 0 }}>
                  <Avatar src={selectedUser.avatarUrl || ''} sx={{ width: 82, height: 82, bgcolor: '#EEE7FF', color: '#6D3CCF', fontSize: 30, fontWeight: 950, boxShadow: '0 14px 30px rgba(109, 60, 207, 0.16)', flexShrink: 0 }}>
                    {initials(selectedUser)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row-reverse" spacing={1} alignItems="center" justifyContent="flex-start" flexWrap="wrap">
                      <Typography variant="h5" fontWeight={950} sx={{ fontSize: 21, textAlign: 'right' }}>{getFullName(selectedUser)}</Typography>
                      <RoleChip role={selectedUser.role || 'participant'} />
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
                    <Typography color="text.secondary" sx={{ mt: 0.45, fontSize: 13.5, textAlign: 'right', wordBreak: 'break-word' }}>{selectedUser.email || 'No email provided'}</Typography>
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

            <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.6, md: 1.9 }, borderTop: '1px solid rgba(130, 92, 206, 0.08)' }}>
              <Stack spacing={1}>
                {compactDetails.map(([label, value]) => (
                  <Box key={label}>
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
