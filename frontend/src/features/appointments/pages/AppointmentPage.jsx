import { useCallback, useEffect, useMemo, useState } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { Alert, Box, Card, CardContent, Snackbar, Stack, Typography } from "@mui/material";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import AppointmentBookingForm from "../components/AppointmentBookingForm";
import AppointmentCard from "../components/AppointmentCard";
import AppointmentTypeSection from "../components/AppointmentTypeSection";
import { APPOINTMENT_TYPE_OPTIONS, WELLNESS } from "../appointmentTypeMeta";
import { auth } from "../../../firebase";
import {
  cancelAppointment,
  getAppointmentProviderOptions,
  getParticipantAppointments,
  appointmentProviderMatchesType,
} from "../services/appointmentService";
import appointmentsHeroImage from "../../../assets/appointments-hero.png";

const appointmentsCacheRtl = createCache({
  key: "appointments-mui-rtl",
  prepend: true,
});

const appointmentsCacheLtr = createCache({
  key: "appointments-mui-ltr",
  prepend: true,
});

function normalizeAppointmentStatus(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "cancelled" || s === "canceled") return "cancelled";
  return "confirmed";
}

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = toDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapAppointmentDocToCard(docRow) {
  const rawType = docRow.appointmentType || docRow.type || docRow.eventTitle || "";
  const typeKey = rawType === "massageTherapy" ? "massage" : rawType;
  const opt =
    APPOINTMENT_TYPE_OPTIONS.find((o) => o.key === typeKey) ||
    APPOINTMENT_TYPE_OPTIONS.find((o) => o.match.some((match) => String(rawType).toLowerCase().includes(match))) ||
    APPOINTMENT_TYPE_OPTIONS[0];
  const typeLabel = opt.label;
  return {
    id: docRow.bookingId || docRow.id,
    dateIso: docRow.selectedDate || docRow.dateKey || toDateKey(docRow.startAt || docRow.eventDate || docRow.date),
    time: docRow.selectedTime || docRow.selectedTimeSlot || docRow.sessionTime || docRow.time,
    provider: docRow.providerName || docRow.therapistName || "Provider",
    room: docRow.room || docRow.eventLocation || docRow.location || "",
    appointmentType: typeLabel,
    durationMins: opt.durationMins,
    status: normalizeAppointmentStatus(docRow.status),
  };
}

/**
 * Personal appointments — light pastel wellness UI (embedded in ParticipantHome or standalone).
 */
