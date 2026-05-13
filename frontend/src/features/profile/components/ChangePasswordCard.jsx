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
        borderRadius: 6,
        border: "1px solid rgba(236, 72, 153, 0.25)",
        backgroundColor: "#1e293b",
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
      }
    : {
        borderRadius: 6,
        border: "1px solid #f3d9e5",
        backgroundColor: "#ffffff",
        boxShadow: "0 12px 30px rgba(236,72,153,0.08)",
      };

  const inputRootBase = {
    borderRadius: "14px",
    height: 58,
    paddingRight: "14px",
    display: "flex",
    alignItems: "center",
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
          "& fieldset": { borderColor: "#475569" },
          "&:hover fieldset": { borderColor: "#f9a8d4" },
          "&.Mui-focused fieldset": { borderColor: "#ec4899" },
        },
        "& .MuiOutlinedInput-input": {
          fontSize: 17,
          color: "#f1f5f9",
        },
      }
    : {
        "& .MuiOutlinedInput-root": {
          ...inputRootBase,
          backgroundColor: "#ffffff",
          "& fieldset": { borderColor: "#d9dee7" },
          "&:hover fieldset": { borderColor: "#f9a8d4" },
          "&.Mui-focused fieldset": { borderColor: "#ec4899" },
        },
        "& .MuiOutlinedInput-input": {
          fontSize: 17,
          color: "#111827",
        },
      };

  const labelMuted = darkMode ? "#cbd5e1" : "#4b5563";
  const titleColor = darkMode ? "#f8fafc" : "#111827";
  const subtitleColor = darkMode ? "#94a3b8" : "#6b7280";

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
          color: darkMode ? "#f9a8d4" : "#ec4899",
          borderRadius: 2,
          p: "6px",
          mr: 0.25,
          "&:hover": {
            backgroundColor: darkMode ? "rgba(236, 72, 153, 0.12)" : "rgba(236, 72, 153, 0.08)",
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
                borderRadius: 3,
                py: 1.4,
                fontWeight: 700,
                fontSize: 16,
                background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                boxShadow: "0 3px 12px rgba(236, 72, 153, 0.14)",
                "&:hover": {
                  background: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
                  boxShadow: "0 4px 14px rgba(236, 72, 153, 0.18)",
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
