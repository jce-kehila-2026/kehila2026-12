import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { useAdminLocale } from '../context/AdminLocaleContext';
import { logAuditEvent } from '../services/auditService';
import { isTranslationConfigured, translateFields, translateItems } from '../services/translationService';
import {
  PUBLIC_PAGES_COLLECTION,
  PUBLIC_HOME_DOC_ID,
  DEFAULT_HERO_CONTENT,
  DEFAULT_STATISTICS,
  STATISTIC_ICON_KEYS,
  STATISTICS_MAX,
  HERO_CONTENT_STEPS_COUNT,
  mergeHeroContent,
  mergeStatistics,
} from '../../public/services/publicPagesService';
import { BookOpen, HandHeart, Heart, Megaphone, Sparkles, UsersRound } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '../components/AutoDirTextField';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

const LIMITS = {
  title: 120,
  intro: 300,
  stepTitle: 40,
  statTitle: 40,
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

function statisticsToForm(statistics) {
  return statistics.map((stat) => ({
    id: stat.id || '',
    icon: stat.icon || STATISTIC_ICON_KEYS[0],
    value: Number.isFinite(stat.value) ? String(stat.value) : '',
    title: stat.title || '',
  }));
}

function heroContentToForm(heroContent) {
  return {
    title: heroContent.title || '',
    intro: heroContent.intro || '',
    steps: (heroContent.steps || DEFAULT_HERO_CONTENT.steps).map((s) => ({
      title: s.title || '',
    })),
  };
}

function emptyForm() {
  return {
    heroContent: heroContentToForm(DEFAULT_HERO_CONTENT),
    statistics: statisticsToForm(DEFAULT_STATISTICS),
  };
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
            heroContent: { ...DEFAULT_HERO_CONTENT },
            updatedAt: serverTimestamp(),
            updatedBy: 'system-seed',
          });
          snap = await getDoc(ref);
        }
        if (!active) return;
        const data = snap.data() || {};
        const mergedHeroContent = mergeHeroContent(data.heroContent);
        const mergedStats = mergeStatistics(data.statistics);
        const next = {
          heroContent: heroContentToForm(mergedHeroContent),
          statistics: statisticsToForm(mergedStats),
        };
        setForm(next);
        setPristine(next);
        setDocMeta({
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || '',
          exists: true,
        });
      } catch (err) {
        console.error('Failed to load public_pages/home:', err);
        const next = emptyForm();
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
    const hc = form.heroContent;
    if (!hc.title.trim()) next['hc.title'] = t('cmsTitleRequired');
    if (!hc.intro.trim()) next['hc.intro'] = t('cmsTitleRequired');
    (hc.steps || []).forEach((step, index) => {
      if (!step.title.trim()) next[`step.${index}.title`] = t('cmsTitleRequired');
    });
    // Statistics validation
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

  // ── Hero content field setters ──────────────────────────
  function setHeroField(key, value) {
    setForm((prev) => ({
      ...prev,
      heroContent: { ...prev.heroContent, [key]: value },
    }));
  }
  function setStepField(index, key, value) {
    setForm((prev) => ({
      ...prev,
      heroContent: {
        ...prev.heroContent,
        steps: prev.heroContent.steps.map((s, i) =>
          i === index ? { ...s, [key]: value } : s,
        ),
      },
    }));
  }
  function handleBlur(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  // ── Statistics field setters ─────────────────────────────
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
      const hc = form.heroContent;

      // Build the statistics payload
      const statisticsPayload = form.statistics.slice(0, STATISTICS_MAX).map((stat, index) => {
        const fallback = DEFAULT_STATISTICS[index] || DEFAULT_STATISTICS[0];
        const parsed = Number(stat.value);
        return {
          id: stat.id || fallback.id,
          icon: STATISTIC_ICON_KEYS.includes(stat.icon) ? stat.icon : fallback.icon,
          value: Number.isFinite(parsed) ? Math.floor(parsed) : fallback.value,
          title: stat.title.trim(),
        };
      });

      // Build the hero content payload
      const stepsPayload = hc.steps.slice(0, HERO_CONTENT_STEPS_COUNT).map((step) => ({
        title: step.title.trim(),
      }));

      const heroContentPayload = {
        title: hc.title.trim(),
        intro: hc.intro.trim(),
        steps: stepsPayload,
      };

      // Translate via Azure if configured
      let heroTranslations = null;
      let translatedSteps = stepsPayload;
      let translatedStats = statisticsPayload;
      if (isTranslationConfigured()) {
        try {
          const [heroTr, stepsTr, statsTr] = await Promise.all([
            translateFields(
              {
                title: heroContentPayload.title,
                intro: heroContentPayload.intro,
              },
              ['title', 'intro'],
            ),
            translateItems(stepsPayload, ['title']),
            translateItems(statisticsPayload, ['title']),
          ]);
          if (Object.keys(heroTr).length) heroTranslations = heroTr;
          translatedSteps = stepsTr;
          translatedStats = statsTr;
        } catch (err) {
          console.error('Home content translation failed; saving original only:', err);
        }
      }

      const heroContentToSave = {
        ...heroContentPayload,
        steps: translatedSteps,
      };
      if (heroTranslations) heroContentToSave.translations = heroTranslations;

      const fieldUpdates = {
        heroContent: heroContentToSave,
        statistics: translatedStats,
        updatedAt: serverTimestamp(),
        updatedBy,
      };

      const ref = doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID);
      if (docMeta.exists) {
        await updateDoc(ref, fieldUpdates);
      } else {
        await setDoc(ref, fieldUpdates);
      }

      await logAuditEvent({
        actionType: 'UPDATE_PUBLIC_HOME_HERO',
        targetId: `${PUBLIC_PAGES_COLLECTION}/${PUBLIC_HOME_DOC_ID}`,
        details: {
          section: 'heroContent+statistics',
          after: {
            heroContent: heroContentPayload,
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
  const hc = form.heroContent;

  return (
    <Box sx={{ pb: 12 }} dir={direction}>
      {lastUpdatedLabel || docMeta.updatedBy ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          {t('cmsLastUpdated').replace('{date}', lastUpdatedLabel || '—')}
          {docMeta.updatedBy ? t('cmsLastUpdatedBy').replace('{user}', docMeta.updatedBy) : ''}
        </Typography>
      ) : null}

      <Stack spacing={3}>
        {/* ── Hero Title ─────────────────────────────── */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>{t('cmsHeroText')}</Typography>
          <Stack spacing={2}>
            <TextField
              label={t('cmsHeroTitle')}
              value={hc.title}
              onChange={(e) => setHeroField('title', e.target.value)}
              onBlur={() => handleBlur('hc.title')}
              inputProps={{ maxLength: LIMITS.title }}
              helperText={
                (shouldShowError('hc.title') && errors['hc.title']) ||
                `${hc.title.length} / ${LIMITS.title}`
              }
              error={shouldShowError('hc.title')}
              required
              fullWidth
              id="hero-title"
            />
            <TextField
              label={t('cmsHeroIntro')}
              value={hc.intro}
              onChange={(e) => setHeroField('intro', e.target.value)}
              onBlur={() => handleBlur('hc.intro')}
              inputProps={{ maxLength: LIMITS.intro }}
              helperText={
                (shouldShowError('hc.intro') && errors['hc.intro']) ||
                `${hc.intro.length} / ${LIMITS.intro}`
              }
              error={shouldShowError('hc.intro')}
              multiline
              minRows={2}
              required
              fullWidth
              id="hero-intro"
            />
          </Stack>
        </Paper>

        {/* ── Journey Steps ──────────────────────────── */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {t('cmsJourneySteps')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('cmsJourneyStepsHelper')}
          </Typography>
          <Stack spacing={2}>
            {hc.steps.map((step, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{ p: 2, bgcolor: 'grey.50' }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  {t('cmsStepNumber').replace('{n}', index + 1)}
                </Typography>
                <TextField
                  label={t('cmsStepTitle')}
                  value={step.title}
                  onChange={(e) => setStepField(index, 'title', e.target.value)}
                  onBlur={() => handleBlur(`step.${index}.title`)}
                  inputProps={{ maxLength: LIMITS.stepTitle }}
                  error={shouldShowError(`step.${index}.title`)}
                  helperText={
                    (shouldShowError(`step.${index}.title`) && errors[`step.${index}.title`]) ||
                    `${step.title.length} / ${LIMITS.stepTitle}`
                  }
                  required
                  fullWidth
                />
              </Paper>
            ))}
          </Stack>
        </Paper>

        {/* ── Impact Statistics ──────────────────────── */}
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
                      md: '130px minmax(0, 1fr) 170px',
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
