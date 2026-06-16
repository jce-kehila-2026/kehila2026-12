import { useEffect, useId, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { localizeField } from '../../../i18n/localizeField';
import {
  ArrowRight,
  CalendarDays,
  CalendarHeart,
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
import { auth } from '../../../firebase';
import { getLocalizedText } from '../../../shared/i18n/getLocalizedText';
import { getParticipantLocaleLang, getStoredParticipantLocale } from '../i18n/participantLocale';
import { createCalendarNote } from '../../calendar/calendarService';
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
  getSyncValidationError,
  isReminderDateSelectable,
  parseReminderTimeParts,
  REMINDER_PERIOD_OPTIONS,
  sanitizeReminderHourInput,
  sanitizeReminderMinuteInput,
  shouldSyncToCalendar,
  stepReminderHour,
  stepReminderMinute,
  toDateInputValue,
} from './participantNotesModel';
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

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  const diffSeconds = (Date.now() - date.getTime()) / 1000;
  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function LatestMessageCard({ notification, onOpenNotifications }) {
  const lang = getParticipantLocaleLang(getStoredParticipantLocale());
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
          ? `New admin message: ${notificationTitle || truncatedBody}`
          : 'No new admin messages'
      }
    >
      <span className="pd-home__admin-message-badge" aria-hidden="true">
        <MessageCircle size={17} strokeWidth={2.2} />
      </span>

      <span className="pd-home__admin-message-content">
        <span className="pd-home__admin-message-label">New admin message</span>
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
            No new admin messages yet
          </span>
        )}
      </span>

      <span className="pd-home__admin-message-meta">
        {hasNotification ? (
          <time className="pd-home__admin-message-time">{formatRelativeTime(notification.createdAt)}</time>
        ) : null}
        <ChevronRight className="pd-home__admin-message-arrow" size={16} strokeWidth={2} aria-hidden="true" />
      </span>
    </button>
  );
}

