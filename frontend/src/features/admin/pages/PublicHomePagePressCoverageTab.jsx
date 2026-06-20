import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { useAdminLocale } from '../context/AdminLocaleContext';
import { logAuditEvent } from '../services/auditService';
import { isTranslationConfigured, translateItems } from '../services/translationService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_PRESS_COVERAGE,
  mergePressCoverage,
} from '../../public/services/publicPagesService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import ArticleIcon from '@mui/icons-material/Article';

const LIMITS = {
  title: 100,
  description: 300,
  imageUrl: 500,
  articleUrl: 500,
};

function generatePressId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `press-${crypto.randomUUID()}`;
  }
  return `press-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidUrlOrEmpty(value) {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/')) return true;
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

function emptyDraft() {
  return { id: '', title: '', description: '', imageUrl: '', articleUrl: '' };
}

export default function PublicHomePagePressCoverageTab() {
  const { t, direction } = useAdminLocale();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
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
        const seed = DEFAULT_PRESS_COVERAGE.map((p) => ({ ...p }));
        if (!snap.exists()) {
          await setDoc(ref, {
            pressCoverage: seed,
            updatedAt: serverTimestamp(),
            updatedBy: 'system-seed',
          });
          if (active) setItems(seed);
        } else {
          const data = snap.data() || {};
          if (!Array.isArray(data.pressCoverage)) {
            await updateDoc(ref, {
              pressCoverage: seed,
              updatedAt: serverTimestamp(),
              updatedBy: 'system-seed',
            });
            if (active) setItems(seed);
          } else if (active) {
            setItems(mergePressCoverage(data.pressCoverage));
          }
        }
      } catch (err) {
        console.error('Failed to load pressCoverage:', err);
        if (active) {
          setToast({ open: true, severity: 'error', message: t('cmsLoadPressFailed') });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const errors = useMemo(() => {
    const next = {};
    if (!draft.title.trim()) next.title = t('cmsTitleRequired');
    if (!isValidUrlOrEmpty(draft.imageUrl)) next.imageUrl = t('cmsInvalidUrl');
    if (!isValidUrlOrEmpty(draft.articleUrl)) next.articleUrl = t('cmsInvalidUrl');
    return next;
  }, [draft]);

  const hasErrors = Object.keys(errors).length > 0;

  function openCreate() {
    setEditorMode('create');
    setDraft(emptyDraft());
    setSubmitted(false);
    setEditorOpen(true);
  }

  function openEdit(item) {
    setEditorMode('edit');
    setDraft({
      id: item.id,
      title: item.title || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      articleUrl: item.articleUrl || '',
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

  async function persistItems(nextItems, audit) {
    const user = auth.currentUser;
    const updatedBy = user?.email || user?.uid || '';
    const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
    // Translate title + description to { he, en, ar } once on save.
    let translatedItems = nextItems;
    if (isTranslationConfigured()) {
      try {
        translatedItems = await translateItems(nextItems, ['title', 'description']);
      } catch (err) {
        console.error('Press coverage translation failed; saving original only:', err);
      }
    }
    await updateDoc(ref, {
      pressCoverage: translatedItems.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        articleUrl: p.articleUrl,
        ...(p.translations ? { translations: p.translations } : {}),
      })),
      updatedAt: serverTimestamp(),
      updatedBy,
    });
    if (audit) {
      await logAuditEvent({
        actionType: audit.actionType,
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: { section: 'pressCoverage', pressId: audit.pressId, change: audit.change },
      });
    }
    setItems(nextItems);
  }

  async function handleSave() {
    setSubmitted(true);
    if (hasErrors) return;
    setSaving(true);
    try {
      const clean = {
        id: draft.id || generatePressId(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        imageUrl: draft.imageUrl.trim(),
        articleUrl: draft.articleUrl.trim(),
      };
      let next;
      let audit;
      if (editorMode === 'create') {
        next = [clean, ...items];
        audit = { actionType: 'CREATE_PUBLIC_HOME_PRESS_COVERAGE', pressId: clean.id, change: 'create' };
      } else {
        next = items.map((p) => (p.id === clean.id ? clean : p));
        audit = { actionType: 'UPDATE_PUBLIC_HOME_PRESS_COVERAGE', pressId: clean.id, change: 'update' };
      }
      await persistItems(next, audit);
      setEditorOpen(false);
      setToast({
        open: true,
        severity: 'success',
        message: editorMode === 'create' ? t('cmsPressAdded') : t('cmsPressUpdated'),
      });
    } catch (err) {
      console.error('Failed to save press card:', err);
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
      const next = items.filter((p) => p.id !== id);
      await persistItems(next, {
        actionType: 'DELETE_PUBLIC_HOME_PRESS_COVERAGE',
        pressId: id,
        change: 'delete',
      });
      setConfirmDeleteId(null);
      setToast({ open: true, severity: 'success', message: t('cmsPressDeleted') });
    } catch (err) {
      console.error('Failed to delete press card:', err);
      setToast({ open: true, severity: 'error', message: t('cmsDeleteFailed') });
    } finally {
      setDeleting(false);
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h6">{t('cmsPressTitle')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('cmsPressSubtitle')}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {t('cmsAddNewCard')}
          </Button>
        </Box>

        {items.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('cmsNoPressYet')}</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {items.map((p) => (
              <Paper
                key={p.id}
                variant="outlined"
                sx={{ p: 2, display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                <Avatar src={p.imageUrl || undefined} variant="rounded" sx={{ width: '3.5rem', height: '3.5rem' }}>
                  <ArticleIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                    {p.title || '—'}
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
                  {p.articleUrl ? (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {p.articleUrl}
                    </Typography>
                  ) : null}
                </Box>
                <IconButton onClick={() => openEdit(p)} aria-label={t('cmsEditAria')}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => setConfirmDeleteId(p.id)}
                  aria-label={t('cmsDeleteAria')}
                  color="error"
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={editorOpen} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle>{editorMode === 'create' ? t('cmsAddPressCard') : t('cmsEditPressCard')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label={t('cmsFieldTitle')}
              value={draft.title}
              onChange={(e) => setField('title', e.target.value)}
              inputProps={{ maxLength: LIMITS.title }}
              error={showError('title')}
              helperText={(showError('title') && errors.title) || `${draft.title.length} / ${LIMITS.title}`}
              required
              fullWidth
            />
            <TextField
              label={t('cmsFieldDescription')}
              value={draft.description}
              onChange={(e) => setField('description', e.target.value)}
              inputProps={{ maxLength: LIMITS.description }}
              helperText={`${draft.description.length} / ${LIMITS.description}`}
              multiline
              minRows={3}
              fullWidth
            />
            <TextField
              label={t('cmsImageUrl')}
              value={draft.imageUrl}
              onChange={(e) => setField('imageUrl', e.target.value)}
              inputProps={{ maxLength: LIMITS.imageUrl }}
              error={showError('imageUrl')}
              helperText={(showError('imageUrl') && errors.imageUrl) || t('cmsPlainUrlHelper')}
              fullWidth
            />
            <TextField
              label={t('cmsArticleUrl')}
              value={draft.articleUrl}
              onChange={(e) => setField('articleUrl', e.target.value)}
              inputProps={{ maxLength: LIMITS.articleUrl }}
              error={showError('articleUrl')}
              helperText={
                (showError('articleUrl') && errors.articleUrl) ||
                t('cmsArticleUrlHelper')
              }
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

      <Dialog open={Boolean(confirmDeleteId)} onClose={() => !deleting && setConfirmDeleteId(null)}>
        <DialogTitle>{t('cmsDeletePressConfirm')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {t('cmsCannotUndo')}
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
