import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { logAuditEvent } from '../services/auditService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_CONTACT,
  mergeContact,
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

const LIMITS = {
  email: 120,
  phone: 40,
  socialUrl: 300,
};

function isValidUrlOrEmpty(value) {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

function contactToForm(contact) {
  const c = contact && typeof contact === 'object' ? contact : DEFAULT_CONTACT;
  return {
    email: c.email || DEFAULT_CONTACT.email,
    phone: c.phone || DEFAULT_CONTACT.phone,
    linkedinUrl: c.linkedinUrl || '',
    instagramUrl: c.instagramUrl || '',
    facebookUrl: c.facebookUrl || '',
  };
}

export default function PublicHomePageContactTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => contactToForm(DEFAULT_CONTACT));
  const [pristine, setPristine] = useState(() => contactToForm(DEFAULT_CONTACT));
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
        const snap = await getDoc(ref);
        if (!active) return;
        const data = snap.exists() ? snap.data() || {} : {};
        const merged = mergeContact(data.contact);
        const next = contactToForm(merged);
        setForm(next);
        setPristine(next);
      } catch (err) {
        console.error('Failed to load contact settings:', err);
        if (active) setToast({ open: true, severity: 'error', message: 'Failed to load contact settings.' });
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(pristine), [form, pristine]);

  const errors = useMemo(() => {
    const next = {};
    if (form.linkedinUrl && !isValidUrlOrEmpty(form.linkedinUrl)) next.linkedinUrl = 'Enter a valid URL.';
    if (form.instagramUrl && !isValidUrlOrEmpty(form.instagramUrl)) next.instagramUrl = 'Enter a valid URL.';
    if (form.facebookUrl && !isValidUrlOrEmpty(form.facebookUrl)) next.facebookUrl = 'Enter a valid URL.';
    return next;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;
  const canSave = dirty && !hasErrors && !saving;

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function handleBlur(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }
  function showError(field) {
    return Boolean(errors[field]) && (submitted || Boolean(touched[field]));
  }

  async function handleSave() {
    setSubmitted(true);
    if (!canSave) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      const updatedBy = user?.email || user?.uid || '';
      const contactPayload = {
        email: form.email.trim(),
        phone: form.phone.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        instagramUrl: form.instagramUrl.trim(),
        facebookUrl: form.facebookUrl.trim(),
      };
      const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
      await updateDoc(ref, {
        contact: contactPayload,
        updatedAt: serverTimestamp(),
        updatedBy,
      });
      await logAuditEvent({
        actionType: 'UPDATE_PUBLIC_HOME_CONTACT',
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: { section: 'contact', after: contactPayload },
      });
      setPristine(form);
      setTouched({});
      setSubmitted(false);
      setToast({ open: true, severity: 'success', message: 'Contact settings saved.' });
    } catch (err) {
      console.error('Failed to save contact settings:', err);
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

  return (
    <Box sx={{ pb: 12 }}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>Contact Us — צרי קשר</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Content shown in the "צרי קשר" section at the bottom of the public home page.
          </Typography>

          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Direct Contact</Typography>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <TextField
                  label="Email Address"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  inputProps={{ maxLength: LIMITS.email }}
                  helperText="Shown as a mailto: link"
                  type="email"
                  fullWidth
                />
                <TextField
                  label="Phone Number"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  inputProps={{ maxLength: LIMITS.phone }}
                  helperText="Shown as a tel: link"
                  fullWidth
                />
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Social Networks</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Leave a field empty to hide that social network from the public page.
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="LinkedIn URL"
                  value={form.linkedinUrl}
                  onChange={(e) => setField('linkedinUrl', e.target.value)}
                  onBlur={() => handleBlur('linkedinUrl')}
                  inputProps={{ maxLength: LIMITS.socialUrl }}
                  error={showError('linkedinUrl')}
                  helperText={showError('linkedinUrl') && errors.linkedinUrl}
                  type="url"
                  fullWidth
                />
                <TextField
                  label="Instagram URL"
                  value={form.instagramUrl}
                  onChange={(e) => setField('instagramUrl', e.target.value)}
                  onBlur={() => handleBlur('instagramUrl')}
                  inputProps={{ maxLength: LIMITS.socialUrl }}
                  error={showError('instagramUrl')}
                  helperText={showError('instagramUrl') && errors.instagramUrl}
                  type="url"
                  fullWidth
                />
                <TextField
                  label="Facebook URL"
                  value={form.facebookUrl}
                  onChange={(e) => setField('facebookUrl', e.target.value)}
                  onBlur={() => handleBlur('facebookUrl')}
                  inputProps={{ maxLength: LIMITS.socialUrl }}
                  error={showError('facebookUrl')}
                  helperText={showError('facebookUrl') && errors.facebookUrl}
                  type="url"
                  fullWidth
                />
              </Stack>
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
          gap: '0.75rem',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1100,
        }}
      >
        <Button onClick={handleDiscard} disabled={!dirty || saving}>
          Discard changes
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
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
