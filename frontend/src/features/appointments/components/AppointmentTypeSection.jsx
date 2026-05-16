import { Box, ButtonBase, Card, CardContent, Stack, Typography } from "@mui/material";
import { getSortedAppointmentTypeOptions, WELLNESS } from "../appointmentTypeMeta";

/**
 * Section 1 — appointment type grid only (controlled selection).
 */
function AppointmentTypeSection({ value, onChange }) {
  const options = getSortedAppointmentTypeOptions();

  return (
    <Card
      elevation={0}
      sx={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        borderRadius: WELLNESS.radiusLg,
        border: "1px solid rgba(181, 123, 232, 0.14)",
        backgroundColor: WELLNESS.card,
        boxShadow: WELLNESS.shadowCard,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      <CardContent sx={{ p: { xs: 2.75, sm: 3.25 }, "&:last-child": { pb: { xs: 2.75, sm: 3.25 } } }}>
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 800,
            fontSize: { xs: "1.25rem", sm: "1.45rem" },
            letterSpacing: "-0.02em",
            color: WELLNESS.text,
            mb: 2.5,
          }}
        >
          1. Choose Appointment Type
        </Typography>

        <Box
          sx={{
            display: "grid",
            width: "100%",
            minWidth: 0,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: "18px",
            alignItems: "stretch",
          }}
        >
          {options.map(({ key, label, Icon, description, durationMins, iconBg, iconColor }) => {
            const selected = value === key;
            return (
              <ButtonBase
                key={key}
                type="button"
                onClick={() => onChange(key)}
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  minWidth: 0,
                  minHeight: "100%",
                  textAlign: "left",
                  display: "block",
                  borderRadius: WELLNESS.radiusMd,
                  p: 2,
                  pt: 2.35,
                  border: selected
                    ? `2px solid ${WELLNESS.primary}`
                    : "1px solid rgba(181, 123, 232, 0.16)",
                  bgcolor: selected ? "rgba(181, 123, 232, 0.09)" : WELLNESS.pageBg,
                  boxShadow: selected ? "0 10px 32px rgba(181, 123, 232, 0.14)" : "none",
                  transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    borderColor: WELLNESS.primary,
                    boxShadow: "0 12px 36px rgba(181, 123, 232, 0.12)",
                  },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    border: selected
                      ? `6px solid ${WELLNESS.primary}`
                      : "2px solid rgba(181, 123, 232, 0.32)",
                    boxSizing: "border-box",
                    bgcolor: selected ? `${WELLNESS.primary}22` : "transparent",
                  }}
                />
                <Stack direction="row" spacing={1.75} alignItems="flex-start" sx={{ height: "100%" }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "18px",
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: iconBg,
                      color: iconColor,
                    }}
                  >
                    <Icon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0, pr: 2.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "1rem",
                        color: WELLNESS.text,
                        lineHeight: 1.25,
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        lineHeight: 1.45,
                        color: WELLNESS.muted,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        flex: 1,
                      }}
                    >
                      {description}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ mt: "auto", pt: 0.5 }}>
                      <Box
                        component="span"
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          px: 1.1,
                          py: 0.35,
                          borderRadius: "999px",
                          bgcolor: WELLNESS.lightPink,
                          color: "#7c3fa1",
                        }}
                      >
                        {durationMins} min
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          px: 1.1,
                          py: 0.35,
                          borderRadius: "999px",
                          border: "1px solid rgba(181, 123, 232, 0.32)",
                          color: WELLNESS.primary,
                        }}
                      >
                        1:1 Session
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </ButtonBase>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

export default AppointmentTypeSection;

