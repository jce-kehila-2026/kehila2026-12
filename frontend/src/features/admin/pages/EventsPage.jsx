import { useEffect, useState, useCallback } from 'react';
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '../services/eventService';
import { getRegistrationCounts } from '../services/registrationService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';

const EVENT_CATEGORIES = [
  'Workshop',
  'Support Group',
  'Therapy Session',
  'Community Activity',
  'Awareness Event',
  'Other',
];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const initialForm = {
    title: '',
    category: '',
    startTime: '',
    location: '',
    description: '',
    maxParticipants: '',
  };

  const [form, setForm] = useState(initialForm);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllEvents();
      setEvents(data);
      if (data.length) {
        const countsData = await getRegistrationCounts(data.map((e) => e.id));
        setCounts(countsData);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function formatTimestampForInput(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(d)) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  function openCreate() {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  }

  function openEdit(ev) {
    setEditing(ev);
    setForm({
      title: ev.title || '',
      category: ev.category || '',
      startTime: formatTimestampForInput(ev.startTime),
      location: ev.location || '',
      description: ev.description || '',
      maxParticipants: ev.maxParticipants || '',
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const dataToSave = {
        title: form.title,
        category: form.category,
        startTime: new Date(form.startTime),
        location: form.location,
        description: form.description,
        maxParticipants: Number(form.maxParticipants) || 0,
        status: 'published',
      };

      if (editing) {
        await updateEvent(editing.id, dataToSave);
      } else {
        await createEvent(dataToSave);
      }

      setShowModal(false);
      fetchEvents();
    } catch (err) {
      console.error('Save event failed:', err);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteEvent(id, title);
      fetchEvents();
    } catch (err) {
      console.error('Delete event failed:', err);
    }
  }

  const columns = [
    { field: 'title', headerName: 'Event Title', flex: 1, minWidth: 180 },
    { field: 'category', headerName: 'Category', width: 160 },
    {
      field: 'startTime',
      headerName: 'Start Time',
      width: 180,
      valueGetter: (value) => (value?.toDate ? value.toDate().toLocaleString() : '—'),
    },
    { field: 'location', headerName: 'Location', flex: 1, minWidth: 160 },
    { field: 'maxParticipants', headerName: 'Capacity', width: 100, align: 'center', headerAlign: 'center' },
    {
      field: 'registered',
      headerName: 'Registered',
      width: 110,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_value, row) => counts[row.id] ?? 0,
    },
    { field: 'status', headerName: 'Status', width: 110 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
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
          <Typography variant="h4">Events Management</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5, display: 'inline-block' }} dir="ltr">
            Create and manage platform events.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} id="btn-create-event">
          Add New Event
        </Button>
      </Box>

      <Box sx={{ height: 500 }}>
        <DataGrid
          rows={events}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>

      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>{editing ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
            <TextField
              label="Event Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <TextField
              label="Category"
              select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              required
            >
              {EVENT_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </TextField>
            <TextField
              helperText="Start Date & Time"
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              required
              inputProps={{ dir: 'ltr' }}
            />
            <TextField
              label="Location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              required
            />
            <TextField
              label="Max Participants (Capacity)"
              type="number"
              value={form.maxParticipants}
              onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))}
              inputProps={{ min: 1 }}
              required
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              multiline
              rows={4}
              required
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">{editing ? 'Save Changes' : 'Create Event'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
