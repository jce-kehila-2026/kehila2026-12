import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, limit, orderBy, documentId } from 'firebase/firestore';
import { db } from '../../../firebase';
import { logAuditEvent } from '../services/auditService';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { DataGrid } from '@mui/x-data-grid';
import { heIL } from '@mui/x-data-grid/locales';
import { useAdminLocale } from '../context/AdminLocaleContext';
import AdminPageHeader from '../components/AdminPageHeader';

const ROLES = ['participant', 'admin'];

const ROLE_LABEL_KEYS = {
  participant: 'roleParticipant',
  admin: 'roleAdmin',
};

function normalizeUserRole(role) {
  return role === 'admin' ? 'admin' : 'participant';
}

const HE_DATAGRID_LOCALE_TEXT = heIL.components.MuiDataGrid.defaultProps.localeText;

export default function RoleManagementPage() {
  const { t, lang } = useAdminLocale();
  const roleLabel = (role) => t(ROLE_LABEL_KEYS[normalizeUserRole(role)] || 'roleParticipant');
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
    if (normalizeUserRole(user.role) === newRole) return;
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
      headerName: t('colUser'),
      flex: 1,
      minWidth: 160,
      valueGetter: (value) => value || t('rmNoName'),
    },
    { field: 'email', headerName: t('fieldEmail'), flex: 1, minWidth: 200 },
    {
      field: 'role',
      headerName: t('rmCurrentRole'),
      width: 150,
      renderCell: (params) => (
        <Chip
          label={roleLabel(params.value)}
          size="small"
          color={roleColor(normalizeUserRole(params.value))}
          variant="outlined"
        />
      ),
    },
    {
      field: 'changeRole',
      headerName: t('umChangeRole'),
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Select
          value={normalizeUserRole(params.row.role)}
          onChange={(e) => handleRoleChange(params.row, e.target.value)}
          disabled={saving === params.row.id}
          size="small"
          sx={{ minWidth: 140 }}
          id={`role-select-${params.row.id}`}
        >
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>{roleLabel(r)}</MenuItem>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <Box>
      <AdminPageHeader title={t('rmTitle')} subtitle={t('rmSubtitle')} />

      <Box sx={{ height: 500 }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          localeText={lang === 'he' ? HE_DATAGRID_LOCALE_TEXT : undefined}
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>
    </Box>
  );
}
