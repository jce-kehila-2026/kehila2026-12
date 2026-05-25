import { useCallback, useEffect, useMemo, useState } from 'react';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import PersonIcon from '@mui/icons-material/Person';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import SpaIcon from '@mui/icons-material/Spa';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { useNavigate } from 'react-router-dom';
import appointmentsHero from '../../assets/appointments-hero.png';
import { useDirection } from '../admin/context/DirectionContext';
import { useAdmin } from '../admin/context/AdminContext';
import { getPublishedEvents } from '../admin/services/eventService';
import {
  addRegistration,
  getRegistrationCounts,
  getUserRegisteredEventIds,
  removeRegistration,
} from '../admin/services/registrationService';
import { createWorkshopSuggestion } from './workshopSuggestionService';
import './EventsPage.css';

const VIEW_WORKSHOPS = 'workshops';
const VIEW_APPOINTMENTS = 'appointments';
const VIEW_REGISTERED = 'registered';

const suggestionCategories = [
  'Anxiety Support',
  'Meditation',
  'Yoga',
  'Art Therapy',
  'Journaling',
  'Self Confidence',
  'Women Circle',
  'Breathing Sessions',
  'Career Support',
  'Emotional Healing',
];

const emptySuggestionForm = {
  title: '',
  category: '',
  description: '',
  reason: '',
  anonymous: false,
};

const participantNavItems = [
  { key: 'home', label: 'Home', icon: HomeRoundedIcon, path: '/home' },
  { key: 'calendar', label: 'Calendar', icon: CalendarMonthIcon, path: '/calendar' },
  { key: 'events', label: 'Events', icon: EventAvailableIcon, path: '/events' },
  { key: 'resources', label: 'Resources', icon: MenuBookIcon, path: '/home' },
  { key: 'community', label: 'Community', icon: Diversity3Icon, path: '/home' },
  { key: 'messages', label: 'Messages', icon: ChatBubbleOutlineIcon, path: '/home', badge: 3 },
  { key: 'settings', label: 'Settings', icon: SettingsIcon, path: '/home' },
];

