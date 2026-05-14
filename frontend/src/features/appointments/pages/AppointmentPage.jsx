import { useCallback, useEffect, useMemo, useState } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import LocalFloristRoundedIcon from "@mui/icons-material/LocalFloristRounded";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import AppointmentBookingForm from "../components/AppointmentBookingForm";
import AppointmentCard from "../components/AppointmentCard";
import AppointmentTypeSection from "../components/AppointmentTypeSection";
import { APPOINTMENT_TYPE_OPTIONS, WELLNESS } from "../appointmentTypeMeta";
import { auth } from "../../../firebase";
import {
  cancelAppointment,
  getParticipantAppointments,
} from "../services/appointmentService";

const appointmentsCacheRtl = createCache({
  key: "appointments-mui-rtl",
  prepend: true,
});

const appointmentsCacheLtr = createCache({
  key: "appointments-mui-ltr",
  prepend: true,
});

const SAMPLE_PROVIDERS = [
  {
    id: "michal",
    name: "Dr. Michal Levi",
    specialty: "Psychologist",
    appointmentTypeKeys: ["psychologist"],
    schedule: "Sunday, Thursday",
    availability: "available",
    initials: "ML",
  },
  {
    id: "noa-therapist",
    name: "Noa Ben-Ami",
    specialty: "Therapist",
    appointmentTypeKeys: ["therapist"],
    schedule: "Tuesday, Thursday",
    availability: "available",
    initials: "NB",
  },
  {
    id: "margarita",
    name: "Margarita",
    specialty: "Reflexology",
    appointmentTypeKeys: ["reflexology"],
    schedule: "Monday 10:30–12:30",
    availability: "limited",
    initials: "M",
  },
  {
    id: "shagi",
    name: "Shagi",
    specialty: "Acupuncture & Herbal Medicine",
    appointmentTypeKeys: ["acupuncture"],
    schedule: "Wednesday 10:30–12:30",
    availability: "available",
    initials: "S",
  },
  {
    id: "omer",
    name: "Omer",
    specialty: "Acupuncture & Herbal Medicine",
    appointmentTypeKeys: ["acupuncture"],
    schedule: "Wednesday 10:30–12:30",
    availability: "available",
    initials: "O",
  },
  {
    id: "yael-massage",
    name: "Yael Rosen",
    specialty: "Massage Therapy",
    appointmentTypeKeys: ["massage"],
    schedule: "Friday",
    availability: "available",
    initials: "YR",
  },
  {
    id: "oshrat",
    name: "Oshrat Yosefson",
    specialty: "NLP",
    appointmentTypeKeys: ["nlp"],
    schedule: "",
    availability: "available",
    initials: "OY",
  },
  {
    id: "lilach",
    name: "Lilach Fisher",
    specialty: "Reflexology",
    appointmentTypeKeys: ["reflexology"],
    schedule: "",
    availability: "limited",
    initials: "LF",
  },
  {
    id: "ayelet",
    name: "Ayelet Shabtai",
    specialty: "NLP / Touch Therapy",
    appointmentTypeKeys: ["touchTherapy"],
    schedule: "",
    availability: "available",
    initials: "AS",
  },
];

function normalizeAppointmentStatus(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "confirmed") return "confirmed";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "pending") return "pending";
  return "pending";
}

function mapAppointmentDocToCard(docRow) {
  const typeKey = docRow.type || "";
  const opt =
    APPOINTMENT_TYPE_OPTIONS.find((o) => o.key === typeKey) ||
    APPOINTMENT_TYPE_OPTIONS[0];
  const typeLabel = opt.label;
  return {
    id: docRow.id,
    dateIso: docRow.date,
    time: docRow.time,
    provider: docRow.therapistName,
    appointmentType: typeLabel,
    durationMins: opt.durationMins,
    status: normalizeAppointmentStatus(docRow.status),
  };
}

