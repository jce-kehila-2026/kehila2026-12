import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MoodOutlinedIcon from '@mui/icons-material/MoodOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import CalendarPage from '../calendar/CalendarPage';
import EventsPage from '../events/EventsPage';
import ProfilePage from '../profile/pages/ProfilePage';
import { getParticipantData, updateParticipantData } from '../profile/services/participantService';
import { getParticipantFirstName, getParticipantFullName, getParticipantEmail } from './utils/participantProfileUtils';
import {
  countUnread,
  fetchActivityNotifications,
  fetchUpdates,
  getLastSeenAt,
  markAllAsRead,
} from '../admin/services/updatesService';
import {
  getParticipantLocaleDirection,
  getParticipantLocaleLang,
  getStoredParticipantLocale,
  localeToProfileLanguage,
  profileLanguageToLocale,
  storeParticipantLocale,
} from './i18n/participantLocale';
import CommunityPage from './community/CommunityPage';
import useCommunityStreak from './community/hooks/useCommunityStreak';
import WorkshopFeed from './WorkshopFeed';
import { createParticipantT } from './i18n/participantUiTranslations';
import { ParticipantLocaleProvider } from './context/ParticipantLocaleContext';
import { useAdmin } from '../admin/context/AdminContext';
import ParticipantDashboardHome from './home/ParticipantDashboardHome';
import useDailyMotivation from './home/useDailyMotivation';
import ParticipantSidebarProfile from './components/ParticipantSidebarProfile';
import ParticipantHeader from './components/ParticipantHeader';
import NotificationsDropdown from './NotificationsDropdown';
import { localizeField } from '../../i18n/localizeField';
import './ParticipantHome.css';
import './styles/participant-dark-mode.css';

const participantNavItems = [
  { key: 'home', labelKey: 'navHome', icon: HomeOutlinedIcon, path: '/home' },
  { key: 'calendar', labelKey: 'navCalendar', icon: CalendarMonthOutlinedIcon, path: '/calendar' },
  { key: 'events', labelKey: 'navEvents', icon: EventAvailableOutlinedIcon, path: '/events' },
  { key: 'community', labelKey: 'navCommunity', icon: Diversity3OutlinedIcon },
  { key: 'profile', labelKey: 'navSettings', icon: SettingsOutlinedIcon },
];

const PARTICIPANT_SIDEBAR_COLLAPSED_KEY = 'shena-participant-sidebar-collapsed';