function HeroBanner() {
  return (
    <section className="pd-home__hero" aria-label="Welcome banner">
      <img
        className="pd-home__hero-image"
        src={heroWellnessBanner}
        alt="Woman overlooking a pink sunset valley with blossoms"
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

function PremiumCta({ variant = 'pink', children, onClick }) {
  const className =
    variant === 'soft'
      ? 'pd-btn pd-btn--soft pd-community__cta'
      : `pd-btn pd-btn--${variant} pd-feature__cta`;

  return (
    <button type="button" className={className} onClick={onClick}>
      <span>{children}</span>
      <ArrowRight size={16} strokeWidth={2.5} className="pd-btn__arrow" aria-hidden="true" />
    </button>
  );
}

function AppointmentCard({ appointment, onView }) {
  const countdown = useCountdownRing(appointment.targetDate, 'appointment');

  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--feature pd-card--appointment">
      <div className="pd-card__surface pd-feature__layout">
        <div className="pd-feature__body">
          <CardHeading
            icon={CalendarHeart}
            label="Next Appointment"
            accent="pink"
            iconProps={{ strokeWidth: 1.75, absoluteStrokeWidth: true }}
          />
          <h3 className="pd-feature__title">{appointment.title}</h3>
          <p className="pd-feature__subtitle">{appointment.therapistName}</p>

          <ul className="pd-feature__details">
            <FeatureSchedule dateLabel={appointment.dateLabel} timeLabel={appointment.timeLabel} />
            <FeatureDetail icon={MapPin} value={appointment.location} />
          </ul>

          <PremiumCta variant="soft" onClick={onView}>
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

function EventCard({ event, onView, locale = 'he' }) {
  const countdown = useCountdownRing(event.targetDate, 'event');

  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--feature pd-card--event">
      <div className="pd-card__surface pd-feature__layout">
        <div className="pd-feature__body">
          <CardHeading icon={Sparkles} label="Upcoming Event" accent="pink" />
          <h3 className="pd-feature__title">{localizeField(event.translations?.title ?? event.title, locale)}</h3>
          <p className="pd-feature__subtitle">{event.category}</p>

          <ul className="pd-feature__details">
            <FeatureSchedule dateLabel={event.dateLabel} timeLabel={event.timeLabel} />
            <FeatureDetail icon={MapPin} value={localizeField(event.translations?.location ?? event.location, locale)} />
          </ul>

          <PremiumCta variant="soft" onClick={onView}>
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
  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--feature pd-card--appointment pd-card--empty">
      <div className="pd-card__surface pd-feature__layout pd-feature__layout--empty">
        <div className="pd-feature__body pd-feature-empty__body">
          <CardHeading
            icon={CalendarHeart}
            label="Next Appointment"
            accent="pink"
            iconProps={{ strokeWidth: 1.75, absoluteStrokeWidth: true }}
          />
          <h3 className="pd-feature-empty__headline">No upcoming appointments</h3>
          <p className="pd-feature-empty__text">
            Take the next step in your wellness journey and book a session with one of our therapists.
          </p>
          <PremiumCta variant="pink" onClick={onBook}>
            Book Appointment
          </PremiumCta>
        </div>

        <div className="pd-feature__col pd-feature__col--badge">
          <EmptyStateIconBadge variant="appointment" icon={CalendarHeart} />
        </div>
      </div>
    </article>
  );
}

function EventEmptyCard({ onExplore }) {
  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--feature pd-card--event pd-card--empty">
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

function usePickerDismiss(open, setOpen, rootRef, enabled = true) {
  useEffect(() => {
    if (!open || !enabled) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open, setOpen, rootRef, enabled]);
}

function NotesDatePicker({
  id,
  value,
  onChange,
  ariaLabel,
  open: controlledOpen,
  onOpenChange,
  pickerRef,
  embeddedInModal = false,
}) {
  const internalRef = useRef(null);
  const rootRef = pickerRef ?? internalRef;
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange != null;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(isOpen) : next;
      if (isControlled) {
        onOpenChange(resolved);
      } else {
        setInternalOpen(resolved);
      }
    },
    [isControlled, isOpen, onOpenChange],
  );

  usePickerDismiss(isOpen, setOpen, rootRef, !embeddedInModal);

  const initialView = getInitialCalendarView(value);
  const [viewYear, setViewYear] = useState(initialView.year);
  const [viewMonth, setViewMonth] = useState(initialView.month);

  useEffect(() => {
    if (!isOpen) return;

    const nextView = getInitialCalendarView(value);
    setViewYear(nextView.year);
    setViewMonth(nextView.month);
  }, [isOpen, value]);

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
    <div className={`pd-notes-picker pd-notes-calendar${isOpen ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`pd-notes-picker__trigger${value ? ' is-filled' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`pd-notes-picker__value${displayLabel ? '' : ' is-placeholder'}`}>
          {displayLabel || 'Select date'}
        </span>
        <CalendarDays size={15} strokeWidth={2} className="pd-notes-picker__icon" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          className="pd-notes-calendar__panel"
          role="dialog"
          aria-label={ariaLabel}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
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

function NotesTimePicker({
  id,
  value,
  onChange,
  ariaLabel,
  open: controlledOpen,
  onOpenChange,
  pickerRef,
  embeddedInModal = false,
}) {
  const hourInputId = useId();
  const minuteInputId = useId();
  const internalRef = useRef(null);
  const rootRef = pickerRef ?? internalRef;
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange != null;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(isOpen) : next;
      if (isControlled) {
        onOpenChange(resolved);
      } else {
        setInternalOpen(resolved);
      }
    },
    [isControlled, isOpen, onOpenChange],
  );

  usePickerDismiss(isOpen, setOpen, rootRef, !embeddedInModal);

  const parsedValue = parseReminderTimeParts(value);
  const [draftHour, setDraftHour] = useState(parsedValue.hour12 ?? DEFAULT_REMINDER_TIME_PARTS.hour12);
  const [draftMinute, setDraftMinute] = useState(
    parsedValue.minute != null ? parsedValue.minute : DEFAULT_REMINDER_TIME_PARTS.minute,
  );
  const [draftPeriod, setDraftPeriod] = useState(parsedValue.period ?? DEFAULT_REMINDER_TIME_PARTS.period);

  useEffect(() => {
    if (!isOpen) return;

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
    if (embeddedInModal) {
      setOpen(false);
    }
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
    <div className={`pd-notes-picker pd-notes-time${isOpen ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`pd-notes-picker__trigger${value ? ' is-filled' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`pd-notes-picker__value${displayLabel ? '' : ' is-placeholder'}`}>
          {displayLabel || 'Select time'}
        </span>
        <Clock3 size={15} strokeWidth={2} className="pd-notes-picker__icon" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          className="pd-notes-time__panel"
          role="dialog"
          aria-label={ariaLabel}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
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
  open: isModalOpen,
  onClose,
  draftDate,
  draftTime,
  onDateChange,
  onTimeChange,
  datePickerId,
  timePickerId,
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const datePickerRef = useRef(null);
  const timePickerRef = useRef(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const closeModal = useCallback(() => {
    setIsDatePickerOpen(false);
    setIsTimePickerOpen(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isModalOpen) return undefined;
    setIsDatePickerOpen(false);
    setIsTimePickerOpen(false);
    return undefined;
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      event.stopPropagation();

      if (isDatePickerOpen) {
        setIsDatePickerOpen(false);
        return;
      }

      if (isTimePickerOpen) {
        setIsTimePickerOpen(false);
        return;
      }

      closeModal();
    };

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!panelRef.current?.contains(target)) return;

      if (isDatePickerOpen && datePickerRef.current && !datePickerRef.current.contains(target)) {
        setIsDatePickerOpen(false);
      }

      if (isTimePickerOpen && timePickerRef.current && !timePickerRef.current.contains(target)) {
        setIsTimePickerOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isModalOpen, isDatePickerOpen, isTimePickerOpen, closeModal]);

  if (!isModalOpen) return null;

  const scheduleSummary = formatReminderDateTimeLabel(draftDate, draftTime);

  const modalContent = (
    <div className="pd-notes-schedule-modal" role="presentation">
      <div
        className="pd-notes-schedule-modal__backdrop"
        aria-hidden="true"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeModal();
          }
        }}
      />
      <div
        ref={panelRef}
        className="pd-notes-schedule-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pd-notes-schedule-modal__header">
          <h4 id={titleId}>Reminder schedule</h4>
          <button type="button" className="pd-notes-schedule-modal__close" aria-label="Close" onClick={closeModal}>
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
            open={isDatePickerOpen}
            onOpenChange={(nextOpen) => {
              setIsDatePickerOpen(nextOpen);
              if (nextOpen) setIsTimePickerOpen(false);
            }}
            pickerRef={datePickerRef}
            embeddedInModal
          />
          <NotesTimePicker
            id={timePickerId}
            value={draftTime}
            ariaLabel="Reminder time"
            onChange={onTimeChange}
            open={isTimePickerOpen}
            onOpenChange={(nextOpen) => {
              setIsTimePickerOpen(nextOpen);
              if (nextOpen) setIsDatePickerOpen(false);
            }}
            pickerRef={timePickerRef}
            embeddedInModal
          />
        </div>

        {scheduleSummary ? (
          <p className="pd-notes-schedule-modal__summary" role="status">
            {scheduleSummary}
          </p>
        ) : null}

        <button type="button" className="pd-notes-schedule-modal__done" onClick={closeModal}>
          Done
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

const NOTES_COMPLETION_FEEDBACK_MS = 650;

function NotesCard({ userId }) {
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
      setSyncHint('Unable to save note. Please sign in again.');
      return;
    }

    const date = draftDate.trim();
    const time = draftTime.trim();
    const willSync = shouldSyncToCalendar(syncEnabled, date, time);
    const validationError = getSyncValidationError(syncEnabled, date, time);

    if (validationError) {
      setSyncHint(validationError);
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
      setSyncHint('Unable to save note right now.');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [draftDate, draftTime, syncEnabled, userId]);

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
        <CardHeading icon={NotebookPen} label="My Notes &amp; Reminders" accent="pink" />

        <form className="pd-notes__composer" noValidate onSubmit={handleNoteFormSubmit}>
          <label className="visually-hidden" htmlFor={titleInputId}>
            Note title
          </label>
          <div className="pd-notes__input-row">
            <input
              ref={noteInputRef}
              id={titleInputId}
              name="noteTitle"
              type="text"
              value={draftTitle}
              placeholder="Write a note..."
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
              aria-label="Add note"
              disabled={isSaving}
              onClick={handleAddNoteClick}
            >
              <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
              <span>Add</span>
            </button>
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
                aria-label="Mark note complete"
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
    <article className="pd-card pd-card--dashboard-skin pd-card--community pd-card--loading" aria-busy="true">
      <div className="pd-card__surface">
        <CardHeading icon={Users} label="Community Highlight" accent="pink" />
        <p className="pd-community__loading">Loading latest community post…</p>
      </div>
    </article>
  );
}

function CommunityEmptyCard({ onVisitCommunity, title, text, ctaLabel = 'Visit Community' }) {
  return (
    <article className="pd-card pd-card--dashboard-skin pd-card--community pd-card--community-empty">
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
    <article className="pd-card pd-card--dashboard-skin pd-card--community">
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
  displayName = '',
  birthDate = '',
  onNavigateToView,
  onViewCommunity,
  latestNotification = null,
  onOpenNotifications,
  locale = 'he',
}) {
  const { appointment, event, isLoading, appointmentError, eventError } = useParticipantDashboardHomeData(userId);
  const isBirthdayToday = useBirthdayToday(birthDate);
  const {
    post: latestCommunityPost,
    isLoading: isCommunityLoading,
    hasError: communityHasError,
    relativeTime: communityRelativeTime,
  } = useLatestCommunityPost();

  const goToEventsView = useCallback(() => {
    onNavigateToView?.('events');
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

        <section className="pd-home__row" aria-label="Upcoming appointment and event">
        {appointment ? (
          <AppointmentCard appointment={appointment} onView={goToAppointments} />
        ) : appointmentError ? (
          <FeatureCardErrorState
            variant="appointment"
            headingIcon={CalendarHeart}
            headingLabel="Next Appointment"
            headingAccent="pink"
          />
        ) : isLoading ? (
          <FeatureCardLoadingShell variant="appointment" label="Loading appointment" />
        ) : (
          <AppointmentEmptyCard onBook={goToAppointments} />
        )}
        {event ? (
          <EventCard event={event} onView={goToEvents} locale={locale} />
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