function HeaderIllustration() {
  const purple = WELLNESS.primary;
  const pink = "#e879c8";
  const green = "#6ee7b7";
  return (
    <Box
      aria-hidden
      sx={{
        width: { xs: "100%", md: 200 },
        maxWidth: 280,
        height: { xs: 160, md: 180 },
        alignSelf: "center",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 132,
          height: 132,
          borderRadius: "28px",
          bgcolor: "rgba(181, 123, 232, 0.1)",
          border: "1px solid rgba(181, 123, 232, 0.2)",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 14px 40px rgba(181, 123, 232, 0.12)",
        }}
      >
        <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
          <rect x="18" y="14" width="52" height="44" rx="10" stroke={purple} strokeWidth="2.2" />
          <path d="M28 26h32M28 34h22" stroke={purple} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
          <path
            d="M44 58c-8 0-14 6-14 14h28c0-8-6-14-14-14z"
            stroke={pink}
            strokeWidth="2"
            fill="rgba(252, 228, 236, 0.6)"
          />
          <path
            d="M62 20c4 2 6 7 4 12-1.5 4-6 6-10 5"
            stroke={green}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="66" cy="18" rx="5" ry="8" transform="rotate(25 66 18)" fill={green} opacity="0.35" />
        </svg>
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: { xs: "18%", md: 0 },
          color: pink,
          opacity: 0.95,
          animation: "floatY 5s ease-in-out infinite",
          "@keyframes floatY": {
            "0%, 100%": { transform: "translateY(0)" },
            "50%": { transform: "translateY(-6px)" },
          },
        }}
      >
        <FavoriteBorderRoundedIcon sx={{ fontSize: 36 }} />
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: 4,
          left: { xs: "12%", md: -4 },
          color: green,
          opacity: 0.9,
        }}
      >
        <LocalFloristRoundedIcon sx={{ fontSize: 34 }} />
      </Box>
    </Box>
  );
}

/**
 * Personal appointments — light pastel wellness UI (embedded in ParticipantHome or standalone).
 */
