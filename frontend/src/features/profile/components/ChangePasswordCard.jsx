import { useMemo, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../../firebase";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import {
  Box,
  Card,
  CardContent,
  Collapse,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { WELLNESS, WELLNESS_DARK } from "../../appointments/appointmentTypeMeta";

const WRONG_CURRENT_PASSWORD_CODES = new Set([
  "auth/wrong-password",
  "auth/invalid-credential",
  "auth/invalid-login-credentials",
]);

function isWrongCurrentPasswordError(error) {
  const code = error?.code;
  return typeof code === "string" && WRONG_CURRENT_PASSWORD_CODES.has(code);
}

function ChangePasswordCard({ darkMode = false, t = (k) => k, variant = "default" }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");

  const embedded = variant === "embedded";
  const inputHeight = embedded ? 52 : 58;
  const inputFontSize = embedded ? 15 : 17;
  const inputRadius = embedded ? "12px" : "18px";

  const showConfirmField = newPassword.length > 0;

  const samePasswordError = useMemo(() => {
    if (!currentPassword.trim() || !newPassword.trim()) return "";
    if (currentPassword.trim() === newPassword.trim()) {
      return t("newPasswordMustDiffer");
    }
    return "";
  }, [currentPassword, newPassword, t]);

  const mismatchError = useMemo(() => {
    if (!showConfirmField || !confirmPassword) return "";
    if (newPassword !== confirmPassword) return t("passwordsDoNotMatch");
    return "";
  }, [confirmPassword, newPassword, showConfirmField, t]);

  const canUpdatePassword =
    Boolean(currentPassword.trim()) &&
    Boolean(newPassword.trim()) &&
    Boolean(confirmPassword) &&
    newPassword === confirmPassword &&
    !samePasswordError &&
    !savingPassword;

  const isUpdatePasswordEnabled = Boolean(newPassword.trim()) && !savingPassword;

  const handlePasswordChange = async () => {
    try {
      setSavingPassword(true);

      if (!canUpdatePassword) {
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

      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      alert("Password updated successfully");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPasswordError("");
    } catch (error) {
      console.error(error);

      if (isWrongCurrentPasswordError(error)) {
        setCurrentPasswordError(t("currentPasswordIncorrect"));
        return;
      }

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

  const inputRootBase = useMemo(
    () => ({
      borderRadius: inputRadius,
      height: inputHeight,
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
    }),
    [inputHeight, inputRadius]
  );

  const fieldSx = useMemo(
    () =>
      darkMode
        ? {
            "& .MuiOutlinedInput-root": {
              ...inputRootBase,
              backgroundColor: embedded ? "#172033" : "#0f172a",
              "& fieldset": { borderColor: "rgba(148, 163, 184, 0.35)" },
              "&:hover fieldset": { borderColor: WELLNESS_DARK.primary },
              "&.Mui-focused fieldset": {
                borderColor: WELLNESS.primary,
                borderWidth: "1.5px",
              },
              "&.Mui-focused": { boxShadow: WELLNESS_DARK.focusRing },
            },
            "& .MuiOutlinedInput-input": {
              fontSize: inputFontSize,
              color: "#f1f5f9",
              "&::-ms-reveal": { display: "none" },
              "&::-ms-clear": { display: "none" },
            },
          }
        : {
            "& .MuiOutlinedInput-root": {
              ...inputRootBase,
              backgroundColor: embedded ? "#fffafb" : "#ffffff",
              "& fieldset": {
                borderColor: embedded ? "rgba(219, 79, 159, 0.14)" : "rgba(181, 123, 232, 0.22)",
              },
              "&:hover fieldset": {
                borderColor: embedded ? "rgba(219, 79, 159, 0.24)" : WELLNESS.primary,
              },
              "&.Mui-focused fieldset": {
                borderColor: embedded ? "#db4f9f" : WELLNESS.primary,
                borderWidth: "1.5px",
              },
              "&.Mui-focused": {
                boxShadow: embedded
                  ? "0 0 0 3px rgba(219, 79, 159, 0.18)"
                  : WELLNESS.focusRing,
              },
            },
            "& .MuiOutlinedInput-input": {
              fontSize: inputFontSize,
              color: WELLNESS.text,
              "&::-ms-reveal": { display: "none" },
              "&::-ms-clear": { display: "none" },
            },
          },
    [darkMode, embedded, inputFontSize, inputRootBase]
  );

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
          color: darkMode ? "#c4a5f5" : embedded ? "#db4f9f" : "#4b136b",
          borderRadius: 2,
          p: "6px",
          mr: 0.25,
          transition: "background-color 0.2s ease, color 0.2s ease",
          "&:hover": {
            color: darkMode ? "#e9d5ff" : embedded ? "#c83f91" : "#3f1059",
            backgroundColor: darkMode
              ? "rgba(196, 165, 245, 0.16)"
              : embedded
                ? "rgba(219, 79, 159, 0.08)"
                : "rgba(75, 19, 107, 0.08)",
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

  const formBody = (
    <Stack spacing={embedded ? 2.4 : 3.2}>
      {!embedded ? (
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: titleColor, mb: 1 }}>
            {t("changePassword")}
          </Typography>
          <Typography sx={{ color: subtitleColor }}>{t("changePasswordSubtitle")}</Typography>
        </Box>
      ) : null}

      <Stack spacing={embedded ? 2 : 3}>
        <Box>
          <Typography
            sx={{
              mb: embedded ? 0.6 : 0.8,
              color: labelMuted,
              fontSize: embedded ? 13 : 14,
              fontWeight: embedded ? 600 : 500,
            }}
          >
            {t("currentPassword")}
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (currentPasswordError) setCurrentPasswordError("");
            }}
            error={Boolean(currentPasswordError)}
            helperText={currentPasswordError || undefined}
            sx={fieldSx}
            slotProps={{
              input: {
                endAdornment: adornment(showCurrent, setShowCurrent),
              },
            }}
          />
        </Box>
        <Box>
          <Typography
            sx={{
              mb: embedded ? 0.6 : 0.8,
              color: labelMuted,
              fontSize: embedded ? 13 : 14,
              fontWeight: embedded ? 600 : 500,
            }}
          >
            {t("newPassword")}
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              const value = e.target.value;
              setNewPassword(value);
              if (!value) setConfirmPassword("");
            }}
            error={Boolean(samePasswordError)}
            helperText={samePasswordError || undefined}
            sx={fieldSx}
            slotProps={{
              input: {
                endAdornment: adornment(showNew, setShowNew),
              },
            }}
          />
        </Box>
        <Collapse in={showConfirmField} timeout={300} unmountOnExit>
          <Box>
            <Typography
              sx={{
                mb: embedded ? 0.6 : 0.8,
                color: labelMuted,
                fontSize: embedded ? 13 : 14,
                fontWeight: embedded ? 600 : 500,
              }}
            >
              {t("confirmNewPassword")}
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              type={showConfirm ? "text" : "password"}
              autoComplete="off"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean(mismatchError)}
              helperText={mismatchError || undefined}
              sx={fieldSx}
              slotProps={{
                input: {
                  endAdornment: adornment(showConfirm, setShowConfirm),
                },
              }}
            />
          </Box>
        </Collapse>
      </Stack>

      <Box
        className={embedded ? "profile-settings-form__save-row" : undefined}
        sx={{
          display: "flex",
          justifyContent: embedded ? "flex-start" : "center",
          width: "100%",
        }}
      >
        <button
          type="button"
          className="pd-btn pd-btn--view-cta pd-community__cta"
          onClick={handlePasswordChange}
          disabled={!isUpdatePasswordEnabled}
        >
          {t("updatePassword")}
        </button>
      </Box>
    </Stack>
  );

  if (embedded) {
    return formBody;
  }

  return (
    <Card elevation={0} sx={cardSx}>
      <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>{formBody}</CardContent>
    </Card>
  );
}

export default ChangePasswordCard;
