import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MoodOutlinedIcon from '@mui/icons-material/MoodOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SpaIcon from '@mui/icons-material/Spa';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { useNavigate } from 'react-router-dom';
import CalendarPage from '../calendar/CalendarPage';
import { getCalendarData } from '../calendar/calendarService';
import AppointmentPage from '../appointments/pages/AppointmentPage';
import EventsPage from '../events/EventsPage';
import ProfilePage from '../profile/pages/ProfilePage';
import { getParticipantData } from '../profile/services/participantService';
import CommunityPage from './community/CommunityPage';
import WorkshopFeed from './WorkshopFeed';
import { useAdmin } from '../admin/context/AdminContext';
import { communityHighlights, moodOptions, recommendations } from './dashboardMockData';
import NotificationsDropdown from './NotificationsDropdown';
import { countUnread, fetchUpdates, getLastSeenAt, markAllAsRead } from '../admin/services/updatesService';
import './ParticipantHome.css';

const overviewIconMap = {
  'Upcoming Events': EventAvailableOutlinedIcon,
  'Registered Activities': TaskAltIcon,
  'Upcoming Appointments': FavoriteBorderOutlinedIcon,
  'Personal Notes': EditNoteOutlinedIcon,
};

const participantNavItems = [
  { key: 'home', label: 'Home', icon: HomeOutlinedIcon },
  { key: 'calendar', label: 'Calendar', icon: CalendarMonthOutlinedIcon },
  { key: 'events', label: 'Events', icon: EventAvailableOutlinedIcon, path: '/events' },
  { key: 'community', label: 'Community', icon: Diversity3OutlinedIcon },
  { key: 'profile', label: 'Settings', icon: SettingsOutlinedIcon },
];

function DashboardCard({ children, className = '' }) {
  return <section className={`dashboard-card ${className}`}>{children}</section>;
}

function SectionHeading({ eyebrow, title, action, onAction }) {
  return (
    <div className="dashboard-section-heading">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action && (
        <button type="button" onClick={onAction}>
          {action}
          <ChevronRightOutlinedIcon fontSize="small" />
        </button>
      )}
    </div>
  );
}

