import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import { WELLNESS, WELLNESS_DARK } from "../appointmentTypeMeta";

/**
 * Therapist row inside the scrollable list (parent supplies dividers).
 */
function ProviderCard({ provider, darkMode = false }) {
  const { name, specialty, schedule, availability, initials } = provider;
  const isLimited = availability === "limited";
  const w = darkMode ? WELLNESS_DARK : WELLNESS;

  const nameColor = darkMode ? "#f8fafc" : WELLNESS.text;
  const muted = darkMode ? "#94a3b8" : WELLNESS.muted;
  const scheduleColor = darkMode ? "#cbd5e1" : "#4b5563";
  const iconColor = darkMode ? w.primary : WELLNESS.primary;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
        py: { xs: 1.35, sm: 1.6 },
        px: { xs: 0.25, sm: 0.35 },
        transition: "background-color 0.22s ease, transform 0.18s ease",
        borderRadius: WELLNESS.radiusMd,
        "&:hover": {
          bgcolor: darkMode ? "rgba(196, 165, 245, 0.08)" : "rgba(181, 123, 232, 0.06)",
          transform: "translateX(2px)",
        },
      }}
    >
      <Avatar
        src={provider.avatarUrl}
        sx={{
          width: 50,
          height: 50,
          fontSize: "0.95rem",
          fontWeight: 800,
          flexShrink: 0,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          bgcolor: darkMode ? "rgba(196, 165, 245, 0.2)" : "rgba(181, 123, 232, 0.16)",
          color: darkMode ? "#f3e8ff" : "#6b3f9e",
          border: darkMode ? "1px solid rgba(196,165,245,0.28)" : "1px solid rgba(181, 123, 232, 0.22)",
        }}
      >
        {initials || name?.slice(0, 2)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: "0.98rem",
            lineHeight: 1.25,
            color: nameColor,
            letterSpacing: "-0.02em",
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
        >
          {name}
        </Typography>
        <Typography
          sx={{
            fontSize: 13,
            color: muted,
            mt: 0.2,
            lineHeight: 1.35,
            fontWeight: 600,
          }}
        >
          {specialty}
        </Typography>
        {schedule ? (
          <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mt: 0.45 }}>
            <EventOutlinedIcon sx={{ fontSize: 18, color: iconColor, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12.75, color: scheduleColor, lineHeight: 1.35, fontWeight: 600 }}>
              {schedule}
            </Typography>
          </Stack>
        ) : null}
      </Box>

      <Chip
        size="small"
        label={isLimited ? "Limited" : "Available"}
        sx={{
          height: 28,
          fontSize: 11.5,
          fontWeight: 800,
          flexShrink: 0,
          alignSelf: "center",
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          ...(isLimited
            ? {
                bgcolor: darkMode ? "rgba(251, 191, 36, 0.14)" : "rgba(254, 243, 199, 0.85)",
                color: darkMode ? "#fcd34d" : "#b45309",
                border: darkMode ? "1px solid rgba(251, 191, 36, 0.35)" : "1px solid rgba(251, 191, 36, 0.45)",
              }
            : {
                bgcolor: darkMode ? "rgba(74, 222, 128, 0.12)" : "rgba(220, 252, 231, 0.9)",
                color: darkMode ? "#86efac" : "#15803d",
                border: darkMode ? "1px solid rgba(74, 222, 128, 0.3)" : "1px solid rgba(74, 222, 128, 0.4)",
              }),
        }}
      />
    </Stack>
  );
}

export default ProviderCard;

