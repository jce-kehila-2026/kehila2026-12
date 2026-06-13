import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, updateEvent } from '../services/eventService';
import { getRegistrationsByEvent, removeRegistration, checkInRegistration } from '../services/registrationService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import { DataGrid } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';

const EVENT_CATEGORIES = [
  'Workshop',
  'Support Group',
  'Therapy Session',
  'Community Activity',
  'Awareness Event',
  'Other',
];

const EVENT_STATUSES = ['published', 'draft', 'cancelled'];

function formatTimestampForInput(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d)) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    title: '',
    category: '',
    startTime: '',
    endTime: '',
    instructor: '',
    location: '',
    description: '',
    maxParticipants: '',
    status: 'published',
  });
  const [saving, setSaving] = useState(false);

  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      const ev = await getEventById(eventId);
      setEvent(ev);
      if (ev) {
        setForm({
          title: ev.title || '',
          category: ev.category || '',
          startTime: formatTimestampForInput(ev.startTime),
          endTime: formatTimestampForInput(ev.endTime),
          instructor: ev.instructor || ev.therapist || ev.facilitator || '',
          location: ev.location || '',
          description: ev.description || '',
          maxParticipants: ev.maxParticipants || '',
          status: ev.status || 'published',
        });
      }
      setEventLoading(false);
    }
    loadEvent();
  }, [eventId]);

  const fetchRegistrations = useCallback(async () => {
    setRegsLoading(true);
    try {
      const data = await getRegistrationsByEvent(eventId);
      setRegistrations(data);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    } finally {
      setRegsLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateEvent(eventId, {
        title: form.title,
        category: form.category,
        startTime: new Date(form.startTime),
        endTime: form.endTime ? new Date(form.endTime) : null,
        instructor: form.instructor,
        location: form.location,
        description: form.description,
        maxParticipants: Number(form.maxParticipants) || 0,
        status: form.status,
      });
      setEvent((prev) => ({ ...prev, title: form.title }));
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(regId, name) {
    if (!window.confirm(`Remove "${name}" from this event?`)) return;
    try {
      await removeRegistration(regId, name, eventId);
      setRegistrations((prev) => prev.filter((r) => r.id !== regId));
    } catch (err) {
      console.error('Remove failed:', err);
    }
  }

  async function handleCheckIn(regId) {
    try {
      await checkInRegistration(regId, eventId);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, checkedIn: true } : r))
      );
    } catch (err) {
      console.error('Check-in failed:', err);
    }
  }

  function handleEmailAll() {
    const emails = registrations
      .map((r) => r.participantEmail)
      .filter(Boolean)
      .join(',');
    window.location.href = `mailto:${emails}`;
  }

  const columns = [
    { field: 'participantName', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'participantEmail', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'registeredAt',
      headerName: 'Registration Date',
      width: 190,
      valueGetter: (value) => (value?.toDate ? value.toDate().toLocaleString() : '—'),
    },
    {
      field: 'checkedIn',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Checked In' : 'Registered'}
          size="small"
          color={params.value ? 'success' : 'default'}
          variant={params.value ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <IconButton
            size="small"
            color="success"
            disabled={Boolean(params.row.checkedIn)}
            onClick={() => handleCheckIn(params.row.id)}
            title="Check in"
          >
            <CheckCircleIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleRemove(params.row.id, params.row.participantName)}
            title="Remove"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (eventLoading) return <Typography sx={{ p: 4 }}>Loading…</Typography>;
  if (!event) return <Typography sx={{ p: 4 }}>Event not found.</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', mb: 1 }}>
        <IconButton onClick={() => navigate('/admin/events')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Details: {event.title}</Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="General Information" />
          <Tab label={`Registered Participants (${registrations.length})`} />
        </Tabs>
      </Box>

      {/* Tab 1 — General Information */}
      <TabPanel value={tab} index={0}>
        <Box
          component="form"
          onSubmit={handleSave}
          sx={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
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
            label="Status"
            select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {EVENT_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            multiline
            rows={4}
            required
          />
          <Box>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </TabPanel>

      {/* Tab 2 — Registered Participants */}
      <TabPanel value={tab} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            disabled={registrations.length === 0}
            onClick={handleEmailAll}
            sx={{
              bgcolor: '#E91E63',
              '&:hover': { bgcolor: '#C2185B' },
              '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.12)' },
            }}
          >
            Email All
          </Button>
        </Box>
        <Box sx={{ height: 450 }}>
          <DataGrid
            rows={registrations}
            columns={columns}
            loading={regsLoading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            sx={{ bgcolor: 'background.paper' }}
          />
        </Box>
      </TabPanel>
    </Box>
  );
}