function parseCalendarDate(item) {
  if (!item?.date) return null;
  const date = new Date(`${item.date}T${item.startTime || '00:00'}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getStartOfWeek(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function formatScheduleDate(date) {
  if (!date) return 'To be scheduled';
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}

function getCalendarTone(type, index = 0) {
  if (type === 'appointment') return 'rose';
  if (type === 'note') return 'amber';
  return ['violet', 'pink', 'amber'][index % 3];
}

function WellnessIllustration() {
  return (
    <div className="wellness-illustration" aria-hidden="true">
      <span className="wellness-illustration__sun" />
      <span className="wellness-illustration__person">
        <SpaIcon />
      </span>
      <span className="wellness-illustration__leaf wellness-illustration__leaf--left" />
      <span className="wellness-illustration__leaf wellness-illustration__leaf--right" />
    </div>
  );
}

function HeroSection({ displayName, onExplore, onDailyMotivation }) {
  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero__copy">
        <span>You are amazing</span>
        <h1>Keep going, {displayName}. You have come so far.</h1>
        <p>Every small step counts. Your workshops, appointments, reminders, and care tools are ready for today.</p>
        <div className="dashboard-hero__actions">
          <button type="button" onClick={onExplore}>
            Explore Events
            <ChevronRightOutlinedIcon fontSize="small" />
          </button>
          <button type="button" className="dashboard-hero__play" onClick={onDailyMotivation}>
            <PlayArrowRoundedIcon />
            Daily Motivation
          </button>
        </div>
      </div>
      <WellnessIllustration />
    </section>
  );
}

function OverviewGrid({ cards, onCardAction }) {
  return (
    <section className="dashboard-overview" aria-label="Participant overview">
      {cards.map((card) => {
        const Icon = overviewIconMap[card.label] || AutoAwesomeOutlinedIcon;
        return (
          <article className={`dashboard-stat dashboard-stat--${card.tone}`} key={card.label}>
            <span className="dashboard-stat__icon">
              <Icon />
            </span>
            <div>
              <strong>{card.value}</strong>
              <p>{card.label}</p>
              <button type="button" onClick={() => onCardAction?.(card)}>
                {card.action}
                <ChevronRightOutlinedIcon fontSize="small" />
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function UpcomingSchedule({ items, onViewCalendar }) {
  return (
    <DashboardCard className="dashboard-card--schedule">
      <SectionHeading title="Upcoming Schedule" action="View full calendar" onAction={onViewCalendar} />
      {items.length > 0 ? (
        <div className="schedule-list">
          {items.map((item) => (
            <article className="schedule-item" key={`${item.id}-${item.startTime}`}>
              <span className={`schedule-item__icon schedule-item__icon--${item.tone}`}>
                {item.type === 'note' ? <EditNoteOutlinedIcon /> : <SpaIcon />}
              </span>
              <div>
                <h3>{item.title}</h3>
                <strong>
                  {item.date} - {item.time}
                </strong>
                <p>{item.description}</p>
              </div>
              <span className={`schedule-item__tag schedule-item__tag--${item.tone}`}>{item.category}</span>
            </article>
          ))}
        </div>
      ) : (
        <p className="dashboard-empty-state">No registered events or appointments yet.</p>
      )}
    </DashboardCard>
  );
}

function WeeklyCalendarPreview({ days, activities, weekLabel }) {
  const defaultSelectedDate = days.find((day) => day.selected)?.dateKey || days[0]?.dateKey || '';
  const [selectedDateKey, setSelectedDateKey] = useState(defaultSelectedDate);

  useEffect(() => {
    if (!days.some((day) => day.dateKey === selectedDateKey)) {
      setSelectedDateKey(defaultSelectedDate);
    }
  }, [days, defaultSelectedDate, selectedDateKey]);

  const selectedActivities = activities.filter((item) => item.dateKey === selectedDateKey);

  return (
    <DashboardCard className="dashboard-card--week">
      <SectionHeading eyebrow={weekLabel} title="This Week" />
      <div className="week-strip">
        {days.map((day) => (
          <button
            className={`${day.dateKey === selectedDateKey ? 'is-selected' : ''}${day.highlighted ? ' is-highlighted' : ''}`}
            type="button"
            onClick={() => setSelectedDateKey(day.dateKey)}
            key={`${day.day}-${day.date}`}
            aria-pressed={day.dateKey === selectedDateKey}
          >
            <span>{day.day}</span>
            <strong>{day.date}</strong>
            {day.hasNote && <small className="week-strip__note-dot" aria-label="Personal note on this day" />}
          </button>
        ))}
      </div>
      {selectedActivities.length > 0 ? (
        <div className="week-agenda">
          {selectedActivities.map((item) => (
            <article className={`week-agenda__item week-agenda__item--${item.tone}`} key={`${item.id}-${item.dateKey}-${item.time}`}>
              <time>{item.time}</time>
              <div>
                <strong>{item.title}</strong>
                <span>{item.location}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="dashboard-empty-state">No registered activities or personal notes for this day.</p>
      )}
    </DashboardCard>
  );
}

function MoodCheckIn() {
  const [selectedMood, setSelectedMood] = useState('calm');
  return (
    <DashboardCard className="dashboard-card--compact">
      <SectionHeading eyebrow="Check in with yourself today" title="How are you feeling?" />
      <div className="mood-options">
        {moodOptions.map((mood) => (
          <button
            className={selectedMood === mood.key ? 'is-selected' : ''}
            type="button"
            onClick={() => setSelectedMood(mood.key)}
            aria-label={mood.label}
            key={mood.key}
          >
            <span>{mood.emoji}</span>
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}

function CommunityHighlights() {
  return (
    <DashboardCard>
      <SectionHeading title="Community Highlights" action="View all" />
      <div className="community-list">
        {communityHighlights.map((post) => (
          <article className="community-post" key={post.title}>
            <div>
              <span className="community-post__avatar">
                <Diversity3OutlinedIcon />
              </span>
              <div>
                <h3>{post.title}</h3>
                <small>{post.meta}</small>
              </div>
            </div>
            <p>{post.content}</p>
            <footer>
              <span>
                <FavoriteOutlinedIcon fontSize="small" />
                {post.likes}
              </span>
              <span>
                <ChatBubbleOutlineOutlinedIcon fontSize="small" />
                {post.comments}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </DashboardCard>
  );
}

function Recommendations() {
  return (
    <DashboardCard className="dashboard-card--recommendations">
      <SectionHeading eyebrow="Based on your journey" title="Recommended For You" />
      <div className="recommendation-row">
        {recommendations.map((item) => (
          <article className={`recommendation-card recommendation-card--${item.tone}`} key={item.title}>
            <div className="recommendation-card__image">
              <SelfImprovementOutlinedIcon />
            </div>
            <strong>{item.title}</strong>
            <span>{item.category} - {item.duration}</span>
          </article>
        ))}
      </div>
    </DashboardCard>
  );
}

function MotivationPanel({ item, onClose }) {
  if (!item) return null;

  return (
    <DashboardCard className="dashboard-card--motivation">
      <SectionHeading eyebrow="Daily motivation" title={item.title} />
      <p>{item.description}</p>
      <div className="motivation-actions">
        <span>{item.category} - {item.duration}</span>
        <button type="button" onClick={onClose}>Done for now</button>
      </div>
    </DashboardCard>
  );
}

function HomeDashboard({ displayName, navigate, setActiveView, overviewCards, scheduleItems, weekDays, weekActivities, weekLabel, loading }) {
  const [motivation, setMotivation] = useState(null);
  const openDailyMotivation = () => {
    const todayIndex = new Date().getDate() % recommendations.length;
    setMotivation(recommendations[todayIndex]);
  };
  const handleOverviewAction = (card) => {
    if (card.target === 'events') navigate('/events');
    if (card.target === 'appointments') navigate('/events');
    if (card.target === 'calendar') setActiveView('calendar');
  };

  return (
    <div className="dashboard-home-grid">
      <div className="dashboard-primary">
        <HeroSection displayName={displayName} onExplore={() => navigate('/events')} onDailyMotivation={openDailyMotivation} />
        <OverviewGrid cards={overviewCards} onCardAction={handleOverviewAction} />
        <MotivationPanel item={motivation} onClose={() => setMotivation(null)} />
        {loading && <p className="dashboard-loading-state">Refreshing your live schedule...</p>}
        <div className="dashboard-two-column">
          <UpcomingSchedule items={scheduleItems} onViewCalendar={() => setActiveView('calendar')} />
          <WeeklyCalendarPreview days={weekDays} activities={weekActivities} weekLabel={weekLabel} />
        </div>
        <Recommendations />
      </div>
      <aside className="dashboard-rail">
        <MoodCheckIn />
        <CommunityHighlights />
      </aside>
    </div>
  );
}

export default function ParticipantHome({ initialView = 'home' }) {
  const navigate = useNavigate();
  const { currentUser, effectiveUID, userRole, logout } = useAdmin();
  const [activeView, setActiveView] = useState(initialView);
  const [darkMode, setDarkMode] = useState(false);
  const [dashboardData, setDashboardData] = useState({ events: [], appointments: [], notes: [] });
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [participantProfile, setParticipantProfile] = useState(null);
  const [loadingParticipantProfile, setLoadingParticipantProfile] = useState(false);

  // ── Notifications ────────────────────────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const notifBellRef = useRef(null);

  const unreadCount = useMemo(() => countUnread(lastSeenAt, updates), [lastSeenAt, updates]);

  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [data, seen] = await Promise.all([
        fetchUpdates(true),
        getLastSeenAt(effectiveUID || currentUser.uid),
      ]);
      setUpdates(data);
      setLastSeenAt(seen);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [currentUser, effectiveUID]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  function handleBellClick() {
    if (notifOpen) {
      setNotifOpen(false);
      return;
    }
    setNotifOpen(true);
    loadNotifications(); // refresh in background, don't block opening
  }

  async function handleMarkAllRead() {
    if (!currentUser) return;
    try {
      await markAllAsRead(effectiveUID || currentUser.uid);
      // Optimistically stamp lastSeenAt to now so badge clears immediately
      setLastSeenAt({ toMillis: () => Date.now() });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const displayName = useMemo(() => {
    if (currentUser?.displayName) return currentUser.displayName.split(' ')[0];
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'there';
  }, [currentUser]);
  const displayInitials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    let ignore = false;
    async function loadDashboardData() {
      if (!currentUser) return;
      setLoadingDashboard(true);
      try {
        const data = await getCalendarData({ uid: effectiveUID || currentUser.uid, email: currentUser.email });
        if (!ignore) setDashboardData(data);
      } catch (error) {
        console.error('Failed to load dashboard calendar data:', error);
      } finally {
        if (!ignore) setLoadingDashboard(false);
      }
    }
    loadDashboardData();
    return () => {
      ignore = true;
    };
  }, [currentUser, effectiveUID]);

  useEffect(() => {
    let ignore = false;

    async function loadParticipantProfile() {
      if (!currentUser) {
        setParticipantProfile(null);
        setLoadingParticipantProfile(false);
        return;
      }

      setLoadingParticipantProfile(true);
      try {
        const profile = await getParticipantData(effectiveUID || currentUser.uid);
        if (!ignore) setParticipantProfile(profile || {});
      } catch {
        if (!ignore) setParticipantProfile({});
      } finally {
        if (!ignore) setLoadingParticipantProfile(false);
      }
    }

    loadParticipantProfile();

    return () => {
      ignore = true;
    };
  }, [currentUser, effectiveUID]);

  const dashboardSummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const calendarItems = [
      ...dashboardData.events.map((item, index) => ({ ...item, tone: getCalendarTone(item.type, index) })),
      ...dashboardData.appointments.map((item, index) => ({ ...item, tone: getCalendarTone(item.type, index) })),
    ];
    const weeklyCalendarItems = [
      ...calendarItems,
      ...dashboardData.notes.map((item, index) => ({ ...item, tone: getCalendarTone(item.type, index) })),
    ];
    const upcomingItems = weeklyCalendarItems
      .map((item) => ({ ...item, parsedDate: parseCalendarDate(item) }))
      .filter((item) => item.parsedDate && item.parsedDate >= today)
      .sort((a, b) => a.parsedDate - b.parsedDate);
    const weeklyItems = weeklyCalendarItems
      .map((item) => ({ ...item, parsedDate: parseCalendarDate(item) }))
      .filter((item) => item.parsedDate)
      .sort((a, b) => a.parsedDate - b.parsedDate);
    const scheduleItems = upcomingItems.slice(0, 3).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      category: item.type === 'appointment' ? 'Appointment' : item.type === 'note' ? 'Personal Note' : 'Workshop',
      date: formatScheduleDate(item.parsedDate),
      time: `${item.startTime} - ${item.endTime}`,
      startTime: item.startTime,
      description: item.type === 'note' ? item.content || 'Personal reminder' : item.description || item.content || 'More details will be added soon.',
      location: item.location || 'She-Na Center',
      tone: item.tone,
    }));
    const weekStart = getStartOfWeek(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const key = toDateKey(date);
      return {
        day: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
        date: String(date.getDate()),
        dateKey: key,
        selected: key === toDateKey(today),
        highlighted: weeklyItems.some((item) => item.date === key),
        hasNote: weeklyItems.some((item) => item.type === 'note' && item.date === key),
      };
    });
    const weekActivities = weeklyItems
      .filter((item) => item.parsedDate >= weekStart && item.parsedDate <= weekEnd)
      .map((item) => ({
        id: item.id,
        dateKey: item.date,
        time: item.startTime,
        title: item.title,
        location: item.type === 'note' ? item.content || 'Personal reminder' : item.location || 'She-Na Center',
        tone: item.tone,
      }));
    const weekLabel = `${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(weekStart)} - ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(weekEnd)}`;
    const upcomingWorkshopCount = upcomingItems.filter((item) => item.type !== 'appointment').length;
    const upcomingAppointmentCount = upcomingItems.filter((item) => item.type === 'appointment').length;
    const overviewCards = [
      { label: 'Upcoming Events', value: String(upcomingWorkshopCount + upcomingAppointmentCount), tone: 'amber', action: 'View all', target: 'events' },
      { label: 'Registered Activities', value: String(dashboardData.events.length), tone: 'violet', action: 'View all', target: 'events' },
      { label: 'Upcoming Appointments', value: String(upcomingAppointmentCount), tone: 'rose', action: 'View all', target: 'appointments' },
      { label: 'Personal Notes', value: String(dashboardData.notes.length), tone: 'lavender', action: 'View all', target: 'calendar' },
    ];
    return { overviewCards, scheduleItems, weekActivities, weekDays, weekLabel };
  }, [dashboardData]);

  return (
    <>
      {userRole === 'admin' && (
        <div className="participant-admin-preview">
          <span>Admin Preview - This is how the participant dashboard looks to participants.</span>
          <button type="button" onClick={() => navigate('/admin/users')}>
            Back to Admin
          </button>
        </div>
      )}
      <main className={`participant-home${darkMode ? ' participant-home--dark' : ''}${activeView === 'events' ? ' participant-home--events' : ''}`} dir="ltr">
        <aside className="participant-sidebar" aria-label="Participant navigation">
          <div className="participant-brand">
            <span className="participant-brand__mark">S</span>
            <span className="participant-brand__text">
              <strong>She-Na</strong>
              <small>Your journey matters</small>
            </span>
          </div>

          <nav className="participant-nav">
            {participantNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={activeView === item.key ? 'is-active' : ''}
                  type="button"
                  onClick={() => {
                    setActiveView(item.key);
                    if (item.path) navigate(item.path);
                  }}
                  key={item.label}
                >
                  <Icon fontSize="small" />
                  <span>{item.label}</span>
                  {item.badge && <small>{item.badge}</small>}
                </button>
              );
            })}
          </nav>

          <div className="participant-support-card">
            <VolunteerActivismOutlinedIcon />
            <strong>Need Support?</strong>
            <span>We are here for you.</span>
            <button type="button" onClick={() => setActiveView('community')}>
              Contact Us
            </button>
          </div>

          <button className="participant-logout" type="button" onClick={logout}>
            <LogoutIcon fontSize="small" />
            <span>Logout</span>
          </button>
        </aside>

        <section className={`participant-main${activeView === 'community' ? ' participant-main--community' : ''}${activeView === 'events' ? ' participant-main--events' : ''}`} id="home">
          <header className={`participant-topbar${activeView === 'community' ? ' participant-header-sticky' : ''}`}>
            <div>
              <p>Good morning, {displayName}</p>
              <strong>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</strong>
            </div>
            <div className="participant-topbar__actions">
              <div className="participant-notif-wrap" ref={notifBellRef}>
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={notifOpen}
                  className={notifOpen ? 'is-active' : ''}
                  onClick={handleBellClick}
                >
                  <NotificationsNoneOutlinedIcon />
                  {unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </button>
                {notifOpen && (
                  <NotificationsDropdown
                    updates={updates}
                    lastSeenAt={lastSeenAt}
                    onMarkAllRead={handleMarkAllRead}
                    onClose={() => setNotifOpen(false)}
                  />
                )}
              </div>
              <div className="participant-profile">
                <strong>{displayInitials}</strong>
                <span>
                  {displayName}
                  <small>Participant</small>
                </span>
              </div>
            </div>
          </header>

          {activeView === 'home' && (
            <HomeDashboard displayName={displayName} navigate={navigate} setActiveView={setActiveView} loading={loadingDashboard} {...dashboardSummary} />
          )}

          {activeView === 'calendar' && (
            <section className="participant-content participant-content--single">
              <div className="participant-panel participant-panel--wide">
                <div className="participant-section-heading">
                  <span>My schedule</span>
                  <h2>Calendar</h2>
                </div>
                <CalendarPage variant="embedded" />
              </div>
            </section>
          )}

          {activeView === 'events' && (
            <section className="participant-content participant-content--single participant-content--events">
              <EventsPage embedInDashboard />
            </section>
          )}

          {activeView === 'workshops' && (
            <section className="participant-content participant-content--single">
              <div className="participant-panel participant-panel--wide">
                <div className="participant-section-heading">
                  <h2>Workshops</h2>
                </div>
                <WorkshopFeed />
              </div>
            </section>
          )}

          {activeView === 'appointments' && (
            <section className="participant-content participant-content--single">
              <div className="participant-panel participant-panel--wide">
                <AppointmentPage embedInDashboard />
              </div>
            </section>
          )}

          {activeView === 'community' && (
            <CommunityPage
              personalDetails={{
                id: effectiveUID || currentUser?.uid || '',
                ...participantProfile,
                displayName: currentUser?.displayName || '',
                fullName: participantProfile?.fullName || currentUser?.displayName || '',
                birthDate: participantProfile?.birthDate || participantProfile?.birthday || '',
              }}
              isPersonalDetailsLoading={loadingParticipantProfile}
              onGoToSettings={() => setActiveView('profile')}
            />
          )}

          {activeView === 'profile' && (
            <section className="participant-content participant-content--single">
              <div className="participant-panel participant-panel--wide">
                <ProfilePage darkMode={darkMode} onDarkModeChange={setDarkMode} embedInDashboard />
              </div>
            </section>
          )}

          {!['home', 'calendar', 'events', 'workshops', 'appointments', 'community', 'profile'].includes(activeView) && (
            <section className="participant-content participant-content--single">
              <div className="participant-panel participant-panel--wide participant-placeholder-view">
                <MoodOutlinedIcon />
                <div>
                  <span>Participant space</span>
                  <h2>{participantNavItems.find((item) => item.key === activeView)?.label}</h2>
                  <p>This section is ready for the next feature and can connect to Firestore later.</p>
                </div>
              </div>
            </section>
          )}
        </section>
      </main>
    </>
  );
}
