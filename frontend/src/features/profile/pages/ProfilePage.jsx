import { useCallback, useEffect, useMemo, useState } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { Box, CircularProgress } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { createProfileT } from "../i18n/profileSettingsTranslations";
import {
  getParticipantLocaleDirection,
  profileLanguageToLocale,
} from "../../participant/i18n/participantLocale";
import { auth } from "../../../firebase";
import ChangePasswordCard from "../components/ChangePasswordCard";
import PersonalDetailsForm from "../components/PersonalDetailsForm";
import ProfileCard from "../components/ProfileCard";
import {
  getParticipantData,
  createParticipantProfile,
} from "../services/participantService";
import { WELLNESS, WELLNESS_DARK } from "../../appointments/appointmentTypeMeta";
import "./ProfilePage.css";

const profileCacheRtl = createCache({
  key: "profile-mui-rtl",
  prepend: true,
  stylisPlugins: [prefixer, rtlPlugin],
});

const profileCacheLtr = createCache({
  key: "profile-mui-ltr",
  prepend: true,
  stylisPlugins: [prefixer],
});

const profilePageBg =
  "linear-gradient(145deg, #F7EEFF 0%, #FFF9FC 42%, #fdf8ff 100%)";

const SETTINGS_TABS = [
  { id: "personal", labelKey: "tabPersonalInfo", icon: PersonOutlineOutlinedIcon },
  { id: "password", labelKey: "tabPassword", icon: LockOutlinedIcon },
];

function ProfilePage({
  darkMode: darkModeFromParent,
  onDarkModeChange,
  locale: localeFromParent,
  onLocaleChange,
  embedInDashboard = false,
  onParticipantProfileSync,
} = {}) {
  const user = auth.currentUser;
  const participantId = user?.uid;

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [darkModeInternal, setDarkModeInternal] = useState(false);

  const darkModeControlled =
    typeof darkModeFromParent === "boolean" &&
    typeof onDarkModeChange === "function";
  const darkMode = darkModeControlled ? darkModeFromParent : darkModeInternal;
  const setDarkMode = darkModeControlled
    ? (value) => onDarkModeChange(typeof value === "function" ? value(darkModeFromParent) : value)
    : setDarkModeInternal;

  const [localeInternal, setLocaleInternal] = useState("en");

  const localeControlled =
    typeof localeFromParent === "string" && typeof onLocaleChange === "function";
  const locale = localeControlled ? localeFromParent : localeInternal;
  const setLocale = localeControlled ? onLocaleChange : setLocaleInternal;

  const parentTheme = useTheme();

  const t = useMemo(() => createProfileT(locale), [locale]);

  const pageTheme = useMemo(
    () =>
      createTheme({
        ...parentTheme,
        direction: getParticipantLocaleDirection(locale),
      }),
    [parentTheme, locale]
  );

  const profileCache = locale === "he" ? profileCacheRtl : profileCacheLtr;

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        let data = await getParticipantData(participantId);

        if (!data && user) {
          const defaultProfile = {
            fullName: user.displayName || "",
            email: user.email || "",
            phoneNumber: "",
            streetAddress: "",
            city: "",
            birthDate: "",
            preferredContactMethod: "email",
            language: "english",
            avatarUrl: "",
          };

          await createParticipantProfile(participantId, defaultProfile);

          data = defaultProfile;
        }

        if (mounted) setProfile(data);
      } catch (error) {
        console.error(error);

        if (mounted) setProfile({});
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [participantId, user]);

  useEffect(() => {
    if (!profile?.language) return;

    const lang = profileLanguageToLocale(profile.language);

    setLocale(lang);
  }, [profile?.language, setLocale]);

  const handleProfileUpdated = useCallback((updatedProfile) => {
    setProfile(updatedProfile);
    onParticipantProfileSync?.(updatedProfile);
  }, [onParticipantProfileSync]);

  const handleAvatarUpdated = useCallback((patch) => {
    setProfile((prev) => {
      const nextProfile = { ...(prev || {}), ...patch };
      onParticipantProfileSync?.(nextProfile);
      return nextProfile;
    });
  }, [onParticipantProfileSync]);

  const loadingTheme = useMemo(
    () => createTheme({ ...parentTheme, direction: "ltr" }),
    [parentTheme]
  );

  if (!profile) {
    return (
      <CacheProvider value={profileCacheLtr}>
        <ThemeProvider theme={loadingTheme}>
          <Box
            dir="ltr"
            sx={{
              minHeight: embedInDashboard ? "min(240px, 40vh)" : "100vh",
              display: "grid",
              placeItems: "center",
              background: embedInDashboard
                ? "transparent"
                : darkMode
                  ? WELLNESS_DARK.pageBg
                  : profilePageBg,
            }}
          >
            <CircularProgress
              sx={{
                color: darkMode ? WELLNESS_DARK.primary : WELLNESS.primary,
              }}
            />
          </Box>
        </ThemeProvider>
      </CacheProvider>
    );
  }

  return (
    <CacheProvider value={profileCache}>
      <ThemeProvider theme={pageTheme}>
        <Box
          dir={getParticipantLocaleDirection(locale)}
          lang={locale === "he" ? "he" : locale === "ar" ? "ar" : "en"}
          className={`profile-settings${darkMode ? " profile-settings--dark" : ""}`}
          sx={{
            minHeight: embedInDashboard ? "auto" : "100vh",
            display: "flex",
            flexDirection: "column",
            transition: "background 0.25s ease",
            background: embedInDashboard
              ? "transparent"
              : darkMode
                ? WELLNESS_DARK.pageBg
                : profilePageBg,
          }}
        >
          <Box
            component="main"
            sx={{
              flex: 1,
              width: "100%",
              minWidth: 0,
              px: embedInDashboard ? 0 : { xs: 1.5, sm: 2.5 },
              py: embedInDashboard ? 0 : { xs: 1.5, sm: 2 },
            }}
          >
            <Box sx={{ maxWidth: { xs: "100%", lg: 1120 }, width: "100%", mx: "auto" }}>
              <div className="profile-settings__layout">
                <ProfileCard
                  profile={profile}
                  participantId={participantId}
                  onAvatarUpdated={handleAvatarUpdated}
                  darkMode={darkMode}
                  t={t}
                />

                <section className="profile-settings__main" aria-label={t("settingsTitle")}>
                  <div className="profile-settings__tabs" role="tablist">
                    {SETTINGS_TABS.map(({ id, labelKey, icon: TabIcon }) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === id}
                        className={`profile-settings__tab${activeTab === id ? " is-active" : ""}`}
                        onClick={() => setActiveTab(id)}
                      >
                        <TabIcon fontSize="inherit" />
                        <span>{t(labelKey)}</span>
                      </button>
                    ))}
                  </div>

                  <div className="profile-settings__panel">
                    {activeTab === "personal" ? (
                      <PersonalDetailsForm
                        variant="embedded"
                        participantId={participantId}
                        profile={profile}
                        onProfileUpdated={handleProfileUpdated}
                        darkMode={darkMode}
                        t={t}
                        locale={locale}
                      />
                    ) : null}

                    {activeTab === "password" ? (
                      <ChangePasswordCard variant="embedded" darkMode={darkMode} t={t} />
                    ) : null}
                  </div>
                </section>
              </div>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default ProfilePage;
