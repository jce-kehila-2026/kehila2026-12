import { useEffect, useMemo, useState } from "react";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { he as dateFnsHe } from "date-fns/locale/he";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { updateParticipantData } from "../services/participantService";

const defaultT = (key) => key;

function PersonalDetailsForm({
  participantId,
  profile,
  onProfileUpdated,
  isEditing,
  onFinishEditing,
  onLogout,
  darkMode = false,
  t = defaultT,
  /** Applied locale only: translations, dir, phone/date/menu formatting (not the language dropdown). */
  locale = "en",
  onLocaleChange,
  onSaveLanguage,
}) {
  const [formData, setFormData] = useState(profile || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(profile || {});
  }, [profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "language" && onLocaleChange) {
      onLocaleChange(value === "hebrew" ? "he" : "en");
    }
  };
  const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

  const handleSave = async (event) => {
    event.preventDefault();
    if (!isValidEmail(formData.email || "")) {
      alert(t("validationEmail"));
      return;
    }
  const cleanPhone = formData.phoneNumber.replace(/\D/g, "");

if (cleanPhone.length < 12) {
  alert(t("validationPhone"));
  return;
}
    setSaving(true);

    try {
     await updateParticipantData(participantId, formData);
      onProfileUpdated(formData);
      onSaveLanguage?.();
      onFinishEditing();
    } finally {
      setSaving(false);
    }
  };

  const fieldSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        backgroundColor: darkMode ? "#0f172a" : "#ffffff",
        height: 58,
        paddingRight: "8px",

        "& fieldset": {
          borderColor: darkMode ? "#475569" : "#d9dee7",
        },

        "&:hover fieldset": {
          borderColor: "#f9a8d4",
        },

        "&.Mui-focused fieldset": {
          borderColor: "#ec4899",
        },
      },

      "& .MuiOutlinedInput-input": {
        fontSize: 17,
        color: darkMode ? "#f1f5f9" : "#111827",
        paddingRight: "8px",
      },
    }),
    [darkMode]
  );

  const labelMuted = darkMode ? "#cbd5e1" : "#4b5563";
  const titleColor = darkMode ? "#f8fafc" : "#111827";
  const subtitleColor = darkMode ? "#94a3b8" : "#6b7280";

  const contactOptions = useMemo(
    () => [
      { value: "email", label: t("contactEmail") },
      { value: "phone", label: t("contactPhone") },
      { value: "sms", label: t("contactSms") },
      { value: "whatsapp", label: t("contactWhatsapp") },
    ],
    [t]
  );

  const languageOptions = useMemo(
    () => [
      { value: "english", label: t("languageEnglish") },
      { value: "hebrew", label: t("languageHebrew") },
    ],
    [t]
  );

  const menuPaperSx = useMemo(
    () => ({
      direction: locale === "he" ? "rtl" : "ltr",
      textAlign: locale === "he" ? "right" : "left",
      ...(darkMode && {
        bgcolor: "#1e293b",
        color: "#f1f5f9",
        border: "1px solid #334155",
        "& .MuiMenuItem-root": { color: "#e2e8f0" },
      }),
    }),
    [locale, darkMode]
  );

  const phoneInputStyle = useMemo(
    () => ({
      width: "100%",
      height: "58px",
      borderRadius: "14px",
      fontSize: "17px",
      border: darkMode ? "1px solid #475569" : "1px solid #d9dee7",
      backgroundColor: darkMode ? "#0f172a" : "#ffffff",
      color: darkMode ? "#f1f5f9" : "#111827",
      direction: "ltr",
      textAlign: "left",
      unicodeBidi: "plaintext",
      paddingLeft: "52px",
      paddingRight: "12px",
    }),
    [darkMode]
  );

  const phoneButtonStyle = {
    borderTopLeftRadius: "14px",
    borderBottomLeftRadius: "14px",
    border: darkMode ? "1px solid #475569" : "1px solid #d9dee7",
    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
  };

  const dateFieldSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        backgroundColor: darkMode ? "#0f172a" : "#ffffff",
        height: 58,

        "& fieldset": {
          borderColor: darkMode ? "#475569" : "#d9dee7",
        },

        "&:hover fieldset": {
          borderColor: "#f9a8d4",
        },

        "&.Mui-focused fieldset": {
          borderColor: "#ec4899",
        },
      },

      "& input": {
        fontSize: 17,
        color: darkMode ? "#f1f5f9" : "#111827",
      },
    }),
    [darkMode]
  );

  const FieldLabel = ({ children }) => (
    <Typography
      sx={{
        mb: 0.8,
        color: labelMuted,
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {children}
    </Typography>
  );

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 6,
        border: darkMode ? "1px solid rgba(236, 72, 153, 0.25)" : "1px solid #f3d9e5",
        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
        boxShadow: darkMode
          ? "0 12px 30px rgba(0,0,0,0.35)"
          : "0 12px 30px rgba(236,72,153,0.08)",
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
        <Stack component="form" spacing={3.2} onSubmit={handleSave}>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: titleColor, mb: 1 }}
            >
              {t("personalDetails")}
            </Typography>

            <Typography sx={{ color: subtitleColor }}>
              {t("personalDetailsSubtitle")}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FieldLabel>{t("fullName")}</FieldLabel>
              <TextField
                fullWidth
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                sx={fieldSx}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FieldLabel>{t("phoneNumber")}</FieldLabel>

              <Box
                dir="ltr"
                lang="en"
                sx={{
                  direction: "ltr",
                  unicodeBidi: "isolate",
                  "& .react-tel-input": {
                    direction: "ltr",
                    textAlign: "left",
                  },
                  "& .react-tel-input .flag-dropdown": {
                    pointerEvents: "auto",
                    zIndex: 3,
                    ...(darkMode && {
                      backgroundColor: "#1e293b !important",
                      borderColor: "#475569 !important",
                      borderRight: "1px solid #475569 !important",
                    }),
                  },
                  "& .react-tel-input .selected-flag": {
                    pointerEvents: "auto",
                    ...(darkMode && {
                      backgroundColor: "#1e293b !important",
                    }),
                  },
                  "& .react-tel-input .form-control": {
                    direction: "ltr",
                    textAlign: "left",
                    unicodeBidi: "plaintext",
                    ...(darkMode && {
                      backgroundColor: "#0f172a !important",
                      color: "#f1f5f9 !important",
                      borderColor: "#475569 !important",
                      border: "1px solid #475569 !important",
                    }),
                  },
                  "& .react-tel-input .country-list": {
                    direction: "ltr",
                    textAlign: "left",
                    ...(darkMode && {
                      backgroundColor: "#0f172a !important",
                      color: "#f1f5f9 !important",
                      borderColor: "#475569 !important",
                      border: "1px solid #475569 !important",
                    }),
                  },
                  ...(darkMode && {
                    "& .react-tel-input .country-list .country": {
                      color: "#f1f5f9 !important",
                    },
                    "& .react-tel-input .country-list .country:hover": {
                      backgroundColor: "rgba(236, 72, 153, 0.12) !important",
                    },
                    "& .react-tel-input .country-list .country.highlight": {
                      backgroundColor: "rgba(236, 72, 153, 0.18) !important",
                    },
                  }),
                }}
              >
                <PhoneInput
                  country={"il"}
                  value={formData.phoneNumber}
                  onChange={(phone) =>
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: phone,
                    }))
                  }
                  specialLabel=""
                  containerStyle={{ direction: "ltr" }}
                  inputProps={{
                    dir: "ltr",
                    autoComplete: "tel",
                    style: { unicodeBidi: "plaintext" },
                  }}
                  inputStyle={phoneInputStyle}
                  buttonStyle={phoneButtonStyle}
                  dropdownStyle={{ direction: "ltr", textAlign: "left" }}
                  disabled={!isEditing}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <FieldLabel>{t("emailAddress")}</FieldLabel>
              <TextField
                fullWidth
                name="email"
                value={formData.email}
                onChange={handleChange}
                sx={fieldSx}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FieldLabel>{t("streetAddress")}</FieldLabel>
              <TextField
                fullWidth
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                sx={fieldSx}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FieldLabel>{t("city")}</FieldLabel>
              <TextField
                fullWidth
                name="city"
                value={formData.city}
                onChange={handleChange}
                sx={fieldSx}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
  <FieldLabel>{t("birthDate")}</FieldLabel>

  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={locale === "he" ? dateFnsHe : undefined}>
    <DatePicker
      value={formData.birthDate
    ? new Date(formData.birthDate)
    : new Date(1990, 4, 15)}
      onChange={(newValue) =>
        setFormData((prev) => ({
          ...prev,
          birthDate: newValue,
        }))
      }
      slots={{
        openPickerIcon: CalendarMonthOutlinedIcon,
      }}
      slotProps={{
        textField: {
          fullWidth: true,
          sx: dateFieldSx,
        },
      }}
      disabled={!isEditing}
    />
  </LocalizationProvider>
