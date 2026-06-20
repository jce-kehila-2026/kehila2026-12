import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { useAdminLocale } from '../context/AdminLocaleContext';
import { logAuditEvent } from '../services/auditService';
import { isTranslationConfigured, translateFields, translateItems } from '../services/translationService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_HOME_HERO,
  DEFAULT_STATISTICS,
  STATISTIC_ICON_KEYS,
  STATISTICS_MAX,
  mergeHero,
  mergeStatistics,
} from '../../public/services/publicPagesService';
import { BookOpen, HandHeart, Heart, Megaphone, Sparkles, UsersRound } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

const LIMITS = {
  title: 80,
  subtitle: 120,
  description: 400,
  statTitle: 40,
  statDescription: 120,
  statValueMax: 999999999,
};

const STAT_ICON_COMPONENTS = {
  'hands-heart': HandHeart,
  megaphone: Megaphone,
  'users-round': UsersRound,
  'book-open': BookOpen,
  heart: Heart,
  sparkles: Sparkles,
};

// Icon keys stay English (stored values); only the display labels are translated.
const STAT_ICON_LABEL_KEYS = {
  'hands-heart': 'cmsIconHandsHeart',
  megaphone: 'cmsIconMegaphone',
  'users-round': 'cmsIconUsers',
  'book-open': 'cmsIconBook',
  heart: 'cmsIconHeart',
  sparkles: 'cmsIconSparkles',
};

const INTL_LOCALE_BY_LANG = { he: 'he-IL', en: 'en-US' };

function StatIconGlyph({ iconKey, size = 20 }) {
  const Icon = STAT_ICON_COMPONENTS[iconKey];
  if (!Icon) return null;
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      absoluteStrokeWidth
      aria-hidden="true"
      style={{ flexShrink: 0, color: '#7f22d9' }}
    />
  );
}

const SEED_HERO = {
  title: 'את לא לבד במסע שלך',
  subtitle: 'קהילה תומכת לנשים ולמתמודדות עם סרטן',
  description: 'מרחב חם, בטוח ומקצועי לתמיכה, ליווי, למידה ותקווה לאורך הדרך.',
  backgroundImageUrl: '',
};

function statisticsToForm(statistics) {
  return statistics.map((stat) => ({
    id: stat.id || '',
    icon: stat.icon || STATISTIC_ICON_KEYS[0],
    value: Number.isFinite(stat.value) ? String(stat.value) : '',
    title: stat.title || '',
    description: stat.description || '',
  }));
}

function emptyForm() {
  return {
    title: '',
    subtitle: '',
    description: '',
    backgroundImageUrl: '',
    statistics: statisticsToForm(DEFAULT_STATISTICS),
  };
}

