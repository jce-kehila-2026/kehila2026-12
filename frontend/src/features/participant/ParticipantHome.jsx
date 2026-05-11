import { useMemo, useState } from 'react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PeopleIcon from '@mui/icons-material/People';
import SpaIcon from '@mui/icons-material/Spa';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CalendarPage from '../calendar/CalendarPage';
import WorkshopFeed from './WorkshopFeed';
import { useAdmin } from '../admin/context/AdminContext';
import './ParticipantHome.css';

const overviewCards = [
  { label: 'Upcoming workshops', value: '4', icon: EventAvailableIcon, tone: 'gold' },
  { label: 'Registered activities', value: '2', icon: TaskAltIcon, tone: 'violet' },
  { label: 'Appointments', value: '2', icon: FavoriteBorderIcon, tone: 'rose' },
  { label: 'Personal notes', value: '1', icon: NotificationsNoneIcon, tone: 'lavender' },
];

const participantNavItems = [
  { key: 'home', label: 'Home', icon: HomeRoundedIcon },
  { key: 'calendar', label: 'Calendar', icon: CalendarMonthIcon },
  { key: 'workshops', label: 'Workshops', icon: EventAvailableIcon },
  { key: 'appointments', label: 'Appointments', icon: FavoriteBorderIcon },
  { key: 'profile', label: 'Profile', icon: PeopleIcon },
];

const activityItems = [
  {
    title: 'Healing Workshop',
    meta: 'Sunday, 10:00 - 11:30',
    description: 'Grounding tools, breath work, and gentle group reflection.',
  },
  {
    title: 'Support Group Meeting',
    meta: 'Monday, 12:00 - 13:00',
    description: 'A registered group session in the community hall.',
  },
  {
    title: 'Psychologist Appointment',
    meta: 'Tuesday, 09:00 - 10:00',
    description: 'Private participant appointment in Room 3.',
  },
];

export default function ParticipantHome() {
  const { currentUser, logout } = useAdmin();
  const [activeView, setActiveView] = useState('home');
  const displayName = useMemo(() => {
    if (currentUser?.displayName) return currentUser.displayName.split(' ')[0];
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'there';
  }, [currentUser]);

  return (
    <main className="participant-home" dir="ltr">
      <aside className="participant-sidebar" aria-label="Participant navigation">
        <div className="participant-brand">
          <span className="participant-brand__mark">S</span>
          <span className="participant-brand__text">
            <strong>She-Na</strong>
            <small>Participant Space</small>
          </span>
        </div>

        <nav className="participant-nav">
          {participantNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeView === item.key ? 'is-active' : ''}
                type="button"
                onClick={() => setActiveView(item.key)}
                key={item.label}
              >
                <Icon fontSize="small" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="participant-logout" type="button" onClick={logout}>
          <LogoutIcon fontSize="small" />
          <span>Logout</span>
        </button>
      </aside>

      <section className="participant-main" id="home">
        <header className="participant-topbar">
          <div>
            <p>Dashboard</p>
            <strong>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</strong>
          </div>
          <div className="participant-profile">
            <span>{currentUser?.email || 'Participant'}</span>
            <strong>{displayName.slice(0, 2).toUpperCase()}</strong>
          </div>
        </header>

        {activeView === 'home' && (
          <>
            <section className="participant-hero">
              <div>
                <span>Welcome back</span>
                <h1>Hi, {displayName}</h1>
                <p>Your workshops, appointments, reminders, and personal calendar are ready for today.</p>
              </div>
              <div className="participant-hero__art" aria-hidden="true">
                <SpaIcon />
              </div>
            </section>

            <section className="participant-overview" aria-label="Participant overview">
              {overviewCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className={`participant-stat participant-stat--${card.tone}`} key={card.label}>
                    <Icon />
                    <strong>{card.value}</strong>
                    <span>{card.label}</span>
                  </article>
                );
              })}
            </section>

            <section className="participant-content participant-content--home">
              <aside className="participant-panel participant-panel--wide">
                <div className="participant-section-heading">
                  <span>Coming up</span>
                  <h2>Activities</h2>
                </div>
                <div className="participant-activity-list">
                  {activityItems.map((item) => (
                    <article className="participant-activity" key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.meta}</span>
                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              </aside>
            </section>
          </>
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

        {!['home', 'calendar', 'workshops'].includes(activeView) && (
          <section className="participant-content participant-content--single">
            <div className="participant-panel participant-panel--wide">
              <div className="participant-section-heading">
                <span>Participant space</span>
                <h2>{participantNavItems.find((item) => item.key === activeView)?.label}</h2>
              </div>
              <p className="participant-empty-view">This section is ready for the next feature.</p>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