</Grid>

            <Grid item xs={12} md={6}>
              <FieldLabel>{t("preferredContactMethod")}</FieldLabel>
              <TextField
  fullWidth
  select
  name="preferredContactMethod"
  value={formData.preferredContactMethod || "email"}
  onChange={handleChange}
  sx={fieldSx}
  MenuProps={{
    PaperProps: {
      sx: menuPaperSx,
    },
  }}
  disabled={!isEditing}
>
              
                {contactOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <FieldLabel>{t("language")}</FieldLabel>
              <TextField
                fullWidth
                select
                name="language"
                value={formData.language || "english"}
                onChange={handleChange}
                sx={fieldSx}
                MenuProps={{
                  PaperProps: {
                    sx: menuPaperSx,
                  },
                }}
                disabled={!isEditing}
              >
                {languageOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {isEditing && (
  <Box display="flex" justifyContent="flex-end">
    <Button
      type="submit"
      variant="contained"
      disabled={saving}
      startIcon={<SaveOutlinedIcon />}
      sx={{
        textTransform: "none",
        borderRadius: 3,
        px: 4,
        py: 1.4,
        fontWeight: 700,
        fontSize: 16,
        background:
          "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        boxShadow: "0 8px 20px rgba(236,72,153,0.25)",
        "&:hover": {
          background:
            "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
        },
      }}
    >
      {saving ? t("saving") : t("saveChanges")}
    </Button>

    
  </Box>
)}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              pt: 1,
              pr: { xs: 0.2, md: 0.6 },
              pb: { xs: 0.5, md: 0.8 },
            }}
          >
            <Button
              type="button"
              variant="outlined"
              startIcon={<LogoutOutlinedIcon />}
              onClick={onLogout}
              sx={{
                gap: 1,
                textTransform: "none",
                borderRadius: 3,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                fontSize: 15,
                color: "#ec4899",
                borderColor: "#f5c2d9",
                backgroundColor: darkMode ? "rgba(236, 72, 153, 0.1)" : "#fff9fc",
                "&:hover": {
                  borderColor: "#ec4899",
                  backgroundColor: darkMode ? "rgba(236, 72, 153, 0.2)" : "#fff1f7",
                },
              }}
            >
              {t("logout")}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default PersonalDetailsForm;