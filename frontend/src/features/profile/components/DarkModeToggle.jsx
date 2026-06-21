import BedtimeOutlinedIcon from "@mui/icons-material/BedtimeOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import { Box, ButtonBase, Typography } from "@mui/material";

const SHENA_PINK = "#ec4899";
const SHENA_PINK_BRIGHT = "#e73386";
const SHENA_PINK_DEEP = "#dc2577";
const SHENA_PURPLE = "#5b1e8c";
const SHENA_PINK_GRADIENT = `linear-gradient(135deg, ${SHENA_PINK_BRIGHT} 0%, ${SHENA_PINK_DEEP} 100%)`;

export default function DarkModeToggle({
  darkMode = false,
  onChange,
  compact = false,
  label = "Dark Mode",
  ariaLabel = "Toggle dark mode",
}) {
  const handleToggle = () => {
    if (typeof onChange === "function") {
      onChange(!darkMode);
    }
  };

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 0 : 0.75,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {!compact ? (
        <Typography
          component="span"
          sx={{
            fontSize: '0.78125rem',
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
          {label}
        </Typography>
      ) : null}

      <ButtonBase
        type="button"
        role="switch"
        aria-checked={darkMode}
        aria-label={ariaLabel}
        disableRipple
        onClick={handleToggle}
        sx={{
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "stretch",
          borderRadius: 9999,
          overflow: "hidden",
          border: `1.5px solid rgba(236, 72, 153, 0.38)`,
          bgcolor: darkMode ? "#1a1028" : "#fff9fd",
          minWidth: '4.75rem',
          height: '2.25rem',
          p: 0,
          transition: "border-color 0.28s ease, box-shadow 0.28s ease, transform 0.22s ease",
          boxShadow: darkMode
            ? "0 2px 14px rgba(91, 30, 140, 0.35), 0 0 0 1px rgba(236, 72, 153, 0.14)"
            : "0 2px 12px rgba(236, 72, 153, 0.16)",
          "&:hover": {
            borderColor: "rgba(236, 72, 153, 0.62)",
            boxShadow: darkMode
              ? "0 4px 18px rgba(91, 30, 140, 0.42), 0 0 0 1px rgba(236, 72, 153, 0.24)"
              : "0 4px 16px rgba(236, 72, 153, 0.24)",
            transform: "translateY(-1px)",
          },
          "&.Mui-focusVisible": {
            outline: `2px solid ${SHENA_PINK}`,
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
            minWidth: '2.25rem',
            background: darkMode
              ? SHENA_PINK_GRADIENT
              : "linear-gradient(180deg, rgba(252, 231, 243, 0.75) 0%, #fff9fd 100%)",
            transition: "background 0.28s ease, background-color 0.28s ease",
          }}
        >
          <BedtimeOutlinedIcon
            sx={{
              fontSize: '1.125rem',
              width: '1.125rem',
              height: '1.125rem',
              flexShrink: 0,
              color: darkMode ? "#ffffff" : SHENA_PURPLE,
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
            minWidth: '2.25rem',
            background: darkMode
              ? "linear-gradient(180deg, #241536 0%, #120a1c 100%)"
              : SHENA_PINK_GRADIENT,
            transition: "background 0.28s ease, background-color 0.28s ease",
          }}
        >
          <WbSunnyOutlinedIcon
            sx={{
              fontSize: '1.125rem',
              width: '1.125rem',
              height: '1.125rem',
              flexShrink: 0,
              color: darkMode ? "#fbcfe8" : "#ffffff",
              opacity: 1,
              transition: "color 0.28s ease, opacity 0.28s ease",
              display: "block",
            }}
          />
        </Box>
      </ButtonBase>
    </Box>
  );
}
