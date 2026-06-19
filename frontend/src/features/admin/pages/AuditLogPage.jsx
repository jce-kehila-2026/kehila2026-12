import { useEffect, useMemo, useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import EventIcon from '@mui/icons-material/Event';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { db } from '../../../firebase';
import { useAdminLocale } from '../context/AdminLocaleContext';

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en' };

const ACTIVITY_FILTERS = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'event', labelKey: 'filterEvents' },
  { value: 'booking', labelKey: 'filterBookings' },
  { value: 'public', labelKey: 'filterPublicHome' },
  { value: 'user', labelKey: 'filterUsersRoles' },
  { value: 'settings', labelKey: 'filterSettings' },
  { value: 'community', labelKey: 'filterCommunity' },
];

const ACTION_LABELS = {
  UPDATE_EVENT: 'Updated event',
  CREATE_EVENT: 'Created event',
  DELETE_EVENT: 'Deleted event',
  ADD_REGISTRATION: 'Added registration',
  REMOVE_REGISTRATION: 'Removed registration',
  UPDATE_BOOKING: 'Updated booking',
  CHECK_IN_PARTICIPANT: 'Checked in participant',
  UPDATE_PUBLIC_HOME: 'Updated public home page',
  UPDATE_PUBLIC_HOME_CONTACT: 'Updated contact section',
  UPDATE_PUBLIC_HOME_HERO: 'Updated home hero',
  UPDATE_PUBLIC_HOME_PARTNER: 'Updated partner',
  CREATE_PUBLIC_HOME_PARTNER: 'Created partner',
  DELETE_PUBLIC_HOME_PARTNER: 'Deleted partner',
  UPDATE_PUBLIC_HOME_PRESS_COVERAGE: 'Updated press coverage',
  CREATE_PUBLIC_HOME_PRESS_COVERAGE: 'Created press coverage',
  DELETE_PUBLIC_HOME_PRESS_COVERAGE: 'Deleted press coverage',
  UPDATE_PUBLIC_HOME_LEARN_TOGETHER_HEADER: 'Updated learn together header',
  UPDATE_PUBLIC_HOME_LEARN_TOGETHER_CARD: 'Updated learn together card',
  CREATE_PUBLIC_HOME_LEARN_TOGETHER_CARD: 'Created learn together card',
  DELETE_PUBLIC_HOME_LEARN_TOGETHER_CARD: 'Deleted learn together card',
  REORDER_PUBLIC_HOME_LEARN_TOGETHER_CARDS: 'Reordered learn together cards',
  UPDATE_PUBLIC_HOME_INSPIRATION_STORY: 'Updated inspiration story',
  CREATE_PUBLIC_HOME_INSPIRATION_STORY: 'Created inspiration story',
  DELETE_PUBLIC_HOME_INSPIRATION_STORY: 'Deleted inspiration story',
  UPDATE_PUBLIC_HOME_TEAM_MEMBER: 'Updated team member',
  CREATE_PUBLIC_HOME_TEAM_MEMBER: 'Created team member',
  DELETE_PUBLIC_HOME_TEAM_MEMBER: 'Deleted team member',
  REORDER_PUBLIC_HOME_TEAM_MEMBERS: 'Reordered team members',
  ROLE_CHANGE: 'Changed user role',
  JOIN_REQUEST_APPROVED: 'Approved join request',
  JOIN_REQUEST_REJECTED: 'Rejected join request',
  HIDE_COMMUNITY_POST: 'Hid community post',
  RESTORE_COMMUNITY_POST: 'Restored community post',
  DELETE_COMMUNITY_POST: 'Deleted community post',
  DISMISS_REPORTS: 'Dismissed reports',
  UPDATE_COMMUNITY_GUIDELINES: 'Updated community guidelines',
  IMPERSONATE_START: 'Started participant preview',
};

