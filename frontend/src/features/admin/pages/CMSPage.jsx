import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { logAuditEvent } from '../services/auditService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_HOME_HERO,
  mergeHero,
} from '../../public/services/publicPagesService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import HomeIcon from '@mui/icons-material/Home';
import CircularProgress from '@mui/material/CircularProgress';

const LIMITS = {
  title: 80,
  subtitle: 120,
  description: 400,
};

function emptyForm() {
  return {
    title: '',
    subtitle: '',
    description: '',
    backgroundImageUrl: '',
  };
}

function heroToForm(hero) {
  return {
    title: hero.title || '',
    subtitle: hero.subtitle || '',
    description: hero.description || '',
    backgroundImageUrl: hero.backgroundImageUrl || '',
  };
}

function isValidUrlOrAnchor(value) {
  if (!value) return true;
  if (value.startsWith('#') || value.startsWith('/')) return true;
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function formatTimestamp(value) {
  if (!value) return '';
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const SEED_HERO = {
  title: 'את לא לבד במסע שלך',
  subtitle: 'קהילה תומכת לנשים ולמתמודדות עם סרטן',
  description: 'מרחב חם, בטוח ומקצועי לתמיכה, ליווי, למידה ותקווה לאורך הדרך.',
  backgroundImageUrl: '',
};

export default function CMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pristine, setPristine] = useState(emptyForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [docMeta, setDocMeta] = useState({ updatedAt: null, updatedBy: '', exists: false });
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
        let snap = await getDoc(ref);

        // Defensive auto-create: if a fresh environment is missing the doc,
        // create it with the seed defaults so the admin form is never empty.
        if (!snap.exists()) {
          await setDoc(ref, {
            hero: { ...SEED_HERO },
            updatedAt: serverTimestamp(),
            updatedBy: 'system-seed',
          });
          snap = await getDoc(ref);
        }

        if (!active) return;
        const data = snap.data() || {};
        const merged = mergeHero(data.hero);
        const next = heroToForm(merged);
        setForm(next);
        setPristine(next);
        setDocMeta({
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || '',
          exists: true,
        });
      } catch (err) {
        console.error('Failed to load public_pages/home:', err);
        // Fall back to defaults in-memory so the form is still usable.
        const next = heroToForm(DEFAULT_HOME_HERO);
        setForm(next);
        setPristine(next);
        setDocMeta({ updatedAt: null, updatedBy: '', exists: false });
        setToast({ open: true, severity: 'error', message: 'Failed to load home page content.' });
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(pristine),
    [form, pristine],
  );

  const errors = useMemo(() => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (form.backgroundImageUrl && !isValidUrlOrAnchor(form.backgroundImageUrl)) {
      next.backgroundImageUrl = 'Enter a valid URL.';
    }
    return next;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;
  const canSave = dirty && !hasErrors && !saving;

  function shouldShowError(field) {
    return Boolean(errors[field]) && (submitted || touched[field]);
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleBlur(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  async function handleSave() {
    setSubmitted(true);
    if (!canSave) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      const updatedBy = user?.email || user?.uid || '';
      const fieldUpdates = {
        'hero.title': form.title.trim(),
        'hero.subtitle': form.subtitle.trim(),
        'hero.description': form.description.trim(),
        'hero.backgroundImageUrl': form.backgroundImageUrl.trim(),
        updatedAt: serverTimestamp(),
        updatedBy,
      };

      const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
      if (docMeta.exists) {
        await updateDoc(ref, fieldUpdates);
      } else {
        // Initial write: build a nested object so we still create only the
        // intended fields. Subsequent saves use updateDoc with dotted paths.
        await setDoc(ref, {
          hero: {
            title: fieldUpdates['hero.title'],
            subtitle: fieldUpdates['hero.subtitle'],
            description: fieldUpdates['hero.description'],
            backgroundImageUrl: fieldUpdates['hero.backgroundImageUrl'],
          },
          updatedAt: serverTimestamp(),
          updatedBy,
        });
      }

      await logAuditEvent({
        actionType: 'UPDATE_PUBLIC_HOME_HERO',
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: { section: 'hero', after: form },
      });

      setPristine(form);
      setTouched({});
      setSubmitted(false);
      setDocMeta((prev) => ({
        updatedAt: new Date(),
        updatedBy,
        exists: true,
      }));
      setToast({ open: true, severity: 'success', message: 'Home page updated.' });
    } catch (err) {
      console.error('Failed to save home page content:', err);
      setToast({ open: true, severity: 'error', message: 'Save failed. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setForm(pristine);
    setTouched({});
    setSubmitted(false);
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const lastUpdatedLabel = formatTimestamp(docMeta.updatedAt);

  return (
    <Box sx={{ pb: 12 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Public Home-page</Typography>
        <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
          Edit the public home page content. Changes are visible to all visitors after save.
        </Typography>
        {lastUpdatedLabel || docMeta.updatedBy ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Last updated: {lastUpdatedLabel || '—'}
            {docMeta.updatedBy ? ` by ${docMeta.updatedBy}` : ''}
          </Typography>
        ) : null}
      </Box>

      <Tabs value={0} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Home" icon={<HomeIcon />} iconPosition="start" />
      </Tabs>

      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Hero Text</Typography>
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              inputProps={{ maxLength: LIMITS.title }}
              helperText={(shouldShowError('title') && errors.title) || `${form.title.length} / ${LIMITS.title}`}
              error={shouldShowError('title')}
              required
              fullWidth
              id="hero-title"
            />
            <TextField
              label="Subtitle"
              value={form.subtitle}
              onChange={(e) => setField('subtitle', e.target.value)}
              onBlur={() => handleBlur('subtitle')}
              inputProps={{ maxLength: LIMITS.subtitle }}
              helperText={`${form.subtitle.length} / ${LIMITS.subtitle}`}
              fullWidth
              id="hero-subtitle"
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              inputProps={{ maxLength: LIMITS.description }}
              helperText={`${form.description.length} / ${LIMITS.description}`}
              multiline
              minRows={3}
              fullWidth
              id="hero-description"
            />
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Background Image</Typography>
          <Stack spacing={2}>
            <TextField
              label="Background Image URL"
              value={form.backgroundImageUrl}
              onChange={(e) => setField('backgroundImageUrl', e.target.value)}
              onBlur={() => handleBlur('backgroundImageUrl')}
              helperText={
                (shouldShowError('backgroundImageUrl') && errors.backgroundImageUrl) ||
                'Paste a public URL (Firebase Storage, Unsplash, etc.).'
              }
              error={shouldShowError('backgroundImageUrl')}
              fullWidth
              id="hero-background-image-url"
              type="url"
            />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Preview
              </Typography>
              <BackgroundPreview url={form.backgroundImageUrl} />
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          bottom: 0,
          insetInlineStart: { xs: 0, md: 0 },
          insetInlineEnd: { xs: 0, md: 260 },
          py: 1.5,
          px: 3,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1100,
        }}
      >
        <Button onClick={handleDiscard} disabled={!dirty || saving}>
          Discard changes
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
          id="btn-save-public-home"
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Paper>

      <Snackbar
        open={toast.open}
        autoHideDuration={3200}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          variant="filled"
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function BackgroundPreview({ url }) {
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    setErrored(false);
  }, [url]);

  if (!url) {
    return (
      <Box
        sx={{
          width: 240,
          height: 135,
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          fontSize: 12,
        }}
      >
        No image set
      </Box>
    );
  }

  if (errored) {
    return (
      <Box
        sx={{
          width: 240,
          height: 135,
          border: '1px dashed',
          borderColor: 'error.main',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'error.main',
          fontSize: 12,
        }}
      >
        Image failed to load
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={url}
      alt="Hero background preview"
      onError={() => setErrored(true)}
      sx={{
        width: 240,
        height: 135,
        objectFit: 'cover',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        display: 'block',
      }}
    />
  );
}