function toDate(value) {
  if (!value) return null;
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatEventDate(value) {
  const date = toDate(value);
  if (!date) return 'To be scheduled';

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatEventTime(startValue, endValue) {
  const start = toDate(startValue);
  const end = toDate(endValue);
  if (!start) return 'Time TBD';

  const formatter = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return end ? `${formatter.format(start)} - ${formatter.format(end)}` : formatter.format(start);
}

function inferEventType(event) {
  const raw = `${event.type || ''} ${event.category || ''}`.toLowerCase();
  if (raw.includes('appointment') || raw.includes('therapy') || raw.includes('session')) return 'appointment';
  return 'workshop';
}

function getTemporalStatus(startValue) {
  const start = toDate(startValue);
  if (!start) return 'upcoming';
  return start.getTime() < Date.now() ? 'completed' : 'upcoming';
}

function getEventTone(type, index) {
  if (type === 'appointment') return 'rose';
  return ['lavender', 'purple', 'peach', 'blush'][index % 4];
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <article className={`events-stat events-stat--${tone}`}>
      <span>
        <Icon />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </article>
  );
}

function EventCategoryButton({ title, active, color, onClick }) {
  return (
    <button
      className={`events-category-button events-category-button--${color}${active ? ' is-active' : ''}`}
      type="button"
      onClick={onClick}
      aria-pressed={active}
    >
      <span>{title}</span>
    </button>
  );
}

function EventCard({ event, isRegistered, onToggleRegistration }) {
  const isFull = event.capacity > 0 && event.participants >= event.capacity && !isRegistered;
  const actionDisabled = event.isRegistering || isFull;
  const typeLabel = event.eventType === 'appointment' ? 'Appointment' : 'Workshop';
  const statusLabel = isRegistered ? 'Registered' : event.temporalStatus === 'completed' ? 'Completed' : 'Upcoming';

  return (
    <article className={`events-card events-card--${event.tone}`}>
      <div className="events-card__image">
        <img src={event.imageUrl} alt="" />
        <span className={`events-card__type events-card__type--${event.eventType}`}>{typeLabel}</span>
        <span className={`events-card__status events-card__status--${statusLabel.toLowerCase()}`}>
          {statusLabel}
        </span>
      </div>

      <div className="events-card__body">
        <h3>{event.title}</h3>
        <p>{event.description}</p>

        <div className="events-card__meta">
          <span>
            <CalendarMonthIcon fontSize="small" />
            {event.date}
          </span>
          <span>
            <AccessTimeIcon fontSize="small" />
            {event.time}
          </span>
          <span>
            <LocationOnOutlinedIcon fontSize="small" />
            {event.location}
          </span>
        </div>

        <button
          className={`events-card__action${isRegistered ? ' is-cancel' : ''}`}
          type="button"
          onClick={() => onToggleRegistration(event.id)}
          disabled={actionDisabled}
        >
          {event.isRegistering
            ? 'Please wait...'
            : isRegistered
              ? 'Cancel Registration'
              : isFull
                ? 'Fully Booked'
                : event.eventType === 'appointment'
                  ? 'Book Now'
                  : 'View Details'}
          {!isRegistered && !isFull && <ArrowForwardIcon fontSize="small" />}
        </button>
      </div>
    </article>
  );
}

function RegisteredMiniRow({ events, onViewRegistered }) {
  return (
    <section className="registered-events" aria-label="Registered events">
      <div className="registered-events__heading">
        <h2>Registered Events</h2>
        <button type="button" onClick={onViewRegistered}>
          <ArrowForwardIcon fontSize="small" />
          View all
        </button>
      </div>

      {events.length > 0 ? (
        <div className="registered-events__row">
          {events.map((event) => (
            <article className="registered-mini-card" key={event.id}>
              <img src={event.imageUrl} alt="" />
              <div>
                <span>{event.eventType === 'appointment' ? 'Appointment' : 'Workshop'}</span>
                <strong>{event.title}</strong>
                <small>{event.date} - {event.time}</small>
                <em>
                  Registered
                  <TaskAltIcon fontSize="small" />
                </em>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="registered-events__empty">Your saved workshops and appointments will appear here.</p>
      )}
    </section>
  );
}

function SuggestWorkshopModal({
  form,
  errors,
  successMessage,
  submitError,
  isSubmitting,
  onChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="suggest-modal" role="presentation">
      <div className="suggest-modal__overlay" onClick={onClose} />
      <section className="suggest-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="suggest-modal-title">
        <button className="suggest-modal__close" type="button" onClick={onClose} aria-label="Close suggestion form">
          <CloseIcon />
        </button>

        <div className="suggest-modal__header">
          <span className="suggest-modal__mark">
            <FavoriteBorderOutlinedIcon />
          </span>
          <h2 id="suggest-modal-title">What would you like to see next?</h2>
          <p>Suggest a workshop, session, or support circle you would love to see in our community.</p>
        </div>

        {successMessage && <div className="suggest-modal__success">{successMessage}</div>}
        {submitError && <div className="suggest-modal__error">{submitError}</div>}

        <form className="suggest-form" onSubmit={onSubmit}>
          <label className="suggest-form__field">
            <span>Workshop title *</span>
            <div className="suggest-form__control">
              <EditOutlinedIcon />
              <input
                value={form.title}
                onChange={(event) => onChange('title', event.target.value)}
                placeholder="Example: Anxiety support circle"
              />
            </div>
            {errors.title && <small>{errors.title}</small>}
          </label>

          <label className="suggest-form__field">
            <span>Category *</span>
            <div className="suggest-form__control">
              <GroupsRoundedIcon />
              <select value={form.category} onChange={(event) => onChange('category', event.target.value)}>
                <option value="">Select a category</option>
                {suggestionCategories.map((category) => (
                  <option value={category} key={category}>{category}</option>
                ))}
              </select>
            </div>
            {errors.category && <small>{errors.category}</small>}
          </label>

          <label className="suggest-form__field">
            <span>Short description *</span>
            <div className="suggest-form__control suggest-form__control--textarea">
              <MenuBookIcon />
              <textarea
                value={form.description}
                onChange={(event) => onChange('description', event.target.value)}
                placeholder="Describe the workshop or session idea..."
                rows={3}
              />
            </div>
            {errors.description && <small>{errors.description}</small>}
          </label>

          <label className="suggest-form__field">
            <span>Why would this help you?</span>
            <div className="suggest-form__control suggest-form__control--textarea">
              <FavoriteBorderIcon />
              <textarea
                value={form.reason}
                onChange={(event) => onChange('reason', event.target.value)}
                placeholder="Tell us why this topic would be meaningful or helpful..."
                rows={3}
              />
            </div>
          </label>

          <label className="suggest-form__anonymous">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(event) => onChange('anonymous', event.target.checked)}
            />
            <span>
              Submit anonymously
              <small>Your name will not be visible.</small>
            </span>
          </label>

          <div className="suggest-form__actions">
            <button className="suggest-form__cancel" type="button" onClick={onClose}>Cancel</button>
            <button className="suggest-form__submit" type="submit" disabled={isSubmitting}>
              <SendOutlinedIcon fontSize="small" />
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function EventsPage({ embedInDashboard = false }) {
  const navigate = useNavigate();
  const { direction } = useDirection();
  const { currentUser, logout } = useAdmin();
  const [activeView, setActiveView] = useState(VIEW_WORKSHOPS);
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({});
  const [registeredMap, setRegisteredMap] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [registeringId, setRegisteringId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionForm, setSuggestionForm] = useState(emptySuggestionForm);
  const [suggestionErrors, setSuggestionErrors] = useState({});
  const [suggestionSuccess, setSuggestionSuccess] = useState('');
  const [suggestionSubmitError, setSuggestionSubmitError] = useState('');
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

  const displayName = useMemo(() => {
    if (currentUser?.displayName) return currentUser.displayName.split(' ')[0];
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'Participant';
  }, [currentUser]);

  const refreshRegistrationData = useCallback(async (eventList) => {
    if (!eventList.length) {
      setCounts({});
      setRegisteredMap({});
      return;
    }

    try {
      const [countsData, userRegistrations] = await Promise.all([
        getRegistrationCounts(eventList.map((event) => event.id)),
        currentUser?.email ? getUserRegisteredEventIds(currentUser.email) : Promise.resolve({}),
      ]);

      setCounts(countsData);
      setRegisteredMap(userRegistrations);
    } catch (error) {
      console.error('Failed to load event registration data:', error);
      setEventsError('Events loaded, but registration data could not be refreshed.');
    }
  }, [currentUser?.email]);

  useEffect(() => {
    let cancelled = false;
    setLoadingEvents(true);
    setEventsError('');

    getPublishedEvents()
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        setLoadingEvents(false);
        refreshRegistrationData(data);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load published events:', error);
        setEventsError('Could not load events from Firestore. Please check your connection and permissions.');
        setLoadingEvents(false);
      });

    return () => { cancelled = true; };
  }, [refreshRegistrationData]);

  const displayEvents = useMemo(
    () =>
      [...events].sort((left, right) => {
        const leftDate = toDate(left.startTime || left.date);
        const rightDate = toDate(right.startTime || right.date);

        if (!leftDate && !rightDate) return 0;
        if (!leftDate) return 1;
        if (!rightDate) return -1;

        return leftDate.getTime() - rightDate.getTime();
      }).map((event, index) => {
        const registeredCount = counts[event.id] ?? 0;
        const eventType = inferEventType(event);
        const imageUrl = event.imageUrl || event.thumbnailUrl || event.coverImageUrl || appointmentsHero;

        return {
          id: event.id,
          title: event.title || 'Untitled Event',
          category: event.category || (eventType === 'appointment' ? 'Appointment' : 'Workshop'),
          description: event.description || 'More details will be added soon.',
          date: formatEventDate(event.startTime || event.date),
          time: formatEventTime(event.startTime || event.date, event.endTime),
          participants: registeredCount,
          capacity: Number(event.maxParticipants || event.capacity) || 0,
          location: event.location || 'She-Na Center',
          tone: getEventTone(eventType, index),
          imageUrl,
          eventType,
          temporalStatus: getTemporalStatus(event.startTime || event.date),
          isRegistering: registeringId === event.id,
        };
      }),
    [counts, events, registeringId],
  );

  const registeredEvents = useMemo(
    () => displayEvents.filter((event) => Boolean(registeredMap[event.id])),
    [displayEvents, registeredMap],
  );

  const filteredEvents = useMemo(() => {
    if (activeView === VIEW_REGISTERED) return registeredEvents;
    return displayEvents.filter((event) => event.eventType === activeView.slice(0, -1));
  }, [activeView, displayEvents, registeredEvents]);

  const stats = useMemo(() => {
    const upcoming = displayEvents.filter((event) => event.temporalStatus === 'upcoming').length;

    return [
      { label: 'Total Events', value: displayEvents.length, tone: 'lavender', icon: CalendarMonthIcon },
      { label: 'Upcoming', value: upcoming, tone: 'blush', icon: EventAvailableIcon },
      { label: 'Registered', value: registeredEvents.length, tone: 'peach', icon: PersonIcon },
    ];
  }, [displayEvents, registeredEvents.length]);

  const categoryCards = useMemo(() => {
    return [
      {
        type: VIEW_WORKSHOPS,
        title: 'Workshops',
        color: 'lavender',
      },
      {
        type: VIEW_APPOINTMENTS,
        title: 'Appointments',
        color: 'blush',
      },
      {
        type: VIEW_REGISTERED,
        title: 'Registered Events',
        color: 'peach',
      },
    ];
  }, []);

  const sectionTitle = useMemo(() => {
    if (activeView === VIEW_APPOINTMENTS) return 'Upcoming Appointments';
    if (activeView === VIEW_REGISTERED) return 'My Registered Events';
    return 'Upcoming Workshops';
  }, [activeView]);

  async function handleToggleRegistration(eventId) {
    if (!currentUser?.email || registeringId) return;

    const event = events.find((item) => item.id === eventId);
    if (!event) return;

    const registrationId = registeredMap[eventId];
    setRegisteringId(eventId);
    setEventsError('');

    try {
      if (registrationId) {
        await removeRegistration(registrationId, currentUser.displayName || currentUser.email, eventId);
        setRegisteredMap((current) => {
          const next = { ...current };
          delete next[eventId];
          return next;
        });
        setCounts((current) => ({ ...current, [eventId]: Math.max(0, (current[eventId] ?? 1) - 1) }));
      } else {
        const newRegistrationId = await addRegistration({
          eventId,
          uid: currentUser.uid,
          participantName: currentUser.displayName || currentUser.email.split('@')[0],
          participantEmail: currentUser.email,
          eventTitle: event.title,
          eventDate: event.startTime || event.date || null,
          eventLocation: event.location || '',
        });
        setRegisteredMap((current) => ({ ...current, [eventId]: newRegistrationId }));
        setCounts((current) => ({ ...current, [eventId]: (current[eventId] ?? 0) + 1 }));
      }
    } catch (error) {
      console.error('Registration action failed:', error);
      setEventsError('Could not update your registration. Please try again.');
    } finally {
      setRegisteringId(null);
    }
  }

  function openSuggestionModal() {
    setSuggestionErrors({});
    setSuggestionSuccess('');
    setSuggestionSubmitError('');
    setIsSuggestionModalOpen(true);
  }

  function closeSuggestionModal() {
    setIsSuggestionModalOpen(false);
    setSuggestionErrors({});
    setSuggestionSubmitError('');
    setIsSubmittingSuggestion(false);
  }

  function updateSuggestionField(fieldName, value) {
    setSuggestionForm((current) => ({ ...current, [fieldName]: value }));
    setSuggestionErrors((current) => ({ ...current, [fieldName]: '' }));
    setSuggestionSubmitError('');
  }

  function validateSuggestionForm() {
    const nextErrors = {};

    if (!suggestionForm.title.trim()) nextErrors.title = 'Please enter a workshop title.';
    if (!suggestionForm.category) nextErrors.category = 'Please choose a category.';
    if (!suggestionForm.description.trim()) nextErrors.description = 'Please add a short description.';

    setSuggestionErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmitSuggestion(event) {
    event.preventDefault();

    if (!validateSuggestionForm()) return;

    setIsSubmittingSuggestion(true);
    setSuggestionSubmitError('');

    try {
      const suggestion = await createWorkshopSuggestion(suggestionForm, currentUser);
      setSuggestions((current) => [suggestion, ...current]);
      setSuggestionSuccess('Thank you. Your suggestion was submitted successfully.');
      setSuggestionForm(emptySuggestionForm);

      window.setTimeout(() => {
        setIsSuggestionModalOpen(false);
        setSuggestionSuccess('');
      }, 1200);
    } catch (error) {
      console.error('Failed to submit workshop suggestion:', error);
      setSuggestionSubmitError('Could not submit your suggestion. Please check Firestore rules and try again.');
    } finally {
      setIsSubmittingSuggestion(false);
    }
  }

  const eventsContent = (
    <>
      <section className="events-hero">
        <div className="events-hero__content">
          <h1>Events</h1>
          <p>All your sessions in one place</p>
        </div>
      </section>

      <section className="events-summary-row" aria-label="Events summary">
        <div className="events-stats">
          {stats.map((item) => (
            <StatCard icon={item.icon} label={item.label} value={item.value} tone={item.tone} key={item.label} />
          ))}
        </div>
        <button className="events-suggest-pill" type="button" onClick={openSuggestionModal}>
          <AddCircleOutlineIcon fontSize="small" />
          Suggest a Workshop
        </button>
      </section>

      {(loadingEvents || eventsError) && (
        <div className={`events-status${eventsError ? ' events-status--error' : ''}`}>
          {loadingEvents ? 'Loading live events from Firestore...' : eventsError}
        </div>
      )}

      <section className="events-categories" aria-label="Event categories">
        <div className="events-category-grid">
          {categoryCards.map((card) => (
              <EventCategoryButton
                {...card}
                active={activeView === card.type}
                onClick={() => setActiveView(card.type)}
              key={card.type}
            />
          ))}
        </div>
      </section>

        <section className="events-list-panel">
          <div className="events-list-heading">
            <div>
              <h2>{sectionTitle}</h2>
            </div>
          </div>

        <section className="events-grid" aria-label={sectionTitle}>
          {filteredEvents.map((event) => (
            <EventCard
              event={event}
              isRegistered={Boolean(registeredMap[event.id])}
              onToggleRegistration={handleToggleRegistration}
              key={event.id}
            />
          ))}
        </section>
      </section>

      {!loadingEvents && filteredEvents.length === 0 && (
        <section className="events-empty">
          <AutoAwesomeIcon />
          <h2>No events here yet</h2>
          <p>When matching published events are available, they will appear in this section.</p>
        </section>
      )}

      <RegisteredMiniRow events={registeredEvents} onViewRegistered={() => setActiveView(VIEW_REGISTERED)} />

      {isSuggestionModalOpen && (
        <SuggestWorkshopModal
          form={suggestionForm}
          errors={suggestionErrors}
          successMessage={suggestionSuccess}
          submitError={suggestionSubmitError}
          isSubmitting={isSubmittingSuggestion}
          onChange={updateSuggestionField}
          onSubmit={handleSubmitSuggestion}
          onClose={closeSuggestionModal}
        />
      )}
    </>
  );

  if (embedInDashboard) {
    return (
      <section className="events-main events-main--embedded" dir="rtl">
        {eventsContent}
      </section>
    );
  }

  return (
    <main className="events-page" dir="rtl">
      <aside className="events-sidebar" aria-label="Participant navigation">
        <button className="events-brand" type="button" onClick={() => navigate('/home')}>
          <span className="events-brand__mark">S</span>
          <span className="events-brand__text">
            <strong>She-Na</strong>
            <small>Your journey matters</small>
          </span>
        </button>

        <nav className="events-nav">
          {participantNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={item.key === 'events' ? 'is-active' : ''}
                type="button"
                onClick={() => navigate(item.path)}
                key={item.key}
              >
                <Icon fontSize="small" />
                <span>{item.label}</span>
                {item.badge && <small>{item.badge}</small>}
              </button>
            );
          })}
        </nav>

        <div className="events-support-card">
          <VolunteerActivismIcon />
          <strong>Need Support?</strong>
          <span>We are here for you.</span>
          <button type="button" onClick={() => navigate('/home')}>
            Contact Us
          </button>
        </div>

        <button className="events-logout" type="button" onClick={logout}>
          <LogoutIcon fontSize="small" />
          <span>Logout</span>
        </button>
      </aside>

      <section className="events-main">
        <header className="events-topbar">
          <div>
            <p>Hi, {displayName}</p>
            <strong>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</strong>
          </div>
          <div className="events-profile">
            <span>{currentUser?.email || 'Participant'}</span>
            <strong>{displayName.slice(0, 2).toUpperCase()}</strong>
          </div>
        </header>
        {eventsContent}
      </section>
    </main>
  );
}
