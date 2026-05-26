import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { logAuditEvent } from '../services/auditService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_PARTNERS,
  mergePartners,
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
import PreviewIcon from '@mui/icons-material/Preview';

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
          setToast({ open: true, severity: 'error', message: 'Failed to load partners.' });
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
    if (!draft.name.trim()) next.name = 'Name is required.';
    if (!isValidUrlOrEmpty(draft.logoUrl)) next.logoUrl = 'Invalid URL.';
    if (!draft.description.trim()) next.description = 'Description is required.';
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
    await updateDoc(ref, {
      partners: nextPartners.map((p) => ({
        id: p.id,
        name: p.name,
        logoUrl: p.logoUrl,
        description: p.description,
        order: p.order,
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
        message: editorMode === 'create' ? 'Partner added.' : 'Partner updated.',
      });
    } catch (err) {
      console.error('Failed to save partner:', err);
      setToast({ open: true, severity: 'error', message: 'Save failed. Please try again.' });
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
      setToast({ open: true, severity: 'success', message: 'Partner deleted.' });
    } catch (err) {
      console.error('Failed to delete partner:', err);
      setToast({ open: true, severity: 'error', message: 'Delete failed. Please try again.' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleMove(index, direction) {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= partners.length) return;
    const next = [...partners];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    const reindexed = reindexOrder(next);
    try {
      await persistPartners(reindexed, null);
    } catch (err) {
      console.error('Failed to reorder partners:', err);
      setToast({ open: true, severity: 'error', message: 'Reorder failed.' });
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
    <Box sx={{ pb: 12 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4">Partners Management — ניהול שותפים</Typography>
          <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
            Manage the partner cards shown in the "השותפים שלנו" section on the public home page.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            component="a"
            href="/public#medical-partners"
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Add Partner
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        {partners.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <HandshakeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No partners yet. Click "Add Partner" to get started.</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {partners.map((p, index) => (
              <Paper
                key={p.id}
                variant="outlined"
                sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
              >
                {/* Logo preview */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
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
                  <IconButton size="small" onClick={() => handleMove(index, -1)} disabled={index === 0} aria-label="Move up">
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleMove(index, 1)} disabled={index === partners.length - 1} aria-label="Move down">
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Box>

                <IconButton onClick={() => openEdit(p)} aria-label="Edit partner">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => setConfirmDeleteId(p.id)} aria-label="Delete partner" color="error">
                  <DeleteOutlineIcon />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Create / Edit dialog */}
      <Dialog open={editorOpen} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle>{editorMode === 'create' ? 'Add Partner' : 'Edit Partner'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Partner Name (שם השותף) *"
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
              inputProps={{ maxLength: LIMITS.name }}
              error={showError('name')}
              helperText={(showError('name') && errors.name) || `${draft.name.length} / ${LIMITS.name}`}
              required
              fullWidth
            />
            <TextField
              label="Logo URL"
              value={draft.logoUrl}
              onChange={(e) => setField('logoUrl', e.target.value)}
              inputProps={{ maxLength: LIMITS.logoUrl }}
              error={showError('logoUrl')}
              helperText={
                (showError('logoUrl') && errors.logoUrl) ||
                'Direct image URL (https://…). Leave empty to show initials.'
              }
              fullWidth
            />
            <TextField
              label="Description (תיאור קצר) *"
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
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={Boolean(confirmDeleteId)} onClose={() => !deleting && setConfirmDeleteId(null)}>
        <DialogTitle>Delete this partner?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. The partner card will be removed from the public website.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
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