function normalizeParticipantView(view) {
  return view === 'appointments' ? 'home' : view;
}

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
  const location = useLocation();
  const { currentUser, effectiveUID, userRole, logout } = useAdmin();
  const [activeView, setActiveView] = useState(() => normalizeParticipantView(initialView));
  const [communityFocusPostId, setCommunityFocusPostId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [locale, setLocale] = useState(getStoredParticipantLocale);
  const [participantProfile, setParticipantProfile] = useState(null);
  const [loadingParticipantProfile, setLoadingParticipantProfile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getStoredSidebarCollapsed);
  const { quote: dailyQuote } = useDailyMotivation();
  const t = useMemo(() => createParticipantT(locale), [locale]);
  useCommunityStreak({ localUserId: effectiveUID || currentUser?.uid || '' });

  // ── Notifications ────────────────────────────────────────────────────────
  // The bell shows a unified feed: admin announcements + auto-generated
  // community activity (comments/likes/support on this user's posts).
  const [notifOpen, setNotifOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [activity, setActivity] = useState([]);
  const [lastSeenAt, setLastSeenAt] = useState(null);
  const notifBellRef = useRef(null);

  const notifications = useMemo(
    () => [...announcements, ...activity]
      .map((item) => ({
        ...item,
        // Admin announcements carry { he, en, ar } title/body; activity items
        // are plain strings. localizeField handles both, picking the current
        // locale with a graceful fallback.
        title: localizeField(item.title, locale),
        body: localizeField(item.body, locale),
      }))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)),
    [announcements, activity, locale],
  );

  const unreadCount = useMemo(
    () => countUnread(lastSeenAt, notifications),
    [lastSeenAt, notifications],
  );

  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;
    const uid = effectiveUID || currentUser.uid;
    try {
      const [data, activityItems, seen] = await Promise.all([
        fetchUpdates(true),
        fetchActivityNotifications(uid),
        getLastSeenAt(uid),
      ]);
      setAnnouncements(data);
      setActivity(activityItems);
      setLastSeenAt(seen);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [currentUser, effectiveUID]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const intervalId = window.setInterval(loadNotifications, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [currentUser, loadNotifications]);

  const handleBellClick = useCallback(() => {
    if (notifOpen) {
      setNotifOpen(false);
      return;
    }
    setNotifOpen(true);
    loadNotifications();
  }, [notifOpen, loadNotifications]);

  const handleOpenNotifications = useCallback(() => {
    setNotifOpen(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    if (!currentUser) return;
    try {
      await markAllAsRead(effectiveUID || currentUser.uid);
      setLastSeenAt({ toMillis: () => Date.now() });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [currentUser, effectiveUID]);

  const notificationsBell = (
    <div className="participant-notif-wrap" ref={notifBellRef}>
      <button
        type="button"
        aria-label={t('notifications')}
        aria-expanded={notifOpen}
        className={notifOpen ? 'is-active' : ''}
        onClick={handleBellClick}
      >
        <NotificationsNoneOutlinedIcon />
        {unreadCount > 0 && <span>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {notifOpen ? (
        <NotificationsDropdown
          updates={notifications}
          lastSeenAt={lastSeenAt}
          onMarkAllRead={handleMarkAllRead}
          onClose={() => setNotifOpen(false)}
        />
      ) : null}
    </div>
  );

  const displayName = useMemo(
    () => getParticipantFirstName(participantProfile, currentUser),
    [currentUser, participantProfile],
  );

  const fullName = useMemo(() => {
    const resolved = getParticipantFullName(participantProfile, currentUser);
    return resolved || 'Participant';
  }, [currentUser, participantProfile]);

  const sidebarEmail = useMemo(
    () => getParticipantEmail(participantProfile, currentUser),
    [currentUser, participantProfile],
  );

  const handleParticipantProfileSync = useCallback((updatedProfile) => {
    setParticipantProfile((current) => ({ ...(current || {}), ...updatedProfile }));
  }, []);

  const avatarUrl = participantProfile?.avatarUrl || '';
  const layoutDirection = getParticipantLocaleDirection(locale);
  const layoutLang = getParticipantLocaleLang(locale);

  // Reflect the participant language on <html lang> so globally-mounted UI
  // (the accessibility widget) can read one consistent locale signal across
  // both the app and the public site, which already sets it.
  useEffect(() => {
    document.documentElement.setAttribute('lang', layoutLang);
  }, [layoutLang]);

  useEffect(() => {
    if (participantProfile?.language) {
      const nextLocale = profileLanguageToLocale(participantProfile.language);
      setLocale(nextLocale);
      // Persist so globally-mounted UI that reads the locale store (e.g. the
      // accessibility widget) stays in sync with the profile-driven language,
      // not only with explicit switches via handleLocaleChange.
      storeParticipantLocale(nextLocale);
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
    (viewKey, options = {}) => {
      const nextView = normalizeParticipantView(viewKey);
      if (viewKey === 'appointments') {
        setActiveView('home');
        navigate('/home', { replace: true });
        return;
      }

      const item = participantNavItems.find((nav) => nav.key === nextView);
      setActiveView(nextView);
      if (item?.path) {
        if (nextView === 'events' && options.eventsTab) {
          navigate(item.path, { state: { eventsTab: options.eventsTab } });
        } else {
          navigate(item.path);
        }
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
    if (location.pathname === '/appointments') {
      setActiveView('home');
      navigate('/home', { replace: true });
      return;
    }

    setActiveView(normalizeParticipantView(initialView));
  }, [initialView, location.pathname, navigate]);

  useEffect(() => {
    setActiveView((current) => normalizeParticipantView(current));
  }, []);

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
    <ParticipantLocaleProvider locale={locale} setLocale={handleLocaleChange}>
      {userRole === 'admin' && (
        <div className="participant-admin-preview">
          <span>{t('adminPreviewText')}</span>
          <button type="button" onClick={() => navigate('/admin/users')}>
            {t('backToAdmin')}
          </button>
        </div>
      )}
      <main
        className={`participant-home${darkMode ? ' participant-home--dark' : ''}${activeView === 'events' ? ' participant-home--events' : ''}${sidebarCollapsed ? ' participant-home--sidebar-collapsed' : ''}`}
        dir={layoutDirection}
        lang={layoutLang}
      >
        <aside className="participant-sidebar" aria-label={t('sidebarNavAria')}>
          <ParticipantSidebarProfile
            fullName={fullName}
            avatarUrl={avatarUrl}
            email={sidebarEmail}
            isLoading={loadingParticipantProfile}
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />

          <nav className="participant-nav">
            {participantNavItems.map((item) => {
              const Icon = item.icon;
              const itemLabel = t(item.labelKey);
              return (
                <button
                  className={activeView === item.key ? 'is-active' : ''}
                  type="button"
                  onClick={() => navigateParticipantView(item.key)}
                  key={item.key}
                  title={sidebarCollapsed ? itemLabel : undefined}
                >
                  <Icon fontSize="small" />
                  <span>{itemLabel}</span>
                  {item.badge && <small>{item.badge}</small>}
                </button>
              );
            })}
          </nav>

          <button className="participant-logout" type="button" onClick={logout} title={sidebarCollapsed ? t('logout') : undefined}>
            <LogoutIcon fontSize="small" />
            <span>{t('logout')}</span>
          </button>
        </aside>

        <section
          className={`participant-main${activeView === 'community' ? ' participant-main--community' : ''}${activeView === 'events' ? ' participant-main--events' : ''}${activeView === 'home' || activeView === 'calendar' ? ' participant-main--dashboard-home' : ''}${activeView === 'calendar' ? ' participant-main--calendar' : ''}`}
          id="home"
        >
          <ParticipantHeader
            displayName={displayName}
            title={
              activeView === 'calendar'
                ? t('titleMySchedule')
                : activeView === 'events'
                  ? t('titleUpcomingActivities')
                  : activeView === 'community'
                    ? t('titleCommunitySpace')
                    : activeView === 'profile'
                      ? t('titlePersonalDetails')
                      : undefined
            }
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
            locale={locale}
            onLocaleChange={handleLocaleChange}
            notificationsBell={notificationsBell}
            dailyQuote={activeView === 'home' ? dailyQuote : null}
            className={activeView === 'community' ? 'participant-header-sticky' : ''}
          />

          {activeView === 'home' && (
            <ParticipantDashboardHome
              userId={effectiveUID || currentUser?.uid}
              displayName={displayName}
              birthDate={participantProfile?.birthDate || participantProfile?.birthday || ''}
              onNavigateToView={navigateParticipantView}
              onViewCommunity={handleViewCommunity}
              latestNotification={notifications?.[0] ?? null}
              onOpenNotifications={handleOpenNotifications}
              locale={locale}
            />
          )}

          {activeView === 'calendar' && (
            <section className="participant-content participant-content--single participant-content--calendar">
              <div className="participant-panel participant-panel--wide">
                <CalendarPage variant="embedded" />
              </div>
            </section>
          )}

          {activeView === 'events' && (
            <section className="participant-content participant-content--single participant-content--events">
              <EventsPage embedInDashboard locale={locale} />
            </section>
          )}

          {activeView === 'workshops' && (
            <section className="participant-content participant-content--single">
              <div className="participant-panel participant-panel--wide">
                <div className="participant-section-heading">
                  <h2>{t('workshopsHeading')}</h2>
                </div>
                <WorkshopFeed locale={locale} />
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
              onParticipantProfileSync={handleParticipantProfileSync}
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
                  onParticipantProfileSync={handleParticipantProfileSync}
                />
              </div>
            </section>
          )}

          {!['home', 'calendar', 'events', 'workshops', 'community', 'profile'].includes(activeView) && (
            <section className="participant-content participant-content--single">
              <div className="participant-panel participant-panel--wide participant-placeholder-view">
                <MoodOutlinedIcon />
                <div>
                  <span>{t('placeholderEyebrow')}</span>
                  <h2>{(() => {
                    const navItem = participantNavItems.find((item) => item.key === activeView);
                    return navItem ? t(navItem.labelKey) : activeView;
                  })()}</h2>
                  <p>{t('placeholderBody')}</p>
                </div>
              </div>
            </section>
          )}
        </section>
      </main>
    </ParticipantLocaleProvider>
  );
}
