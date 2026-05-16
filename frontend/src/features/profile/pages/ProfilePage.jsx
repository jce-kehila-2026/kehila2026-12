import { useEffect, useMemo, useState } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { signOut } from "firebase/auth";
import BedtimeOutlinedIcon from "@mui/icons-material/BedtimeOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import {
  Box,
  ButtonBase,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { createProfileT } from "../i18n/profileSettingsTranslations";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import ChangePasswordCard from "../components/ChangePasswordCard";
import PersonalDetailsForm from "../components/PersonalDetailsForm";
import ProfileCard from "../components/ProfileCard";
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

function ProfilePage({
  darkMode: darkModeFromParent,
  onDarkModeChange,
  embedInDashboard = false,
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
  const setDarkMode = darkModeControlled ? onDarkModeChange : setDarkModeInternal;

  const [locale, setLocale] = useState("en");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const navigate = useNavigate();
  const parentTheme = useTheme();

  const t = useMemo(() => createProfileT(locale), [locale]);

  const pageTheme = useMemo(
    () =>
      createTheme({
        ...parentTheme,
        direction: locale === "he" ? "rtl" : "ltr",
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

    const lang = profile.language === "hebrew" ? "he" : "en";

    setLocale(lang);
    setSelectedLanguage(lang);
  }, [profile?.language]);

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
          dir={locale === "he" ? "rtl" : "ltr"}
          lang={locale === "he" ? "he" : "en"}
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
                      fontSize: { xs: 36, sm: 48, md: 52 },
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
                      fontSize: { xs: 17, sm: 20, md: 22 },
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
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      letterSpacing: "0.01em",
                      color: darkMode ? "#e2e8f0" : "#4b5563",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      pr: 0.25,
                    }}
                  >
                    {t("darkMode")}
                  </Typography>

                  <ButtonBase
                    type="button"
                    role="switch"
                    aria-checked={darkMode}
                    aria-label={t("toggleDarkMode")}
                    disableRipple
                    onClick={() => setDarkMode((d) => !d)}
                    sx={{
                      display: "inline-flex",
                      flexDirection: "row",
                      alignItems: "stretch",
                      borderRadius: 9999,
                      overflow: "hidden",
                      border: "1.5px solid rgba(181, 123, 232, 0.38)",
                      bgcolor: darkMode ? "#1e293b" : "#fffbff",
                      minWidth: 76,
                      height: 36,
                      p: 0,
                      transition:
                        "border-color 0.28s ease, box-shadow 0.28s ease, transform 0.22s ease",
                      boxShadow: darkMode
                        ? "0 2px 12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(196, 165, 245, 0.12)"
                        : "0 2px 10px rgba(181, 123, 232, 0.14)",
                      "&:hover": {
                        borderColor: "rgba(181, 123, 232, 0.65)",
                        boxShadow: darkMode
                          ? "0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(196, 165, 245, 0.22)"
                          : "0 4px 16px rgba(181, 123, 232, 0.22)",
                        transform: "translateY(-1px)",
                      },
                      "&.Mui-focusVisible": {
                        outline: `2px solid ${WELLNESS.primary}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Box
                      aria-hidden
                      sx={{
                        flex: "1 1 50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 0.75,
                        px: 1.1,
                        minWidth: 36,
                        background: darkMode
                          ? `linear-gradient(145deg, ${WELLNESS.primary} 0%, #8b5cf6 55%, #7c3aed 100%)`
                          : "linear-gradient(180deg, rgba(234,215,255,0.55) 0%, #fffbff 100%)",
                        transition:
                          "background 0.28s ease, background-color 0.28s ease",
                      }}
                    >
                      <BedtimeOutlinedIcon
                        sx={{
                          fontSize: 18,
                          width: 18,
                          height: 18,
                          flexShrink: 0,
                          color: darkMode ? "#ffffff" : "#9d5bd6",
                          opacity: darkMode ? 1 : 0.85,
                          transition: "color 0.28s ease, opacity 0.28s ease",
                          display: "block",
                        }}
                      />
                    </Box>

                    <Box
                      aria-hidden
                      sx={{
                        flex: "1 1 50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 0.75,
                        px: 1.1,
                        minWidth: 36,
                        background: darkMode
                          ? "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)"
                          : `linear-gradient(145deg, ${WELLNESS.primary} 0%, #c4a5f5 100%)`,
                        transition:
                          "background 0.28s ease, background-color 0.28s ease",
                      }}
                    >
                      <WbSunnyOutlinedIcon
                        sx={{
                          fontSize: 18,
                          width: 18,
                          height: 18,
                          flexShrink: 0,
                          color: darkMode ? WELLNESS_DARK.primary : "#ffffff",
                          opacity: 1,
                          transition: "color 0.28s ease, opacity 0.28s ease",
                          display: "block",
                        }}
                      />
                    </Box>
                  </ButtonBase>
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
                    onAvatarUpdated={(patch) =>
                      setProfile((prev) => ({ ...prev, ...patch }))
                    }
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
                      onProfileUpdated={setProfile}
                      isEditing={isEditing}
                      onFinishEditing={() => setIsEditing(false)}
                      onLogout={handleLogout}
                      darkMode={darkMode}
                      t={t}
                      locale={locale}
                      onLocaleChange={setSelectedLanguage}
                      onSaveLanguage={handleSaveLanguage}
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
