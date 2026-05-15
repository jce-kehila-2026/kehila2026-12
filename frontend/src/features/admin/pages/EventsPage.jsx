import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents, createEvent, deleteEvent } from '../services/eventService';
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

const initialForm = {
  title: '',
  category: '',
  startTime: '',
  endTime: '',
  instructor: '',
  location: '',
  description: '',
  maxParticipants: '',
};

export default function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  function openCreate() {
    setForm(initialForm);
    setShowModal(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createEvent({
        title: form.title,
        category: form.category,
        startTime: new Date(form.startTime),
        endTime: form.endTime ? new Date(form.endTime) : null,
        instructor: form.instructor,
        location: form.location,
        description: form.description,
        maxParticipants: Number(form.maxParticipants) || 0,
        status: 'published',
      });
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      console.error('Create event failed:', err);
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
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/admin/events/${params.row.id}`)}
          >
            View
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleDelete(params.row.id, params.row.title)}
          >
            Delete
          </Button>
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
        <form onSubmit={handleCreate}>
          <DialogTitle>Add New Event</DialogTitle>
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
              helperText="End Date & Time (optional)"
              type="datetime-local"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              inputProps={{ dir: 'ltr' }}
            />
            <TextField
              label="Instructor / Therapist"
              value={form.instructor}
              onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
              placeholder="She-Na team"
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
            <Button type="submit" variant="contained">Create Event</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
