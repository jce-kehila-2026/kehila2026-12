import { useCallback, useEffect, useMemo, useState } from 'react';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MoodOutlinedIcon from '@mui/icons-material/MoodOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { useNavigate } from 'react-router-dom';
import CalendarPage from '../calendar/CalendarPage';
import AppointmentPage from '../appointments/pages/AppointmentPage';
import EventsPage from '../events/EventsPage';
import ProfilePage from '../profile/pages/ProfilePage';
import { getParticipantData, updateParticipantData } from '../profile/services/participantService';
import CommunityPage from './community/CommunityPage';
import WorkshopFeed from './WorkshopFeed';
import { useAdmin } from '../admin/context/AdminContext';
import ParticipantDashboardHome from './home/ParticipantDashboardHome';
import ParticipantSidebarProfile from './components/ParticipantSidebarProfile';
import {
  getParticipantLocaleDirection,
  getParticipantLocaleLang,
  getStoredParticipantLocale,
  localeToProfileLanguage,
  profileLanguageToLocale,
  storeParticipantLocale,
} from './i18n/participantLocale';
import './ParticipantHome.css';

const participantNavItems = [
  { key: 'home', label: 'Home', icon: HomeOutlinedIcon, path: '/home' },
  { key: 'calendar', label: 'Calendar', icon: CalendarMonthOutlinedIcon, path: '/calendar' },
  { key: 'appointments', label: 'Appointments', icon: EventNoteOutlinedIcon },
  { key: 'events', label: 'Events', icon: EventAvailableOutlinedIcon, path: '/events' },
  { key: 'community', label: 'Community', icon: Diversity3OutlinedIcon },
  { key: 'messages', label: 'Messages', icon: ChatBubbleOutlineOutlinedIcon, badge: 3 },
  { key: 'profile', label: 'Settings', icon: SettingsOutlinedIcon },
];

const PARTICIPANT_SIDEBAR_COLLAPSED_KEY = 'shena-participant-sidebar-collapsed';

