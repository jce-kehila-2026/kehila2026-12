import { useEffect, useId, useMemo, useRef, useState, useCallback } from 'react';
import { localizeField } from '../../../i18n/localizeField';
import {
  CalendarDays,
  CalendarHeart,
  CalendarSync,
  Check,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  NotebookPen,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import heroWellnessBanner from '../../../assets/hero-wellness-banner.png';
import communityHighlightFallback from '../../../assets/images/support-groups.jpeg';
import { auth } from '../../../firebase';
import { getLocalizedText } from '../../../shared/i18n/getLocalizedText';
import { useParticipantLocale } from '../context/ParticipantLocaleContext';
import { createCalendarNote } from '../../calendar/calendarService';
import {
  formatReminderDateTimeLabel,
  getSyncValidationError,
  shouldSyncToCalendar,
} from './participantNotesModel';
import NotesScheduleModal from './NotesScheduleModal';
import { useParticipantDashboardHomeData } from './useParticipantDashboardHomeData';
import { createParticipantNote, updateParticipantNote } from './participantNotesService';
import { useParticipantNotes } from './useParticipantNotes';
import useLatestCommunityPost from '../community/hooks/useLatestCommunityPost';
import BirthdayGreeting from './BirthdayGreeting';
import useBirthdayToday from './useBirthdayToday';
import './ParticipantDashboardHome.css';

const RING_SIZE = 130;
const RING_CENTER = 65;
const RING_RADIUS = 51;
const RING_INNER_RADIUS = 46;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_ROTATE = `rotate(-90 ${RING_CENTER} ${RING_CENTER})`;

/** Fixed windows â€” ring fill = clamp(remainingMs / windowMs, 0, 1). */
const APPOINTMENT_COUNTDOWN_WINDOW_MS = 48 * 60 * 60 * 1000;
const EVENT_COUNTDOWN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function getCountdownWindowMs(displayMode) {
  return displayMode === 'appointment'
    ? APPOINTMENT_COUNTDOWN_WINDOW_MS
    : EVENT_COUNTDOWN_WINDOW_MS;
}

/** Ring progress: 1 = full window remaining, 0 = none (empty ring). */
function getCountdownProgress(remainingMs, displayMode) {
  const countdownWindowMs = getCountdownWindowMs(displayMode);
  if (!Number.isFinite(remainingMs) || remainingMs <= 0 || countdownWindowMs <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, remainingMs / countdownWindowMs));
}

function computeCountdownRingMetrics(remainingMs, displayMode) {
  const countdownWindowMs = getCountdownWindowMs(displayMode);
  const progress = getCountdownProgress(remainingMs, displayMode);
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return {
    remainingMs: Number.isFinite(remainingMs) ? Math.max(0, remainingMs) : 0,
    countdownWindowMs,
    progress,
    dashOffset,
  };
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatHms(diffMs) {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function buildCountdownDisplay(remainingMs, displayMode) {
  const progress = getCountdownProgress(remainingMs, displayMode);

  if (remainingMs >= ONE_DAY_MS) {
    const days = Math.max(1, Math.floor(remainingMs / ONE_DAY_MS));

    return {
      status: 'active',
      eyebrowKey: 'countdownStartsIn',
      value: String(days),
      unitKey: days === 1 ? 'unitDay' : 'unitDays',
      progress,
      display: 'days',
    };
  }

  return {
    status: 'active',
    eyebrowKey: 'countdownStartsIn',
    value: formatHms(remainingMs),
    unitKey: '',
    progress,
    display: 'hms',
  };
}

function buildActiveCountdown(remainingMs, displayMode) {
  return buildCountdownDisplay(remainingMs, displayMode);
}

function buildEndedCountdown(displayMode) {
  if (displayMode === 'event') {
    return {
      status: 'started',
      eyebrowKey: 'countdownStarted',
      value: '',
      unitKey: '',
      progress: 0,
      remainingMs: 0,
      display: 'status',
    };
  }

  return {
    status: 'completed',
    eyebrowKey: 'countdownCompleted',
    value: '',
    unitKey: '',
    progress: 0,
    remainingMs: 0,
    display: 'status',
  };
}

function useCountdownRing(targetDate, displayMode = 'appointment') {
  const targetMs = targetDate?.getTime?.() ?? NaN;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(targetMs) || targetMs - new Date().getTime() <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetMs]);

  if (!Number.isFinite(targetMs)) {
    return buildEndedCountdown(displayMode);
  }

  const remainingMs = targetMs - Date.now();

  if (remainingMs <= 0) {
    return buildEndedCountdown(displayMode);
  }

  return {
    ...buildActiveCountdown(remainingMs, displayMode),
    remainingMs,
  };
}

