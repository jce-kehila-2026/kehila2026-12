import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { logAuditEvent } from '../services/auditService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_TEAM_MEMBERS,
  mergeTeamMembers,
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
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const LIMITS = {
  name: 60,
  role: 80,
  bio: 400,
  email: 120,
  imageUrl: 500,
};

function generateMemberId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `team-${crypto.randomUUID()}`;
  }
  return `team-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

function isValidEmailOrEmpty(value) {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function emptyDraft() {
  return { id: '', name: '', role: '', bio: '', imageUrl: '', email: '' };
}

function reindexOrder(list) {
  return list.map((m, index) => ({ ...m, order: index }));
}

export default function PublicHomePageTeamTab() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
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
        const seed = DEFAULT_TEAM_MEMBERS.map((m) => ({ ...m }));
        if (!snap.exists()) {
          await setDoc(ref, {
            teamMembers: seed,
            updatedAt: serverTimestamp(),
            updatedBy: 'system-seed',
          });
          if (active) setMembers(seed);
        } else {
          const data = snap.data() || {};
          if (!Array.isArray(data.teamMembers)) {
            await updateDoc(ref, {
              teamMembers: seed,
              updatedAt: serverTimestamp(),
              updatedBy: 'system-seed',
            });
            if (active) setMembers(seed);
          } else if (active) {
            setMembers(mergeTeamMembers(data.teamMembers));
          }
        }
      } catch (err) {
        console.error('Failed to load teamMembers:', err);
        if (active) {
          setToast({ open: true, severity: 'error', message: 'Failed to load team members.' });
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
    if (!draft.name.trim()) next.name = 'Name is required.';
    if (!draft.role.trim()) next.role = 'Role is required.';
    if (!isValidUrlOrEmpty(draft.imageUrl)) next.imageUrl = 'Invalid URL.';
    if (!isValidEmailOrEmpty(draft.email)) next.email = 'Invalid email.';
    return next;
  }, [draft]);

  const hasErrors = Object.keys(errors).length > 0;

  function openCreate() {
    setEditorMode('create');
    setDraft(emptyDraft());
    setSubmitted(false);
    setEditorOpen(true);
  }

  function openEdit(member) {
    setEditorMode('edit');
    setDraft({
      id: member.id,
      name: member.name || '',
      role: member.role || '',
      bio: member.bio || '',
      imageUrl: member.imageUrl || '',
      email: member.email || '',
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

  async function persistMembers(nextMembers, audit) {
    const ordered = reindexOrder(nextMembers);
    const user = auth.currentUser;
    const updatedBy = user?.email || user?.uid || '';
    const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
    await updateDoc(ref, {
      teamMembers: ordered.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        bio: m.bio,
        imageUrl: m.imageUrl,
        email: m.email,
        order: m.order,
      })),
      updatedAt: serverTimestamp(),
      updatedBy,
    });
    if (audit) {
      await logAuditEvent({
        actionType: audit.actionType,
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: { section: 'teamMembers', memberId: audit.memberId, change: audit.change },
      });
    }
    setMembers(ordered);
  }

  async function handleSave() {
    setSubmitted(true);
    if (hasErrors) return;
    setSaving(true);
    try {
      const clean = {
        id: draft.id || generateMemberId(),
        name: draft.name.trim(),
        role: draft.role.trim(),
        bio: draft.bio.trim(),
        imageUrl: draft.imageUrl.trim(),
        email: draft.email.trim(),
      };
      let next;
      let audit;
      if (editorMode === 'create') {
        next = [...members, { ...clean, order: members.length }];
        audit = { actionType: 'CREATE_PUBLIC_HOME_TEAM_MEMBER', memberId: clean.id, change: 'create' };
      } else {
        next = members.map((m) =>
          m.id === clean.id ? { ...clean, order: m.order } : m,
        );
        audit = { actionType: 'UPDATE_PUBLIC_HOME_TEAM_MEMBER', memberId: clean.id, change: 'update' };
      }
      await persistMembers(next, audit);
      setEditorOpen(false);
      setToast({
        open: true,
        severity: 'success',
        message: editorMode === 'create' ? 'Team member added.' : 'Team member updated.',
      });
    } catch (err) {
      console.error('Failed to save team member:', err);
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
      const next = members.filter((m) => m.id !== id);
      await persistMembers(next, {
        actionType: 'DELETE_PUBLIC_HOME_TEAM_MEMBER',
        memberId: id,
        change: 'delete',
      });
      setConfirmDeleteId(null);
      setToast({ open: true, severity: 'success', message: 'Team member deleted.' });
    } catch (err) {
      console.error('Failed to delete team member:', err);
      setToast({ open: true, severity: 'error', message: 'Delete failed. Please try again.' });
    } finally {
      setDeleting(false);
    }
  }

  async function moveMember(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= members.length || fromIndex === toIndex) return;
    const next = members.slice();
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    try {
      await persistMembers(next, {
        actionType: 'REORDER_PUBLIC_HOME_TEAM_MEMBERS',
        memberId: moved.id,
        change: `move ${fromIndex} -> ${toIndex}`,
      });
    } catch (err) {
      console.error('Failed to reorder team members:', err);
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
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: '1rem' }}>
          <Box>
            <Typography variant="h6">Team Members</Typography>
            <Typography variant="body2" color="text.secondary">
              Members shown in the "הכירו את הצוות שלנו" section on the public home page.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ flexShrink: 0 }}
          >
            Add team member
          </Button>
        </Box>

        {members.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No team members yet.</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {members.map((m, index) => (
              <Paper
                key={m.id}
                variant="outlined"
                sx={{ p: 2, display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                <Avatar src={m.imageUrl || undefined} sx={{ width: '3.5rem', height: '3.5rem' }}>
                  {(m.name || '?').slice(0, 1)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                    {m.name || '—'}
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ display: 'block' }} noWrap>
                    {m.role}
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
                    {m.bio}
                  </Typography>
                  {m.email ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                      {m.email}
                    </Typography>
                  ) : null}
                </Box>
                <Stack direction="column" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => moveMember(index, index - 1)}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => moveMember(index, index + 1)}
                    disabled={index === members.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <IconButton onClick={() => openEdit(m)} aria-label="Edit">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => setConfirmDeleteId(m.id)} aria-label="Delete" color="error">
                  <DeleteOutlineIcon />
                </IconButton>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={editorOpen} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle>{editorMode === 'create' ? 'Add team member' : 'Edit team member'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
              inputProps={{ maxLength: LIMITS.name }}
              error={showError('name')}
              helperText={(showError('name') && errors.name) || `${draft.name.length} / ${LIMITS.name}`}
              required
              fullWidth
            />
            <TextField
              label="Role"
              value={draft.role}
              onChange={(e) => setField('role', e.target.value)}
              inputProps={{ maxLength: LIMITS.role }}
              error={showError('role')}
              helperText={(showError('role') && errors.role) || `${draft.role.length} / ${LIMITS.role}`}
              required
              fullWidth
            />
            <TextField
              label="Biography"
              value={draft.bio}
              onChange={(e) => setField('bio', e.target.value)}
              inputProps={{ maxLength: LIMITS.bio }}
              helperText={`${draft.bio.length} / ${LIMITS.bio}`}
              multiline
              minRows={3}
              fullWidth
            />
            <TextField
              label="Image URL"
              value={draft.imageUrl}
              onChange={(e) => setField('imageUrl', e.target.value)}
              inputProps={{ maxLength: LIMITS.imageUrl }}
              error={showError('imageUrl')}
              helperText={
                (showError('imageUrl') && errors.imageUrl) ||
                'Plain text URL (https://…). Leave empty to show an initial.'
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={draft.email}
              onChange={(e) => setField('email', e.target.value)}
              inputProps={{ maxLength: LIMITS.email }}
              error={showError('email')}
              helperText={(showError('email') && errors.email) || 'Used for the contact button on the card.'}
              fullWidth
              type="email"
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

      <Dialog open={Boolean(confirmDeleteId)} onClose={() => !deleting && setConfirmDeleteId(null)}>
        <DialogTitle>Delete this team member?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
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