function getStoredSidebarCollapsed() {
  try {
    return localStorage.getItem(PARTICIPANT_SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function storeSidebarCollapsed(collapsed) {
  try {
    localStorage.setItem(PARTICIPANT_SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
  } catch {
    // Ignore storage failures.
  }
}

export default function ParticipantHome({ initialView = 'home' }) {
  const navigate = useNavigate();
  const { currentUser, effectiveUID, userRole, logout } = useAdmin();
  const [activeView, setActiveView] = useState(initialView);
  const [communityFocusPostId, setCommunityFocusPostId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [locale, setLocale] = useState(getStoredParticipantLocale);
  const [participantProfile, setParticipantProfile] = useState(null);
  const [loadingParticipantProfile, setLoadingParticipantProfile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredSidebarCollapsed);

  const displayName = useMemo(() => {
    const profileName = participantProfile?.fullName || participantProfile?.firstName;
    if (profileName) return profileName.split(' ')[0];
    if (currentUser?.displayName) return currentUser.displayName.split(' ')[0];
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'Dema';
  }, [currentUser, participantProfile]);

  const fullName = useMemo(() => {
    if (participantProfile?.fullName) return participantProfile.fullName;
    if (currentUser?.displayName) return currentUser.displayName;
    return 'Dema';
  }, [currentUser, participantProfile]);

  const displayInitials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = participantProfile?.avatarUrl || '';
  const layoutDirection = getParticipantLocaleDirection(locale);
  const layoutLang = getParticipantLocaleLang(locale);

  useEffect(() => {
    if (participantProfile?.language) {
      setLocale(profileLanguageToLocale(participantProfile.language));
    }
  }, [participantProfile?.language]);

  const handleLocaleChange = (nextLocale) => {
    setLocale(nextLocale);
    storeParticipantLocale(nextLocale);

    const participantId = effectiveUID || currentUser?.uid;
    if (!participantId) return;

    updateParticipantData(participantId, {
      language: localeToProfileLanguage(nextLocale),
    }).catch(() => {
      // Keep local locale even if profile sync fails.
    });
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      storeSidebarCollapsed(next);
      return next;
    });
  };

  const navigateParticipantView = useCallback(
    (viewKey) => {
      const item = participantNavItems.find((nav) => nav.key === viewKey);
      setActiveView(viewKey);
      if (item?.path) {
        navigate(item.path);
      }
    },
    [navigate],
  );

  const handleViewCommunity = useCallback(
    (postId = null) => {
      setCommunityFocusPostId(postId || null);
      navigateParticipantView('community');
    },
    [navigateParticipantView],
  );

  const handleCommunityFocusHandled = useCallback(() => {
    setCommunityFocusPostId(null);
  }, []);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

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
      <main
        className={`participant-home${darkMode ? ' participant-home--dark' : ''}${activeView === 'events' ? ' participant-home--events' : ''}${sidebarCollapsed ? ' participant-home--sidebar-collapsed' : ''}`}
        dir={layoutDirection}
        lang={layoutLang}
      >
        <aside className="participant-sidebar" aria-label="Participant navigation">
          <ParticipantSidebarProfile
            fullName={fullName}
            avatarUrl={avatarUrl}
            role="Participant"
            isLoading={loadingParticipantProfile}
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />

          <nav className="participant-nav">
            {participantNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={activeView === item.key ? 'is-active' : ''}
                  type="button"
                  onClick={() => navigateParticipantView(item.key)}
                  key={item.label}
                  title={sidebarCollapsed ? item.label : undefined}
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
            <button type="button" onClick={() => setActiveView('messages')}>
              Contact Us
            </button>
          </div>

          <button className="participant-logout" type="button" onClick={logout} title={sidebarCollapsed ? 'Logout' : undefined}>
            <LogoutIcon fontSize="small" />
            <span>Logout</span>
          </button>
        </aside>

        <section
          className={`participant-main${activeView === 'community' ? ' participant-main--community' : ''}${activeView === 'events' ? ' participant-main--events' : ''}${activeView === 'home' ? ' participant-main--dashboard-home' : ''}`}
          id="home"
        >
          {activeView !== 'home' && (
            <header className={`participant-topbar${activeView === 'community' ? ' participant-header-sticky' : ''}`}>
              <div>
                <p>Good morning, {displayName}</p>
                <strong>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())}</strong>
              </div>
              <div className="participant-topbar__actions">
                <button type="button" aria-label="Notifications">
                  <NotificationsNoneOutlinedIcon />
                  <span>3</span>
                </button>
                <button type="button" aria-label="Messages">
                  <MailOutlineOutlinedIcon />
                </button>
                <div className="participant-profile">
                  <strong>{displayInitials}</strong>
                  <span>
                    {displayName}
                    <small>Participant</small>
                  </span>
                </div>
              </div>
            </header>
          )}

          {activeView === 'home' && (
            <ParticipantDashboardHome
              userId={effectiveUID || currentUser?.uid}
              displayName={displayName}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
              locale={locale}
              onLocaleChange={handleLocaleChange}
              onNavigateToView={navigateParticipantView}
              onViewJourney={() => navigateParticipantView('calendar')}
              onViewCommunity={handleViewCommunity}
            />
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
              focusPostId={communityFocusPostId}
              onFocusPostHandled={handleCommunityFocusHandled}
              personalDetails={{
                id: effectiveUID || currentUser?.uid || '',
                ...(participantProfile || {}),
                displayName: currentUser?.displayName || '',
                fullName: participantProfile?.fullName || currentUser?.displayName || '',
                birthDate: participantProfile?.birthDate || participantProfile?.birthday || '',
              }}
              isPersonalDetailsLoading={loadingParticipantProfile}
              onGoToSettings={() => navigateParticipantView('profile')}
            />
          )}

          {activeView === 'profile' && (
            <section className="participant-content participant-content--single">
              <div className="participant-panel participant-panel--wide">
                <ProfilePage
                  darkMode={darkMode}
                  onDarkModeChange={setDarkMode}
                  locale={locale}
                  onLocaleChange={handleLocaleChange}
                  embedInDashboard
                />
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
