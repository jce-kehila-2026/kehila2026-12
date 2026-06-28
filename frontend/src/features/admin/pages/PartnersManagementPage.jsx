import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { useAdminLocale } from '../context/AdminLocaleContext';
import { logAuditEvent } from '../services/auditService';
import { isTranslationConfigured, translateItems } from '../services/translationService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_PARTNERS,
  mergePartners,
} from '../../public/services/publicPagesService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '../components/AutoDirTextField';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HandshakeIcon from '@mui/icons-material/Handshake';

const LIMITS = {
  name: 80,
  logoUrl: 500,
  description: 400,
};

function generatePartnerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `partner-${crypto.randomUUID()}`;
  }
  return `partner-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidUrlOrEmpty(value) {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/')) return true;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

function reindexOrder(list) {
  return list.map((item, index) => ({ ...item, order: index }));
}

function emptyDraft() {
  return { id: '', name: '', logoUrl: '', description: '', order: 0 };
}

export default function PartnersManagementPage() {
  const { t, direction } = useAdminLocale();
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [draft, setDraft] = useState(emptyDraft);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
        const snap = await getDoc(ref);
        const seed = DEFAULT_PARTNERS.map((p) => ({ ...p }));
        if (!snap.exists()) {
          await setDoc(ref, {
            partners: seed,
            updatedAt: serverTimestamp(),
            updatedBy: 'system-seed',
          });
          if (active) setPartners(seed);
        } else {
          const data = snap.data() || {};
          if (!Array.isArray(data.partners)) {
            await updateDoc(ref, {
              partners: seed,
              updatedAt: serverTimestamp(),
              updatedBy: 'system-seed',
            });
            if (active) setPartners(seed);
          } else if (active) {
            setPartners(mergePartners(data.partners));
          }
        }
      } catch (err) {
        console.error('Failed to load partners:', err);
        if (active) {
          setToast({ open: true, severity: 'error', message: t('cmsLoadPartnersFailed') });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const errors = useMemo(() => {
    const next = {};
    if (!draft.name.trim()) next.name = t('cmsNameRequired');
    if (!isValidUrlOrEmpty(draft.logoUrl)) next.logoUrl = t('cmsInvalidUrl');
    if (!draft.description.trim()) next.description = t('cmsDescriptionRequired');
    return next;
  }, [draft]);

  const hasErrors = Object.keys(errors).length > 0;

  function openCreate() {
    setEditorMode('create');
    setDraft({ ...emptyDraft(), order: partners.length });
    setSubmitted(false);
    setEditorOpen(true);
  }

  function openEdit(partner) {
    setEditorMode('edit');
    setDraft({
      id: partner.id,
      name: partner.name || '',
      logoUrl: partner.logoUrl || '',
      description: partner.description || '',
      order: partner.order ?? 0,
    });
    setSubmitted(false);
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving) return;
    setEditorOpen(false);
  }

  function setField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function persistPartners(nextPartners, audit) {
    const user = auth.currentUser;
    const updatedBy = user?.email || user?.uid || '';
    const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
    // Translate the description (not org names) to { he, en, ar } once on save.
    let translatedPartners = nextPartners;
    if (isTranslationConfigured()) {
      try {
        translatedPartners = await translateItems(nextPartners, ['description']);
      } catch (err) {
        console.error('Partners translation failed; saving original only:', err);
      }
    }
    await updateDoc(ref, {
      partners: translatedPartners.map((p) => ({
        id: p.id,
        name: p.name,
        logoUrl: p.logoUrl,
        description: p.description,
        order: p.order,
        ...(p.translations ? { translations: p.translations } : {}),
      })),
      updatedAt: serverTimestamp(),
      updatedBy,
    });
    if (audit) {
      await logAuditEvent({
        actionType: audit.actionType,
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: { section: 'partners', partnerId: audit.partnerId, change: audit.change },
      });
    }
    setPartners(nextPartners);
  }

  async function handleSave() {
    setSubmitted(true);
    if (hasErrors) return;
    setSaving(true);
    try {
      const clean = {
        id: draft.id || generatePartnerId(),
        name: draft.name.trim(),
        logoUrl: draft.logoUrl.trim(),
        description: draft.description.trim(),
        order: draft.order,
      };
      let next;
      let audit;
      if (editorMode === 'create') {
        next = reindexOrder([...partners, clean]);
        audit = { actionType: 'CREATE_PUBLIC_HOME_PARTNER', partnerId: clean.id, change: 'create' };
      } else {
        next = partners.map((p) => (p.id === clean.id ? clean : p));
        audit = { actionType: 'UPDATE_PUBLIC_HOME_PARTNER', partnerId: clean.id, change: 'update' };
      }
      await persistPartners(next, audit);
      setEditorOpen(false);
      setToast({
        open: true,
        severity: 'success',
        message: editorMode === 'create' ? t('cmsPartnerAdded') : t('cmsPartnerUpdated'),
      });
    } catch (err) {
      console.error('Failed to save partner:', err);
      setToast({ open: true, severity: 'error', message: t('cmsSaveFailed') });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const id = confirmDeleteId;
    if (!id) return;
    setDeleting(true);
    try {
      const next = reindexOrder(partners.filter((p) => p.id !== id));
      await persistPartners(next, {
        actionType: 'DELETE_PUBLIC_HOME_PARTNER',
        partnerId: id,
        change: 'delete',
      });
      setConfirmDeleteId(null);
      setToast({ open: true, severity: 'success', message: t('cmsPartnerDeleted') });
    } catch (err) {
      console.error('Failed to delete partner:', err);
      setToast({ open: true, severity: 'error', message: t('cmsDeleteFailed') });
    } finally {
      setDeleting(false);
    }
  }

  async function handleMove(index, delta) {
    const swapIndex = index + delta;
    if (swapIndex < 0 || swapIndex >= partners.length) return;
    const next = [...partners];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    const reindexed = reindexOrder(next);
    try {
      await persistPartners(reindexed, null);
    } catch (err) {
      console.error('Failed to reorder partners:', err);
      setToast({ open: true, severity: 'error', message: t('cmsReorderFailed') });
    }
  }

  function showError(field) {
    return submitted && Boolean(errors[field]);
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 12 }} dir={direction}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h6">{t('cmsPartnersTitle')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('cmsPartnersSubtitle')}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ flexShrink: 0 }}>
            {t('cmsAddPartner')}
          </Button>
        </Box>

        {partners.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <HandshakeIcon sx={{ fontSize: '3rem', color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">{t('cmsNoPartnersYet')}</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {partners.map((p, index) => (
              <Paper
                key={p.id}
                variant="outlined"
                sx={{ p: 2, display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                {/* Logo preview */}
                <Box
                  sx={{
                    width: '3.5rem',
                    height: '3.5rem',
                    flexShrink: 0,
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {p.logoUrl ? (
                    <img
                      src={p.logoUrl}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {(p.name || '?').slice(0, 2)}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                    {p.name || '—'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {p.description}
                  </Typography>
                </Box>

                {/* Reorder */}
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <IconButton size="small" onClick={() => handleMove(index, -1)} disabled={index === 0} aria-label={t('cmsMoveUp')}>
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleMove(index, 1)} disabled={index === partners.length - 1} aria-label={t('cmsMoveDown')}>
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Box>

                <IconButton onClick={() => openEdit(p)} aria-label={t('cmsEditPartnerAria')}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => setConfirmDeleteId(p.id)} aria-label={t('cmsDeletePartnerAria')} color="error">
                  <DeleteOutlineIcon />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Create / Edit dialog */}
      <Dialog open={editorOpen} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle>{editorMode === 'create' ? t('cmsAddPartner') : t('cmsEditPartner')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label={t('cmsPartnerName')}
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
              inputProps={{ maxLength: LIMITS.name }}
              error={showError('name')}
              helperText={(showError('name') && errors.name) || `${draft.name.length} / ${LIMITS.name}`}
              required
              fullWidth
            />
            <TextField
              label={t('cmsLogoUrl')}
              value={draft.logoUrl}
              onChange={(e) => setField('logoUrl', e.target.value)}
              inputProps={{ maxLength: LIMITS.logoUrl }}
              error={showError('logoUrl')}
              helperText={
                (showError('logoUrl') && errors.logoUrl) ||
                t('cmsLogoHelper')
              }
              fullWidth
            />
            <TextField
              label={t('cmsFieldDescription')}
              value={draft.description}
              onChange={(e) => setField('description', e.target.value)}
              inputProps={{ maxLength: LIMITS.description }}
              error={showError('description')}
              helperText={(showError('description') && errors.description) || `${draft.description.length} / ${LIMITS.description}`}
              multiline
              minRows={3}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor} disabled={saving}>
            {t('cmsCancel')}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? t('cmsSaving') : t('cmsSave')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={Boolean(confirmDeleteId)} onClose={() => !deleting && setConfirmDeleteId(null)}>
        <DialogTitle>{t('cmsDeletePartnerConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('cmsDeletePartnerBody')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
            {t('cmsCancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? t('cmsDeleting') : t('cmsDelete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
