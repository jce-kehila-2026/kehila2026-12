import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getAllAppointments, createAppointment, updateAppointment, deleteAppointment,
  getAvailabilitySettings, saveAvailabilitySettings,
  getAppointmentTypes, saveAppointmentTypes,
  getBlockoutDates, saveBlockoutDates,
} from '../services/appointmentService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SaveIcon from '@mui/icons-material/Save';

// ─── Constants ────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:   { color: 'warning', bg: 'rgba(255,152,0,0.10)'  },
  approved:  { color: 'primary', bg: 'rgba(33,150,243,0.10)' },
  completed: { color: 'success', bg: 'rgba(76,175,80,0.10)'  },
  cancelled: { color: 'default', bg: 'rgba(0,0,0,0.05)'      },
  'no-show': { color: 'error',   bg: 'rgba(244,67,54,0.10)'  },
};

const STATUS_BORDER = {
  pending:   '#FF9800',
  approved:  '#2196F3',
  completed: '#4CAF50',
  cancelled: '#aaa',
  'no-show': '#F44336',
};

const APPOINTMENT_STATUSES = ['pending', 'approved', 'completed', 'cancelled', 'no-show'];
const DEFAULT_TYPES = ['Initial Intake', 'General Support', 'Follow-up', 'Crisis Support', 'Group Session'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_HOURS = Object.fromEntries(
  DAY_NAMES.map((d) => [d, { enabled: d !== 'Saturday' && d !== 'Sunday', start: '09:00', end: '17:00' }])
);
const EMPTY_FORM = {
  participantName: '', participantEmail: '', providerName: '',
  date: '', time: '', type: '', status: 'pending', notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const days  = [];
  for (let i = 0; i < first.getDay(); i++) {
    days.push({ date: new Date(year, month, 1 - (first.getDay() - i)), current: false });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: new Date(year, month, d), current: true });
  }
  let next = 1;
  while (days.length < 42) {
    days.push({ date: new Date(year, month + 1, next++), current: false });
  }
  return days;
}