function CircularCountdownRing({ variant, targetDate, countdown }) {
  const { t } = useParticipantLocale();
  const uid = useId().replace(/:/g, '');
  const gradientId = `pd-ring-grad-${variant}-${uid}`;
  const displayMode = variant === 'appointment' ? 'appointment' : 'event';
  const eyebrow = t(countdown.eyebrowKey);
  const unit = countdown.unitKey ? t(countdown.unitKey) : '';
  const targetMs = targetDate?.getTime?.() ?? NaN;
  const remainingMs =
    countdown.status === 'active' && Number.isFinite(targetMs) ? targetMs - Date.now() : 0;
  const { countdownWindowMs, progress, dashOffset } = computeCountdownRingMetrics(
    remainingMs,
    displayMode,
  );

  useEffect(() => {
    if (!import.meta.env.DEV || countdown.status !== 'active') {
      return undefined;
    }

    console.log(`[pd-countdown:${variant}]`, {
      remainingMs,
      remainingHours: remainingMs / (60 * 60 * 1000),
      countdownWindowMs,
      progress,
      dashOffset,
      targetDate: Number.isFinite(targetMs) ? new Date(targetMs).toISOString() : null,
    });

    return undefined;
  }, [variant, remainingMs, countdownWindowMs, progress, dashOffset, countdown.status, targetMs]);

  return (
    <div
      className={`pd-countdown-ring pd-countdown-ring--${variant}`}
      aria-live="polite"
      aria-atomic="true"
      title={
        countdown.status === 'active'
          ? `${eyebrow} ${countdown.value} ${unit}`.trim()
          : eyebrow
      }
    >
      <svg
        className="pd-countdown-ring__svg"
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        width={RING_SIZE}
        height={RING_SIZE}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {variant === 'appointment' ? (
              <>
                <stop offset="0%" stopColor="#ec168c" />
                <stop offset="50%" stopColor="#d946a1" />
                <stop offset="100%" stopColor="#7e22ce" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ec168c" />
                <stop offset="50%" stopColor="#d946a1" />
                <stop offset="100%" stopColor="#7e22ce" />
              </>
            )}
          </linearGradient>
        </defs>

        <circle
          className="pd-countdown-ring__inner"
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_INNER_RADIUS}
        />

        <circle
          className="pd-countdown-ring__track"
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          fill="none"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
        />

        <circle
          className="pd-countdown-ring__progress"
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          pathLength={RING_CIRCUMFERENCE}
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          transform={RING_ROTATE}
        />
      </svg>

      <div className="pd-countdown-ring__label">
        {countdown.status === 'active' ? (
          <>
            <span>{eyebrow}</span>
            <strong
              className={
                countdown.display === 'days'
                  ? 'pd-countdown-ring__value--days'
                  : 'pd-countdown-ring__value--hms'
              }
            >
              {countdown.value}
            </strong>
            {unit ? <small>{unit}</small> : null}
          </>
        ) : (
          <strong className="pd-countdown-ring__status">{eyebrow}</strong>
        )}
      </div>
    </div>
  );
}

const DATE_LOCALE_BY_LANG = { he: 'he-IL', ar: 'ar', en: 'en-US' };

function formatRelativeTime(timestamp, t, lang = 'en') {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  const diffSeconds = (Date.now() - date.getTime()) / 1000;
  if (diffSeconds < 60) return t('timeJustNow');
  if (diffSeconds < 3600) return t('timeMinutesAgo').replace('{n}', String(Math.floor(diffSeconds / 60)));
  if (diffSeconds < 86400) return t('timeHoursAgo').replace('{n}', String(Math.floor(diffSeconds / 3600)));
  if (diffSeconds < 172800) return t('timeYesterday');
  return date.toLocaleDateString(DATE_LOCALE_BY_LANG[lang] || 'en-US', { month: 'short', day: 'numeric' });
}

