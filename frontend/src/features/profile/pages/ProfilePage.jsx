import { useEffect, useMemo, useState } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import BedtimeOutlinedIcon from "@mui/icons-material/BedtimeOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import { signOut } from "firebase/auth";
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
import { getParticipantData } from "../services/participantService";

const DARK_MODE_TOGGLE_ICON_PINK = "#ec4899";
const DARK_MODE_TOGGLE_ICON_ON_PINK = "#ffffff";

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

const navDefs = [
  { labelKey: "navDashboard", icon: HomeOutlinedIcon, active: false },
  { labelKey: "navCommunity", icon: GroupOutlinedIcon, active: false },
  { labelKey: "navMessages", icon: ChatBubbleOutlineOutlinedIcon, active: false },
  { labelKey: "navEvents", icon: EventOutlinedIcon, active: false },
  { labelKey: "navResources", icon: FavoriteBorderOutlinedIcon, active: false },
  { labelKey: "navSettings", icon: SettingsOutlinedIcon, active: true },
];

function ProfilePage() {
  const participantId = "participant-001";

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // locale = the language that is actually applied to the page
  const [locale, setLocale] = useState("en");

  // selectedLanguage = the dropdown value before clicking Save Changes
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
      const data = await getParticipantData(participantId);
      if (mounted) setProfile(data);
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
              minHeight: "100vh",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(140deg, #fff8fc 0%, #fdf3f8 100%)",
            }}
          >
            <CircularProgress sx={{ color: "#ec4899" }} />
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
            minHeight: "100vh",
            display: "flex",
            transition: "background 0.25s ease",
            background: darkMode
              ? "linear-gradient(145deg, #0f172a 0%, #020617 55%, #0c1222 100%)"
              : "linear-gradient(140deg, #fff8fc 0%, #fdf3f8 100%)",
          }}
        >
          <Box
            component="aside"
            sx={{
              width: { xs: 92, sm: 210 },
              flexShrink: 0,
              borderInlineEnd: darkMode
                ? "1px solid #334155"
                : "1px solid #f6dce8",
              bgcolor: darkMode ? "#0f172a" : "#fffefe",
              px: { xs: 1, sm: 1.8 },
              py: 3,
            }}
          >
            <Typography
              sx={{
                fontWeight: 800,
                color: darkMode ? "#f472b6" : "#be185d",
                fontSize: 36,
                px: 1,
                mb: 3.5,
                display: { xs: "none", sm: "block" },
              }}
            >
              She-Na
            </Typography>

            <Stack spacing={0.8}>
              {navDefs.map((item) => {
                const Icon = item.icon;

                return (
                  <ButtonBase
                    key={item.labelKey}
                    sx={{
                      width: "100%",
                      justifyContent: "flex-start",
                      gap: 1.1,
                      px: { xs: 1, sm: 1.3 },
                      py: 1.2,
                      borderRadius: 3,
                      color: item.active
                        ? darkMode
                          ? "#f9a8d4"
                          : "#be185d"
                        : darkMode
                          ? "#94a3b8"
                          : "#374151",
                      border: item.active
                        ? darkMode
                          ? "1px solid rgba(236, 72, 153, 0.35)"
                          : "1px solid #f2c3dd"
                        : "1px solid transparent",
                      background: item.active
                        ? darkMode
                          ? "linear-gradient(90deg, rgba(236,72,153,0.18) 0%, rgba(15,23,42,0.9) 100%)"
                          : "linear-gradient(90deg, #fce7f3 0%, #fff3f8 100%)"
                        : "transparent",
                      "&:hover": {
                        backgroundColor: item.active
                          ? darkMode
                            ? "rgba(236, 72, 153, 0.15)"
                            : "#fce7f3"
                          : darkMode
                            ? "rgba(148, 163, 184, 0.12)"
                            : "#fdf2f8",
                      },
                    }}
                  >
                    <Icon sx={{ fontSize: 20 }} />
                    <Typography
                      sx={{
                        fontSize: 14.5,
                        display: { xs: "none", sm: "block" },
                        color: "inherit",
                      }}
                    >
                      {t(item.labelKey)}
                    </Typography>
                  </ButtonBase>
                );
              })}
            </Stack>
          </Box>

          <Box
            component="main"
            sx={{
              flex: 1,
              px: { xs: 2, sm: 4 },
              py: { xs: 2.5, sm: 3.6 },
            }}
          >
            <Box sx={{ maxWidth: 1120 }}>
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
                      color: darkMode ? "#f8fafc" : "#111827",
                      lineHeight: 1.1,
                    }}
                  >
                    {t("profileSettings")}
                  </Typography>

                  <Typography
                    sx={{
                      color: darkMode ? "#94a3b8" : "#6b7280",
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
                      border: "1.5px solid #f9a8d4",
                      bgcolor: "#fffafb",
                      minWidth: 76,
                      height: 36,
                      p: 0,
                      transition:
                        "border-color 0.28s ease, box-shadow 0.28s ease",
                      boxShadow: "0 1px 4px rgba(236, 72, 153, 0.12)",
                      "&:hover": {
                        borderColor: "#ec4899",
                        boxShadow: "0 2px 10px rgba(236, 72, 153, 0.2)",
                      },
                      "&.Mui-focusVisible": {
                        outline: "2px solid #ec4899",
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
                        bgcolor: darkMode ? "#ec4899" : "#fffbfc",
                        background: darkMode
                          ? "linear-gradient(180deg, #f472b6 0%, #ec4899 55%, #db2777 100%)"
                          : "#fffbfc",
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
                          color: darkMode
                            ? DARK_MODE_TOGGLE_ICON_ON_PINK
                            : DARK_MODE_TOGGLE_ICON_PINK,
                          opacity: 1,
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
                        bgcolor: darkMode ? "#fff7fb" : "#ec4899",
                        background: darkMode
                          ? "#fff7fb"
                          : "linear-gradient(180deg, #f472b6 0%, #ec4899 55%, #db2777 100%)",
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
                          color: darkMode
                            ? DARK_MODE_TOGGLE_ICON_PINK
                            : DARK_MODE_TOGGLE_ICON_ON_PINK,
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
                    isEditing={isEditing}
                    onEdit={() => setIsEditing(true)}
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