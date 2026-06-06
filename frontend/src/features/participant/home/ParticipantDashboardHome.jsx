import { useEffect, useId, useMemo, useRef, useState, useCallback } from 'react';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CalendarSync,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  NotebookPen,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import heroWellnessBanner from '../../../assets/hero-wellness-banner.png';
import communityHighlightFallback from '../../../assets/images/support-groups.jpeg';
import sheNaLogo from '../../../assets/she-na-logo.png';
import DarkModeToggle from '../../profile/components/DarkModeToggle';
import ParticipantLanguageSwitcher from '../components/ParticipantLanguageSwitcher';
import useDailyMotivation from './useDailyMotivation';
import { initialReminderNotes } from './participantDashboardMockData';
import {
  buildCalendarMonthCells,
  CALENDAR_WEEKDAY_LABELS,
  composeReminderTimeValue,
  DEFAULT_REMINDER_TIME_PARTS,
  formatReminderDateDisplay,
  formatReminderDateTimeLabel,
  formatReminderTimeDisplay,
  getCalendarMonthLabel,
  getInitialCalendarView,
  hasValidReminderDateTime,
  isReminderDateSelectable,
  parseReminderTimeParts,
  REMINDER_PERIOD_OPTIONS,
  sanitizeReminderHourInput,
  sanitizeReminderMinuteInput,
  shouldSyncToCalendar,
  stepReminderHour,
  stepReminderMinute,
  SYNC_VALIDATION_MESSAGE,
  toDateInputValue,
} from './participantNotesModel';
import { useParticipantDashboardHomeData } from './useParticipantDashboardHomeData';
import useLatestCommunityPost from '../community/hooks/useLatestCommunityPost';
import './ParticipantDashboardHome.css';

const RING_SIZE = 130;
const RING_CENTER = 65;
const RING_RADIUS = 51;
const RING_INNER_RADIUS = 46;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_ROTATE = `rotate(-90 ${RING_CENTER} ${RING_CENTER})`;

/** Fixed windows — ring fill = clamp(remainingMs / windowMs, 0, 1). */
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
      eyebrow: 'Starts in',
      value: String(days),
      unit: days === 1 ? 'day' : 'days',
      progress,
      display: 'days',
    };
  }

  return {
    status: 'active',
    eyebrow: 'Starts in',
    value: formatHms(remainingMs),
    unit: '',
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
      eyebrow: 'Started',
      value: '',
      unit: '',
      progress: 0,
      remainingMs: 0,
      display: 'status',
    };
  }

  return {
    status: 'completed',
    eyebrow: 'Completed',
    value: '',
    unit: '',
    progress: 0,
    remainingMs: 0,
    display: 'status',
  };
}

function useCountdownRing(targetDate, displayMode = 'appointment') {
  const targetMs = targetDate.getTime();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (targetMs - new Date().getTime() <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTick((tick) => tick + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetMs]);

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
  const uid = useId().replace(/:/g, '');
  const gradientId = `pd-ring-grad-${variant}-${uid}`;
  const displayMode = variant === 'appointment' ? 'appointment' : 'event';
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
          ? `${countdown.eyebrow} ${countdown.value} ${countdown.unit}`.trim()
          : countdown.eyebrow
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
                <stop offset="0%" stopColor="#5b1e8c" />
                <stop offset="55%" stopColor="#8a2da8" />
                <stop offset="100%" stopColor="#ec168c" />
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
            <span>{countdown.eyebrow}</span>
            <strong
              className={
                countdown.display === 'days'
                  ? 'pd-countdown-ring__value--days'
                  : 'pd-countdown-ring__value--hms'
              }
            >
              {countdown.value}
            </strong>
            {countdown.unit ? <small>{countdown.unit}</small> : null}
          </>
        ) : (
          <strong className="pd-countdown-ring__status">{countdown.eyebrow}</strong>
        )}
      </div>
    </div>
  );
}

