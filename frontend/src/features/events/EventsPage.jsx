import { useCallback, useEffect, useMemo, useState } from 'react';
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
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import SettingsIcon from '@mui/icons-material/Settings';
import SpaIcon from '@mui/icons-material/Spa';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { useNavigate } from 'react-router-dom';
import appointmentsHero from '../../assets/appointments-hero.png';
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

const ALL_CATEGORY = 'All';

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
  { key: 'workshops', label: 'Workshops', icon: EventAvailableIcon, path: '/events' },
  { key: 'appointments', label: 'Appointments', icon: FavoriteBorderIcon, path: '/home' },
  { key: 'resources', label: 'Resources', icon: MenuBookIcon, path: '/home' },
  { key: 'community', label: 'Community', icon: Diversity3Icon, path: '/home' },
  { key: 'messages', label: 'Messages', icon: ChatBubbleOutlineIcon, path: '/home', badge: 3 },
  { key: 'settings', label: 'Settings', icon: SettingsIcon, path: '/home' },
];

const eventIconMap = {
  art: PaletteOutlinedIcon,
  breath: SpaIcon,
  group: GroupsRoundedIcon,
  meditation: SelfImprovementIcon,
  spa: SpaIcon,
  spark: PsychologyAltOutlinedIcon,
};

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
  if (!start) return 'To be scheduled';

  const formatter = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return end ? `${formatter.format(start)} - ${formatter.format(end)}` : formatter.format(start);
}

function getEventTone(index) {
  return ['pink', 'purple', 'orange', 'violet', 'rose', 'lavender'][index % 6];
}

function getEventIcon(category = '') {
  const normalized = category.toLowerCase();
  if (normalized.includes('support') || normalized.includes('circle')) return 'group';
  if (normalized.includes('therapy') || normalized.includes('counsel') || normalized.includes('nlp')) return 'spark';
  if (normalized.includes('movement') || normalized.includes('yoga') || normalized.includes('body')) return 'meditation';
  if (normalized.includes('art')) return 'art';
  return 'spa';
}

function EventCard({ event, isRegistered, onToggleRegistration }) {
  const isFull = event.capacity > 0 && event.participants >= event.capacity && !isRegistered;
  const actionDisabled = event.isRegistering || isFull;

  return (
    <article className={`events-card events-card--${event.tone}`} style={{ '--event-card-image': `url("${event.imageUrl}")` }}>
      <div className="events-card__visual" aria-hidden="true">
        <span className="events-card__category">{event.category}</span>
        {isRegistered && (
          <span className="events-card__registered">
            <TaskAltIcon fontSize="small" />
            Registered
          </span>
        )}
      </div>

      <div className="events-card__body">
        <h2>{event.title}</h2>
        <p>{event.description}</p>

        <dl className="events-card__details">
          <div>
            <CalendarMonthIcon fontSize="small" />
            <dt>Date</dt>
            <dd>{event.date}</dd>
          </div>
          <div>
            <AccessTimeIcon fontSize="small" />
            <dt>Time</dt>
            <dd>{event.time}</dd>
          </div>
          <div>
            <PeopleAltOutlinedIcon fontSize="small" />
            <dt>Participants</dt>
            <dd>{event.capacity > 0 ? `${event.participants} / ${event.capacity} spots left` : `${event.participants} registered`}</dd>
          </div>
          <div>
            <LocationOnOutlinedIcon fontSize="small" />
            <dt>Location</dt>
            <dd>{event.location}</dd>
          </div>
        </dl>

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
                : 'Register Now'}
        </button>
      </div>
    </article>
  );
}