function AppointmentPage({ embedInDashboard = false, locale = "en" } = {}) {
  const [selectedType, setSelectedType] = useState(null);
  const [myAppointments, setMyAppointments] = useState([]);

  const loadMyAppointments = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setMyAppointments([]);
      return;
    }
    try {
      const rows = await getParticipantAppointments(uid);
      setMyAppointments(rows.map(mapAppointmentDocToCard));
    } catch (e) {
      console.error("Failed to load appointments", e);
      setMyAppointments([]);
    }
  }, []);

  useEffect(() => {
    loadMyAppointments();
  }, [loadMyAppointments]);

  const parentTheme = useTheme();
  const pageTheme = useMemo(
    () =>
      createTheme({
        ...parentTheme,
        direction: locale === "he" ? "rtl" : "ltr",
        typography: {
          ...parentTheme.typography,
          fontFamily: '"Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }),
    [parentTheme, locale]
  );

  const appointmentsCache = locale === "he" ? appointmentsCacheRtl : appointmentsCacheLtr;

  const filteredProviderOptions = useMemo(() => {
    if (!selectedType) return [];
    return SAMPLE_PROVIDERS.filter((p) =>
      (p.appointmentTypeKeys ?? []).includes(selectedType)
    ).map((p) => ({
      id: p.id,
      name: p.name,
      specialty: p.specialty,
    }));
  }, [selectedType]);

  const handleCancel = async (id) => {
    setMyAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    );
    try {
      await cancelAppointment(id);
      await loadMyAppointments();
    } catch (e) {
      console.error("Failed to cancel appointment", e);
      await loadMyAppointments();
    }
  };

  const panelBorder = "1px solid rgba(181, 123, 232, 0.14)";
  const panelBg = WELLNESS.card;
  const panelShadow = WELLNESS.shadowCard;

  const pageBg = embedInDashboard ? "transparent" : WELLNESS.pageBg;

  const featurePill = (text) => (
    <Box
      key={text}
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.5,
        py: 0.6,
        borderRadius: "999px",
        fontSize: 13,
        fontWeight: 700,
        color: "#6b4f9a",
        bgcolor: WELLNESS.lightPink,
        border: "1px solid rgba(181, 123, 232, 0.15)",
      }}
    >
      {text}
    </Box>
  );

  return (
    <CacheProvider value={appointmentsCache}>
      <ThemeProvider theme={pageTheme}>
        <Box
          dir={locale === "he" ? "rtl" : "ltr"}
          lang={locale === "he" ? "he" : "en"}
          sx={{
            minHeight: embedInDashboard ? "auto" : "100vh",
            display: "flex",
            flexDirection: "column",
            transition: "background 0.3s ease",
            background: pageBg,
            color: WELLNESS.text,
          }}
        >
          <Box
            component="main"
            sx={{
              flex: 1,
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              px: { xs: 2, sm: 2.75, md: 3.5 },
              py: { xs: 2, sm: 2.5 },
            }}
          >
            <Box sx={{ width: "100%", maxWidth: 1320, minWidth: 0, mx: "auto" }}>
              <Box
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: WELLNESS.radiusLg,
                  border: embedInDashboard ? "none" : panelBorder,
                  bgcolor: embedInDashboard ? "transparent" : WELLNESS.card,
                  boxShadow: embedInDashboard ? "none" : panelShadow,
                  p: { xs: 2.5, sm: 3, md: 3.5 },
                  mb: { xs: 2.5, md: 3 },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "radial-gradient(520px 240px at 88% 0%, rgba(181,123,232,0.12), transparent 58%)",
                  }}
                />
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={{ xs: 2.5, md: 3.5 }}
                  alignItems={{ xs: "center", md: "center" }}
                  justifyContent={{ md: "space-between" }}
                  sx={{ position: "relative" }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      maxWidth: { md: 720 },
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "1.75rem", sm: "2.15rem", md: "2.35rem" },
                        letterSpacing: "-0.03em",
                        lineHeight: 1.12,
                        color: WELLNESS.text,
                      }}
                    >
                      Personal Appointments
                    </Typography>
                    <Typography
                      sx={{
                        mt: 1.25,
                        mx: { xs: "auto", md: 0 },
                        maxWidth: 620,
                        fontSize: { xs: 15, sm: 16 },
                        lineHeight: 1.55,
                        color: WELLNESS.muted,
                        fontWeight: 500,
                      }}
                    >
                      Book private one-on-one therapy and treatment sessions that are personalized to your needs.
                    </Typography>
                    <Stack
                      direction="row"
                      flexWrap="wrap"
                      useFlexGap
                      gap={1}
                      sx={{
                        mt: 2,
                        justifyContent: { xs: "center", md: "flex-start" },
                      }}
                    >
                      {["Private & Confidential", "Easy Booking", "Personalized Care"].map(featurePill)}
                    </Stack>
                  </Box>
                  <HeaderIllustration />
                </Stack>
              </Box>

              <Stack spacing={3} sx={{ width: "100%", minWidth: 0 }}>
                <AppointmentTypeSection value={selectedType} onChange={setSelectedType} />

                <AppointmentBookingForm
                  selectedAppointmentTypeKey={selectedType}
                  providerOptions={filteredProviderOptions}
                  onBookingComplete={loadMyAppointments}
                />

                <Card
                  elevation={0}
                  sx={{
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    borderRadius: WELLNESS.radiusLg,
                    border: panelBorder,
                    backgroundColor: panelBg,
                    boxShadow: panelShadow,
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.75, sm: 3.25 }, "&:last-child": { pb: { xs: 2.75, sm: 3.25 } } }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "1.25rem", sm: "1.45rem" },
                        letterSpacing: "-0.02em",
                        color: WELLNESS.text,
                        mb: 2,
                        fontFamily: '"Poppins", "Inter", sans-serif',
                      }}
                    >
                      3. My Appointments
                    </Typography>
                    <Box>
                      {myAppointments.map((a) => (
                        <AppointmentCard key={a.id} appointment={a} onCancel={handleCancel} />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default AppointmentPage;