function LatestMessageCard({ notification, onOpenNotifications }) {
  const { t, lang } = useParticipantLocale();
  const notificationTitle = getLocalizedText(notification?.title, lang);
  const notificationBody = getLocalizedText(notification?.body, lang);
  const senderText = getLocalizedText(notification?.sender ?? notification?.senderTitle, lang);
  const previewText = notificationBody || senderText;
  const hasNotification = Boolean(notification && (notificationTitle || previewText));
  const truncatedBody = previewText.length > 80 ? `${previewText.slice(0, 77)}...` : previewText;

  return (
    <button
      type="button"
      className="pd-home__admin-message"
      onClick={onOpenNotifications}
      aria-label={
        hasNotification
          ? t('newAdminMessageAria').replace('{x}', notificationTitle || truncatedBody)
          : t('noNewAdminMessages')
      }
    >
      <span className="pd-home__admin-message-badge" aria-hidden="true">
        <MessageCircle size={17} strokeWidth={2.2} />
      </span>

      <span className="pd-home__admin-message-content">
        <span className="pd-home__admin-message-label">{t('newAdminMessage')}</span>
        {hasNotification ? (
          <>
            {notificationTitle ? (
              <span className="pd-home__admin-message-title">{notificationTitle}</span>
            ) : null}
            {truncatedBody ? (
              <span className="pd-home__admin-message-preview">{truncatedBody}</span>
            ) : null}
          </>
        ) : (
          <span className="pd-home__admin-message-preview pd-home__admin-message-preview--empty">
            {t('noNewAdminMessagesYet')}
          </span>
        )}
      </span>

      <span className="pd-home__admin-message-meta">
        {hasNotification ? (
          <time className="pd-home__admin-message-time">{formatRelativeTime(notification.createdAt, t, lang)}</time>
        ) : null}
        <ChevronRight className="pd-home__admin-message-arrow" size={16} strokeWidth={2} aria-hidden="true" />
      </span>
    </button>
  );
}

function HeroBanner() {
  const { t } = useParticipantLocale();
  return (
    <section className="pd-home__hero" aria-label={t('welcomeBanner')}>
      <img
        className="pd-home__hero-image"
        src={heroWellnessBanner}
        alt={t('heroImageAlt')}
      />
      <div className="pd-home__hero-overlay" aria-hidden="true" />
    </section>
  );
}

function CardHeading({ icon: Icon, label, accent = 'purple', iconProps }) {
  return (
    <div className={`pd-card__heading pd-card__heading--${accent}`}>
      <span className="pd-card__heading-badge" aria-hidden="true">
        <Icon size={20} strokeWidth={2.1} {...iconProps} />
      </span>
      <span className="pd-card__heading-label">{label}</span>
    </div>
  );
}

function FeatureSchedule({ dateLabel, timeLabel }) {
  return (
    <li className="pd-feature__detail pd-feature__detail--schedule">
      <CalendarDays size={16} strokeWidth={2} className="pd-feature__detail-icon" aria-hidden="true" />
      <span className="pd-feature__detail-value">
        {dateLabel}
        <span className="pd-feature__detail-sep" aria-hidden="true">
          {' '}
          Â·{' '}
        </span>
        {timeLabel}
      </span>
    </li>
  );
}

function FeatureDetail({ icon: Icon, value }) {
  return (
    <li className="pd-feature__detail">
      <Icon size={16} strokeWidth={2} className="pd-feature__detail-icon" aria-hidden="true" />
      <span className="pd-feature__detail-value">{value}</span>
    </li>
  );
}

function PremiumCta({ variant = 'pink', children, onClick }) {
  const className =
    variant === 'soft'
      ? 'pd-btn pd-btn--view-cta pd-community__cta'
      : variant === 'pink'
        ? 'pd-btn pd-btn--view-cta pd-feature__cta'
        : `pd-btn pd-btn--${variant} pd-feature__cta`;

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}

