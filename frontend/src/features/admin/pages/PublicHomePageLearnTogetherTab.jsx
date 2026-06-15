import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { logAuditEvent } from '../services/auditService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_LEARN_TOGETHER,
  LEARN_TOGETHER_MAX_SECTIONS,
  mergeLearnTogether,
  emptyLearnTogetherPopup,
  popupHasLegacyFields,
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
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const LIMITS = {
  eyebrow: 40,
  title: 80,
  paragraph: 300,
  cardTitle: 40,
  cardDescription: 160,
  popupTitle: 60,
  popupParagraph: 400,
  popupSectionLabel: 30,
  popupSectionText: 300,
};

function isValidUrlOrAnchorOrEmpty(value) {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return true;
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

function generateCardId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `card-${crypto.randomUUID()}`;
  }
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

function cardWithOrders(cards) {
  return cards.map((card, index) => ({ ...card, order: index }));
}

function emptyCardDraft() {
  return {
    id: '',
    imageUrl: '',
    title: '',
    description: '',
    popup: emptyLearnTogetherPopup(),
  };
}

export default function PublicHomePageLearnTogetherTab() {
  const [loading, setLoading] = useState(true);
  const [savingHeader, setSavingHeader] = useState(false);
  const [docMeta, setDocMeta] = useState({ updatedAt: null, updatedBy: '' });
  const [header, setHeader] = useState({ eyebrow: '', title: '', paragraph: '' });
  const [headerPristine, setHeaderPristine] = useState({ eyebrow: '', title: '', paragraph: '' });
  const [cards, setCards] = useState([]);
  const [headerTouched, setHeaderTouched] = useState({});
  const [headerSubmitted, setHeaderSubmitted] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [editorDraft, setEditorDraft] = useState(emptyCardDraft);
  const [editorSubmitted, setEditorSubmitted] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const dragIndexRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
        let snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            learnTogether: {
              eyebrow: DEFAULT_LEARN_TOGETHER.eyebrow,
              title: DEFAULT_LEARN_TOGETHER.title,
              paragraph: DEFAULT_LEARN_TOGETHER.paragraph,
              cards: DEFAULT_LEARN_TOGETHER.cards.map((card) => ({
                ...card,
                popup: { ...card.popup },
                createdAt: null,
              })),
            },
            updatedAt: serverTimestamp(),
            updatedBy: 'system-seed',
          });
          snap = await getDoc(ref);
        } else if (!snap.data()?.learnTogether) {
          await updateDoc(ref, {
            'learnTogether.eyebrow': DEFAULT_LEARN_TOGETHER.eyebrow,
            'learnTogether.title': DEFAULT_LEARN_TOGETHER.title,
            'learnTogether.paragraph': DEFAULT_LEARN_TOGETHER.paragraph,
            'learnTogether.cards': DEFAULT_LEARN_TOGETHER.cards.map((card) => ({
              ...card,
              popup: { ...card.popup },
              createdAt: null,
            })),
            updatedAt: serverTimestamp(),
            updatedBy: 'system-seed',
          });
          snap = await getDoc(ref);
        }

        if (!active) return;
        const data = snap.data() || {};
        const merged = mergeLearnTogether(data.learnTogether);

        const rawCards = Array.isArray(data.learnTogether?.cards) ? data.learnTogether.cards : [];
        const needsMigration = rawCards.some(
          (card) => popupHasLegacyFields(card?.popup) || Object.hasOwn(card || {}, 'iconKey'),
        );
        if (needsMigration) {
          await updateDoc(ref, {
            'learnTogether.cards': merged.cards.map((card) => ({
              id: card.id,
              imageUrl: card.imageUrl,
              title: card.title,
              description: card.description,
              order: card.order,
              createdAt: card.createdAt || null,
              popup: {
                title: card.popup.title,
                paragraph: card.popup.paragraph,
                sections: card.popup.sections.map((s) => ({ label: s.label, text: s.text })),
                sideImageUrl: card.popup.sideImageUrl,
              },
            })),
            updatedAt: serverTimestamp(),
            updatedBy: 'system-migration-sections',
          });
          await logAuditEvent({
            actionType: 'MIGRATE_PUBLIC_HOME_LEARN_TOGETHER_POPUP_SCHEMA',
            targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
            details: { section: 'learnTogether', change: 'sections-array + drop cta/iconKey' },
          });
        }

        const nextHeader = {
          eyebrow: merged.eyebrow,
          title: merged.title,
          paragraph: merged.paragraph,
        };
        setHeader(nextHeader);
        setHeaderPristine(nextHeader);
        setCards(merged.cards);
        setDocMeta({
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || '',
        });
      } catch (err) {
        console.error('Failed to load public_pages/home learnTogether:', err);
        const fallback = mergeLearnTogether(undefined);
        const nextHeader = {
          eyebrow: fallback.eyebrow,
          title: fallback.title,
          paragraph: fallback.paragraph,
        };
        setHeader(nextHeader);
        setHeaderPristine(nextHeader);
        setCards(fallback.cards);
        setToast({
          open: true,
          severity: 'error',
          message: 'Failed to load Learn Together content.',
        });
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const headerErrors = useMemo(() => {
    const next = {};
    if (!header.eyebrow.trim()) next.eyebrow = 'Eyebrow is required.';
    if (!header.title.trim()) next.title = 'Title is required.';
    if (!header.paragraph.trim()) next.paragraph = 'Intro paragraph is required.';
    return next;
  }, [header]);

  const headerDirty =
    header.eyebrow !== headerPristine.eyebrow ||
    header.title !== headerPristine.title ||
    header.paragraph !== headerPristine.paragraph;

  const canSaveHeader =
    headerDirty && Object.keys(headerErrors).length === 0 && !savingHeader;

  function shouldShowHeaderError(field) {
    return Boolean(headerErrors[field]) && (headerSubmitted || headerTouched[field]);
  }

  function markHeaderTouched(field) {
    setHeaderTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSaveHeader() {
    setHeaderSubmitted(true);
    if (!canSaveHeader) return;
    setSavingHeader(true);
    try {
      const user = auth.currentUser;
      const updatedBy = user?.email || user?.uid || '';
      const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
      const payload = {
        'learnTogether.eyebrow': header.eyebrow.trim(),
        'learnTogether.title': header.title.trim(),
        'learnTogether.paragraph': header.paragraph.trim(),
        updatedAt: serverTimestamp(),
        updatedBy,
      };
      await updateDoc(ref, payload);
      await logAuditEvent({
        actionType: 'UPDATE_PUBLIC_HOME_LEARN_TOGETHER_HEADER',
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: {
          section: 'learnTogether',
          after: {
            eyebrow: header.eyebrow.trim(),
            title: header.title.trim(),
            paragraph: header.paragraph.trim(),
          },
        },
      });
      const persisted = {
        eyebrow: header.eyebrow.trim(),
        title: header.title.trim(),
        paragraph: header.paragraph.trim(),
      };
      setHeader(persisted);
      setHeaderPristine(persisted);
      setHeaderTouched({});
      setHeaderSubmitted(false);
      setDocMeta({ updatedAt: new Date(), updatedBy });
      setToast({
        open: true,
        severity: 'success',
        message: 'Learn Together header updated.',
      });
    } catch (err) {
      console.error('Failed to save Learn Together header:', err);
      setToast({
        open: true,
        severity: 'error',
        message: 'Save failed. Please try again.',
      });
    } finally {
      setSavingHeader(false);
    }
  }

  function handleDiscardHeader() {
    setHeader(headerPristine);
    setHeaderTouched({});
    setHeaderSubmitted(false);
  }

  async function persistCards(nextCardsRaw, audit) {
    const nextCards = cardWithOrders(nextCardsRaw);
    const user = auth.currentUser;
    const updatedBy = user?.email || user?.uid || '';
    const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
    await updateDoc(ref, {
      'learnTogether.cards': nextCards.map((card) => ({
        id: card.id,
        imageUrl: card.imageUrl,
        title: card.title,
        description: card.description,
        order: card.order,
        createdAt: card.createdAt || null,
        popup: {
          title: card.popup?.title || '',
          paragraph: card.popup?.paragraph || '',
          sections: Array.isArray(card.popup?.sections)
            ? card.popup.sections
                .map((s) => ({ label: (s?.label || '').trim(), text: (s?.text || '').trim() }))
                .filter((s) => s.label && s.text)
                .slice(0, LEARN_TOGETHER_MAX_SECTIONS)
            : [],
          sideImageUrl: card.popup?.sideImageUrl || '',
        },
      })),
      updatedAt: serverTimestamp(),
      updatedBy,
    });
    if (audit) {
      await logAuditEvent({
        actionType: audit.actionType,
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: { section: 'learnTogether', cardId: audit.cardId, change: audit.change },
      });
    }
    setCards(nextCards);
    setDocMeta({ updatedAt: new Date(), updatedBy });
  }

  function openCreateEditor() {
    setEditorMode('create');
    setEditorDraft(emptyCardDraft());
    setEditorSubmitted(false);
    setEditorOpen(true);
  }

  function openEditEditor(card) {
    setEditorMode('edit');
    setEditorDraft({
      id: card.id,
      imageUrl: card.imageUrl || '',
      title: card.title || '',
      description: card.description || '',
      popup: { ...emptyLearnTogetherPopup(), ...card.popup },
    });
    setEditorSubmitted(false);
    setEditorOpen(true);
  }

  function closeEditor() {
    if (editorSaving) return;
    setEditorOpen(false);
  }

  const editorErrors = useMemo(() => {
    const next = {};
    const d = editorDraft;
    if (!d.title.trim()) next.title = 'Title is required.';
    if (!d.description.trim()) next.description = 'Description is required.';
    if (!isValidUrlOrAnchorOrEmpty(d.imageUrl)) next.imageUrl = 'Invalid URL.';
    if (!d.popup.title.trim()) next['popup.title'] = 'Popup title is required.';
    if (!d.popup.paragraph.trim()) next['popup.paragraph'] = 'Popup paragraph is required.';
    const sections = Array.isArray(d.popup.sections) ? d.popup.sections : [];
    sections.forEach((section, index) => {
      const label = (section.label || '').trim();
      const text = (section.text || '').trim();
      if (label && !text) next[`popup.sections.${index}.text`] = 'Text is required when label is set.';
      if (!label && text) next[`popup.sections.${index}.label`] = 'Label is required when text is set.';
      if (!label && !text) {
        next[`popup.sections.${index}.label`] = 'Remove this sub-section or fill both fields.';
      }
    });
    if (!isValidUrlOrAnchorOrEmpty(d.popup.sideImageUrl)) next['popup.sideImageUrl'] = 'Invalid URL.';
    return next;
  }, [editorDraft]);

  const editorHasErrors = Object.keys(editorErrors).length > 0;

  function setDraftField(key, value) {
    setEditorDraft((prev) => ({ ...prev, [key]: value }));
  }

  function setDraftPopupField(key, value) {
    setEditorDraft((prev) => ({ ...prev, popup: { ...prev.popup, [key]: value } }));
  }

  async function handleSaveCard() {
    setEditorSubmitted(true);
    if (editorHasErrors) return;
    setEditorSaving(true);
    try {
      const cleanCard = {
        id: editorDraft.id || generateCardId(),
        imageUrl: editorDraft.imageUrl.trim(),
        title: editorDraft.title.trim(),
        description: editorDraft.description.trim(),
        order: 0,
        createdAt: null,
        popup: {
          title: editorDraft.popup.title.trim(),
          paragraph: editorDraft.popup.paragraph.trim(),
          sections: (Array.isArray(editorDraft.popup.sections) ? editorDraft.popup.sections : [])
            .map((section) => ({
              label: (section.label || '').trim(),
              text: (section.text || '').trim(),
            }))
            .filter((section) => section.label && section.text)
            .slice(0, LEARN_TOGETHER_MAX_SECTIONS),
          sideImageUrl: editorDraft.popup.sideImageUrl.trim(),
        },
      };

      let nextCards;
      let action;
      if (editorMode === 'create') {
        cleanCard.createdAt = new Date();
        nextCards = [cleanCard, ...cards];
        action = { actionType: 'CREATE_PUBLIC_HOME_LEARN_TOGETHER_CARD', cardId: cleanCard.id, change: 'create' };
      } else {
        nextCards = cards.map((c) =>
          c.id === cleanCard.id
            ? { ...cleanCard, createdAt: c.createdAt, order: c.order }
            : c,
        );
        action = { actionType: 'UPDATE_PUBLIC_HOME_LEARN_TOGETHER_CARD', cardId: cleanCard.id, change: 'update' };
      }

      await persistCards(nextCards, action);
      setEditorOpen(false);
      setToast({
        open: true,
        severity: 'success',
        message: editorMode === 'create' ? 'Card created.' : 'Card updated.',
      });
    } catch (err) {
      console.error('Failed to save Learn Together card:', err);
      setToast({
        open: true,
        severity: 'error',
        message: 'Save failed. Please try again.',
      });
    } finally {
      setEditorSaving(false);
    }
  }

  async function handleConfirmDelete() {
    const id = confirmDeleteId;
    if (!id) return;
    setDeleting(true);
    try {
      const nextCards = cards.filter((c) => c.id !== id);
      await persistCards(nextCards, {
        actionType: 'DELETE_PUBLIC_HOME_LEARN_TOGETHER_CARD',
        cardId: id,
        change: 'delete',
      });
      setConfirmDeleteId(null);
      setToast({ open: true, severity: 'success', message: 'Card deleted.' });
    } catch (err) {
      console.error('Failed to delete Learn Together card:', err);
      setToast({ open: true, severity: 'error', message: 'Delete failed. Please try again.' });
    } finally {
      setDeleting(false);
    }
  }

  async function reorderCards(fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= cards.length || toIndex >= cards.length) return;
    const next = cards.slice();
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    try {
      await persistCards(next, {
        actionType: 'REORDER_PUBLIC_HOME_LEARN_TOGETHER_CARDS',
        cardId: moved.id,
        change: `move ${fromIndex} -> ${toIndex}`,
      });
      setToast({ open: true, severity: 'success', message: 'Cards reordered.' });
    } catch (err) {
      console.error('Failed to reorder Learn Together cards:', err);
      setToast({ open: true, severity: 'error', message: 'Reorder failed. Please try again.' });
    }
  }

  function handleDragStart(index) {
    dragIndexRef.current = index;
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(targetIndex) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from == null) return;
    reorderCards(from, targetIndex);
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
      {lastUpdatedLabel || docMeta.updatedBy ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Last updated: {lastUpdatedLabel || '—'}
          {docMeta.updatedBy ? ` by ${docMeta.updatedBy}` : ''}
        </Typography>
      ) : null}

      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Section Header
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Eyebrow, title, and intro paragraph above the cards.
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label="Eyebrow"
              value={header.eyebrow}
              onChange={(e) => setHeader((prev) => ({ ...prev, eyebrow: e.target.value }))}
              onBlur={() => markHeaderTouched('eyebrow')}
              inputProps={{ maxLength: LIMITS.eyebrow }}
              helperText={
                (shouldShowHeaderError('eyebrow') && headerErrors.eyebrow) ||
                `${header.eyebrow.length} / ${LIMITS.eyebrow}`
              }
              error={shouldShowHeaderError('eyebrow')}
              required
              fullWidth
            />
            <TextField
              label="Title"
              value={header.title}
              onChange={(e) => setHeader((prev) => ({ ...prev, title: e.target.value }))}
              onBlur={() => markHeaderTouched('title')}
              inputProps={{ maxLength: LIMITS.title }}
              helperText={
                (shouldShowHeaderError('title') && headerErrors.title) ||
                `${header.title.length} / ${LIMITS.title}`
              }
              error={shouldShowHeaderError('title')}
              required
              fullWidth
            />
            <TextField
              label="Intro paragraph"
              value={header.paragraph}
              onChange={(e) => setHeader((prev) => ({ ...prev, paragraph: e.target.value }))}
              onBlur={() => markHeaderTouched('paragraph')}
              inputProps={{ maxLength: LIMITS.paragraph }}
              helperText={
                (shouldShowHeaderError('paragraph') && headerErrors.paragraph) ||
                `${header.paragraph.length} / ${LIMITS.paragraph}`
              }
              error={shouldShowHeaderError('paragraph')}
              multiline
              minRows={3}
              required
              fullWidth
            />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={handleDiscardHeader} disabled={!headerDirty || savingHeader}>
                Discard changes
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveHeader}
                disabled={!canSaveHeader}
              >
                {savingHeader ? 'Saving…' : 'Save header'}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h6">Cards</Typography>
              <Typography variant="body2" color="text.secondary">
                Add, edit, delete, and reorder cards. New cards appear at the top.
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateEditor}>
              Add new card
            </Button>
          </Box>

          {cards.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">No cards yet.</Typography>
            </Box>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {cards.map((card, index) => (
                <CardRow
                  key={card.id}
                  card={card}
                  index={index}
                  total={cards.length}
                  onEdit={() => openEditEditor(card)}
                  onDelete={() => setConfirmDeleteId(card.id)}
                  onMoveUp={() => reorderCards(index, index - 1)}
                  onMoveDown={() => reorderCards(index, index + 1)}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                />
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>

      <CardEditorDialog
        open={editorOpen}
        mode={editorMode}
        draft={editorDraft}
        errors={editorErrors}
        submitted={editorSubmitted}
        saving={editorSaving}
        onChangeField={setDraftField}
        onChangePopupField={setDraftPopupField}
        onClose={closeEditor}
        onSave={handleSaveCard}
      />

      <Dialog open={Boolean(confirmDeleteId)} onClose={() => !deleting && setConfirmDeleteId(null)}>
        <DialogTitle>Delete this card?</DialogTitle>
        <DialogContent>
          <Typography>This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

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

function CardRow({
  card,
  index,
  total,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  return (
    <Box
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        '&:hover': { borderColor: 'primary.light' },
        cursor: 'grab',
      }}
    >
      <DragIndicatorIcon color="action" />
      <Box
        sx={{
          width: 64,
          height: 48,
          borderRadius: 1.5,
          overflow: 'hidden',
          bgcolor: 'action.hover',
          flexShrink: 0,
          backgroundImage: card.imageUrl ? `url(${card.imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
          {card.title || '(untitled)'}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {card.description || '—'}
        </Typography>
      </Box>
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Move up">
          <span>
            <IconButton size="small" onClick={onMoveUp} disabled={index === 0}>
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Move down">
          <span>
            <IconButton size="small" onClick={onMoveDown} disabled={index === total - 1}>
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={onDelete}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}

function CardEditorDialog({
  open,
  mode,
  draft,
  errors,
  submitted,
  saving,
  onChangeField,
  onChangePopupField,
  onClose,
  onSave,
}) {
  function show(field) {
    return Boolean(errors[field]) && submitted;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Add new card' : 'Edit card'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Box>
            <TextField
              label="Card image URL"
              value={draft.imageUrl}
              onChange={(e) => onChangeField('imageUrl', e.target.value)}
              helperText={
                (show('imageUrl') && errors.imageUrl) ||
                'Paste an image URL. Leave empty to show a placeholder.'
              }
              error={show('imageUrl')}
              fullWidth
            />
            {draft.imageUrl ? (
              <Box
                sx={{
                  mt: 1,
                  width: 200,
                  height: 120,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'action.hover',
                  backgroundImage: `url(${draft.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: 1,
                  borderColor: 'divider',
                }}
              />
            ) : null}
          </Box>

          <TextField
            label="Card title"
            value={draft.title}
            onChange={(e) => onChangeField('title', e.target.value)}
            inputProps={{ maxLength: LIMITS.cardTitle }}
            helperText={
              (show('title') && errors.title) || `${draft.title.length} / ${LIMITS.cardTitle}`
            }
            error={show('title')}
            required
            fullWidth
          />
          <TextField
            label="Card description"
            value={draft.description}
            onChange={(e) => onChangeField('description', e.target.value)}
            inputProps={{ maxLength: LIMITS.cardDescription }}
            helperText={
              (show('description') && errors.description) ||
              `${draft.description.length} / ${LIMITS.cardDescription}`
            }
            error={show('description')}
            required
            multiline
            minRows={2}
            fullWidth
          />

          <Divider textAlign="left">Popup Content</Divider>

          <TextField
            label="Popup title"
            value={draft.popup.title}
            onChange={(e) => onChangePopupField('title', e.target.value)}
            inputProps={{ maxLength: LIMITS.popupTitle }}
            helperText={
              (show('popup.title') && errors['popup.title']) ||
              `${draft.popup.title.length} / ${LIMITS.popupTitle}`
            }
            error={show('popup.title')}
            required
            fullWidth
          />
          <TextField
            label="Popup intro paragraph"
            value={draft.popup.paragraph}
            onChange={(e) => onChangePopupField('paragraph', e.target.value)}
            inputProps={{ maxLength: LIMITS.popupParagraph }}
            helperText={
              (show('popup.paragraph') && errors['popup.paragraph']) ||
              `${draft.popup.paragraph.length} / ${LIMITS.popupParagraph}`
            }
            error={show('popup.paragraph')}
            required
            multiline
            minRows={3}
            fullWidth
          />

          <SectionsEditor
            sections={Array.isArray(draft.popup.sections) ? draft.popup.sections : []}
            errors={errors}
            submitted={submitted}
            onChange={(nextSections) => onChangePopupField('sections', nextSections)}
          />

          <Box>
            <TextField
              label="Popup side image URL"
              value={draft.popup.sideImageUrl}
              onChange={(e) => onChangePopupField('sideImageUrl', e.target.value)}
              helperText={
                (show('popup.sideImageUrl') && errors['popup.sideImageUrl']) ||
                'Image shown beside the popup content.'
              }
              error={show('popup.sideImageUrl')}
              fullWidth
            />
            {draft.popup.sideImageUrl ? (
              <Box
                sx={{
                  mt: 1,
                  width: 200,
                  height: 120,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'action.hover',
                  backgroundImage: `url(${draft.popup.sideImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: 1,
                  borderColor: 'divider',
                }}
              />
            ) : null}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SectionsEditor({ sections, errors, submitted, onChange }) {
  function updateAt(index, key, value) {
    const next = sections.map((section, i) =>
      i === index ? { ...section, [key]: value } : section,
    );
    onChange(next);
  }

  function removeAt(index) {
    onChange(sections.filter((_, i) => i !== index));
  }

  function addSection() {
    if (sections.length >= LEARN_TOGETHER_MAX_SECTIONS) return;
    onChange([...sections, { label: '', text: '' }]);
  }

  function show(key) {
    return Boolean(errors[key]) && submitted;
  }

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Sub-sections ({sections.length} / {LEARN_TOGETHER_MAX_SECTIONS})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Add up to {LEARN_TOGETHER_MAX_SECTIONS} labeled blocks.
        </Typography>
      </Box>

      {sections.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No sub-sections — the popup will show only the title and intro paragraph.
        </Typography>
      ) : null}

      {sections.map((section, index) => {
        const labelKey = `popup.sections.${index}.label`;
        const textKey = `popup.sections.${index}.text`;
        return (
          <Box
            key={index}
            sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Sub-section {index + 1}
              </Typography>
              <Button
                size="small"
                color="error"
                onClick={() => removeAt(index)}
                aria-label={`Remove sub-section ${index + 1}`}
              >
                Remove
              </Button>
            </Box>
            <Stack spacing={1.5}>
              <TextField
                label="Label"
                value={section.label || ''}
                onChange={(e) => updateAt(index, 'label', e.target.value)}
                inputProps={{ maxLength: LIMITS.popupSectionLabel }}
                helperText={
                  (show(labelKey) && errors[labelKey]) ||
                  `${(section.label || '').length} / ${LIMITS.popupSectionLabel}`
                }
                error={show(labelKey)}
                required
                fullWidth
              />
              <TextField
                label="Text"
                value={section.text || ''}
                onChange={(e) => updateAt(index, 'text', e.target.value)}
                inputProps={{ maxLength: LIMITS.popupSectionText }}
                helperText={
                  (show(textKey) && errors[textKey]) ||
                  `${(section.text || '').length} / ${LIMITS.popupSectionText}`
                }
                error={show(textKey)}
                required
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
          </Box>
        );
      })}

      {sections.length < LEARN_TOGETHER_MAX_SECTIONS ? (
        <Button startIcon={<AddIcon />} onClick={addSection} sx={{ alignSelf: 'flex-start' }}>
          Add sub-section
        </Button>
      ) : null}
    </Stack>
  );
}
