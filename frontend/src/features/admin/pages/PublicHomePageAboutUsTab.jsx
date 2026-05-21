import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { logAuditEvent } from '../services/auditService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_ABOUT_US,
  ABOUT_US_CARD_COUNT,
  mergeAboutUs,
} from '../../public/services/publicPagesService';
import {
  ABOUT_US_ICON_LIBRARY,
  ABOUT_US_ICON_KEYS,
  DEFAULT_ABOUT_US_ICON_KEY,
  getAboutUsIconEntry,
  isKnownAboutUsIconKey,
} from '../../public/components/cmsIcons';
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

const LIMITS = {
  paragraph: 600,
  cardTitle: 40,
  cardDescription: 160,
};

function emptyForm() {
  return {
    paragraph: '',
    cards: Array.from({ length: ABOUT_US_CARD_COUNT }, () => ({
      iconKey: DEFAULT_ABOUT_US_ICON_KEY,
      title: '',
      description: '',
    })),
  };
}

function aboutUsToForm(aboutUs) {
  return {
    paragraph: aboutUs.paragraph || '',
    cards: aboutUs.cards.map((card) => ({
      iconKey: card.iconKey || DEFAULT_ABOUT_US_ICON_KEY,
      title: card.title || '',
      description: card.description || '',
    })),
  };
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

export default function PublicHomePageAboutUsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pristine, setPristine] = useState(emptyForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [docMeta, setDocMeta] = useState({ updatedAt: null, updatedBy: '' });
  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
        let snap = await getDoc(ref);

        // Defensive auto-create / auto-fill: if the doc or its aboutUs field
        // group is missing, populate it with the seed defaults so the form is
        // never empty.
        if (!snap.exists()) {
          await setDoc(ref, {
            aboutUs: {
              paragraph: DEFAULT_ABOUT_US.paragraph,
              cards: DEFAULT_ABOUT_US.cards.map((card) => ({ ...card })),
            },
            updatedAt: serverTimestamp(),
            updatedBy: 'system-seed',
          });
          snap = await getDoc(ref);
        } else if (!snap.data()?.aboutUs) {
          await updateDoc(ref, {
            'aboutUs.paragraph': DEFAULT_ABOUT_US.paragraph,
            'aboutUs.cards': DEFAULT_ABOUT_US.cards.map((card) => ({ ...card })),
            updatedAt: serverTimestamp(),
            updatedBy: 'system-seed',
          });
          snap = await getDoc(ref);
        }

        if (!active) return;
        const data = snap.data() || {};
        const merged = mergeAboutUs(data.aboutUs);
        const next = aboutUsToForm(merged);
        setForm(next);
        setPristine(next);
        setDocMeta({
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || '',
        });
      } catch (err) {
        console.error('Failed to load public_pages/home aboutUs:', err);
        const next = aboutUsToForm(mergeAboutUs(undefined));
        setForm(next);
        setPristine(next);
        setToast({ open: true, severity: 'error', message: 'Failed to load About Us content.' });
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
    if (!form.paragraph.trim()) next.paragraph = 'Paragraph is required.';
    form.cards.forEach((card, index) => {
      if (!card.title.trim()) next[`cards.${index}.title`] = 'Title is required.';
      if (!card.description.trim()) next[`cards.${index}.description`] = 'Description is required.';
      if (!isKnownAboutUsIconKey(card.iconKey)) next[`cards.${index}.iconKey`] = 'Pick an icon.';
    });
    return next;
  }, [form]);

  const hasErrors = Object.keys(errors).length > 0;
  const canSave = dirty && !hasErrors && !saving;

  function shouldShowError(field) {
    return Boolean(errors[field]) && (submitted || touched[field]);
  }

  function setParagraph(value) {
    setForm((prev) => ({ ...prev, paragraph: value }));
  }

  function setCardField(index, key, value) {
    setForm((prev) => ({
      ...prev,
      cards: prev.cards.map((card, i) => (i === index ? { ...card, [key]: value } : card)),
    }));
  }

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSave() {
    setSubmitted(true);
    if (!canSave) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      const updatedBy = user?.email || user?.uid || '';

      // Defensive normalization: enforce iconKey is one of the library keys,
      // exactly ABOUT_US_CARD_COUNT cards, and trimmed strings.
      const cleanCards = form.cards.slice(0, ABOUT_US_CARD_COUNT).map((card, index) => ({
        iconKey: isKnownAboutUsIconKey(card.iconKey)
          ? card.iconKey
          : DEFAULT_ABOUT_US.cards[index].iconKey,
        title: card.title.trim(),
        description: card.description.trim(),
      }));

      const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
      await updateDoc(ref, {
        'aboutUs.paragraph': form.paragraph.trim(),
        'aboutUs.cards': cleanCards,
        updatedAt: serverTimestamp(),
        updatedBy,
      });

      await logAuditEvent({
        actionType: 'UPDATE_PUBLIC_HOME_ABOUT_US',
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: { section: 'aboutUs', after: { paragraph: form.paragraph.trim(), cards: cleanCards } },
      });

      const persisted = { paragraph: form.paragraph.trim(), cards: cleanCards };
      setPristine(persisted);
      setForm(persisted);
      setTouched({});
      setSubmitted(false);
      setDocMeta({ updatedAt: new Date(), updatedBy });
      setToast({ open: true, severity: 'success', message: 'About Us updated.' });
    } catch (err) {
      console.error('Failed to save About Us content:', err);
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
      {lastUpdatedLabel || docMeta.updatedBy ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Last updated: {lastUpdatedLabel || '—'}
          {docMeta.updatedBy ? ` by ${docMeta.updatedBy}` : ''}
        </Typography>
      ) : null}

      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Intro Paragraph</Typography>
          <TextField
            label="Paragraph"
            value={form.paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            onBlur={() => markTouched('paragraph')}
            inputProps={{ maxLength: LIMITS.paragraph }}
            helperText={
              (shouldShowError('paragraph') && errors.paragraph) ||
              `${form.paragraph.length} / ${LIMITS.paragraph}`
            }
            error={shouldShowError('paragraph')}
            multiline
            minRows={4}
            required
            fullWidth
            id="aboutus-paragraph"
          />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>Cards</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Exactly 4 cards. Each card has an icon, title, and description.
          </Typography>
          <Stack spacing={3}>
            {form.cards.map((card, index) => (
              <CardEditor
                key={index}
                index={index}
                card={card}
                onChangeField={(key, value) => setCardField(index, key, value)}
                onBlurField={(key) => markTouched(`cards.${index}.${key}`)}
                showTitleError={shouldShowError(`cards.${index}.title`)}
                showDescriptionError={shouldShowError(`cards.${index}.description`)}
                titleErrorText={errors[`cards.${index}.title`]}
                descriptionErrorText={errors[`cards.${index}.description`]}
              />
            ))}
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
          id="btn-save-aboutus"
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

function CardEditor({
  index,
  card,
  onChangeField,
  onBlurField,
  showTitleError,
  showDescriptionError,
  titleErrorText,
  descriptionErrorText,
}) {
  const selectedEntry = getAboutUsIconEntry(card.iconKey);
  const SelectedIcon = selectedEntry.Icon;

  return (
    <Box sx={{ p: 2.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
        Card {index + 1}
      </Typography>
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Icon
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              <SelectedIcon size={28} strokeWidth={1.5} />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {ABOUT_US_ICON_LIBRARY.map(({ key, label, Icon }) => {
                const isSelected = key === card.iconKey;
                return (
                  <Tooltip key={key} title={label} arrow>
                    <IconButton
                      onClick={() => onChangeField('iconKey', key)}
                      aria-label={`Select icon ${label}`}
                      aria-pressed={isSelected}
                      size="small"
                      sx={{
                        width: 36,
                        height: 36,
                        border: 1,
                        borderRadius: 1.5,
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        color: isSelected ? 'primary.main' : 'text.secondary',
                        bgcolor: isSelected ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.light' },
                      }}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                    </IconButton>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        </Box>

        <TextField
          label="Title"
          value={card.title}
          onChange={(e) => onChangeField('title', e.target.value)}
          onBlur={() => onBlurField('title')}
          inputProps={{ maxLength: LIMITS.cardTitle }}
          helperText={(showTitleError && titleErrorText) || `${card.title.length} / ${LIMITS.cardTitle}`}
          error={showTitleError}
          required
          fullWidth
          id={`aboutus-card-${index}-title`}
        />
        <TextField
          label="Description"
          value={card.description}
          onChange={(e) => onChangeField('description', e.target.value)}
          onBlur={() => onBlurField('description')}
          inputProps={{ maxLength: LIMITS.cardDescription }}
          helperText={
            (showDescriptionError && descriptionErrorText) ||
            `${card.description.length} / ${LIMITS.cardDescription}`
          }
          error={showDescriptionError}
          multiline
          minRows={2}
          required
          fullWidth
          id={`aboutus-card-${index}-description`}
        />
      </Stack>
    </Box>
  );
}

// Re-export the keys so other modules can import from a single place if needed.
export { ABOUT_US_ICON_KEYS };