function AppointmentCard({ appointment, onView }) {
  const { t } = useParticipantLocale();
  const countdown = useCountdownRing(appointment.targetDate, 'appointment');

  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--feature pd-card--appointment">
      <div className="pd-card__surface pd-feature__layout">
        <div className="pd-feature__body">
          <CardHeading
            icon={CalendarHeart}
            label={t('nextAppointment')}
            accent="pink"
            iconProps={{ strokeWidth: 1.75, absoluteStrokeWidth: true }}
          />
          <h3 className="pd-feature__title">{appointment.title}</h3>
          <p className="pd-feature__subtitle">{appointment.therapistName}</p>

          <ul className="pd-feature__details">
            <FeatureSchedule dateLabel={appointment.dateLabel} timeLabel={appointment.timeLabel} />
            <FeatureDetail icon={MapPin} value={appointment.location} />
          </ul>

          <div className="pd-feature__footer">
            <PremiumCta variant="soft" onClick={onView}>
              {t('viewAppointment')}
            </PremiumCta>
          </div>
        </div>

        <div className="pd-feature__col pd-feature__col--countdown">
          <CircularCountdownRing
            variant="appointment"
            targetDate={appointment.targetDate}
            countdown={countdown}
          />
        </div>
      </div>
    </article>
  );
}

function EventCard({ event, onView, locale = 'he' }) {
  const { t } = useParticipantLocale();
  const countdown = useCountdownRing(event.targetDate, 'event');

  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--feature pd-card--event">
      <div className="pd-card__surface pd-feature__layout">
        <div className="pd-feature__body">
          <CardHeading icon={Sparkles} label={t('upcomingEvent')} accent="pink" />
          <h3 className="pd-feature__title">{localizeField(event.translations?.title ?? event.title, locale)}</h3>
          <p className="pd-feature__subtitle">{event.category}</p>

          <ul className="pd-feature__details">
            <FeatureSchedule dateLabel={event.dateLabel} timeLabel={event.timeLabel} />
            <FeatureDetail icon={MapPin} value={localizeField(event.translations?.location ?? event.location, locale)} />
          </ul>

          <div className="pd-feature__footer">
            <PremiumCta variant="soft" onClick={onView}>
              {t('viewEvent')}
            </PremiumCta>
          </div>
        </div>

        <div className="pd-feature__col pd-feature__col--countdown">
          <CircularCountdownRing variant="event" targetDate={event.targetDate} countdown={countdown} />
        </div>
      </div>
    </article>
  );
}

function EmptyStateIconBadge({ variant, icon: Icon }) {
  return (
    <div className={`pd-feature-empty__badge pd-feature-empty__badge--${variant}`} aria-hidden="true">
      <span className="pd-feature-empty__badge-ring" />
      <Icon size={44} strokeWidth={1.65} />
    </div>
  );
}

function FeatureCardLoadingShell({ variant, label }) {
  return (
    <article
      className={`pd-card pd-card--dashboard-skin pd-card--feature pd-card--${variant} pd-card--feature-loading`}
      aria-busy="true"
      aria-label={label}
    >
    </article>
  );
}

function AppointmentEmptyCard({ onBook }) {
  const { t } = useParticipantLocale();
  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--feature pd-card--appointment pd-card--empty">
      <div className="pd-card__surface pd-feature__layout pd-feature__layout--empty">
        <div className="pd-feature__body pd-feature-empty__body">
          <CardHeading
            icon={CalendarHeart}
            label={t('nextAppointment')}
            accent="pink"
            iconProps={{ strokeWidth: 1.75, absoluteStrokeWidth: true }}
          />
          <h3 className="pd-feature-empty__headline">{t('noUpcomingAppointments')}</h3>
          <p className="pd-feature-empty__text">
            {t('bookAppointmentText')}
          </p>
          <div className="pd-feature__footer">
            <PremiumCta variant="pink" onClick={onBook}>
              {t('bookAppointment')}
            </PremiumCta>
          </div>
        </div>

        <div className="pd-feature__col pd-feature__col--badge">
          <EmptyStateIconBadge variant="appointment" icon={CalendarHeart} />
        </div>
      </div>
    </article>
  );
}

