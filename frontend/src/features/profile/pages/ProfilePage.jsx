import { useCallback, useEffect, useMemo, useState } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { signOut } from "firebase/auth";
import DarkModeToggle from "../components/DarkModeToggle";
import {
  Box,
  ButtonBase,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { createProfileT } from "../i18n/profileSettingsTranslations";
import {
  getParticipantLocaleDirection,
  profileLanguageToLocale,
} from "../../participant/i18n/participantLocale";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import ChangePasswordCard from "../components/ChangePasswordCard";
import PersonalDetailsForm from "../components/PersonalDetailsForm";
import ProfileCard from "../components/ProfileCard";
import useCommunityProfile from "../../participant/community/hooks/useCommunityProfile";
import {
  getParticipantData,
  createParticipantProfile,
} from "../services/participantService";
import { WELLNESS, WELLNESS_DARK } from "../../appointments/appointmentTypeMeta";

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

function CommunitySettingsSection({ darkMode = false, participantId = "", profile = {} }) {
  const {
    showBirthdayInCommunity,
    handleBirthdayVisibilityChange,
  } = useCommunityProfile({
    personalDetails: {
      id: participantId,
      ...profile,
    },
  });

  return (
    <Box
      component="section"
      aria-labelledby="community-settings-title"
      sx={{
        border: darkMode
          ? "1px solid rgba(196, 165, 245, 0.22)"
          : "1px solid rgba(181, 123, 232, 0.18)",
        borderRadius: 4,
        backgroundColor: darkMode ? WELLNESS_DARK.card : WELLNESS.card,
        boxShadow: darkMode ? WELLNESS_DARK.shadowCard : WELLNESS.shadowCard,
        p: { xs: 2.2, sm: 2.8 },
      }}
    >
      <Typography
        id="community-settings-title"
        sx={{
          color: darkMode ? WELLNESS_DARK.text : WELLNESS.text,
          fontSize: '1.25rem',
          fontWeight: 800,
          lineHeight: 1.2,
          mb: 1.8,
        }}
      >
        Community Settings
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          border: darkMode
            ? "1px solid rgba(196, 165, 245, 0.16)"
            : "1px solid rgba(181, 123, 232, 0.14)",
          borderRadius: 3,
          backgroundColor: darkMode ? "rgba(15, 23, 42, 0.46)" : "rgba(255, 251, 255, 0.78)",
          p: { xs: 1.6, sm: 1.8 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: darkMode ? WELLNESS_DARK.text : WELLNESS.text,
              fontSize: '0.9375rem',
              fontWeight: 800,
              lineHeight: 1.3,
            }}
          >
            Show my birthday in the community
          </Typography>
          <Typography
            sx={{
              color: darkMode ? WELLNESS_DARK.muted : WELLNESS.muted,
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              mt: 0.45,
            }}
          >
            This only controls community visibility. Your birthday stays unchanged in Settings.
          </Typography>
        </Box>

        <ButtonBase
          type="button"
          role="switch"
          aria-checked={showBirthdayInCommunity}
          aria-label="Show my birthday in the community"
          disableRipple
          onClick={() => handleBirthdayVisibilityChange(!showBirthdayInCommunity)}
          sx={{
            flexShrink: 0,
            alignSelf: { xs: "flex-end", sm: "center" },
            width: 52,
            height: 30,
            borderRadius: 999,
            border: darkMode
              ? "1px solid rgba(196, 165, 245, 0.28)"
              : "1px solid rgba(181, 123, 232, 0.32)",
            backgroundColor: showBirthdayInCommunity
              ? darkMode
                ? "rgba(196, 165, 245, 0.24)"
                : "rgba(234, 215, 255, 0.9)"
              : darkMode
                ? "rgba(30, 41, 59, 0.9)"
                : "#ffffff",
            transition: "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
            "&::after": {
              content: '""',
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: showBirthdayInCommunity
                ? `linear-gradient(145deg, ${WELLNESS.primary}, #c4a5f5)`
                : darkMode
                  ? "#94a3b8"
                  : "#d7c4ec",
              transform: showBirthdayInCommunity ? "translateX(10px)" : "translateX(-10px)",
              transition: "transform 0.2s ease, background 0.2s ease",
              boxShadow: "0 2px 8px rgba(75, 19, 107, 0.18)",
            },
            "&:hover": {
              borderColor: darkMode ? "rgba(196, 165, 245, 0.46)" : "rgba(181, 123, 232, 0.52)",
            },
            "&.Mui-focusVisible": {
              outline: `2px solid ${WELLNESS.primary}`,
              outlineOffset: 2,
            },
          }}
        />
      </Box>
    </Box>
  );
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [darkModeInternal, setDarkModeInternal] = useState(false);

  const darkModeControlled =
    typeof darkModeFromParent === "boolean" &&
    typeof onDarkModeChange === "function";
  const darkMode = darkModeControlled ? darkModeFromParent : darkModeInternal;
  const setDarkMode = darkModeControlled
    ? (value) => onDarkModeChange(typeof value === 'function' ? value(darkModeFromParent) : value)
    : setDarkModeInternal;

  const [localeInternal, setLocaleInternal] = useState("en");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const localeControlled =
    typeof localeFromParent === "string" && typeof onLocaleChange === "function";
  const locale = localeControlled ? localeFromParent : localeInternal;
  const setLocale = localeControlled ? onLocaleChange : setLocaleInternal;

  const navigate = useNavigate();
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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleSaveLanguage = () => {
    setLocale(selectedLanguage);
  };

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
  }, []);

  useEffect(() => {
    if (!profile?.language) return;

    const lang = profileLanguageToLocale(profile.language);

    setLocale(lang);
    setSelectedLanguage(lang);
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
              px: { xs: 2, sm: 4 },
              py: { xs: 2.5, sm: 3.6 },
            }}
          >
            <Box sx={{ maxWidth: { xs: "100%", lg: 1320 }, width: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                  gap: { xs: 1.5, sm: 2 },
                  mb: 3,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: '2.25rem', sm: '3rem', md: '3.25rem' },
                      fontWeight: 700,
                      color: darkMode ? WELLNESS_DARK.text : WELLNESS.text,
                      lineHeight: 1.1,
                    }}
                  >
                    {t("profileSettings")}
                  </Typography>

                  <Typography
                    sx={{
                      color: darkMode ? WELLNESS_DARK.muted : WELLNESS.muted,
                      fontSize: { xs: '1.0625rem', sm: '1.25rem', md: '1.375rem' },
                      mt: 0.5,
                    }}
                  >
                    {t("profileSettingsSubtitle")}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  flexWrap="nowrap"
                  gap={0.75}
                  sx={{
                    flexShrink: 0,
                    alignSelf: { xs: "flex-end", sm: "auto" },
                    lineHeight: 1,
                  }}
                >
                  <DarkModeToggle
                    darkMode={darkMode}
                    onChange={setDarkMode}
                    label={t("darkMode")}
                    ariaLabel={t("toggleDarkMode")}
                  />
                </Stack>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "300px minmax(0, 1fr)",
                  },
                  gap: { xs: 2.2, lg: 2.8 },
                  alignItems: "start",
                }}
              >
                <Box sx={{ gridColumn: { xs: 1, lg: 1 }, gridRow: 1 }}>
                  <ProfileCard
                    profile={profile}
                    participantId={participantId}
                    isEditing={isEditing}
                    onEdit={() => setIsEditing(true)}
                    onAvatarUpdated={handleAvatarUpdated}
                    darkMode={darkMode}
                    t={t}
                  />
                </Box>

                <Box
                  sx={{
                    gridColumn: { xs: 1, lg: 2 },
                    gridRow: 1,
                    minWidth: 0,
                  }}
                >
                  <Stack spacing={{ xs: 2.2, lg: 2.8 }}>
                    <PersonalDetailsForm
                      participantId={participantId}
                      profile={profile}
                      onProfileUpdated={handleProfileUpdated}
                      isEditing={isEditing}
                      onFinishEditing={() => setIsEditing(false)}
                      onLogout={handleLogout}
                      darkMode={darkMode}
                      t={t}
                      locale={locale}
                      onLocaleChange={setSelectedLanguage}
                      onSaveLanguage={handleSaveLanguage}
                    />

                    <CommunitySettingsSection
                      darkMode={darkMode}
                      participantId={participantId}
                      profile={profile}
                    />

                    <ChangePasswordCard darkMode={darkMode} t={t} />
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default ProfilePage;