function DashboardHeader({ displayName, darkMode, onDarkModeChange, locale, onLocaleChange }) {
  return (
    <header className="pd-home__header">
      <div className="pd-home__header-copy">
        <h1>Welcome back, {displayName}</h1>
      </div>

      <div className="pd-home__header-actions">
        <button type="button" className="pd-header-icon-btn" aria-label="Notifications">
          <Bell size={18} strokeWidth={2.2} />
          <span className="pd-header-icon-btn__badge">2</span>
        </button>

        <ParticipantLanguageSwitcher locale={locale} onChange={onLocaleChange} />

        <DarkModeToggle
          darkMode={darkMode}
          onChange={onDarkModeChange}
          compact
          ariaLabel="Toggle dark mode"
        />

        <span className="pd-home__header-divider" aria-hidden="true" />

        <img src={sheNaLogo} alt="She-Na" className="pd-home__header-logo" />
      </div>
    </header>
  );
}

function HeroBanner({ displayName, dailyQuote, onViewJourney }) {
  return (
    <section className="pd-home__hero" aria-label="Welcome banner">
      <img
        className="pd-home__hero-image"
        src={heroWellnessBanner}
        alt="Woman overlooking a pink sunset valley with blossoms"
      />
      <div className="pd-home__hero-overlay" aria-hidden="true" />
      <div className="pd-home__hero-content">
        <h2 className="pd-home__hero-title">Keep going, {displayName}</h2>
        {dailyQuote?.text ? (
          <blockquote className="pd-home__hero-quote">
            <p>&ldquo;{dailyQuote.text}&rdquo;</p>
            {dailyQuote.author ? <cite>{dailyQuote.author}</cite> : null}
          </blockquote>
        ) : null}
        <button type="button" className="pd-home__hero-cta" onClick={onViewJourney}>
          View My Journey
        </button>
      </div>
    </section>
  );
}

function FeatureCardWatermark({ variant }) {
  if (variant === 'community') {
    return (
      <div className="pd-feature__watermark pd-feature__watermark--community" aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M60 96c-20-15-34-30-34-49 0-15 12-26 27-26 9 0 17 5 21 12 4-7 12-12 21-12 15 0 27 11 27 26 0 19-14 34-34 49z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`pd-feature__watermark pd-feature__watermark--${variant}`} aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M60 18c-6 14-18 22-18 36 0 10 8 18 18 18s18-8 18-18c0-14-12-22-18-36z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M60 72c-10 8-22 10-32 4 8 12 20 18 32 18s24-6 32-18c-10 6-22 4-32-4z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.7"
        />
        <circle cx="60" cy="58" r="6" fill="currentColor" opacity="0.5" />
      </svg>
    </div>
  );
}

function CardDecor({ variant }) {
  return (
    <div className={`pd-card__decor pd-card__decor--${variant}`} aria-hidden="true">
      <span className="pd-card__blob pd-card__blob--a" />
      <span className="pd-card__blob pd-card__blob--b" />
      <span className="pd-card__petal pd-card__petal--a" />
      <span className="pd-card__petal pd-card__petal--b" />
    </div>
  );
}

