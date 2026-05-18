import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  getRegistrationsByEvent,
  addRegistration,
  removeRegistration,
} from '../services/registrationService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import { DataGrid } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';

export default function EventRegistrationsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ participantName: '', participantEmail: '', participantPhone: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventSnap, regs] = await Promise.all([
        getDoc(doc(db, 'events', eventId)),
        getRegistrationsByEvent(eventId),
      ]);
      if (eventSnap.exists()) {
        setEvent({ id: eventSnap.id, ...eventSnap.data() });
      }
      setRegistrations(regs);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await addRegistration({ eventId, ...form });
      setShowModal(false);
      setForm({ participantName: '', participantEmail: '', participantPhone: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add registration:', err);
    }
  }

  async function handleRemove(regId, name) {
    if (!window.confirm(`Remove "${name}" from this event?`)) return;
    try {
      await removeRegistration(regId, name, eventId);
      fetchData();
    } catch (err) {
      console.error('Failed to remove registration:', err);
    }
  }

  const registered = registrations.length;
  const capacity = event?.maxParticipants || 0;
  const progressPct = capacity > 0 ? Math.min((registered / capacity) * 100, 100) : 0;
  const isFull = capacity > 0 && registered >= capacity;

  const columns = [
    { field: 'participantName', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'participantEmail', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'participantPhone', headerName: 'Phone', width: 150 },
    {
      field: 'registeredAt',
      headerName: 'Registered',
      width: 180,
      valueGetter: (value) => (value?.toDate ? value.toDate().toLocaleString() : '—'),
    },
    {
      field: 'actions',
      headerName: '',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          color="error"
          onClick={() => handleRemove(params.row.id, params.row.participantName)}
          title="Remove registration"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <IconButton onClick={() => navigate('/admin/events')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {event?.title || 'Event'} — Registrations
        </Typography>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 3, display: 'inline-block' }} dir="ltr">
        Track and manage participant registrations for this event.
      </Typography>

      {/* Stats Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { sm: 'center' },
          gap: 3,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Registration Progress</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progressPct}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'rgba(0,0,0,0.06)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    bgcolor: isFull ? 'error.main' : 'primary.main',
                  },
                }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, minWidth: 80, textAlign: 'center' }}>
              {registered} / {capacity || '∞'}
            </Typography>
          </Box>
        </Box>

        <Chip
          label={isFull ? 'FULL' : 'Open'}
          color={isFull ? 'error' : 'success'}
          variant="filled"
          sx={{ fontWeight: 700, px: 1 }}
        />

        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setShowModal(true)}
          disabled={isFull}
        >
          Add Participant
        </Button>
      </Paper>

      {/* Registrations Table */}
      <Box sx={{ height: 400 }}>
        <DataGrid
          rows={registrations}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>

      {/* Add Participant Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAdd}>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
            <TextField
              label="Full Name"
              value={form.participantName}
              onChange={(e) => setForm((f) => ({ ...f, participantName: e.target.value }))}
              required
            />
            <TextField
              label="Email"
              type="email"
              value={form.participantEmail}
              onChange={(e) => setForm((f) => ({ ...f, participantEmail: e.target.value }))}
              required
            />
            <TextField
              label="Phone (optional)"
              value={form.participantPhone}
              onChange={(e) => setForm((f) => ({ ...f, participantPhone: e.target.value }))}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">Register</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