// Hebrew labels for the (bounded) set of known action types. Picked by locale in
// getActionLabel; unknown actions fall back to the humanized English form.
const ACTION_LABELS_HE = {
  UPDATE_EVENT: 'עודכן אירוע',
  CREATE_EVENT: 'נוצר אירוע',
  DELETE_EVENT: 'נמחק אירוע',
  ADD_REGISTRATION: 'נוספה הרשמה',
  REMOVE_REGISTRATION: 'הוסרה הרשמה',
  UPDATE_BOOKING: 'עודכנה הזמנה',
  CHECK_IN_PARTICIPANT: 'בוצע צ\'ק-אין למשתתפת',
  UPDATE_PUBLIC_HOME: 'עודכן דף הבית הציבורי',
  UPDATE_PUBLIC_HOME_CONTACT: 'עודכן אזור יצירת הקשר',
  UPDATE_PUBLIC_HOME_HERO: 'עודכן אזור הכותרת',
  UPDATE_PUBLIC_HOME_PARTNER: 'עודכן שותף',
  CREATE_PUBLIC_HOME_PARTNER: 'נוצר שותף',
  DELETE_PUBLIC_HOME_PARTNER: 'נמחק שותף',
  UPDATE_PUBLIC_HOME_PRESS_COVERAGE: 'עודכן סיקור תקשורתי',
  CREATE_PUBLIC_HOME_PRESS_COVERAGE: 'נוצר סיקור תקשורתי',
  DELETE_PUBLIC_HOME_PRESS_COVERAGE: 'נמחק סיקור תקשורתי',
  UPDATE_PUBLIC_HOME_LEARN_TOGETHER_HEADER: 'עודכנה כותרת "ללמוד יחד"',
  UPDATE_PUBLIC_HOME_LEARN_TOGETHER_CARD: 'עודכן כרטיס "ללמוד יחד"',
  CREATE_PUBLIC_HOME_LEARN_TOGETHER_CARD: 'נוצר כרטיס "ללמוד יחד"',
  DELETE_PUBLIC_HOME_LEARN_TOGETHER_CARD: 'נמחק כרטיס "ללמוד יחד"',
  REORDER_PUBLIC_HOME_LEARN_TOGETHER_CARDS: 'סודרו מחדש כרטיסי "ללמוד יחד"',
  UPDATE_PUBLIC_HOME_INSPIRATION_STORY: 'עודכן סיפור השראה',
  CREATE_PUBLIC_HOME_INSPIRATION_STORY: 'נוצר סיפור השראה',
  DELETE_PUBLIC_HOME_INSPIRATION_STORY: 'נמחק סיפור השראה',
  UPDATE_PUBLIC_HOME_TEAM_MEMBER: 'עודכנה חברת צוות',
  CREATE_PUBLIC_HOME_TEAM_MEMBER: 'נוצרה חברת צוות',
  DELETE_PUBLIC_HOME_TEAM_MEMBER: 'נמחקה חברת צוות',
  REORDER_PUBLIC_HOME_TEAM_MEMBERS: 'סודרו מחדש חברות הצוות',
  ROLE_CHANGE: 'שונה תפקיד משתמשת',
  JOIN_REQUEST_APPROVED: 'אושרה בקשת הצטרפות',
  JOIN_REQUEST_REJECTED: 'נדחתה בקשת הצטרפות',
  HIDE_COMMUNITY_POST: 'הוסתר פוסט בקהילה',
  RESTORE_COMMUNITY_POST: 'שוחזר פוסט בקהילה',
  DELETE_COMMUNITY_POST: 'נמחק פוסט בקהילה',
  DISMISS_REPORTS: 'נדחו דיווחים',
  UPDATE_COMMUNITY_GUIDELINES: 'עודכנו כללי הקהילה',
  IMPERSONATE_START: 'התחילה תצוגת משתתפת',
};

