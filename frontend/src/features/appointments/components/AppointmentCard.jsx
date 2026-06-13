import { format, isValid, parse, parseISO } from "date-fns";
import { Box, Button, Stack, Typography } from "@mui/material";
import { resolveAppointmentTypeOption, WELLNESS } from "../appointmentTypeMeta";

const STATUS_STYLES = {
  confirmed: {
    label: "Confirmed",
    sx: {
      bgcolor: "rgba(209, 250, 229, 0.75)",
      color: "#047857",
      border: "1px solid rgba(110, 231, 183, 0.55)",
    },
  },
  pending: {
    label: "Pending Approval",
    sx: {
      bgcolor: "rgba(255, 237, 213, 0.92)",
      color: "#c2410c",
      border: "1px solid rgba(251, 146, 60, 0.55)",
    },
  },
  cancelled: {
    label: "Cancelled",
    sx: {
      bgcolor: "rgba(220, 38, 38, 0.14)",
      color: "#b91c1c",
      border: "1px solid rgba(220, 38, 38, 0.5)",
      fontWeight: 700,
    },
  },
};

function normalizeStatus(status) {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();
  if (s === "confirmed") return "confirmed";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "pending") return "pending";
  return "pending";
}

function parseAppointmentDate(appointment) {
  if (appointment.dateIso) {
    const parsed = parseISO(appointment.dateIso);
    return isValid(parsed) ? parsed : null;
  }
  if (appointment.date) {
    const tryParse = parse(appointment.date, "EEEE, MMMM d, yyyy", new Date());
    if (isValid(tryParse)) return tryParse;
    const fallback = new Date(appointment.date);
    return isValid(fallback) ? fallback : null;
  }
  return null;
}

function formatDateTimeLine(d, timeStr) {
  if (!d) return "—";
  if (!timeStr || typeof timeStr !== "string") {
    return format(d, "EEE, MMM d, yyyy");
  }
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) {
    return `${format(d, "EEE, MMM d, yyyy")} · ${timeStr}`;
  }
  const hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const combined = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes, 0, 0);
  return format(combined, "EEE, MMM d, yyyy · h:mm a");
}

/**
 * Single horizontal wellness booking card: details left, status + cancel right.
 */
function AppointmentCard({ appointment, onCancel }) {
  const { time, provider, appointmentType, status, durationMins } = appointment;
  const statusKey = normalizeStatus(status);
  const st = STATUS_STYLES[statusKey] || STATUS_STYLES.pending;
  const canCancel =
    (statusKey === "confirmed" || statusKey === "pending") && Boolean(onCancel);

  const d = parseAppointmentDate(appointment);
  const dateTimeLine = formatDateTimeLine(d, time);

  const typeOpt = resolveAppointmentTypeOption(appointmentType);
  const TypeIcon = typeOpt.Icon;
  const durationLabel =
    typeof durationMins === "number" && durationMins > 0 ? `${durationMins} min` : null;

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
        borderRadius: WELLNESS.radiusLg,
        border: "1px solid rgba(181, 123, 232, 0.12)",
        backgroundColor: WELLNESS.card,
        boxShadow: "0 4px 24px rgba(181, 123, 232, 0.07)",
        px: { xs: 2, sm: 2.75 },
        py: { xs: 2, sm: 2.25 },
        transition: "border-color 0.22s ease, box-shadow 0.22s ease, transform 0.2s ease",
        "&:hover": {
          borderColor: "rgba(181, 123, 232, 0.22)",
          boxShadow: "0 8px 32px rgba(181, 123, 232, 0.11)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 2, sm: 2.5 }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "20px",
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: typeOpt.iconBg,
              color: typeOpt.iconColor,
            }}
          >
            <TypeIcon sx={{ fontSize: '1.875rem' }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0, pt: 0.15 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.02rem", sm: "1.06rem" },
                letterSpacing: "-0.02em",
                color: WELLNESS.text,
                lineHeight: 1.3,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            >
              {typeOpt.label}{" "}
              <Box
                component="span"
                sx={{
                  fontWeight: 600,
                  color: WELLNESS.muted,
                  fontSize: "0.92em",
                }}
              >
                Appointment
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: 0.65,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: WELLNESS.muted,
                lineHeight: 1.4,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
            >
              {provider}
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontSize: '0.84375rem',
                fontWeight: 500,
                color: "#5b5670",
                lineHeight: 1.45,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {dateTimeLine}
            </Typography>

            {durationLabel ? (
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  mt: 1,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  px: 1.25,
                  py: 0.45,
                  borderRadius: "999px",
                  bgcolor: WELLNESS.lightPink,
                  color: "#7c4fa8",
                  border: "1px solid rgba(181, 123, 232, 0.18)",
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}
              >
                {durationLabel}
              </Box>
            ) : null}
          </Box>
        </Stack>

        <Stack
          direction="column"
          alignItems={{ xs: "stretch", sm: "flex-end" }}
          justifyContent="center"
          spacing={1.25}
          sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "center" }, minWidth: { sm: 140 } }}
        >
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              alignSelf: { xs: "flex-start", sm: "flex-end" },
              px: 1.35,
              py: 0.45,
              borderRadius: "999px",
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: "0.02em",
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              ...st.sx,
            }}
          >
            {st.label}
          </Box>

          {canCancel ? (
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={() => onCancel(appointment.id)}
              sx={{
                alignSelf: { xs: "stretch", sm: "flex-end" },
                minWidth: "unset",
                py: 0.5,
                px: 1.5,
                textTransform: "none",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: '0.78125rem',
                lineHeight: 1.2,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                borderColor: "rgba(248, 113, 113, 0.5)",
                color: "#dc2626",
                transition: "transform 0.18s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  borderColor: "#f87171",
                  bgcolor: "rgba(254, 242, 242, 0.95)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.1)",
                },
              }}
            >
              Cancel Appointment
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}

export default AppointmentCard;