function CardHeading({ icon: Icon, label, accent = 'purple' }) {
  return (
    <div className={`pd-card__heading pd-card__heading--${accent}`}>
      <span className="pd-card__heading-badge" aria-hidden="true">
        <Icon size={20} strokeWidth={2.1} />
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
          ·{' '}
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

function PremiumCta({ variant, children, onClick }) {
  return (
    <button type="button" className={`pd-btn pd-btn--${variant} pd-feature__cta`} onClick={onClick}>
      <span>{children}</span>
      <ArrowRight size={16} strokeWidth={2.5} className="pd-btn__arrow" aria-hidden="true" />
    </button>
  );
}

function AppointmentCard({ appointment, onView }) {
  const countdown = useCountdownRing(appointment.targetDate, 'appointment');

  return (
    <article className="pd-card pd-card--glass pd-card--feature pd-card--appointment">
      <FeatureCardWatermark variant="appointment" />
      <CardDecor variant="appointment" />
      <div className="pd-card__surface pd-feature__layout">
        <div className="pd-feature__body">
          <CardHeading icon={CalendarDays} label="Next Appointment" accent="purple" />
          <h3 className="pd-feature__title">{appointment.title}</h3>
          <p className="pd-feature__subtitle">{appointment.therapistName}</p>

          <ul className="pd-feature__details">
            <FeatureSchedule dateLabel={appointment.dateLabel} timeLabel={appointment.timeLabel} />
            <FeatureDetail icon={MapPin} value={appointment.location} />
          </ul>

          <PremiumCta variant="primary" onClick={onView}>
            View Appointment
          </PremiumCta>
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

function EventCard({ event, onView }) {
  const countdown = useCountdownRing(event.targetDate, 'event');

  return (
    <article className="pd-card pd-card--glass pd-card--feature pd-card--event">
      <FeatureCardWatermark variant="event" />
      <CardDecor variant="event" />
      <div className="pd-card__surface pd-feature__layout">
        <div className="pd-feature__body">
          <CardHeading icon={Sparkles} label="Upcoming Event" accent="pink" />
          <h3 className="pd-feature__title">{event.title}</h3>
          <p className="pd-feature__subtitle">{event.category}</p>

          <ul className="pd-feature__details">
            <FeatureSchedule dateLabel={event.dateLabel} timeLabel={event.timeLabel} />
            <FeatureDetail icon={MapPin} value={event.location} />
          </ul>

          <PremiumCta variant="pink" onClick={onView}>
            View Event
          </PremiumCta>
        </div>

        <div className="pd-feature__col pd-feature__col--countdown">
          <CircularCountdownRing variant="event" targetDate={event.targetDate} countdown={countdown} />
        </div>
      </div>
    </article>
  );
}

function EmptyStatePattern({ variant }) {
  const accent = variant === 'appointment' ? '#5b1e8c' : '#ec168c';
  const accentSoft = variant === 'appointment' ? '#8a2da8' : '#f472b6';

  return (
    <div className={`pd-feature-empty__pattern pd-feature-empty__pattern--${variant}`} aria-hidden="true">
      <svg viewBox="0 0 480 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <circle cx="392" cy="48" r="72" fill={accent} opacity="0.06" />
        <circle cx="430" cy="196" r="48" fill={accentSoft} opacity="0.07" />
        <circle cx="48" cy="210" r="36" fill={accentSoft} opacity="0.05" />
        <path
          d="M24 168c28-36 56-44 88-28s52 48 84 36 62-58 96-42"
          stroke={accent}
          strokeWidth="1.5"
          fill="none"
          opacity="0.07"
          strokeLinecap="round"
        />
        <path
          d="M320 24c10 14 24 18 38 12M338 18c8 12 20 16 32 10"
          stroke={accentSoft}
          strokeWidth="1.2"
          fill="none"
          opacity="0.08"
          strokeLinecap="round"
        />
        <g opacity="0.06" fill={accent}>
          <ellipse cx="120" cy="52" rx="10" ry="16" transform="rotate(-18 120 52)" />
          <ellipse cx="136" cy="44" rx="10" ry="16" transform="rotate(18 136 44)" />
          <circle cx="128" cy="58" r="5" />
        </g>
      </svg>
    </div>
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
      className={`pd-card pd-card--glass pd-card--feature pd-card--${variant} pd-card--feature-loading`}
      aria-busy="true"
      aria-label={label}
    />
  );
}

function AppointmentEmptyCard({ onBook }) {
  return (
    <article className="pd-card pd-card--glass pd-card--feature pd-card--appointment pd-card--empty">
      <FeatureCardWatermark variant="appointment" />
      <CardDecor variant="appointment" />
      <EmptyStatePattern variant="appointment" />
      <div className="pd-card__surface pd-feature__layout pd-feature__layout--empty">
        <div className="pd-feature__body pd-feature-empty__body">
          <CardHeading icon={CalendarDays} label="Next Appointment" accent="purple" />
          <h3 className="pd-feature-empty__headline">No upcoming appointments</h3>
          <p className="pd-feature-empty__text">
            Take the next step in your wellness journey and book a session with one of our therapists.
          </p>
          <PremiumCta variant="primary" onClick={onBook}>
            Book Appointment
          </PremiumCta>
        </div>

        <div className="pd-feature__col pd-feature__col--badge">
          <EmptyStateIconBadge variant="appointment" icon={CalendarDays} />
        </div>
      </div>
    </article>
  );
}

function EventEmptyCard({ onExplore }) {
  return (
    <article className="pd-card pd-card--glass pd-card--feature pd-card--event pd-card--empty">
      <FeatureCardWatermark variant="event" />
      <CardDecor variant="event" />
      <EmptyStatePattern variant="event" />
      <div className="pd-card__surface pd-feature__layout pd-feature__layout--empty">
        <div className="pd-feature__body pd-feature-empty__body">
          <CardHeading icon={Sparkles} label="Upcoming Event" accent="pink" />
          <h3 className="pd-feature-empty__headline">No upcoming events</h3>
          <p className="pd-feature-empty__text">
            Explore upcoming workshops, support groups, and community activities.
          </p>
          <PremiumCta variant="pink" onClick={onExplore}>
            Explore Events
          </PremiumCta>
        </div>

        <div className="pd-feature__col pd-feature__col--badge">
          <EmptyStateIconBadge variant="event" icon={Users} />
        </div>
      </div>
    </article>
  );
}

function FeatureCardErrorState({ variant, headingIcon: HeadingIcon, headingLabel, headingAccent }) {
  const badgeVariant = variant === 'event' ? 'event' : 'appointment';

  return (
    <article
      className={`pd-card pd-card--glass pd-card--feature pd-card--${variant} pd-card--empty pd-card--error`}
    >
      <FeatureCardWatermark variant={variant} />
      <CardDecor variant={variant} />
      <EmptyStatePattern variant={badgeVariant} />
      <div className="pd-card__surface pd-feature__layout pd-feature__layout--empty">
        <div className="pd-feature__body pd-feature-empty__body">
          <CardHeading icon={HeadingIcon} label={headingLabel} accent={headingAccent} />
          <p className="pd-feature-error__message" role="status">
            We couldn&apos;t load this right now.
          </p>
        </div>

        <div className="pd-feature__col pd-feature__col--badge">
          <EmptyStateIconBadge variant={badgeVariant} icon={HeadingIcon} />
        </div>
      </div>
    </article>
  );
}

function usePickerDismiss(open, setOpen, rootRef) {
  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen, rootRef]);
}

function NotesDatePicker({ id, value, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const initialView = getInitialCalendarView(value);
  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);

  usePickerDismiss(open, setOpen, rootRef);

  useEffect(() => {
    if (!open) return;

    const nextView = getInitialCalendarView(value);
    setViewYear(nextView.year);
    setViewMonth(nextView.month);
  }, [open, value]);

  const cells = useMemo(() => buildCalendarMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = getCalendarMonthLabel(viewYear, viewMonth);
  const displayLabel = formatReminderDateDisplay(value);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((currentYear) => currentYear - 1);
      setViewMonth(11);
      return;
    }
    setViewMonth((currentMonth) => currentMonth - 1);
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((currentYear) => currentYear + 1);
      setViewMonth(0);
      return;
    }
    setViewMonth((currentMonth) => currentMonth + 1);
  };

  const handleSelect = (nextValue, date) => {
    if (!isReminderDateSelectable(date)) return;
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div className={`pd-notes-picker pd-notes-calendar${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`pd-notes-picker__trigger${value ? ' is-filled' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`pd-notes-picker__value${displayLabel ? '' : ' is-placeholder'}`}>
          {displayLabel || 'Select date'}
        </span>
        <CalendarDays size={15} strokeWidth={2} className="pd-notes-picker__icon" aria-hidden="true" />
      </button>

      {open ? (
        <div className="pd-notes-calendar__panel" role="dialog" aria-label={ariaLabel}>
          <div className="pd-notes-calendar__nav">
            <button type="button" className="pd-notes-calendar__nav-btn" onClick={goPrevMonth} aria-label="Previous month">
              <ChevronLeft size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <span className="pd-notes-calendar__month">{monthLabel}</span>
            <button type="button" className="pd-notes-calendar__nav-btn" onClick={goNextMonth} aria-label="Next month">
              <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className="pd-notes-calendar__weekdays" aria-hidden="true">
            {CALENDAR_WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="pd-notes-calendar__grid" role="grid">
            {cells.map((cell) => {
              const selectable = isReminderDateSelectable(cell.date);
              const isSelected = value === cell.value;
              const isToday = cell.value === toDateInputValue(new Date());

              return (
                <button
                  key={cell.value}
                  type="button"
                  role="gridcell"
                  aria-label={cell.value}
                  aria-selected={isSelected}
                  disabled={!selectable}
                  className={[
                    'pd-notes-calendar__day',
                    cell.inMonth ? '' : 'is-outside',
                    isSelected ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleSelect(cell.value, cell.date)}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimeStepperInput({ id, label, value, onCommit, maxLength }) {
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const displayValue = String(value).padStart(2, '0');

  const handleFocus = (event) => {
    setIsEditing(true);
    setText(displayValue);
    event.target.select();
  };

  const handleChange = (event) => {
    setText(event.target.value.replace(/\D/g, '').slice(0, maxLength));
  };

  const handleBlur = () => {
    setIsEditing(false);
    onCommit(text);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className="pd-notes-time__step-value"
      value={isEditing ? text : displayValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-label={label}
    />
  );
}

function NotesTimePicker({ id, value, onChange, ariaLabel }) {
  const hourInputId = useId();
  const minuteInputId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const parsedValue = parseReminderTimeParts(value);
  const [draftHour, setDraftHour] = useState(parsedValue.hour12 ?? DEFAULT_REMINDER_TIME_PARTS.hour12);
  const [draftMinute, setDraftMinute] = useState(
    parsedValue.minute != null ? parsedValue.minute : DEFAULT_REMINDER_TIME_PARTS.minute,
  );
  const [draftPeriod, setDraftPeriod] = useState(parsedValue.period ?? DEFAULT_REMINDER_TIME_PARTS.period);

  usePickerDismiss(open, setOpen, rootRef);

  useEffect(() => {
    if (!open) return;

    const parts = parseReminderTimeParts(value);
    if (parts.hour12 != null && parts.minute != null && parts.period) {
      setDraftHour(parts.hour12);
      setDraftMinute(parts.minute);
      setDraftPeriod(parts.period);
      return;
    }

    setDraftHour(DEFAULT_REMINDER_TIME_PARTS.hour12);
    setDraftMinute(DEFAULT_REMINDER_TIME_PARTS.minute);
    setDraftPeriod(DEFAULT_REMINDER_TIME_PARTS.period);
  }, [open, value]);

  const displayLabel = formatReminderTimeDisplay(value);

  const commitSelection = (hour12, minute, period) => {
    const nextValue = composeReminderTimeValue(hour12, minute, period);
    if (nextValue) onChange(nextValue);
  };

  const adjustHour = (delta) => {
    const nextHour = stepReminderHour(draftHour, delta);
    setDraftHour(nextHour);
    commitSelection(nextHour, draftMinute, draftPeriod);
  };

  const adjustMinute = (delta) => {
    const nextMinute = stepReminderMinute(draftMinute, delta);
    setDraftMinute(nextMinute);
    commitSelection(draftHour, nextMinute, draftPeriod);
  };

  const handlePeriodSelect = (period) => {
    setDraftPeriod(period);
    commitSelection(draftHour, draftMinute, period);
  };

  const handleHourCommit = (text) => {
    const nextHour = sanitizeReminderHourInput(text);
    if (nextHour == null) return;

    setDraftHour(nextHour);
    commitSelection(nextHour, draftMinute, draftPeriod);
  };

  const handleMinuteCommit = (text) => {
    const nextMinute = sanitizeReminderMinuteInput(text);
    if (nextMinute == null) return;

    setDraftMinute(nextMinute);
    commitSelection(draftHour, nextMinute, draftPeriod);
  };

  return (
    <div className={`pd-notes-picker pd-notes-time${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`pd-notes-picker__trigger${value ? ' is-filled' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`pd-notes-picker__value${displayLabel ? '' : ' is-placeholder'}`}>
          {displayLabel || 'Select time'}
        </span>
        <Clock3 size={15} strokeWidth={2} className="pd-notes-picker__icon" aria-hidden="true" />
      </button>

      {open ? (
        <div className="pd-notes-time__panel" role="dialog" aria-label={ariaLabel}>
          <div className="pd-notes-time__steppers">
            <div className="pd-notes-time__stepper">
              <span className="pd-notes-time__column-label">Hour</span>
              <button
                type="button"
                className="pd-notes-time__step-btn"
                aria-label="Increase hour"
                onClick={() => adjustHour(1)}
              >
                <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
              <TimeStepperInput
                id={hourInputId}
                label="Hour"
                value={draftHour}
                maxLength={2}
                onCommit={handleHourCommit}
              />
              <button
                type="button"
                className="pd-notes-time__step-btn"
                aria-label="Decrease hour"
                onClick={() => adjustHour(-1)}
              >
                <Minus size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>

            <div className="pd-notes-time__stepper">
              <span className="pd-notes-time__column-label">Minute</span>
              <button
                type="button"
                className="pd-notes-time__step-btn"
                aria-label="Increase minute"
                onClick={() => adjustMinute(1)}
              >
                <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
              <TimeStepperInput
                id={minuteInputId}
                label="Minute"
                value={draftMinute}
                maxLength={2}
                onCommit={handleMinuteCommit}
              />
              <button
                type="button"
                className="pd-notes-time__step-btn"
                aria-label="Decrease minute"
                onClick={() => adjustMinute(-1)}
              >
                <Minus size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>

            <div className="pd-notes-time__period">
              <span className="pd-notes-time__column-label">Period</span>
              <div className="pd-notes-time__period-spacer" aria-hidden="true" />
              <div className="pd-notes-time__period-btns">
                {REMINDER_PERIOD_OPTIONS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={`pd-notes-time__period-btn${draftPeriod === period ? ' is-selected' : ''}`}
                    aria-pressed={draftPeriod === period}
                    onClick={() => handlePeriodSelect(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <div className="pd-notes-time__period-spacer" aria-hidden="true" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotesScheduleModal({
  open,
  onClose,
  draftDate,
  draftTime,
  onDateChange,
  onTimeChange,
  datePickerId,
  timePickerId,
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const scheduleSummary = formatReminderDateTimeLabel(draftDate, draftTime);

  return (
    <div className="pd-notes-schedule-modal" role="presentation">
      <button type="button" className="pd-notes-schedule-modal__backdrop" aria-label="Close schedule" onClick={onClose} />
      <div
        className="pd-notes-schedule-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="pd-notes-schedule-modal__header">
          <h4 id={titleId}>Reminder schedule</h4>
          <button type="button" className="pd-notes-schedule-modal__close" aria-label="Close" onClick={onClose}>
            <X size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <p className="pd-notes-schedule-modal__hint">Set an optional date and time for calendar sync.</p>

        <div className="pd-notes__datetime pd-notes__datetime--modal">
          <NotesDatePicker
            id={datePickerId}
            value={draftDate}
            ariaLabel="Reminder date"
            onChange={onDateChange}
          />
          <NotesTimePicker
            id={timePickerId}
            value={draftTime}
            ariaLabel="Reminder time"
            onChange={onTimeChange}
          />
        </div>

        {scheduleSummary ? (
          <p className="pd-notes-schedule-modal__summary" role="status">
            {scheduleSummary}
          </p>
        ) : null}

        <button type="button" className="pd-notes-schedule-modal__done" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

function NotesCard() {
  const titleInputId = useId();
  const datePickerId = useId();
  const timePickerId = useId();
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncHint, setSyncHint] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [notes, setNotes] = useState(initialReminderNotes);

  const clearSyncHint = () => {
    if (syncHint) setSyncHint('');
  };

  const addNote = () => {
    const title = draftTitle.trim();
    if (!title) return;

    const date = draftDate.trim();
    const time = draftTime.trim();
    const willSync = shouldSyncToCalendar(syncEnabled, date, time);

    if (syncEnabled && !hasValidReminderDateTime(date, time)) {
      setSyncHint(SYNC_VALIDATION_MESSAGE);
    } else {
      setSyncHint('');
    }

    // TODO(Firestore): when willSync is true, call createCalendarNote(user, { title, date, time, content: '' })

    setNotes((current) => [
      {
        id: `note-${Date.now()}`,
        title,
        date,
        time,
        done: false,
        syncToCalendar: willSync,
      },
      ...current,
    ]);

    setDraftTitle('');
    setDraftDate('');
    setDraftTime('');
  };

  const toggleNote = (id) => {
    setNotes((current) =>
      current.map((note) => (note.id === id ? { ...note, done: !note.done } : note)),
    );
  };

  const handleSyncToggle = () => {
    setSyncEnabled((value) => !value);
    setSyncHint('');
  };

  return (
    <article className="pd-card pd-card--glass pd-card--notes">
      <FeatureCardWatermark variant="notes" />
      <CardDecor variant="notes" />
      <div className="pd-card__surface">
        <CardHeading icon={NotebookPen} label="My Notes &amp; Reminders" accent="purple" />

        <div className="pd-notes__composer">
          <label className="visually-hidden" htmlFor={titleInputId}>
            Note title
          </label>
          <div className="pd-notes__input-row">
            <input
              id={titleInputId}
              type="text"
              value={draftTitle}
              placeholder="Write a note..."
              onChange={(event) => {
                setDraftTitle(event.target.value);
                clearSyncHint();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addNote();
              }}
            />
            <button
              type="button"
              className={`pd-notes__schedule-btn${draftDate || draftTime ? ' has-schedule' : ''}`}
              aria-label="Set reminder date and time"
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
        </div>

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
        {notes.map((note) => {
          const scheduleLabel = formatReminderDateTimeLabel(note.date, note.time);

          return (
            <li key={note.id} className={note.done ? 'is-done' : ''}>
              <button
                type="button"
                className={`pd-notes__check${note.done ? ' is-checked' : ''}`}
                aria-label={note.done ? 'Mark note incomplete' : 'Mark note complete'}
                aria-pressed={note.done}
                onClick={() => toggleNote(note.id)}
              >
                {note.done ? <Check size={14} strokeWidth={3} /> : null}
              </button>
              <div className="pd-notes__copy">
                <span>{note.title}</span>
                {scheduleLabel ? (
                  <small>
                    {scheduleLabel}
                    {note.syncToCalendar ? ' · Synced to calendar' : ''}
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
          <span>Sync to Calendar</span>
        </div>
        <button
          type="button"
          className={`pd-toggle${syncEnabled ? ' is-on' : ''}`}
          role="switch"
          aria-checked={syncEnabled}
          aria-label="Sync new reminders to calendar"
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
  return (
    <article className="pd-card pd-card--glass pd-card--community pd-card--loading" aria-busy="true">
      <div className="pd-card__surface">
        <CardHeading icon={Users} label="Community Highlight" accent="pink" />
        <p className="pd-community__loading">Loading latest community post…</p>
      </div>
    </article>
  );
}

function CommunityEmptyCard({ onVisitCommunity, title, text, ctaLabel = 'Visit Community' }) {
  return (
    <article className="pd-card pd-card--glass pd-card--community pd-card--community-empty">
      <FeatureCardWatermark variant="community" />
      <CardDecor variant="community" />
      <div className="pd-card__surface">
        <CardHeading icon={Users} label="Community Highlight" accent="pink" />
        <div className="pd-community-empty">
          <h3 className="pd-community-empty__title">{title}</h3>
          <p className="pd-community-empty__text">{text}</p>
          <button type="button" className="pd-btn pd-btn--soft pd-community__cta" onClick={onVisitCommunity}>
            <span>{ctaLabel}</span>
            <ArrowRight size={16} strokeWidth={2.5} className="pd-btn__arrow" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function CommunityCard({ post, relativeTime, onViewPost }) {
  const postImageUrl = getCommunityPostImageUrl(post);
  const thumbImageUrl = postImageUrl || communityHighlightFallback;
  const isFallbackThumb = !postImageUrl;
  const likesCount = post.likesCount ?? post.likes ?? 0;
  const commentsCount = post.commentsCount ?? 0;

  return (
    <article className="pd-card pd-card--glass pd-card--community">
      <FeatureCardWatermark variant="community" />
      <CardDecor variant="community" />
      <div className="pd-card__surface">
        <CardHeading icon={Users} label="Community Highlight" accent="pink" />

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

            <p className="pd-community__excerpt">{post.content || post.body}</p>
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
                <strong>{likesCount}</strong> Likes
              </span>
            </span>
            <span className="pd-community__stat">
              <MessageCircle size={16} strokeWidth={2} aria-hidden="true" />
              <span className="pd-community__stat-text">
                <strong>{commentsCount}</strong> Comments
              </span>
            </span>
          </div>

          <button type="button" className="pd-btn pd-btn--soft pd-community__cta" onClick={() => onViewPost(post.id)}>
            <span>View Post</span>
            <ArrowRight size={16} strokeWidth={2.5} className="pd-btn__arrow" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function CommunityCardSection({ post, isLoading, hasError, relativeTime, onViewPost, onVisitCommunity }) {
  if (isLoading) {
    return <CommunityCardLoading />;
  }

  if (hasError) {
    return (
      <CommunityEmptyCard
        onVisitCommunity={onVisitCommunity}
        title="Community highlight unavailable"
        text="We couldn't load the latest post right now."
        ctaLabel="Visit Community"
      />
    );
  }

  if (!post) {
    return (
      <CommunityEmptyCard
        onVisitCommunity={onVisitCommunity}
        title="No community posts yet"
        text="Be the first to share with the community, or visit to see what others are posting."
      />
    );
  }

  return (
    <CommunityCard post={post} relativeTime={relativeTime} onViewPost={onViewPost} />
  );
}

export default function ParticipantDashboardHome({
  userId,
  displayName = 'Dema',
  darkMode = false,
  onDarkModeChange,
  locale = 'en',
  onLocaleChange,
  onViewJourney,
  onNavigateToView,
  onViewCommunity,
}) {
  const { appointment, event, isLoading, appointmentError, eventError } = useParticipantDashboardHomeData(userId);
  const {
    post: latestCommunityPost,
    isLoading: isCommunityLoading,
    hasError: communityHasError,
    relativeTime: communityRelativeTime,
  } = useLatestCommunityPost();
  const { quote: dailyQuote } = useDailyMotivation();

  const goToEventsView = useCallback(() => {
    onNavigateToView('events');
  }, [onNavigateToView]);

  const goToAppointments = useCallback(() => {
    goToEventsView();
  }, [goToEventsView]);

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
    <div className="pd-home">
      <DashboardHeader
        displayName={displayName}
        darkMode={darkMode}
        onDarkModeChange={onDarkModeChange}
        locale={locale}
        onLocaleChange={onLocaleChange}
      />
      <HeroBanner displayName={displayName} dailyQuote={dailyQuote} onViewJourney={onViewJourney} />

      <section className="pd-home__row" aria-label="Upcoming appointment and event">
        {appointment ? (
          <AppointmentCard appointment={appointment} onView={goToAppointments} />
        ) : appointmentError ? (
          <FeatureCardErrorState
            variant="appointment"
            headingIcon={CalendarDays}
            headingLabel="Next Appointment"
            headingAccent="purple"
          />
        ) : isLoading ? (
          <FeatureCardLoadingShell variant="appointment" label="Loading appointment" />
        ) : (
          <AppointmentEmptyCard onBook={goToAppointments} />
        )}
        {event ? (
          <EventCard event={event} onView={goToEvents} />
        ) : eventError ? (
          <FeatureCardErrorState
            variant="event"
            headingIcon={Sparkles}
            headingLabel="Upcoming Event"
            headingAccent="pink"
          />
        ) : isLoading ? (
          <FeatureCardLoadingShell variant="event" label="Loading event" />
        ) : (
          <EventEmptyCard onExplore={goToEvents} />
        )}
      </section>

      <section className="pd-home__row" aria-label="Notes and community">
        <NotesCard />
        <CommunityCardSection
          post={latestCommunityPost}
          isLoading={isCommunityLoading}
          hasError={communityHasError}
          relativeTime={communityRelativeTime}
          onViewPost={handleViewCommunityPost}
          onVisitCommunity={handleVisitCommunity}
        />
      </section>
    </div>
  );
}