function EventEmptyCard({ onExplore }) {
  const { t } = useParticipantLocale();
  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--feature pd-card--event pd-card--empty">
      <div className="pd-card__surface pd-feature__layout pd-feature__layout--empty">
        <div className="pd-feature__body pd-feature-empty__body">
          <CardHeading icon={Sparkles} label={t('upcomingEvent')} accent="pink" />
          <h3 className="pd-feature-empty__headline">{t('noUpcomingEvents')}</h3>
          <p className="pd-feature-empty__text">
            {t('exploreEventsText')}
          </p>
          <div className="pd-feature__footer">
            <PremiumCta variant="pink" onClick={onExplore}>
              {t('exploreEvents')}
            </PremiumCta>
          </div>
        </div>

        <div className="pd-feature__col pd-feature__col--badge">
          <EmptyStateIconBadge variant="event" icon={Users} />
        </div>
      </div>
    </article>
  );
}

function FeatureCardErrorState({ variant, headingIcon: HeadingIcon, headingLabel, headingAccent }) {
  const { t } = useParticipantLocale();
  const badgeVariant = variant === 'event' ? 'event' : 'appointment';

  return (
    <article
      className={`pd-card pd-card--dashboard-skin pd-card--feature pd-card--${variant} pd-card--empty pd-card--error`}
    >
      <div className="pd-card__surface pd-feature__layout pd-feature__layout--empty">
        <div className="pd-feature__body pd-feature-empty__body">
          <CardHeading
            icon={HeadingIcon}
            label={headingLabel}
            accent={headingAccent}
            iconProps={variant === 'appointment' ? { strokeWidth: 1.75, absoluteStrokeWidth: true } : undefined}
          />
          <p className="pd-feature-error__message" role="status">
            {t('featureLoadError')}
          </p>
        </div>

        <div className="pd-feature__col pd-feature__col--badge">
          <EmptyStateIconBadge variant={badgeVariant} icon={HeadingIcon} />
        </div>
      </div>
    </article>
  );
}

const NOTES_COMPLETION_FEEDBACK_MS = 650;

