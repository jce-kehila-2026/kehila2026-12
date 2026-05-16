import { useCallback, useEffect, useMemo, useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
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
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { useNavigate } from 'react-router-dom';
import appointmentsHero from '../../assets/appointments-hero.png';
import { useAdmin } from '../admin/context/AdminContext';
import { subscribeToPublishedEvents } from '../admin/services/eventService';
import {
  addRegistration,
  getRegistrationCounts,
  getUserRegisteredEventIds,
  removeRegistration,
} from '../admin/services/registrationService';
import './EventsPage.css';

const ALL_CATEGORY = 'All';

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
    setLoadingEvents(true);
    setEventsError('');

    const unsubscribe = subscribeToPublishedEvents(
      (data) => {
        setEvents(data);
        setLoadingEvents(false);
        refreshRegistrationData(data);
      },
      (error) => {
        console.error('Failed to subscribe to published events:', error);
        setEventsError('Could not load events from Firestore. Please check your connection and permissions.');
        setLoadingEvents(false);
      },
    );

    return unsubscribe;
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
        await removeRegistration(registrationId, currentUser.displayName || currentUser.email);
        setRegisteredMap((current) => {
          const next = { ...current };
          delete next[eventId];
          return next;
        });
        setCounts((current) => ({ ...current, [eventId]: Math.max(0, (current[eventId] ?? 1) - 1) }));
      } else {
        const newRegistrationId = await addRegistration({
          eventId,
          participantName: currentUser.displayName || currentUser.email.split('@')[0],
          participantEmail: currentUser.email,
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

        <section className="events-suggestion">
          <div className="events-suggestion__icon" aria-hidden="true">
            <CalendarMonthIcon />
            <TaskAltIcon />
          </div>
          <div>
            <h2>Can't find what you're looking for?</h2>
            <p>Let us know what topics or sessions you'd like to see next.</p>
          </div>
          <button type="button" onClick={() => navigate('/home')}>
            Suggest a Workshop
            <ArrowForwardIcon fontSize="small" />
          </button>
        </section>
      </section>
    </main>
  );
}