function HeroIllustration() {
  return (
    <div className="events-hero-art" aria-hidden="true">
      <span className="events-hero-art__leaf events-hero-art__leaf--one" />
      <span className="events-hero-art__leaf events-hero-art__leaf--two" />
      <span className="events-hero-art__leaf events-hero-art__leaf--three" />
      <span className="events-hero-art__body" />
      <span className="events-hero-art__head" />
      <span className="events-hero-art__hair" />
      <span className="events-hero-art__legs" />
    </div>
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

export default function EventsPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAdmin();
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
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

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(events.map((event) => event.category).filter(Boolean)));
    return [ALL_CATEGORY, ...uniqueCategories];
  }, [events]);

  const displayEvents = useMemo(
    () =>
      [...events].sort((left, right) => {
        const leftDate = toDate(left.startTime);
        const rightDate = toDate(right.startTime);

        if (!leftDate && !rightDate) return 0;
        if (!leftDate) return 1;
        if (!rightDate) return -1;

        return leftDate.getTime() - rightDate.getTime();
      }).map((event, index) => {
        const registeredCount = counts[event.id] ?? 0;
        const imageUrl = event.imageUrl || event.thumbnailUrl || event.coverImageUrl || appointmentsHero;

        return {
          id: event.id,
          title: event.title || 'Untitled Event',
          category: event.category || 'Workshop',
          description: event.description || 'More details will be added soon.',
          date: formatEventDate(event.startTime),
          time: formatEventTime(event.startTime, event.endTime),
          instructor: event.instructor || event.therapist || event.facilitator || event.providerName || 'She-Na team',
          participants: registeredCount,
          capacity: Number(event.maxParticipants) || 0,
          location: event.location || 'She-Na Center',
          tone: event.tone || getEventTone(index),
          icon: event.icon || getEventIcon(event.category),
          imageUrl,
          isRegistering: registeringId === event.id,
        };
      }),
    [counts, events, registeringId],
  );

  const filteredEvents = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return displayEvents;
    return displayEvents.filter((event) => event.category === activeCategory);
  }, [activeCategory, displayEvents]);

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
      setSuggestionSuccess('Thank you. Your suggestion was submitted successfully 💜');
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

  return (
    <main className="events-page" dir="ltr">
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
                className={item.key === 'workshops' ? 'is-active' : ''}
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
            <p>Participant space</p>
            <strong>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</strong>
          </div>
          <div className="events-profile">
            <span>{currentUser?.email || 'Participant'}</span>
            <strong>{displayName.slice(0, 2).toUpperCase()}</strong>
          </div>
        </header>

        <section className="events-hero">
          <div className="events-hero__content">
            <h1>Workshops & Sessions</h1>
            <p>Discover calming, empowering sessions designed to support movement, reflection, creativity, and connection.</p>
            <div className="events-hero__summary" aria-label="Workshop summary">
              <div>
                <EventAvailableIcon />
                <strong>{events.length}</strong>
                <span>Upcoming Workshops</span>
              </div>
              <div>
                <TaskAltIcon />
                <strong>{Object.keys(registeredMap).length}</strong>
                <span>Registered</span>
              </div>
            </div>
          </div>
          <HeroIllustration />
        </section>

        {(loadingEvents || eventsError) && (
          <div className={`events-status${eventsError ? ' events-status--error' : ''}`}>
            {loadingEvents ? 'Loading live events from Firestore...' : eventsError}
          </div>
        )}

        <section className="events-suggestion">
          <div className="events-suggestion__icon" aria-hidden="true">
            <CalendarMonthIcon />
            <TaskAltIcon />
          </div>
          <div>
            <h2>Can't find what you're looking for?</h2>
            <p>Let us know what topics or sessions you'd like to see next.</p>
          </div>
          <button type="button" onClick={openSuggestionModal}>
            Suggest a Workshop
            <ArrowForwardIcon fontSize="small" />
          </button>
        </section>

        <section className="events-workshops-panel">
          <section className="events-filter" aria-label="Filter events by category">
            {categories.map((category) => (
              <button
                className={activeCategory === category ? 'is-active' : ''}
                type="button"
                onClick={() => setActiveCategory(category)}
                key={category}
              >
                {category}
              </button>
            ))}
          </section>

          <div className="events-list-heading">
            <h2>Upcoming Workshops</h2>
          </div>

          <section className="events-grid" aria-label="Events and workshops">
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
            <h2>No published events yet</h2>
            <p>Create published events in the admin dashboard and they will appear here automatically.</p>
            <button type="button" onClick={() => navigate('/admin/events')}>
              Open Admin Events
            </button>
          </section>
        )}

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
      </section>
    </main>
  );
}
