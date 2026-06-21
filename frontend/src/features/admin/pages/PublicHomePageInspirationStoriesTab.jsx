import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { useAdminLocale } from '../context/AdminLocaleContext';
import { logAuditEvent } from '../services/auditService';
import { isTranslationConfigured, translateItems } from '../services/translationService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_INSPIRATIONAL_STORIES,
  mergeInspirationalStories,
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

const LIMITS = {
  name: 60,
  occupation: 60,
  story: 600,
  imageUrl: 500,
};

function generateStoryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `story-${crypto.randomUUID()}`;
  }
  return `story-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  return { id: '', name: '', story: '', imageUrl: '', occupation: '' };
}

export default function PublicHomePageInspirationStoriesTab() {
  const { t, direction } = useAdminLocale();
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
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
        const seed = DEFAULT_INSPIRATIONAL_STORIES.map((s) => ({ ...s }));
        if (!snap.exists()) {
          await setDoc(ref, {
            inspirationalStories: seed,
            updatedAt: serverTimestamp(),
            updatedBy: 'system-seed',
          });
          if (active) setStories(seed);
        } else {
          const data = snap.data() || {};
          if (!Array.isArray(data.inspirationalStories)) {
            await updateDoc(ref, {
              inspirationalStories: seed,
              updatedAt: serverTimestamp(),
              updatedBy: 'system-seed',
            });
            if (active) setStories(seed);
          } else if (active) {
            setStories(mergeInspirationalStories(data.inspirationalStories));
          }
        }
      } catch (err) {
        console.error('Failed to load inspirationalStories:', err);
        if (active) {
          setToast({ open: true, severity: 'error', message: t('cmsLoadStoriesFailed') });
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
    if (!draft.name.trim()) next.name = t('cmsNameRequired');
    if (!draft.story.trim()) next.story = t('cmsStoryRequired');
    if (!isValidUrlOrEmpty(draft.imageUrl)) next.imageUrl = t('cmsInvalidUrl');
    return next;
  }, [draft]);

  const hasErrors = Object.keys(errors).length > 0;

  function openCreate() {
    setEditorMode('create');
    setDraft(emptyDraft());
    setSubmitted(false);
    setEditorOpen(true);
  }

  function openEdit(story) {
    setEditorMode('edit');
    setDraft({
      id: story.id,
      name: story.name || '',
      story: story.story || '',
      imageUrl: story.imageUrl || '',
      occupation: story.occupation || '',
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

  async function persistStories(nextStories, audit) {
    const user = auth.currentUser;
    const updatedBy = user?.email || user?.uid || '';
    const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
    // Translate occupation + story (not personal names) to { he, en, ar } on save.
    let translatedStories = nextStories;
    if (isTranslationConfigured()) {
      try {
        translatedStories = await translateItems(nextStories, ['occupation', 'story']);
      } catch (err) {
        console.error('Inspiration stories translation failed; saving original only:', err);
      }
    }
    await updateDoc(ref, {
      inspirationalStories: translatedStories.map((s) => ({
        id: s.id,
        name: s.name,
        story: s.story,
        imageUrl: s.imageUrl,
        occupation: s.occupation,
        ...(s.translations ? { translations: s.translations } : {}),
      })),
      updatedAt: serverTimestamp(),
      updatedBy,
    });
    if (audit) {
      await logAuditEvent({
        actionType: audit.actionType,
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: { section: 'inspirationalStories', storyId: audit.storyId, change: audit.change },
      });
    }
    setStories(nextStories);
  }

  async function handleSave() {
    setSubmitted(true);
    if (hasErrors) return;
    setSaving(true);
    try {
      const clean = {
        id: draft.id || generateStoryId(),
        name: draft.name.trim(),
        story: draft.story.trim(),
        imageUrl: draft.imageUrl.trim(),
        occupation: draft.occupation.trim(),
      };
      let next;
      let audit;
      if (editorMode === 'create') {
        next = [clean, ...stories];
        audit = { actionType: 'CREATE_PUBLIC_HOME_INSPIRATION_STORY', storyId: clean.id, change: 'create' };
      } else {
        next = stories.map((s) => (s.id === clean.id ? clean : s));
        audit = { actionType: 'UPDATE_PUBLIC_HOME_INSPIRATION_STORY', storyId: clean.id, change: 'update' };
      }
      await persistStories(next, audit);
      setEditorOpen(false);
      setToast({
        open: true,
        severity: 'success',
        message: editorMode === 'create' ? t('cmsStoryAdded') : t('cmsStoryUpdated'),
      });
    } catch (err) {
      console.error('Failed to save story:', err);
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
      const next = stories.filter((s) => s.id !== id);
      await persistStories(next, {
        actionType: 'DELETE_PUBLIC_HOME_INSPIRATION_STORY',
        storyId: id,
        change: 'delete',
      });
      setConfirmDeleteId(null);
      setToast({ open: true, severity: 'success', message: t('cmsStoryDeleted') });
    } catch (err) {
      console.error('Failed to delete story:', err);
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
            <Typography variant="h6">{t('cmsStoriesTitle')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('cmsStoriesSubtitle')}
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {t('cmsAddNewStory')}
          </Button>
        </Box>

        {stories.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('cmsNoStoriesYet')}</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {stories.map((s) => (
              <Paper
                key={s.id}
                variant="outlined"
                sx={{ p: 2, display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                <Avatar src={s.imageUrl || undefined} alt={s.name}>
                  {(s.name || '?').slice(0, 1)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                    {s.name || '—'}
                  </Typography>
                  {s.occupation ? (
                    <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                      {s.occupation}
                    </Typography>
                  ) : null}
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
                    {s.story}
                  </Typography>
                </Box>
                <IconButton onClick={() => openEdit(s)} aria-label={t('cmsEditStoryAria')}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={() => setConfirmDeleteId(s.id)}
                  aria-label={t('cmsDeleteStoryAria')}
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
        <DialogTitle>{editorMode === 'create' ? t('cmsAddStory') : t('cmsEditStory')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label={t('cmsFieldName')}
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
              inputProps={{ maxLength: LIMITS.name }}
              error={showError('name')}
              helperText={(showError('name') && errors.name) || `${draft.name.length} / ${LIMITS.name}`}
              required
              fullWidth
            />
            <TextField
              label={t('cmsFieldOccupation')}
              value={draft.occupation}
              onChange={(e) => setField('occupation', e.target.value)}
              inputProps={{ maxLength: LIMITS.occupation }}
              helperText={`${draft.occupation.length} / ${LIMITS.occupation}`}
              fullWidth
            />
            <TextField
              label={t('cmsImageUrl')}
              value={draft.imageUrl}
              onChange={(e) => setField('imageUrl', e.target.value)}
              inputProps={{ maxLength: LIMITS.imageUrl }}
              error={showError('imageUrl')}
              helperText={
                (showError('imageUrl') && errors.imageUrl) ||
                t('cmsStoryImageHelper')
              }
              fullWidth
            />
            <TextField
              label={t('cmsFieldStory')}
              value={draft.story}
              onChange={(e) => setField('story', e.target.value)}
              inputProps={{ maxLength: LIMITS.story }}
              error={showError('story')}
              helperText={(showError('story') && errors.story) || `${draft.story.length} / ${LIMITS.story}`}
              multiline
              minRows={4}
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

      <Dialog open={Boolean(confirmDeleteId)} onClose={() => !deleting && setConfirmDeleteId(null)}>
        <DialogTitle>{t('cmsDeleteStoryConfirm')}</DialogTitle>
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