function AppointmentPage({ embedInDashboard = false, locale = "en" } = {}) {
  const [selectedType, setSelectedType] = useState(null);
  const [myAppointments, setMyAppointments] = useState([]);
  const [appointmentProviders, setAppointmentProviders] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getAppointmentProviderOptions();
        if (!cancelled) setAppointmentProviders(list);
      } catch (e) {
        console.error("[Appointments] Failed to load appointment event slots:", e);
        if (!cancelled) setAppointmentProviders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
          fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }),
    [parentTheme, locale]
  );

  const appointmentsCache = locale === "he" ? appointmentsCacheRtl : appointmentsCacheLtr;

  const filteredProviderOptions = useMemo(() => {
    if (!selectedType) return [];
    const exactMatches = appointmentProviders.filter((provider) =>
      appointmentProviderMatchesType(provider, selectedType)
    );
    return exactMatches.length ? exactMatches : appointmentProviders;
  }, [appointmentProviders, selectedType]);

  const handleCancel = async (id) => {
    const row = myAppointments.find((a) => a.id === id);
    if (!row || normalizeAppointmentStatus(row.status) === "cancelled") {
      return;
    }

    setMyAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    );
    try {
      await cancelAppointment(id);
      await loadMyAppointments();
      setSnackbar({
        open: true,
        message: "Appointment cancelled successfully",
        severity: "success",
      });
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
        fontSize: '0.8125rem',
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
                  boxShadow: embedInDashboard ? "none" : panelShadow,
                  mb: { xs: 2.5, md: 3 },
                  isolation: "isolate",
                  minHeight: { md: '19.5rem', lg: '20.75rem' },
                  background:
                    "linear-gradient(145deg, rgba(255, 250, 252, 0.98) 0%, rgba(248, 242, 255, 0.55) 48%, rgba(255, 253, 255, 0.97) 100%)",
                  p: { xs: 3, sm: 3.75, md: 4.5, lg: 5 },
                }}
              >
                {/* Single wide wash: warm (copy) → cool (imagery), no center line */}
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: "none",
                    background:
                      locale === "he"
                        ? "linear-gradient(to left, rgba(255, 240, 246, 0.5) 0%, rgba(254, 246, 250, 0.32) 18%, rgba(251, 246, 252, 0.2) 38%, rgba(248, 244, 252, 0.16) 50%, rgba(243, 238, 252, 0.2) 62%, rgba(236, 230, 250, 0.3) 82%, rgba(237, 232, 252, 0.44) 100%)"
                        : "linear-gradient(to right, rgba(255, 240, 246, 0.5) 0%, rgba(254, 246, 250, 0.32) 18%, rgba(251, 246, 252, 0.2) 38%, rgba(248, 244, 252, 0.16) 50%, rgba(243, 238, 252, 0.2) 62%, rgba(236, 230, 250, 0.3) 82%, rgba(237, 232, 252, 0.44) 100%)",
                  }}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: { xs: "-18%", md: "-12%" },
                    right: { xs: "-25%", md: "-8%" },
                    width: { xs: '12.5rem', md: '18.75rem' },
                    height: { xs: '12.5rem', md: '18.75rem' },
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(181, 123, 232, 0.22) 0%, rgba(181, 123, 232, 0.06) 45%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    bottom: { xs: "-28%", md: "-22%" },
                    left: { xs: "-20%", md: "-12%" },
                    width: { xs: '13.75rem', md: '17.5rem' },
                    height: { xs: '13.75rem', md: '17.5rem' },
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(232, 121, 200, 0.18) 0%, rgba(252, 228, 236, 0.08) 50%, transparent 72%)",
                    pointerEvents: "none",
                  }}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "radial-gradient(560px 300px at 90% 12%, rgba(181, 123, 232, 0.12), transparent 58%)",
                  }}
                />
                <Box
                  component="img"
                  src={appointmentsHeroImage}
                  alt=""
                  sx={(theme) => ({
                    display: { xs: "none", md: "block" },
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 0,
                    pointerEvents: "none",
                    height: { md: "118%", lg: "120%" },
                    width: { md: "58%", lg: "56%" },
                    insetInlineEnd: { md: theme.spacing(-1.5) },
                    objectFit: "cover",
                    objectPosition:
                      theme.direction === "rtl" ? "38% 46%" : "62% 46%",
                    borderRadius: 0,
                    filter: "saturate(0.96) brightness(1.02)",
                    maskImage:
                      theme.direction === "rtl"
                        ? "linear-gradient(270deg, transparent 0%, rgba(0,0,0,0.06) 6%, rgba(0,0,0,0.28) 22%, rgba(0,0,0,0.72) 46%, rgba(0,0,0,0.95) 68%, #000 100%)"
                        : "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 6%, rgba(0,0,0,0.28) 22%, rgba(0,0,0,0.72) 46%, rgba(0,0,0,0.95) 68%, #000 100%)",
                    WebkitMaskImage:
                      theme.direction === "rtl"
                        ? "linear-gradient(270deg, transparent 0%, rgba(0,0,0,0.06) 6%, rgba(0,0,0,0.28) 22%, rgba(0,0,0,0.72) 46%, rgba(0,0,0,0.95) 68%, #000 100%)"
                        : "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 6%, rgba(0,0,0,0.28) 22%, rgba(0,0,0,0.72) 46%, rgba(0,0,0,0.95) 68%, #000 100%)",
                  })}
                />
                {/* Soft blend between copy and imagery (desktop) — sits over image, under text */}
                <Box
                  aria-hidden
                  sx={(theme) => ({
                    display: { xs: "none", md: "block" },
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: "70%",
                    zIndex: 1,
                    pointerEvents: "none",
                    ...(theme.direction === "rtl"
                      ? {
                          left: 0,
                          background:
                            "linear-gradient(to left, rgba(255, 251, 255, 0.38) 0%, rgba(249, 244, 252, 0.24) 16%, rgba(246, 241, 252, 0.14) 36%, rgba(243, 238, 252, 0.08) 58%, rgba(255, 251, 255, 0.03) 82%, transparent 100%)",
                        }
                      : {
                          right: 0,
                          background:
                            "linear-gradient(to right, rgba(255, 251, 255, 0.38) 0%, rgba(249, 244, 252, 0.24) 16%, rgba(246, 241, 252, 0.14) 36%, rgba(243, 238, 252, 0.08) 58%, rgba(255, 251, 255, 0.03) 82%, transparent 100%)",
                        }),
                  })}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: "18%",
                    left: "6%",
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: "50%",
                    bgcolor: "rgba(181, 123, 232, 0.35)",
                    display: { xs: "none", md: "block" },
                    pointerEvents: "none",
                  }}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: "52%",
                    left: "14%",
                    width: '0.3125rem',
                    height: '0.3125rem',
                    borderRadius: "50%",
                    bgcolor: "rgba(232, 121, 200, 0.45)",
                    display: { xs: "none", lg: "block" },
                    pointerEvents: "none",
                  }}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    bottom: "22%",
                    left: "22%",
                    width: '0.375rem',
                    height: '0.375rem',
                    borderRadius: "50%",
                    bgcolor: "rgba(181, 123, 232, 0.25)",
                    display: { xs: "none", md: "block" },
                    pointerEvents: "none",
                  }}
                />

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={{ xs: 3, md: 0 }}
                  alignItems={{ xs: "center", md: "center" }}
                  justifyContent={{ md: "flex-start" }}
                  sx={{ position: "relative", zIndex: 2 }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      maxWidth: { md: "58%", lg: "56%" },
                      textAlign: { xs: "center", md: "start" },
                      alignSelf: { xs: "stretch", md: "center" },
                      pr: { md: 1.25, lg: 1.5 },
                    }}
                  >
                    <Typography
                      component="h1"
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "1.85rem", sm: "2.2rem", md: "2.45rem", lg: "2.55rem" },
                        letterSpacing: "-0.035em",
                        lineHeight: 1.08,
                        color: WELLNESS.text,
                        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      }}
                    >
                      Personal Appointments
                    </Typography>
                    <Typography
                      sx={{
                        mt: { xs: 1.5, md: 2 },
                        mx: { xs: "auto", md: 0 },
                        maxWidth: 560,
                        fontSize: { xs: '0.9375rem', sm: '1.0625rem' },
                        lineHeight: 1.65,
                        color: WELLNESS.muted,
                        fontWeight: 500,
                        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      }}
                    >
                      Book private one-on-one therapy and treatment sessions that are personalized to your needs.
                    </Typography>
                    <Stack
                      direction="row"
                      flexWrap="wrap"
                      useFlexGap
                      gap={1.25}
                      sx={{
                        mt: { xs: 2.25, md: 2.75 },
                        justifyContent: { xs: "center", md: "flex-start" },
                        rowGap: '0.5rem',
                      }}
                    >
                      {["Private & Confidential", "Easy Booking", "Personalized Care"].map(featurePill)}
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      display: { xs: "block", md: "none" },
                      position: "relative",
                      width: "100%",
                      maxWidth: 400,
                      mx: "auto",
                      mt: 0.25,
                    }}
                  >
                    <Box
                      aria-hidden
                      sx={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        top: 0,
                        width: "120%",
                        height: "55%",
                        maxWidth: 480,
                        pointerEvents: "none",
                        background:
                          "radial-gradient(ellipse 70% 90% at 50% 0%, rgba(255, 251, 255, 0.92) 0%, rgba(247, 238, 255, 0.45) 45%, transparent 78%)",
                      }}
                    />
                    <Box
                      component="img"
                      src={appointmentsHeroImage}
                      alt=""
                      sx={{
                        position: "relative",
                        zIndex: 0,
                        display: "block",
                        width: "min(100%, 380px)",
                        height: "auto",
                        maxHeight: '16.25rem',
                        mx: "auto",
                        objectFit: "contain",
                        borderRadius: 0,
                        opacity: 0.97,
                        filter: "saturate(0.96)",
                      }}
                    />
                  </Box>
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
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
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

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default AppointmentPage;

