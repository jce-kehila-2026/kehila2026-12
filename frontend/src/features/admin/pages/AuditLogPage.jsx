import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { DataGrid } from '@mui/x-data-grid';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminFilter, setAdminFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      let results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (adminFilter) {
        const lc = adminFilter.toLowerCase();
        results = results.filter(
          (l) => (l.adminEmail || '').toLowerCase().includes(lc) || (l.adminId || '').includes(lc)
        );
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        results = results.filter((l) => l.timestamp?.toDate && l.timestamp.toDate() >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        results = results.filter((l) => l.timestamp?.toDate && l.timestamp.toDate() <= to);
      }

      setLogs(results);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [adminFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, []);

  const actionColor = (type) => {
    if (type?.includes('DELETE')) return 'error';
    if (type?.includes('CREATE')) return 'success';
    if (type?.includes('IMPERSONATE')) return 'warning';
    return 'primary';
  };

  const columns = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      valueGetter: (value) => (value?.toDate ? value.toDate().toLocaleString() : '—'),
    },
    {
      field: 'adminEmail',
      headerName: 'Admin',
      flex: 1,
      minWidth: 180,
      valueGetter: (value, row) => value || row.adminId || '—',
    },
    {
      field: 'actionType',
      headerName: 'Action',
      width: 180,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={actionColor(params.value)} variant="outlined" />
      ),
    },
    {
      field: 'targetId',
      headerName: 'Target',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'details',
      headerName: 'Details',
      flex: 1,
      minWidth: 200,
      valueGetter: (value) => value?.description || JSON.stringify(value || {}).substring(0, 80),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Audit Log</Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5, display: 'inline-block' }} dir="ltr">
          Read-only view of all administrative actions. Logs are immutable.
        </Typography>
      </Box>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }} component="form" onSubmit={(e) => { e.preventDefault(); fetchLogs(); }}>
        <TextField
          placeholder="🔍 Filter by admin email…"
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value)}
          id="audit-admin-filter"
          sx={{ minWidth: 220 }}
        />
        <TextField
          type="date"
          helperText="From date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          id="audit-date-from"
          sx={{ minWidth: 150 }}
        />
        <TextField
          type="date"
          helperText="To date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          id="audit-date-to"
          sx={{ minWidth: 150 }}
        />
        <Button variant="contained" size="small" type="submit" sx={{ alignSelf: 'flex-end' }}>
          Apply Filters
        </Button>
      </Stack>

      <Box sx={{ height: 550 }}>
        <DataGrid
          rows={logs}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>
    </Box>
  );
}
