import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, updateEvent } from '../services/eventService';
import { getRegistrationsByEvent, removeRegistration } from '../services/registrationService';
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
import { heIL } from '@mui/x-data-grid/locales';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import { useAdminLocale } from '../context/AdminLocaleContext';
import CitySelect from '../../../shared/components/CitySelect';
import AdminPageHeader from '../components/AdminPageHeader';

const EVENT_CATEGORIES = [
  'Workshop',
  'Support Group',
  'Therapy Session',
  'Community Activity',
  'Awareness Event',
  'Other',
];

const CATEGORY_LABEL_KEYS = {
  Workshop: 'catWorkshop',
  'Support Group': 'catSupportGroup',
  'Therapy Session': 'catTherapySession',
  'Community Activity': 'catCommunityActivity',
  'Awareness Event': 'catAwarenessEvent',
  Other: 'catOther',
};

const EVENT_STATUSES = ['published', 'draft', 'cancelled'];

const STATUS_LABEL_KEYS = {
  published: 'evStatusPublished',
  draft: 'evStatusDraft',
  cancelled: 'evStatusCancelled',
};

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en-US' };

const HE_DATAGRID_LOCALE_TEXT = heIL.components.MuiDataGrid.defaultProps.localeText;

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
  const { t, lang, direction } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en-US';
  const categoryLabel = (cat) => (CATEGORY_LABEL_KEYS[cat] ? t(CATEGORY_LABEL_KEYS[cat]) : cat);
  const statusLabel = (s) => (STATUS_LABEL_KEYS[s] ? t(STATUS_LABEL_KEYS[s]) : s);

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
    if (!window.confirm(t('edConfirmRemove').replace('{name}', name))) return;
    try {
      await removeRegistration(regId, name, eventId);
      setRegistrations((prev) => prev.filter((r) => r.id !== regId));
    } catch (err) {
      console.error('Remove failed:', err);
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
    { field: 'participantName', headerName: t('edColName'), flex: 1, minWidth: 160 },
    { field: 'participantEmail', headerName: t('edColEmail'), flex: 1, minWidth: 200 },
    {
      field: 'registeredAt',
      headerName: t('edColRegDate'),
      width: 190,
      valueGetter: (value) => (value?.toDate ? value.toDate().toLocaleString(intlLocale) : '—'),
    },
    {
      field: 'status',
      headerName: t('edColStatus'),
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? statusLabel(params.value) : t('edRegistered')}
          size="small"
          color={params.value === 'cancelled' ? 'error' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions',
      headerName: t('edColActions'),
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleRemove(params.row.id, params.row.participantName)}
            title={t('edRemove')}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (eventLoading) return <Typography sx={{ p: 4 }}>{t('edLoading')}</Typography>;
  if (!event) return <Typography sx={{ p: 4 }}>{t('edNotFound')}</Typography>;

  return (
    <Box dir={direction}>
      <AdminPageHeader
        title={t('edDetailsTitle').replace('{title}', event.title)}
        actions={(
          <IconButton onClick={() => navigate('/admin/events')} size="small">
            <ArrowBackIcon />
          </IconButton>
        )}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={t('edTabGeneral')} />
          <Tab label={t('edTabParticipants').replace('{n}', registrations.length)} />
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
            label={t('edEventTitle')}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <TextField
            label={t('edCategory')}
            select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
          >
            {EVENT_CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>{categoryLabel(cat)}</MenuItem>
            ))}
          </TextField>
          <TextField
            helperText={t('edStartDateTime')}
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            required
            inputProps={{ dir: 'ltr' }}
          />
          <TextField
            helperText={t('edEndDateTime')}
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            inputProps={{ dir: 'ltr' }}
          />
          <TextField
            label={t('edInstructor')}
            value={form.instructor}
            onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
            placeholder={t('edInstructorPlaceholder')}
          />
          <CitySelect
            label={t('edLocation')}
            value={form.location}
            onChange={(city) => setForm((f) => ({ ...f, location: city }))}
            required
          />
          <TextField
            label={t('edMaxParticipants')}
            type="number"
            value={form.maxParticipants}
            onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))}
            inputProps={{ min: 1 }}
            required
          />
          <TextField
            label={t('edStatus')}
            select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {EVENT_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {statusLabel(s)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('edDescription')}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            multiline
            rows={4}
            required
          />
          <Box>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? t('edSaving') : t('edSaveChanges')}
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
            {t('edEmailAll')}
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
            localeText={lang === 'he' ? HE_DATAGRID_LOCALE_TEXT : undefined}
            sx={{ bgcolor: 'background.paper' }}
          />
        </Box>
      </TabPanel>
    </Box>
  );
}