const AREA_CONFIG = {
  event: {
    labelKey: 'areaEvent',
    icon: EventIcon,
    color: '#6d35b8',
    background: 'rgba(109, 53, 184, 0.12)',
  },
  booking: {
    labelKey: 'areaBooking',
    icon: ReceiptLongIcon,
    color: '#d94682',
    background: 'rgba(224, 82, 151, 0.13)',
  },
  public: {
    labelKey: 'areaPublic',
    icon: HomeWorkOutlinedIcon,
    color: '#7c3aed',
    background: 'rgba(167, 139, 250, 0.16)',
  },
  user: {
    labelKey: 'areaUser',
    icon: PersonIcon,
    color: '#21835a',
    background: 'rgba(134, 209, 124, 0.22)',
  },
  community: {
    labelKey: 'areaCommunity',
    icon: PersonIcon,
    color: '#0f766e',
    background: 'rgba(45, 212, 191, 0.16)',
  },
  settings: {
    labelKey: 'areaSettings',
    icon: SettingsOutlinedIcon,
    color: '#f97316',
    background: 'rgba(253, 186, 116, 0.2)',
  },
  general: {
    labelKey: 'areaGeneral',
    icon: SettingsOutlinedIcon,
    color: '#64748b',
    background: 'rgba(100, 116, 139, 0.12)',
  },
};

const COMMON_FIELD_LABELS = {
  title: 'title',
  name: 'name',
  location: 'location',
  status: 'status',
  section: 'section',
  change: 'change',
  participant: 'participant',
  removed: 'participant',
  deleted: 'deleted item',
  before: 'before',
  after: 'after',
  eventId: 'event',
  bookingId: 'booking',
  registrationId: 'registration',
  providerName: 'provider',
  selectedDate: 'date',
  selectedTime: 'time',
  startTime: 'start time',
  endTime: 'end time',
  maxParticipants: 'capacity',
};

function toDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value, intlLocale = 'en') {
  const date = toDate(value);
  if (!date) return 'Date unavailable';
  return new Intl.DateTimeFormat(intlLocale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function humanizeKey(value = '') {
  return COMMON_FIELD_LABELS[value] || String(value)
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase();
}

function humanizeValue(value) {
  if (value === null || value === undefined || value === '') return 'empty';
  if (value?.toDate) return formatDateTime(value);
  if (value instanceof Date) return formatDateTime(value);
  if (Array.isArray(value)) return value.length ? value.map(humanizeValue).join(', ') : 'none';
  if (typeof value === 'object') {
    const title = value.title || value.name || value.label || value.id;
    if (title) return String(title);
    return `${Object.keys(value).length} fields`;
  }
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return String(value);
}

function getActionType(log) {
  return String(log.actionType || log.type || log.action || '').trim();
}

function getActionLabel(actionType, locale = 'en') {
  if (!actionType) return locale === 'he' ? 'פעילות נרשמה' : 'Recorded activity';
  const map = locale === 'he' ? ACTION_LABELS_HE : ACTION_LABELS;
  if (map[actionType] || ACTION_LABELS[actionType]) return map[actionType] || ACTION_LABELS[actionType];

  const words = actionType
    .toLowerCase()
    .split('_')
    .filter(Boolean);

  if (!words.length) return 'Recorded activity';
  return `${words[0][0].toUpperCase()}${words[0].slice(1)} ${words.slice(1).join(' ')}`;
}

function getAreaKey(log) {
  const actionType = getActionType(log).toUpperCase();
  const target = String(log.targetId || log.target || '').toUpperCase();
  const details = log.details || {};
  const section = String(details.section || '').toLowerCase();
  const combined = `${actionType} ${target} ${section}`;

  if (combined.includes('BOOKING') || combined.includes('REGISTRATION') || combined.includes('APPOINTMENT')) return 'booking';
  if (combined.includes('EVENT')) return 'event';
  if (combined.includes('PUBLIC_HOME') || combined.includes('PUBLIC HOME') || section) return 'public';
  if (combined.includes('ROLE') || combined.includes('USER') || combined.includes('JOIN_REQUEST')) return 'user';
  if (combined.includes('COMMUNITY') || combined.includes('REPORT')) return 'community';
  if (combined.includes('SETTING') || combined.includes('GUIDELINE')) return 'settings';
  return 'general';
}

function getAdminLabel(log) {
  return log.adminEmail || log.actorEmail || log.actorName || log.adminId || 'Unknown admin';
}

function getReadableSection(details) {
  return humanizeValue(details?.section || details?.targetSection || 'section');
}

function getSummaryFromDetails(log) {
  const details = log.details || {};
  const actionType = getActionType(log);
  const actionUpper = actionType.toUpperCase();

  if (details.description) return details.description;
  if (log.summary && !String(log.summary).includes('{')) {
    return String(log.summary).replace(actionType, getActionLabel(actionType)).replace(/\s+—\s+/, ': ');
  }

  if (details.before !== undefined && details.after !== undefined && typeof details.before !== 'object' && typeof details.after !== 'object') {
    return `Changed value from ${humanizeValue(details.before)} to ${humanizeValue(details.after)}`;
  }

  if (details.before && details.after && typeof details.before === 'object' && typeof details.after === 'object') {
    const changedKeys = Object.keys(details.after).filter((key) => humanizeValue(details.before[key]) !== humanizeValue(details.after[key]));
    if (changedKeys.length === 1) {
      const key = changedKeys[0];
      return `Changed ${humanizeKey(key)} to ${humanizeValue(details.after[key])}`;
    }
    if (changedKeys.length > 1) {
      return `Updated ${changedKeys.slice(0, 3).map(humanizeKey).join(', ')}${changedKeys.length > 3 ? ' and more' : ''}`;
    }
  }

  if (details.after && typeof details.after === 'object') {
    const keys = Object.keys(details.after).filter((key) => !['updatedAt', 'createdAt'].includes(key));
    if (keys.length === 1) {
      const key = keys[0];
      return `Changed ${humanizeKey(key)} to ${humanizeValue(details.after[key])}`;
    }
    if (details.after.location) return `Changed location to ${humanizeValue(details.after.location)}`;
    if (details.after.title) return `${getActionLabel(actionType)}: ${humanizeValue(details.after.title)}`;
    if (keys.length) return `Updated ${keys.slice(0, 3).map(humanizeKey).join(', ')}`;
  }

  if (details.section && details.change) {
    const change = humanizeValue(details.change);
    return `${change[0].toUpperCase()}${change.slice(1)} ${getReadableSection(details)} section on the public home page`;
  }

  if (details.participant) return `${getActionLabel(actionType)} for ${humanizeValue(details.participant)}`;
  if (details.removed) return `Removed ${humanizeValue(details.removed)} from this event`;
  if (details.deleted) return `Deleted ${humanizeValue(details.deleted)}`;
  if (details.status) return `Changed status to ${humanizeValue(details.status)}`;
  if (details.reason) return `${getActionLabel(actionType)}: ${humanizeValue(details.reason)}`;
  if (actionUpper.includes('PUBLIC_HOME')) return 'Updated content on the public home page';
  if (actionUpper.includes('EVENT')) return 'Changed event information';
  if (actionUpper.includes('BOOKING') || actionUpper.includes('REGISTRATION')) return 'Updated a participant booking';
  if (actionUpper.includes('ROLE')) return 'Changed user permissions';

  return log.targetId ? `Updated ${humanizeValue(log.targetId)}` : 'Admin activity was recorded';
}

function getChangeRows(details = {}) {
  if (details.before && details.after && typeof details.before === 'object' && typeof details.after === 'object') {
    return Object.keys(details.after)
      .filter((key) => humanizeValue(details.before[key]) !== humanizeValue(details.after[key]))
      .map((key) => ({
        field: humanizeKey(key),
        before: humanizeValue(details.before[key]),
        after: humanizeValue(details.after[key]),
      }));
  }

  if (details.before !== undefined || details.after !== undefined) {
    return [{
      field: 'value',
      before: humanizeValue(details.before),
      after: humanizeValue(details.after),
    }];
  }

  return Object.entries(details)
    .filter(([key]) => !['description'].includes(key))
    .slice(0, 8)
    .map(([key, value]) => ({
      field: humanizeKey(key),
      before: '-',
      after: humanizeValue(value),
    }));
}

function normalizeLog(log) {
  const areaKey = getAreaKey(log);
  const area = AREA_CONFIG[areaKey] || AREA_CONFIG.general;
  return {
    ...log,
    actionType: getActionType(log),
    actionLabel: getActionLabel(getActionType(log)),
    adminLabel: getAdminLabel(log),
    areaKey,
    areaLabel: area.label,
    summaryText: getSummaryFromDetails(log),
    timestampDate: toDate(log.timestamp),
  };
}

export default function AuditLogPage() {
  const { t, lang } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(200));
      const snap = await getDocs(q);
      setLogs(snap.docs.map((docSnap) => normalizeLog({ id: docSnap.id, ...docSnap.data() })));
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError(t('auditError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    const adminSearch = adminFilter.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return logs.filter((log) => {
      const matchesAdmin = adminSearch
        ? log.adminLabel.toLowerCase().includes(adminSearch) || String(log.adminId || '').toLowerCase().includes(adminSearch)
        : true;
      const matchesActivity = activityFilter === 'all' ? true : log.areaKey === activityFilter;
      const matchesFrom = from && log.timestampDate ? log.timestampDate >= from : true;
      const matchesTo = to && log.timestampDate ? log.timestampDate <= to : true;
      return matchesAdmin && matchesActivity && matchesFrom && matchesTo;
    });
  }, [activityFilter, adminFilter, dateFrom, dateTo, logs]);

  const selectedArea = selectedLog ? AREA_CONFIG[selectedLog.areaKey] || AREA_CONFIG.general : AREA_CONFIG.general;
  const SelectedIcon = selectedArea.icon;
  const changeRows = selectedLog ? getChangeRows(selectedLog.details || {}) : [];

  return (
    <Box
      sx={{
        minHeight: '100%',
        color: '#24104f',
      }}
    >
      <Box sx={{ mb: 2.75 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 0, color: '#171239' }}>
          {t('auditTitle')}
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5, color: 'rgba(36, 16, 79, 0.66)', fontWeight: 600 }}>
          {t('auditSubtitle')}
        </Typography>
      </Box>

      <Box
        sx={{
          p: 2,
          mb: 2,
          border: '1px solid rgba(167, 139, 250, 0.18)',
          borderRadius: '22px',
          background: 'rgba(255, 255, 255, 0.78)',
          boxShadow: '0 18px 45px rgba(109, 53, 184, 0.08)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            placeholder={t('auditSearchPlaceholder')}
            value={adminFilter}
            onChange={(event) => setAdminFilter(event.target.value)}
            id="audit-admin-filter"
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: '#7a6ca5' }} /> }}
            sx={{ minWidth: { md: 260 }, flex: 1 }}
          />
          <TextField
            select
            label={t('auditActivityType')}
            value={activityFilter}
            onChange={(event) => setActivityFilter(event.target.value)}
            sx={{ minWidth: { md: 210 } }}
          >
            {ACTIVITY_FILTERS.map((option) => (
              <MenuItem value={option.value} key={option.value}>{t(option.labelKey)}</MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            label={t('auditDateFrom')}
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { md: 155 } }}
          />
          <TextField
            type="date"
            label={t('auditDateTo')}
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { md: 155 } }}
          />
          <Button
            type="button"
            onClick={() => {
              setAdminFilter('');
              setActivityFilter('all');
              setDateFrom('');
              setDateTo('');
            }}
            sx={{ minHeight: 54, color: '#6d35b8', fontWeight: 900 }}
          >
            {t('auditClear')}
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          overflow: 'hidden',
          border: '1px solid rgba(167, 139, 250, 0.18)',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.82)',
          boxShadow: '0 18px 45px rgba(109, 53, 184, 0.08)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 1.25fr 1.25fr 1fr 2.1fr 120px',
            gap: 2,
            px: 2.25,
            py: 1.5,
            borderBottom: '1px solid rgba(167, 139, 250, 0.16)',
            color: 'rgba(36, 16, 79, 0.66)',
            fontSize: '0.78rem',
            fontWeight: 900,
          }}
        >
          <span>{t('colDateTime')}</span>
          <span>{t('colAdmin')}</span>
          <span>{t('colActivity')}</span>
          <span>{t('colArea')}</span>
          <span>{t('colSummary')}</span>
          <span>{t('colDetails')}</span>
        </Box>

        <Box sx={{ maxHeight: 'calc(100vh - 300px)', minHeight: 360, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#6d35b8', fontWeight: 800 }}>{t('auditLoading')}</Box>
          ) : error ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ mb: 1, color: '#b42355', fontWeight: 900 }}>{error}</Typography>
              <Button onClick={fetchLogs} variant="outlined">{t('retry')}</Button>
            </Box>
          ) : filteredLogs.length ? (
            filteredLogs.map((log) => {
              const area = AREA_CONFIG[log.areaKey] || AREA_CONFIG.general;
              const AreaIcon = area.icon;

              return (
                <Box
                  key={log.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1.15fr 1.25fr 1.25fr 1fr 2.1fr 120px',
                    gap: 2,
                    alignItems: 'center',
                    px: 2.25,
                    py: 1.25,
                    borderBottom: '1px solid rgba(167, 139, 250, 0.12)',
                    '&:hover': { background: 'rgba(252, 231, 243, 0.26)' },
                  }}
                >
                  <Typography sx={{ color: '#303a58', fontSize: '0.82rem', fontWeight: 800 }}>
                    {formatDateTime(log.timestamp, intlLocale)}
                  </Typography>
                  <Typography sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', color: '#303a58', fontSize: '0.82rem', fontWeight: 700 }}>
                    {log.adminLabel}
                  </Typography>
                  <Chip
                    label={getActionLabel(log.actionType, lang)}
                    size="small"
                    sx={{
                      justifySelf: 'start',
                      color: area.color,
                      backgroundColor: area.background,
                      borderRadius: 999,
                      fontWeight: 900,
                    }}
                  />
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        width: 30,
                        height: 30,
                        placeItems: 'center',
                        flex: '0 0 auto',
                        borderRadius: '10px',
                        color: area.color,
                        background: area.background,
                      }}
                    >
                      <AreaIcon fontSize="small" />
                    </Box>
                    <Typography sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#303a58', fontSize: '0.8rem', fontWeight: 800 }}>
                      {t(area.labelKey)}
                    </Typography>
                  </Stack>
                  <Typography sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(36, 16, 79, 0.72)', fontSize: '0.82rem', fontWeight: 650 }}>
                    {log.summaryText}
                  </Typography>
                  <Button
                    type="button"
                    size="small"
                    startIcon={<VisibilityOutlinedIcon />}
                    onClick={() => setSelectedLog(log)}
                    sx={{
                      justifySelf: 'start',
                      borderRadius: 999,
                      color: '#e05297',
                      borderColor: 'rgba(224, 82, 151, 0.28)',
                      fontWeight: 900,
                    }}
                    variant="outlined"
                  >
                    {t('view')}
                  </Button>
                </Box>
              );
            })
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', color: 'rgba(36, 16, 79, 0.68)', fontWeight: 800 }}>
              {t('auditNoMatch')}
            </Box>
          )}
        </Box>
      </Box>

      {selectedLog ? (
        <Box
          role="dialog"
          aria-modal="true"
          aria-label={t('auditDetailsAria')}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            background: 'rgba(36, 16, 79, 0.22)',
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedLog(null);
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 18,
              right: 18,
              bottom: 18,
              width: 'min(520px, calc(100vw - 36px))',
              overflowY: 'auto',
              border: '1px solid rgba(167, 139, 250, 0.2)',
              borderRadius: '26px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,252,0.96))',
              boxShadow: '0 28px 70px rgba(36, 16, 79, 0.22)',
              p: 2.5,
            }}
          >
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    display: 'grid',
                    width: 48,
                    height: 48,
                    placeItems: 'center',
                    borderRadius: '16px',
                    color: selectedArea.color,
                    background: selectedArea.background,
                  }}
                >
                  <SelectedIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: '#171239', fontWeight: 900 }}>
                    {getActionLabel(selectedLog.actionType, lang)}
                  </Typography>
                  <Typography sx={{ color: 'rgba(36, 16, 79, 0.62)', fontWeight: 700 }}>
                    {t(selectedArea.labelKey)}
                  </Typography>
                </Box>
              </Stack>
              <IconButton onClick={() => setSelectedLog(null)} aria-label={t('closeActivityDetails')}>
                <CloseIcon />
              </IconButton>
            </Stack>

            <Box sx={{ mt: 2.5, p: 2, borderRadius: '18px', background: 'rgba(252, 231, 243, 0.5)' }}>
              <Typography sx={{ color: '#171239', fontWeight: 900 }}>{t('auditSummaryHeading')}</Typography>
              <Typography sx={{ mt: 0.5, color: 'rgba(36, 16, 79, 0.75)', fontWeight: 650 }}>
                {selectedLog.summaryText}
              </Typography>
            </Box>

            <Stack spacing={1.25} sx={{ mt: 2.25 }}>
              <DetailLine label={t('detailAdmin')} value={selectedLog.adminLabel} />
              <DetailLine label={t('detailTimestamp')} value={formatDateTime(selectedLog.timestamp, intlLocale)} />
              <DetailLine label={t('detailArea')} value={t(selectedArea.labelKey)} />
              <DetailLine label={t('detailTarget')} value={selectedLog.targetId || t('detailNotSpecified')} />
            </Stack>

            <Divider sx={{ my: 2.25 }} />

            <Typography sx={{ mb: 1.25, color: '#171239', fontWeight: 900 }}>
              {t('whatChanged')}
            </Typography>
            {changeRows.length ? (
              <Stack spacing={1}>
                {changeRows.map((row) => (
                  <Box
                    key={`${row.field}-${row.before}-${row.after}`}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '110px 1fr',
                      gap: 1.25,
                      p: 1.25,
                      border: '1px solid rgba(167, 139, 250, 0.16)',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.72)',
                    }}
                  >
                    <Typography sx={{ color: '#6d35b8', fontSize: '0.78rem', fontWeight: 900 }}>
                      {row.field}
                    </Typography>
                    <Box>
                      <Typography sx={{ color: 'rgba(36, 16, 79, 0.58)', fontSize: '0.76rem', fontWeight: 800 }}>
                        {t('beforeLabel')}: {row.before}
                      </Typography>
                      <Typography sx={{ mt: 0.25, color: '#24104f', fontSize: '0.82rem', fontWeight: 850 }}>
                        {t('afterLabel')}: {row.after}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography sx={{ color: 'rgba(36, 16, 79, 0.66)', fontWeight: 700 }}>
                {t('noFieldDetails')}
              </Typography>
            )}

            <Box component="details" sx={{ mt: 2.25 }}>
              <Typography component="summary" sx={{ cursor: 'pointer', color: '#6d35b8', fontWeight: 900 }}>
                {t('advancedDetails')}
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 1,
                  maxHeight: 220,
                  overflow: 'auto',
                  p: 1.5,
                  borderRadius: '14px',
                  background: '#1f1637',
                  color: '#f8f3ff',
                  fontSize: '0.72rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </Box>
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function DetailLine({ label, value }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 1.5 }}>
      <Typography sx={{ color: 'rgba(36, 16, 79, 0.56)', fontSize: '0.8rem', fontWeight: 900 }}>
        {label}
      </Typography>
      <Typography sx={{ minWidth: 0, overflowWrap: 'anywhere', color: '#24104f', fontSize: '0.84rem', fontWeight: 750 }}>
        {value}
      </Typography>
    </Box>
  );
}
