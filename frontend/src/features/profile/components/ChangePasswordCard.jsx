import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../../firebase";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { WELLNESS, WELLNESS_DARK } from "../../appointments/appointmentTypeMeta";

function ChangePasswordCard({ darkMode = false, t = (k) => k }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [savingPassword, setSavingPassword] = useState(false);
const handlePasswordChange = async () => {
  try {
    setSavingPassword(true);

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const user = auth.currentUser;

    if (!user || !user.email) {
      alert("No authenticated user found");
      return;
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPassword);

    alert("Password updated successfully");

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (error) {
    console.error(error);

    alert(error.message);
  } finally {
    setSavingPassword(false);
  }
};

  const cardSx = darkMode
    ? {
        borderRadius: WELLNESS.radiusLg,
        border: "1px solid rgba(196, 165, 245, 0.22)",
        backgroundColor: WELLNESS_DARK.card,
        boxShadow: WELLNESS_DARK.shadowCard,
      }
    : {
        borderRadius: WELLNESS.radiusLg,
        border: "1px solid rgba(181, 123, 232, 0.14)",
        backgroundColor: WELLNESS.card,
        boxShadow: WELLNESS.shadowCard,
      };

  const inputRootBase = {
    borderRadius: "18px",
    height: 58,
    paddingRight: "14px",
    display: "flex",
    alignItems: "center",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    "& .MuiInputAdornment-root": {
      margin: 0,
      marginLeft: 4,
      paddingRight: 4,
      height: "100%",
      maxHeight: "none",
      display: "flex",
      alignItems: "center",
      alignSelf: "stretch",
    },
  };

  const fieldSx = darkMode
    ? {
        "& .MuiOutlinedInput-root": {
          ...inputRootBase,
          backgroundColor: "#0f172a",
          "& fieldset": { borderColor: "rgba(148, 163, 184, 0.35)" },
          "&:hover fieldset": { borderColor: WELLNESS_DARK.primary },
          "&.Mui-focused fieldset": {
            borderColor: WELLNESS.primary,
            borderWidth: "1.5px",
          },
          "&.Mui-focused": { boxShadow: WELLNESS_DARK.focusRing },
        },
        "& .MuiOutlinedInput-input": {
          fontSize: 17,
          color: "#f1f5f9",
        },
      }
    : {
        "& .MuiOutlinedInput-root": {
          ...inputRootBase,
          backgroundColor: WELLNESS.card,
          "& fieldset": { borderColor: "rgba(181, 123, 232, 0.2)" },
          "&:hover fieldset": { borderColor: WELLNESS.primary },
          "&.Mui-focused fieldset": {
            borderColor: WELLNESS.primary,
            borderWidth: "1.5px",
          },
          "&.Mui-focused": { boxShadow: WELLNESS.focusRing },
        },
        "& .MuiOutlinedInput-input": {
          fontSize: 17,
          color: WELLNESS.text,
        },
      };

  const labelMuted = darkMode ? WELLNESS_DARK.muted : WELLNESS.muted;
  const titleColor = darkMode ? WELLNESS_DARK.text : WELLNESS.text;
  const subtitleColor = darkMode ? "#94a3b8" : WELLNESS.muted;

  const adornment = (visible, setVisible) => (
    <InputAdornment
      position="end"
      sx={{
        mr: 0,
        pr: 0.5,
        my: 0,
        height: "100%",
        maxHeight: "none",
        display: "flex",
        alignItems: "center",
      }}
    >
      <IconButton
        type="button"
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        onClick={() => setVisible((v) => !v)}
        size="small"
        sx={{
          color: darkMode ? "#d4c4f7" : "#9d5bd6",
          borderRadius: 2,
          p: "6px",
          mr: 0.25,
          transition: "background-color 0.2s ease, color 0.2s ease",
          "&:hover": {
            color: darkMode ? WELLNESS_DARK.primary : WELLNESS.primary,
            backgroundColor: darkMode
              ? "rgba(196, 165, 245, 0.12)"
              : "rgba(181, 123, 232, 0.1)",
          },
        }}
      >
        {visible ? (
          <VisibilityOffOutlinedIcon sx={{ fontSize: 20, display: "block" }} />
        ) : (
          <VisibilityOutlinedIcon sx={{ fontSize: 20, display: "block" }} />
        )}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Card elevation={0} sx={cardSx}>
      <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
        <Stack spacing={3.2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: titleColor, mb: 1 }}>
              {t("changePassword")}
            </Typography>
            <Typography sx={{ color: subtitleColor }}>
              {t("changePasswordSubtitle")}
            </Typography>
          </Box>

          <Stack spacing={3}>
            <Box>
              <Typography sx={{ mb: 0.8, color: labelMuted, fontSize: 14, fontWeight: 500 }}>
                {t("currentPassword")}
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                sx={fieldSx}
                slotProps={{
                  input: {
                    endAdornment: adornment(showCurrent, setShowCurrent),
                  },
                }}
              />
            </Box>
            <Box>
              <Typography sx={{ mb: 0.8, color: labelMuted, fontSize: 14, fontWeight: 500 }}>
                {t("newPassword")}
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={fieldSx}
                slotProps={{
                  input: {
                    endAdornment: adornment(showNew, setShowNew),
                  },
                }}
              />
            </Box>
            <Box>
              <Typography sx={{ mb: 0.8, color: labelMuted, fontSize: 14, fontWeight: 500 }}>
                {t("confirmNewPassword")}
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
onChange={(e) => setConfirmPassword(e.target.value)}
                sx={fieldSx}
                slotProps={{
                  input: {
                    endAdornment: adornment(showConfirm, setShowConfirm),
                  },
                }}
              />
            </Box>
          </Stack>

          <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <Button
              type="button"
              variant="contained"
              onClick={handlePasswordChange}
disabled={savingPassword}
              startIcon={<LockOutlinedIcon sx={{ fontSize: 20 }} />}
              sx={{
                width: "58%",
                maxWidth: 300,
                minWidth: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                textTransform: "none",
                borderRadius: "18px",
                py: 1.35,
                fontWeight: 800,
                fontSize: 16,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                color: "#fff",
                background: `linear-gradient(135deg, ${WELLNESS.primary} 0%, #e879c8 100%)`,
                boxShadow: "0 8px 22px rgba(181, 123, 232, 0.28)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #a66ee0 0%, #df6aad 100%)",
                  boxShadow: "0 10px 26px rgba(181, 123, 232, 0.36)",
                  transform: "translateY(-1px)",
                },
                "&:disabled": {
                  background: "linear-gradient(135deg, rgba(181,123,232,0.45) 0%, rgba(232,121,200,0.45) 100%)",
                  color: "rgba(255,255,255,0.85)",
                },
                "& .MuiButton-startIcon": {
                  marginRight: 0,
                  marginLeft: 0,
                },
              }}
            >
              {t("updatePassword")}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ChangePasswordCard;

