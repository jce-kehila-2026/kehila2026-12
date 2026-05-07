import { useEffect, useState, useCallback } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { logAuditEvent } from '../services/auditService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import GroupsIcon from '@mui/icons-material/Groups';
import BusinessIcon from '@mui/icons-material/Business';

const TABS = [
  { key: 'articles', label: 'Articles', icon: <NewspaperIcon /> },
  { key: 'team_profiles', label: 'Team Profiles', icon: <GroupsIcon /> },
  { key: 'org_info', label: 'Organization Info', icon: <BusinessIcon /> },
];

export default function CMSPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const activeTab = TABS[tabIndex].key;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, activeTab));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('CMS fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function openCreate() {
    setEditing(null);
    setForm({ title: '', content: '' });
    setShowModal(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({ title: item.title || '', content: item.content || '' });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editing) {
        await updateDoc(doc(db, activeTab, editing.id), { ...form, updatedAt: serverTimestamp() });
        await logAuditEvent({ actionType: `UPDATE_${activeTab.toUpperCase()}`, targetId: editing.id, details: { after: form } });
      } else {
        const ref = await addDoc(collection(db, activeTab), { ...form, createdAt: serverTimestamp() });
        await logAuditEvent({ actionType: `CREATE_${activeTab.toUpperCase()}`, targetId: ref.id, details: { after: form } });
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error('CMS save failed:', err);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, activeTab, id));
      await logAuditEvent({ actionType: `DELETE_${activeTab.toUpperCase()}`, targetId: id, details: { deleted: title } });
      fetchItems();
    } catch (err) {
      console.error('CMS delete failed:', err);
    }
  }

  const columns = [
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
    {
      field: 'content',
      headerName: 'Preview',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {(params.value || '').substring(0, 100)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => openEdit(params.row)}>Edit</Button>
          <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(params.row.id, params.row.title)}>Delete</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Content Management</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>Manage articles, team profiles, and organization information.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} id="btn-create-cms">
          New Entry
        </Button>
      </Box>

      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map((tab) => (
          <Tab key={tab.key} label={tab.label} icon={tab.icon} iconPosition="start" />
        ))}
      </Tabs>

      <Box sx={{ height: 450 }}>
        <DataGrid
          rows={items}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>

      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>{editing ? 'Edit Entry' : 'New Entry'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required id="cms-title" />
            <TextField label="Content" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} multiline rows={6} id="cms-content" />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editing ? 'Save' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