function NotesCard({ userId }) {
  const { t } = useParticipantLocale();
  const completionHideTimeoutsRef = useRef(new Map());
  const titleInputId = useId();
  const datePickerId = useId();
  const timePickerId = useId();
  const noteInputRef = useRef(null);
  const draftTitleRef = useRef('');
  const isSavingRef = useRef(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncHint, setSyncHint] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completingNoteIds, setCompletingNoteIds] = useState(() => new Set());
  const { notes } = useParticipantNotes(userId);

  useEffect(() => {
    const timeouts = completionHideTimeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

  const activeNotes = useMemo(
    () => notes.filter((note) => !note.done || completingNoteIds.has(note.id)),
    [notes, completingNoteIds],
  );

  const clearSyncHint = () => {
    if (syncHint) setSyncHint('');
  };

  const handleAddNote = useCallback(async (titleFromInput) => {
    const title = String(
      titleFromInput ?? noteInputRef.current?.value ?? draftTitleRef.current ?? '',
    ).trim();

    if (!title || isSavingRef.current) return;

    const participantId = auth.currentUser?.uid || userId;
    if (!participantId) {
      console.error('[Dashboard notes] Cannot save — no participant id');
      setSyncHint(t('noteSaveSignIn'));
      return;
    }

    const date = draftDate.trim();
    const time = draftTime.trim();
    const willSync = shouldSyncToCalendar(syncEnabled, date, time);
    const validationError = getSyncValidationError(syncEnabled, date, time);

    if (validationError) {
      setSyncHint(t('syncValidationMessage'));
      return;
    }

    setSyncHint('');
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      await createParticipantNote(participantId, {
        title,
        date: willSync ? date : '',
        time: willSync ? time : '',
        done: false,
        syncToCalendar: willSync,
      });

      if (willSync) {
        try {
          await createCalendarNote({ uid: participantId }, { title, date, time, content: '' });
        } catch (calendarError) {
          console.error('[Dashboard notes] Calendar sync failed (note was saved):', calendarError);
        }
      }

      draftTitleRef.current = '';
      setDraftTitle('');
      setDraftDate('');
      setDraftTime('');
    } catch (error) {
      console.error('[Dashboard notes] Failed to create note:', error?.code, error?.message, error);
      setSyncHint(t('noteSaveError'));
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [draftDate, draftTime, syncEnabled, userId, t]);

  const handleAddNoteClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const value = noteInputRef.current?.value ?? draftTitleRef.current ?? draftTitle;
    void handleAddNote(value);
  };

  const handleNoteInputKeyDown = (event) => {
    if (event.key !== 'Enter' && event.code !== 'NumpadEnter') return;

    event.preventDefault();
    event.stopPropagation();
    void handleAddNote(event.currentTarget.value);
  };

  const handleNoteFormSubmit = (event) => {
    event.preventDefault();

    const field = event.currentTarget.elements.namedItem('noteTitle');
    const value = field instanceof HTMLInputElement ? field.value : noteInputRef.current?.value ?? '';

    void handleAddNote(value);
  };

  const completeNote = useCallback(async (id) => {
    const note = notes.find((entry) => entry.id === id);
    const participantId = auth.currentUser?.uid || userId;
    if (!note || note.done || !participantId || completingNoteIds.has(id)) return;

    setCompletingNoteIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });

    const existingTimeout = completionHideTimeoutsRef.current.get(id);
    if (existingTimeout) clearTimeout(existingTimeout);

    const hideTimeout = setTimeout(() => {
      setCompletingNoteIds((current) => {
        if (!current.has(id)) return current;
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      completionHideTimeoutsRef.current.delete(id);
    }, NOTES_COMPLETION_FEEDBACK_MS);

    completionHideTimeoutsRef.current.set(id, hideTimeout);

    try {
      await updateParticipantNote(participantId, id, { done: true });
    } catch (error) {
      console.error('[Dashboard notes] Failed to update note:', error);
      clearTimeout(hideTimeout);
      completionHideTimeoutsRef.current.delete(id);
      setCompletingNoteIds((current) => {
        if (!current.has(id)) return current;
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }, [completingNoteIds, notes, userId]);

  const handleSyncToggle = () => {
    setSyncEnabled((value) => !value);
    setSyncHint('');
  };

  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--notes">
      <div className="pd-card__surface">
        <CardHeading icon={NotebookPen} label={t('notesHeading')} accent="pink" />

        <form className="pd-notes__composer" noValidate onSubmit={handleNoteFormSubmit}>
          <label className="visually-hidden" htmlFor={titleInputId}>
            {t('noteTitleLabel')}
          </label>
          <div className="pd-notes__input-row">
            <input
              ref={noteInputRef}
              id={titleInputId}
              name="noteTitle"
              type="text"
              value={draftTitle}
              placeholder={t('notePlaceholder')}
              autoComplete="off"
              onChange={(event) => {
                draftTitleRef.current = event.target.value;
                setDraftTitle(event.target.value);
                clearSyncHint();
              }}
              onKeyDown={handleNoteInputKeyDown}
            />
            <button
              type="button"
              className="pd-notes__add-btn"
              aria-label={t('addNote')}
              disabled={isSaving}
              onClick={handleAddNoteClick}
            >
              <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
              <span>{t('add')}</span>
            </button>
            <button
              type="button"
              className={`pd-notes__schedule-btn${draftDate || draftTime ? ' has-schedule' : ''}`}
              aria-label={t('setReminderDateTime')}
              aria-haspopup="dialog"
              aria-expanded={scheduleOpen}
              onClick={() => setScheduleOpen(true)}
            >
              <CalendarDays size={17} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          {syncHint ? (
            <p className="pd-notes__hint pd-notes__hint--warn" role="status">
              {syncHint}
            </p>
          ) : null}
        </form>

        <NotesScheduleModal
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          draftDate={draftDate}
          draftTime={draftTime}
          onDateChange={(nextDate) => {
            setDraftDate(nextDate);
            clearSyncHint();
          }}
          onTimeChange={(nextTime) => {
            setDraftTime(nextTime);
            clearSyncHint();
          }}
          datePickerId={datePickerId}
          timePickerId={timePickerId}
        />

      <ul className="pd-notes__list">
        {activeNotes.map((note) => {
          const scheduleLabel = formatReminderDateTimeLabel(note.date, note.time);
          const isCompleted = note.done || completingNoteIds.has(note.id);

          return (
            <li key={note.id} className={isCompleted ? 'is-done' : ''}>
              <button
                type="button"
                className={`pd-notes__check${isCompleted ? ' is-checked' : ''}`}
                aria-label={t('markNoteComplete')}
                aria-pressed={isCompleted}
                onClick={() => completeNote(note.id)}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : null}
              </button>
              <div className="pd-notes__copy">
                <span>{note.title}</span>
                {scheduleLabel ? (
                  <small>
                    {scheduleLabel}
                    {note.syncToCalendar ? ` · ${t('syncedToCalendar')}` : ''}
                  </small>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="pd-notes__sync">
        <div>
          <CalendarSync size={16} />
          <span>{t('syncToCalendar')}</span>
        </div>
        <button
          type="button"
          className={`pd-toggle${syncEnabled ? ' is-on' : ''}`}
          role="switch"
          aria-checked={syncEnabled}
          aria-label={t('syncNewReminders')}
          onClick={handleSyncToggle}
        >
          <span />
        </button>
      </div>
      </div>
    </article>
  );
}

function getCommunityPostImageUrl(post) {
  if (!post) return '';

  if (post.attachment?.type === 'image' && post.attachment.url) {
    return post.attachment.url;
  }

  if (typeof post.imageUrl === 'string' && post.imageUrl.trim()) {
    return post.imageUrl.trim();
  }

  return '';
}

function CommunityCardLoading() {
  const { t } = useParticipantLocale();
  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--community pd-card--loading" aria-busy="true">
      <div className="pd-card__surface">
        <CardHeading icon={Users} label={t('communityHighlight')} accent="pink" />
        <p className="pd-community__loading">{t('loadingCommunityPost')}</p>
      </div>
    </article>
  );
}

function CommunityEmptyCard({ onVisitCommunity, title, text, ctaLabel }) {
  const { t } = useParticipantLocale();
  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--community pd-card--community-empty">
      <div className="pd-card__surface">
        <CardHeading icon={Users} label={t('communityHighlight')} accent="pink" />
        <div className="pd-community-empty">
          <h3 className="pd-community-empty__title">{title}</h3>
          <p className="pd-community-empty__text">{text}</p>
          <button type="button" className="pd-btn pd-btn--view-cta pd-community__cta" onClick={onVisitCommunity}>
            {ctaLabel ?? t('visitCommunity')}
          </button>
        </div>
      </div>
    </article>
  );
}

function CommunityCard({ post, relativeTime, onViewPost }) {
  const { t, locale } = useParticipantLocale();
  const postImageUrl = getCommunityPostImageUrl(post);
  const thumbImageUrl = postImageUrl || communityHighlightFallback;
  const isFallbackThumb = !postImageUrl;
  const likesCount = post.likesCount ?? post.likes ?? 0;
  const commentsCount = post.commentsCount ?? 0;

  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--community">
      <div className="pd-card__surface">
        <CardHeading icon={Users} label={t('communityHighlight')} accent="pink" />

        <div className="pd-community__content">
          <div className="pd-community__copy">
            <div className="pd-community__author">
              {post.authorAvatarUrl ? (
                <img
                  className="pd-community__avatar pd-community__avatar--photo"
                  src={post.authorAvatarUrl}
                  alt=""
                />
              ) : (
                <span className="pd-community__avatar">{post.initials}</span>
              )}
              <div>
                <strong>{post.authorDisplayName || post.author}</strong>
                <time dateTime={post.createdAt}>{relativeTime}</time>
              </div>
            </div>

            <p className="pd-community__excerpt">{localizeField(post.translations?.content ?? (post.content || post.body), locale)}</p>
          </div>

          <div
            className={`pd-community__thumb${isFallbackThumb ? ' pd-community__thumb--fallback' : ''}`}
          >
            <img src={thumbImageUrl} alt="" />
            {isFallbackThumb ? (
              <span className="pd-community__thumb-badge" aria-hidden="true">
                <Heart size={18} strokeWidth={2} />
              </span>
            ) : null}
          </div>
        </div>

        <div className="pd-community__footer">
          <div className="pd-community__stats">
            <span className="pd-community__stat">
              <Heart size={16} strokeWidth={2} aria-hidden="true" />
              <span className="pd-community__stat-text">
                <strong>{likesCount}</strong> {t('likesLabel')}
              </span>
            </span>
            <span className="pd-community__stat">
              <MessageCircle size={16} strokeWidth={2} aria-hidden="true" />
              <span className="pd-community__stat-text">
                <strong>{commentsCount}</strong> {t('commentsLabel')}
              </span>
            </span>
          </div>

          <button type="button" className="pd-btn pd-btn--view-cta pd-community__cta" onClick={() => onViewPost(post.id)}>
            {t('viewPost')}
          </button>
        </div>
      </div>
    </article>
  );
}

function CommunityCardSection({ post, isLoading, hasError, relativeTime, onViewPost, onVisitCommunity }) {
  const { t } = useParticipantLocale();

  if (isLoading) {
    return <CommunityCardLoading />;
  }

  if (hasError) {
    return (
      <CommunityEmptyCard
        onVisitCommunity={onVisitCommunity}
        title={t('communityUnavailableTitle')}
        text={t('communityUnavailableText')}
        ctaLabel={t('visitCommunity')}
      />
    );
  }

  if (!post) {
    return (
      <CommunityEmptyCard
        onVisitCommunity={onVisitCommunity}
        title={t('noCommunityPostsTitle')}
        text={t('noCommunityPostsText')}
      />
    );
  }

  return (
    <CommunityCard post={post} relativeTime={relativeTime} onViewPost={onViewPost} />
  );
}

export default function ParticipantDashboardHome({
  userId,
  displayName = '',
  birthDate = '',
  onNavigateToView,
  onViewCommunity,
  latestNotification = null,
  onOpenNotifications,
  locale = 'he',
}) {
  const { t } = useParticipantLocale();
  const { appointment, event, isLoading, appointmentError, eventError } = useParticipantDashboardHomeData(userId);
  const isBirthdayToday = useBirthdayToday(birthDate);
  const {
    post: latestCommunityPost,
    isLoading: isCommunityLoading,
    hasError: communityHasError,
    relativeTime: communityRelativeTime,
  } = useLatestCommunityPost();

  const goToEventsView = useCallback(() => {
    onNavigateToView?.('events', { eventsTab: 'registered' });
  }, [onNavigateToView]);

  const goToExploreEvents = useCallback(() => {
    onNavigateToView?.('events', { eventsTab: 'workshops' });
  }, [onNavigateToView]);

  const goToAppointments = useCallback(() => {
    onNavigateToView?.('calendar');
  }, [onNavigateToView]);

  const goToEvents = useCallback(() => {
    goToEventsView();
  }, [goToEventsView]);

  const handleViewCommunityPost = useCallback(
    (postId) => {
      onViewCommunity?.(postId);
    },
    [onViewCommunity],
  );

  const handleVisitCommunity = useCallback(() => {
    onViewCommunity?.();
  }, [onViewCommunity]);

  return (
    <div className="participant-home__main">
      <LatestMessageCard notification={latestNotification} onOpenNotifications={onOpenNotifications} />
      <HeroBanner />

      <section className="pd-home">
        {isBirthdayToday ? <BirthdayGreeting firstName={displayName} /> : null}

        <section className="pd-home__row" aria-label={t('rowApptEventAria')}>
        {appointment ? (
          <AppointmentCard appointment={appointment} onView={goToEventsView} />
        ) : appointmentError ? (
          <FeatureCardErrorState
            variant="appointment"
            headingIcon={CalendarHeart}
            headingLabel={t('nextAppointment')}
            headingAccent="pink"
          />
        ) : isLoading ? (
          <FeatureCardLoadingShell variant="appointment" label={t('loadingAppointment')} />
        ) : (
          <AppointmentEmptyCard onBook={goToAppointments} />
        )}
        {event ? (
          <EventCard event={event} onView={goToEvents} locale={locale} />
        ) : eventError ? (
          <FeatureCardErrorState
            variant="event"
            headingIcon={Sparkles}
            headingLabel={t('upcomingEvent')}
            headingAccent="pink"
          />
        ) : isLoading ? (
          <FeatureCardLoadingShell variant="event" label={t('loadingEvent')} />
        ) : (
          <EventEmptyCard onExplore={goToExploreEvents} />
        )}
      </section>

        <section className="pd-home__row" aria-label={t('rowNotesCommunityAria')}>
          <NotesCard userId={userId} />
          <CommunityCardSection
            post={latestCommunityPost}
            isLoading={isCommunityLoading}
            hasError={communityHasError}
            relativeTime={communityRelativeTime}
            onViewPost={handleViewCommunityPost}
            onVisitCommunity={handleVisitCommunity}
          />
        </section>
      </section>
    </div>
  );
}