function buildWeekDays(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// ─── StatusChip ───────────────────────────────────────────────

function StatusChip({ status }) {
  return (
    <Chip
      label={status}
      size="small"
      color={STATUS_CONFIG[status]?.color || 'default'}
      variant="outlined"
      sx={{ textTransform: 'capitalize' }}
    />
  );
}

// ─── Appointment Modal ────────────────────────────────────────

function AppointmentModal({ open, onClose, onSave, initialData, savedTypes }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
  }, [initialData, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  const f = (key) => ({ value: form[key], onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })) });
  const types = savedTypes?.length ? savedTypes.map((t) => t.name) : DEFAULT_TYPES;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ dir: 'ltr' }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initialData ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="Participant Name" {...f('participantName')} required />
          <TextField label="Participant Email" type="email" {...f('participantEmail')} />
          <TextField label="Provider / Counselor" {...f('providerName')} required />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              helperText="Date" type="date" {...f('date')} required
              inputProps={{ dir: 'ltr' }}
            />
            <TextField
              helperText="Time" type="time" {...f('time')} required
              inputProps={{ dir: 'ltr' }}
            />
          </Box>
          <TextField label="Type" select {...f('type')} required>
            {types.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="Status" select {...f('status')}>
            {APPOINTMENT_STATUSES.map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
            ))}
          </TextField>
          <TextField label="Notes" multiline rows={3} {...f('notes')} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}
            sx={{ bgcolor: '#E91E63', '&:hover': { bgcolor: '#C2185B' } }}>
            {saving ? 'Saving…' : initialData ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ─── Tab 1: Appointments List ─────────────────────────────────

function AppointmentsList({ appointments, loading, onRefresh, savedTypes }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => appointments.filter((a) => {
    const matchSearch = !search || (a.participantName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  }), [appointments, search, statusFilter]);

  async function handleApprove(id) {
    try {
      await updateAppointment(id, { status: 'approved' });
      onRefresh();
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this appointment? This cannot be undone.')) return;
    try {
      await deleteAppointment(id);
      onRefresh();
    } catch (err) { console.error(err); }
  }

  async function handleSave(form) {
    if (editing) {
      await updateAppointment(editing.id, form);
    } else {
      await createAppointment(form);
    }
    setShowModal(false);
    setEditing(null);
    onRefresh();
  }

  const columns = [
    { field: 'participantName', headerName: 'Participant', flex: 1, minWidth: 150 },
    { field: 'providerName', headerName: 'Provider', flex: 1, minWidth: 140 },
    { field: 'date', headerName: 'Date', width: 115 },
    { field: 'time', headerName: 'Time', width: 85 },
    { field: 'type', headerName: 'Type', width: 150 },
    {
      field: 'status', headerName: 'Status', width: 125,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: 'actions', headerName: 'Actions', width: 120,
      sortable: false, filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>
          {params.row.status === 'pending' && (
            <IconButton size="small" color="success" onClick={() => handleApprove(params.row.id)} title="Approve">
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" color="primary" onClick={() => { setEditing(params.row); setShowModal(true); }} title="Edit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)} title="Delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ pt: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search participant…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>
            ),
          }}
        />
        <TextField
          select size="small" label="Filter by status"
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          {APPOINTMENT_STATUSES.map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained" startIcon={<AddIcon />}
          onClick={() => { setEditing(null); setShowModal(true); }}
          sx={{ ml: 'auto', bgcolor: '#E91E63', '&:hover': { bgcolor: '#C2185B' } }}
        >
          New Appointment
        </Button>
      </Box>

      <Box sx={{ height: 500 }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          slots={{
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No appointments found.</Typography>
              </Box>
            ),
          }}
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>

      <AppointmentModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={handleSave}
        initialData={editing}
        savedTypes={savedTypes}
      />
    </Box>
  );
}

// ─── Tab 2: Calendar View ─────────────────────────────────────

function CalendarView({ appointments }) {
  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const todayKey = dateKey(new Date());

  const apptMap = useMemo(() => {
    const map = {};
    appointments.forEach((a) => {
      if (a.date) {
        if (!map[a.date]) map[a.date] = [];
        map[a.date].push(a);
      }
    });
    return map;
  }, [appointments]);

  function nav(dir) {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  }

  function periodLabel() {
    if (viewMode === 'month') return currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });
    if (viewMode === 'week') {
      const w = buildWeekDays(currentDate);
      const s = w[0].toLocaleDateString('en', { month: 'short', day: 'numeric' });
      const e = w[6].toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${s} – ${e}`;
    }
    return currentDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  const selectedDayAppts = (apptMap[dateKey(selectedDate)] || [])
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  return (
    <Box sx={{ pt: 3 }}>
      {/* Controls bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['month', 'week', 'day'].map((v) => (
            <Button key={v} size="small"
              variant={viewMode === v ? 'contained' : 'outlined'}
              onClick={() => setViewMode(v)}
              sx={viewMode === v ? { bgcolor: '#E91E63', '&:hover': { bgcolor: '#C2185B' } } : {}}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => nav(-1)}><ChevronLeftIcon /></IconButton>
          <Typography variant="subtitle1" fontWeight={600} sx={{ minWidth: 230, textAlign: 'center' }}>
            {periodLabel()}
          </Typography>
          <IconButton size="small" onClick={() => nav(1)}><ChevronRightIcon /></IconButton>
          <Button size="small" variant="outlined" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </Box>
      </Box>

      {/* ── Month View ── */}
      {viewMode === 'month' && (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
            {WEEKDAYS.map((d) => (
              <Typography key={d} variant="caption" fontWeight={700} textAlign="center" color="text.secondary" sx={{ py: 0.5 }}>
                {d}
              </Typography>
            ))}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {buildMonthDays(currentDate.getFullYear(), currentDate.getMonth()).map(({ date, current }, i) => {
              const key = dateKey(date);
              const appts = apptMap[key] || [];
              const isToday = key === todayKey;
              const isSelected = dateKey(selectedDate) === key;
              return (
                <Box
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  sx={{
                    minHeight: 88,
                    p: 0.5,
                    border: '1px solid',
                    borderColor: isSelected ? '#E91E63' : 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    bgcolor: current ? 'background.paper' : 'rgba(0,0,0,0.018)',
                    transition: 'background 0.12s',
                    '&:hover': { bgcolor: 'rgba(233,30,99,0.04)' },
                  }}
                >
                  <Box sx={{
                    width: 24, height: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: isToday ? '#E91E63' : 'transparent',
                    mx: 'auto', mb: 0.25,
                  }}>
                    <Typography variant="caption" fontWeight={isToday ? 700 : current ? 400 : 300}
                      color={isToday ? '#fff' : current ? 'text.primary' : 'text.disabled'}>
                      {date.getDate()}
                    </Typography>
                  </Box>
                  {appts.slice(0, 2).map((a) => (
                    <Box key={a.id} sx={{
                      px: 0.5, py: '1px', mb: '2px',
                      bgcolor: STATUS_CONFIG[a.status]?.bg || 'rgba(0,0,0,0.06)',
                      borderRadius: 0.5,
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>
                      <Typography sx={{ fontSize: '0.64rem', lineHeight: 1.3 }}>
                        {a.time} {a.participantName}
                      </Typography>
                    </Box>
                  ))}
                  {appts.length > 2 && (
                    <Typography sx={{ fontSize: '0.64rem', color: '#E91E63', display: 'block' }}>
                      +{appts.length - 2} more
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Selected day detail panel */}
          <Paper variant="outlined" sx={{ mt: 2.5, p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Typography>
            {selectedDayAppts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No appointments scheduled for this day.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedDayAppts.map((a) => (
                  <Box key={a.id} sx={{
                    display: 'flex', gap: 2, alignItems: 'center',
                    p: 1.5, bgcolor: STATUS_CONFIG[a.status]?.bg || 'rgba(0,0,0,0.04)', borderRadius: 1.5,
                  }}>
                    <Typography variant="body2" fontWeight={700} color="primary" sx={{ minWidth: 50 }}>{a.time}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{a.participantName}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.type} · {a.providerName}</Typography>
                    </Box>
                    <StatusChip status={a.status} />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* ── Week View ── */}
      {viewMode === 'week' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {buildWeekDays(currentDate).map((date) => {
            const key = dateKey(date);
            const appts = (apptMap[key] || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
            const isToday = key === todayKey;
            return (
              <Box key={key}>
                <Box sx={{
                  textAlign: 'center', pb: 1, mb: 1,
                  borderBottom: '2px solid',
                  borderColor: isToday ? '#E91E63' : 'divider',
                }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {WEEKDAYS[date.getDay()]}
                  </Typography>
                  <Typography variant="h6" sx={{ color: isToday ? '#E91E63' : 'text.primary', fontWeight: isToday ? 700 : 400, lineHeight: 1.2 }}>
                    {date.getDate()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minHeight: 180 }}>
                  {appts.length === 0
                    ? <Typography variant="caption" color="text.disabled" textAlign="center">—</Typography>
                    : appts.map((a) => (
                      <Box key={a.id} sx={{
                        p: 0.75,
                        bgcolor: STATUS_CONFIG[a.status]?.bg || 'rgba(0,0,0,0.06)',
                        borderRadius: 1,
                        borderLeft: `3px solid ${STATUS_BORDER[a.status] || '#ccc'}`,
                      }}>
                        <Typography variant="caption" display="block" fontWeight={700}>{a.time}</Typography>
                        <Typography variant="caption" display="block" noWrap>{a.participantName}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary" noWrap>{a.type}</Typography>
                      </Box>
                    ))
                  }
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Day View ── */}
      {viewMode === 'day' && (
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5 }}>
            {currentDate.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
          {!(apptMap[dateKey(currentDate)]?.length) ? (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No appointments scheduled for this day.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {(apptMap[dateKey(currentDate)] || [])
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                .map((a) => (
                  <Paper key={a.id} variant="outlined" sx={{
                    p: 2, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 2,
                    borderLeft: `4px solid ${STATUS_BORDER[a.status] || '#ccc'}`,
                  }}>
                    <Typography fontWeight={700} color="primary" sx={{ minWidth: 60 }}>{a.time}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={600}>{a.participantName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {a.type} · Provider: {a.providerName}
                      </Typography>
                      {a.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {a.notes}
                        </Typography>
                      )}
                    </Box>
                    <StatusChip status={a.status} />
                  </Paper>
                ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Tab 3: Availability & Settings ──────────────────────────

function AvailabilitySettings() {
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [types, setTypes] = useState([]);
  const [newType, setNewType] = useState('');
  const [blockouts, setBlockouts] = useState([]);
  const [newBlockout, setNewBlockout] = useState({ date: '', reason: '' });
  const [saving, setSaving] = useState({ hours: false, types: false, blockouts: false });

  useEffect(() => {
    async function load() {
      try {
        const [avail, aptTypes, bouts] = await Promise.all([
          getAvailabilitySettings(),
          getAppointmentTypes(),
          getBlockoutDates(),
        ]);
        if (avail?.hours) setHours(avail.hours);
        if (aptTypes?.types) setTypes(aptTypes.types);
        if (bouts?.dates) setBlockouts(bouts.dates);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    load();
  }, []);

  const set = (key, bool) => setSaving((s) => ({ ...s, [key]: bool }));

  async function saveHours() {
    set('hours', true);
    try { await saveAvailabilitySettings({ hours }); } finally { set('hours', false); }
  }
  async function saveTypes() {
    set('types', true);
    try { await saveAppointmentTypes({ types }); } finally { set('types', false); }
  }
  async function saveBlockoutsData() {
    set('blockouts', true);
    try { await saveBlockoutDates({ dates: blockouts }); } finally { set('blockouts', false); }
  }

  function addType() {
    const name = newType.trim();
    if (!name || types.some((t) => t.name === name)) return;
    setTypes((prev) => [...prev, { id: Date.now().toString(), name }]);
    setNewType('');
  }

  function addBlockout() {
    if (!newBlockout.date) return;
    setBlockouts((prev) => [...prev, { id: Date.now().toString(), ...newBlockout }]);
    setNewBlockout({ date: '', reason: '' });
  }

  const saveBtn = (key, fn) => (
    <Button size="small" variant="contained" startIcon={<SaveIcon />}
      onClick={fn} disabled={saving[key]}
      sx={{ bgcolor: '#E91E63', '&:hover': { bgcolor: '#C2185B' } }}>
      {saving[key] ? 'Saving…' : 'Save'}
    </Button>
  );

  return (
    <Box sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Bookable Hours */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6">Bookable Hours</Typography>
          {saveBtn('hours', saveHours)}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {DAY_NAMES.map((day) => (
            <Box key={day} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel sx={{ minWidth: 150, m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={hours[day]?.enabled || false}
                    onChange={(e) => setHours((h) => ({ ...h, [day]: { ...h[day], enabled: e.target.checked } }))}
                  />
                }
                label={<Typography variant="body2" fontWeight={600} sx={{ ml: 0.5 }}>{day}</Typography>}
              />
              <TextField type="time" size="small" helperText="From"
                disabled={!hours[day]?.enabled}
                value={hours[day]?.start || '09:00'}
                onChange={(e) => setHours((h) => ({ ...h, [day]: { ...h[day], start: e.target.value } }))}
                inputProps={{ dir: 'ltr' }} sx={{ width: 130 }}
              />
              <Typography color="text.secondary">–</Typography>
              <TextField type="time" size="small" helperText="To"
                disabled={!hours[day]?.enabled}
                value={hours[day]?.end || '17:00'}
                onChange={(e) => setHours((h) => ({ ...h, [day]: { ...h[day], end: e.target.value } }))}
                inputProps={{ dir: 'ltr' }} sx={{ width: 130 }}
              />
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Appointment Types */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Appointment Types</Typography>
          {saveBtn('types', saveTypes)}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField size="small" placeholder="New type name…"
            value={newType} onChange={(e) => setNewType(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addType()}
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" onClick={addType}>Add</Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {types.length === 0
            ? <Typography variant="body2" color="text.secondary">No custom types saved — using defaults.</Typography>
            : types.map((t) => (
              <Chip key={t.id} label={t.name} variant="outlined"
                onDelete={() => setTypes((prev) => prev.filter((x) => x.id !== t.id))}
              />
            ))
          }
        </Box>
      </Paper>

      {/* Block-out Dates */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Block-out Dates</Typography>
          {saveBtn('blockouts', saveBlockoutsData)}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <TextField type="date" size="small" helperText="Date"
            value={newBlockout.date}
            onChange={(e) => setNewBlockout((b) => ({ ...b, date: e.target.value }))}
            inputProps={{ dir: 'ltr' }} sx={{ width: 165 }}
          />
          <TextField size="small" placeholder="Reason (optional)"
            value={newBlockout.reason}
            onChange={(e) => setNewBlockout((b) => ({ ...b, reason: e.target.value }))}
            sx={{ flex: 1, minWidth: 160 }}
          />
          <Button variant="outlined" onClick={addBlockout}>Block</Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {blockouts.length === 0
            ? <Typography variant="body2" color="text.secondary">No block-out dates configured.</Typography>
            : [...blockouts]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((b) => (
                <Box key={b.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1.5, bgcolor: 'rgba(244,67,54,0.06)', borderRadius: 1.5,
                }}>
                  <Typography variant="body2" fontWeight={700} sx={{ minWidth: 110 }}>{b.date}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{b.reason || '—'}</Typography>
                  <IconButton size="small" color="error"
                    onClick={() => setBlockouts((prev) => prev.filter((x) => x.id !== b.id))}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))
          }
        </Box>
      </Paper>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function AppointmentsPage() {
  const [tab, setTab] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedTypes, setSavedTypes] = useState([]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    getAppointmentTypes()
      .then((res) => { if (res?.types) setSavedTypes(res.types); })
      .catch(() => {});
  }, [fetchAppointments]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Appointments</Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Manage bookings, view the schedule, and configure availability.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Appointments List" />
          <Tab label="Calendar View" />
          <Tab label="Availability & Settings" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <AppointmentsList
          appointments={appointments}
          loading={loading}
          onRefresh={fetchAppointments}
          savedTypes={savedTypes}
        />
      )}
      {tab === 1 && <CalendarView appointments={appointments} />}
      {tab === 2 && <AvailabilitySettings />}
    </Box>
  );
}
