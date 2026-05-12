import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { DataGrid } from '@mui/x-data-grid';
import PreviewIcon from '@mui/icons-material/Preview';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (u.email || '').toLowerCase().includes(q) || (u.displayName || '').toLowerCase().includes(q);
  });

  const roleColor = (role) => {
    const map = { admin: 'primary', participant: 'info' };
    return map[role] || 'default';
  };

  const columns = [
    {
      field: 'displayName',
      headerName: 'User',
      flex: 1,
      minWidth: 160,
      valueGetter: (value) => value || '(No name)',
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Role',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={(params.value || 'participant').replace('_', ' ')}
          size="small"
          color={roleColor(params.value)}
          variant="outlined"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 140,
      valueGetter: (value) => (value?.toDate ? value.toDate().toLocaleDateString() : '—'),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4">User Management</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>View registered users and event participants.</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={() => navigate('/home')}
        >
          Preview Participant View
        </Button>
      </Box>

      <TextField
        placeholder="🔍 Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        id="user-search"
        sx={{ mb: 2.5, maxWidth: 400 }}
      />

      <Box sx={{ height: 500 }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>
    </Box>
  );
}
