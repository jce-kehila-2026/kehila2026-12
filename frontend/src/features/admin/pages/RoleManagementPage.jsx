import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, limit, orderBy, documentId } from 'firebase/firestore';
import { db } from '../../../firebase';
import { logAuditEvent } from '../services/auditService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { DataGrid } from '@mui/x-data-grid';

const ROLES = ['participant', 'admin'];

export default function RoleManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(query(collection(db, 'users'), orderBy(documentId()), limit(100)));
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function handleRoleChange(user, newRole) {
    if (user.role === newRole) return;
    setSaving(user.id);
    try {
      const oldRole = user.role;
      await updateDoc(doc(db, 'users', user.id), { role: newRole });
      await logAuditEvent({
        actionType: 'ROLE_CHANGE',
        targetId: user.id,
        details: { before: oldRole, after: newRole, description: `Changed role from ${oldRole} to ${newRole}` },
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error('Role change failed:', err);
    } finally {
      setSaving(null);
    }
  }

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
      headerName: 'Current Role',
      width: 150,
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
      field: 'changeRole',
      headerName: 'Change Role',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Select
          value={params.row.role || 'participant'}
          onChange={(e) => handleRoleChange(params.row, e.target.value)}
          disabled={saving === params.row.id}
          size="small"
          sx={{ minWidth: 140 }}
          id={`role-select-${params.row.id}`}
        >
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>{r.replace('_', ' ')}</MenuItem>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Role Management</Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Change user permissions. All changes are logged in Admin Changes.
        </Typography>
      </Box>

      <Box sx={{ height: 500 }}>
        <DataGrid
          rows={users}
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