function heroToForm(hero, statistics) {
  return {
    title: hero.title || '',
    subtitle: hero.subtitle || '',
    description: hero.description || '',
    backgroundImageUrl: hero.backgroundImageUrl || '',
    statistics: statisticsToForm(
      Array.isArray(statistics) && statistics.length ? statistics : DEFAULT_STATISTICS,
    ),
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

function formatTimestamp(value, intlLocale) {
  if (!value) return '';
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function PublicHomePageHomeTab() {
  const { t, lang, direction } = useAdminLocale();
  const intlLocale = INTL_LOCALE_BY_LANG[lang] || 'en-US';
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
        const mergedStats = mergeStatistics(data.statistics);
        const next = heroToForm(merged, mergedStats);
        setForm(next);
        setPristine(next);
        setDocMeta({
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || '',
          exists: true,
        });
      } catch (err) {
        console.error('Failed to load public_pages/home:', err);
        const next = heroToForm(DEFAULT_HOME_HERO, DEFAULT_STATISTICS);
        setForm(next);
        setPristine(next);
        setDocMeta({ updatedAt: null, updatedBy: '', exists: false });
        setToast({ open: true, severity: 'error', message: t('cmsHomeLoadFailed') });
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
    if (!form.title.trim()) next.title = t('cmsTitleRequired');
    if (form.backgroundImageUrl && !isValidUrlOrAnchor(form.backgroundImageUrl)) {
      next.backgroundImageUrl = t('cmsEnterValidUrl');
    }
    (form.statistics || []).forEach((stat, index) => {
      if (!stat.title.trim()) next[`stat.${index}.title`] = t('cmsTitleRequired');
      if (stat.value === '' || stat.value === null || stat.value === undefined) {
        next[`stat.${index}.value`] = t('cmsValueRequired');
      } else {
        const parsed = Number(stat.value);
        if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
          next[`stat.${index}.value`] = t('cmsValueWholeNumber');
        } else if (parsed > LIMITS.statValueMax) {
          next[`stat.${index}.value`] = t('cmsValueTooLarge');
        }
      }
      if (!STATISTIC_ICON_KEYS.includes(stat.icon)) {
        next[`stat.${index}.icon`] = t('cmsPickIcon');
      }
    });
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
  function setStatField(index, key, value) {
    setForm((prev) => ({
      ...prev,
      statistics: prev.statistics.map((stat, i) => (i === index ? { ...stat, [key]: value } : stat)),
    }));
  }
  function handleStatBlur(index, key) {
    setTouched((prev) => ({ ...prev, [`stat.${index}.${key}`]: true }));
  }

  async function handleSave() {
    setSubmitted(true);
    if (!canSave) return;
    setSaving(true);
    try {
      const user = auth.currentUser;
      const updatedBy = user?.email || user?.uid || '';
      const statisticsPayload = form.statistics.slice(0, STATISTICS_MAX).map((stat, index) => {
        const fallback = DEFAULT_STATISTICS[index] || DEFAULT_STATISTICS[0];
        const parsed = Number(stat.value);
        return {
          id: stat.id || fallback.id,
          icon: STATISTIC_ICON_KEYS.includes(stat.icon) ? stat.icon : fallback.icon,
          value: Number.isFinite(parsed) ? Math.floor(parsed) : fallback.value,
          title: stat.title.trim(),
          description: stat.description.trim(),
        };
      });

      // Translate hero (title/subtitle/description) and each statistic
      // (title/description) to { he, en, ar } once on save.
      let heroTranslations = null;
      let statisticsToSave = statisticsPayload;
      if (isTranslationConfigured()) {
        try {
          const [hero, stats] = await Promise.all([
            translateFields(
              { title: form.title.trim(), subtitle: form.subtitle.trim(), description: form.description.trim() },
              ['title', 'subtitle', 'description'],
            ),
            translateItems(statisticsPayload, ['title', 'description']),
          ]);
          heroTranslations = Object.keys(hero).length ? hero : null;
          statisticsToSave = stats;
        } catch (err) {
          console.error('Home content translation failed; saving original only:', err);
        }
      }

      const fieldUpdates = {
        'hero.title': form.title.trim(),
        'hero.subtitle': form.subtitle.trim(),
        'hero.description': form.description.trim(),
        'hero.backgroundImageUrl': form.backgroundImageUrl.trim(),
        statistics: statisticsToSave,
        updatedAt: serverTimestamp(),
        updatedBy,
      };
      if (heroTranslations) fieldUpdates['hero.translations'] = heroTranslations;

      const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
      if (docMeta.exists) {
        await updateDoc(ref, fieldUpdates);
      } else {
        await setDoc(ref, {
          hero: {
            title: fieldUpdates['hero.title'],
            subtitle: fieldUpdates['hero.subtitle'],
            description: fieldUpdates['hero.description'],
            backgroundImageUrl: fieldUpdates['hero.backgroundImageUrl'],
            ...(heroTranslations ? { translations: heroTranslations } : {}),
          },
          statistics: statisticsToSave,
          updatedAt: serverTimestamp(),
          updatedBy,
        });
      }

      await logAuditEvent({
        actionType: 'UPDATE_PUBLIC_HOME_HERO',
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: {
          section: 'hero+statistics',
          after: {
            hero: {
              title: form.title,
              subtitle: form.subtitle,
              description: form.description,
              backgroundImageUrl: form.backgroundImageUrl,
            },
            statistics: statisticsPayload,
          },
        },
      });

      setPristine(form);
      setTouched({});
      setSubmitted(false);
      setDocMeta({
        updatedAt: new Date(),
        updatedBy,
        exists: true,
      });
      setToast({ open: true, severity: 'success', message: t('cmsHomeUpdated') });
    } catch (err) {
      console.error('Failed to save home page content:', err);
      setToast({ open: true, severity: 'error', message: t('cmsSaveFailed') });
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

  const lastUpdatedLabel = formatTimestamp(docMeta.updatedAt, intlLocale);

  return (
    <Box sx={{ pb: 12 }} dir={direction}>
      {lastUpdatedLabel || docMeta.updatedBy ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          {t('cmsLastUpdated').replace('{date}', lastUpdatedLabel || '—')}
          {docMeta.updatedBy ? t('cmsLastUpdatedBy').replace('{user}', docMeta.updatedBy) : ''}
        </Typography>
      ) : null}

      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>{t('cmsHeroText')}</Typography>
          <Stack spacing={2}>
            <TextField
              label={t('cmsFieldTitle')}
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
              label={t('cmsFieldSubtitle')}
              value={form.subtitle}
              onChange={(e) => setField('subtitle', e.target.value)}
              onBlur={() => handleBlur('subtitle')}
              inputProps={{ maxLength: LIMITS.subtitle }}
              helperText={`${form.subtitle.length} / ${LIMITS.subtitle}`}
              fullWidth
              id="hero-subtitle"
            />
            <TextField
              label={t('cmsFieldDescription')}
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
          <Typography variant="h6" sx={{ mb: 2 }}>{t('cmsBackgroundImage')}</Typography>
          <Stack spacing={2}>
            <TextField
              label={t('cmsBackgroundImageUrl')}
              value={form.backgroundImageUrl}
              onChange={(e) => setField('backgroundImageUrl', e.target.value)}
              onBlur={() => handleBlur('backgroundImageUrl')}
              helperText={
                (shouldShowError('backgroundImageUrl') && errors.backgroundImageUrl) ||
                t('cmsBackgroundImageHelper')
              }
              error={shouldShowError('backgroundImageUrl')}
              fullWidth
              id="hero-background-image-url"
              type="url"
            />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {t('cmsPreview')}
              </Typography>
              <BackgroundPreview url={form.backgroundImageUrl} t={t} />
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {t('cmsImpactStatistics')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('cmsImpactStatisticsHelper')}
          </Typography>
          <Stack spacing={2}>
            {form.statistics.map((stat, index) => (
              <Paper
                key={stat.id || index}
                variant="outlined"
                sx={{ p: 2, bgcolor: 'grey.50' }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  {t('cmsStatisticNumber').replace('{n}', index + 1)}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    gridTemplateColumns: {
                      xs: 'minmax(0, 1fr)',
                      md: '130px minmax(0, 1.1fr) minmax(0, 1.6fr) 170px',
                    },
                  }}
                >
                  <TextField
                    label={t('cmsFieldValue')}
                    type="number"
                    value={stat.value}
                    onChange={(e) => setStatField(index, 'value', e.target.value)}
                    onBlur={() => handleStatBlur(index, 'value')}
                    inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
                    error={shouldShowError(`stat.${index}.value`)}
                    helperText={
                      (shouldShowError(`stat.${index}.value`) && errors[`stat.${index}.value`]) ||
                      t('cmsStatValueHelper')
                    }
                    required
                    fullWidth
                  />
                  <TextField
                    label={t('cmsFieldTitle')}
                    value={stat.title}
                    onChange={(e) => setStatField(index, 'title', e.target.value)}
                    onBlur={() => handleStatBlur(index, 'title')}
                    inputProps={{ maxLength: LIMITS.statTitle }}
                    error={shouldShowError(`stat.${index}.title`)}
                    helperText={
                      (shouldShowError(`stat.${index}.title`) && errors[`stat.${index}.title`]) ||
                      `${stat.title.length} / ${LIMITS.statTitle}`
                    }
                    required
                    fullWidth
                  />
                  <TextField
                    label={t('cmsFieldDescription')}
                    value={stat.description}
                    onChange={(e) => setStatField(index, 'description', e.target.value)}
                    onBlur={() => handleStatBlur(index, 'description')}
                    inputProps={{ maxLength: LIMITS.statDescription }}
                    helperText={`${stat.description.length} / ${LIMITS.statDescription}`}
                    fullWidth
                  />
                  <TextField
                    select
                    label={t('cmsFieldIcon')}
                    value={stat.icon}
                    onChange={(e) => setStatField(index, 'icon', e.target.value)}
                    error={shouldShowError(`stat.${index}.icon`)}
                    helperText={shouldShowError(`stat.${index}.icon`) && errors[`stat.${index}.icon`]}
                    fullWidth
                    SelectProps={{
                      renderValue: (selected) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <StatIconGlyph iconKey={selected} />
                          <span>{STAT_ICON_LABEL_KEYS[selected] ? t(STAT_ICON_LABEL_KEYS[selected]) : selected}</span>
                        </Box>
                      ),
                    }}
                  >
                    {STATISTIC_ICON_KEYS.map((key) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <StatIconGlyph iconKey={key} />
                          <span>{STAT_ICON_LABEL_KEYS[key] ? t(STAT_ICON_LABEL_KEYS[key]) : key}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Paper>
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
          gap: '0.75rem',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1100,
        }}
      >
        <Button onClick={handleDiscard} disabled={!dirty || saving}>
          {t('cmsDiscardChanges')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
          id="btn-save-public-home"
        >
          {saving ? t('cmsSaving') : t('cmsSave')}
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

function BackgroundPreview({ url, t }) {
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    setErrored(false);
  }, [url]);

  if (!url) {
    return (
      <Box
        sx={{
          width: '15rem',
          height: '8.4375rem',
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          fontSize: '0.75rem',
        }}
      >
        {t('cmsNoImageSet')}
      </Box>
    );
  }

  if (errored) {
    return (
      <Box
        sx={{
          width: '15rem',
          height: '8.4375rem',
          border: '1px dashed',
          borderColor: 'error.main',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'error.main',
          fontSize: '0.75rem',
        }}
      >
        {t('cmsImageFailedToLoad')}
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={url}
      alt={t('cmsHeroBackgroundAlt')}
      onError={() => setErrored(true)}
      sx={{
        width: '15rem',
        height: '8.4375rem',
        objectFit: 'cover',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        display: 'block',
      }}
    />
  );
}
