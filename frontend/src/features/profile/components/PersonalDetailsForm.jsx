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
  FormHelperText,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Timestamp } from "firebase/firestore";
import { updateParticipantData } from "../services/participantService";
import { WELLNESS, WELLNESS_DARK } from "../../appointments/appointmentTypeMeta";

const defaultT = (key) => key;

const CONTACT_METHOD_VALUES = ["email", "phone", "sms", "whatsapp"];
const LANGUAGE_VALUES = ["english", "hebrew"];

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

/** Local calendar date from YYYY-MM-DD (avoids UTC shift from `new Date("YYYY-MM-DD")`). */
function parseYyyyMmDdToLocalDate(str) {
  if (typeof str !== "string") return null;
  const trimmed = str.trim();
  if (!YYYY_MM_DD.test(trimmed)) return null;
  const [y, m, d] = trimmed.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
}

function formatDateToYyyyMmDd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/**
 * Firestore may return `birthDate` as a Timestamp, Date, plain { seconds, nanoseconds }, or string.
 * Form state uses `""` or a valid `YYYY-MM-DD` string for consistent display and saves.
 */
function normalizeBirthDateFromFirestore(raw) {
  if (raw == null || raw === "") return "";

  if (raw instanceof Timestamp) {
    return formatDateToYyyyMmDd(raw.toDate());
  }

  if (raw instanceof Date) {
    return formatDateToYyyyMmDd(raw);
  }

  if (typeof raw === "object" && typeof raw.seconds === "number") {
    const ms = raw.seconds * 1000 + (typeof raw.nanoseconds === "number" ? raw.nanoseconds / 1e6 : 0);
    return formatDateToYyyyMmDd(new Date(ms));
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (YYYY_MM_DD.test(trimmed) && parseYyyyMmDdToLocalDate(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateToYyyyMmDd(parsed);
    }
    return "";
  }

  return "";
}

function birthDateFormValueToDate(bd) {
  if (bd == null || bd === "") return null;
  if (bd instanceof Date) {
    return Number.isNaN(bd.getTime()) ? null : bd;
  }
  if (typeof bd === "string") {
    const fromStr = parseYyyyMmDdToLocalDate(bd);
    return fromStr;
  }
  return null;
}

function isValidBirthDateFormValue(bd) {
  return birthDateFormValueToDate(bd) != null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePersonalDetailsForm(formData, t) {
  const errors = {};

  const fullName = (formData.fullName || "").trim();
  if (!fullName) errors.fullName = t("validationFullNameRequired");

  const phoneDigits = (formData.phoneNumber || "").replace(/\D/g, "");
  if (!phoneDigits) errors.phoneNumber = t("validationPhoneRequired");
  else if (phoneDigits.length < 12) errors.phoneNumber = t("validationPhone");

  const email = (formData.email || "").trim();
  if (!email) errors.email = t("validationEmailRequired");
  else if (!isValidEmail(email)) errors.email = t("validationEmail");

  const city = (formData.city || "").trim();
  if (!city) errors.city = t("validationCityRequired");

  const streetAddress = (formData.streetAddress || "").trim();
  if (!streetAddress) errors.streetAddress = t("validationStreetAddressRequired");

  if (!isValidBirthDateFormValue(formData.birthDate)) {
    errors.birthDate = t("validationBirthDateRequired");
  }

  const pcm = formData.preferredContactMethod || "email";
  if (!CONTACT_METHOD_VALUES.includes(pcm)) {
    errors.preferredContactMethod = t("validationPreferredContactRequired");
  }

  const lang = formData.language || "english";
  if (!LANGUAGE_VALUES.includes(lang)) {
    errors.language = t("validationLanguageRequired");
  }

  return errors;
}

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
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const p = profile || {};
    setFormData({
      ...p,
      birthDate: normalizeBirthDateFromFirestore(p.birthDate),
    });
  }, [profile]);

  useEffect(() => {
    if (!isEditing) setFieldErrors({});
  }, [isEditing]);

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
    if (name === "language" && onLocaleChange) {
      onLocaleChange(value === "hebrew" ? "he" : "en");
    }
  };
  const handleSave = async (event) => {
    event.preventDefault();
    const errors = validatePersonalDetailsForm(formData, t);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSaving(true);

    try {
      const dataToSave = { ...formData };
      const bd = birthDateFormValueToDate(dataToSave.birthDate);
      dataToSave.birthDate = bd ? formatDateToYyyyMmDd(bd) : "";
      await updateParticipantData(participantId, dataToSave);
      onProfileUpdated(dataToSave);
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
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",

        "& fieldset": {
          borderColor: darkMode ? "#475569" : "rgba(181, 123, 232, 0.22)",
        },

        "&:hover fieldset": {
          borderColor: darkMode
            ? "rgba(196, 165, 245, 0.45)"
            : "rgba(181, 123, 232, 0.45)",
        },

        "&.Mui-focused": {
          boxShadow: darkMode ? WELLNESS_DARK.focusRing : WELLNESS.focusRing,
        },

        "&.Mui-focused fieldset": {
          borderColor: darkMode ? WELLNESS_DARK.primary : WELLNESS.primary,
        },

        "& .MuiSelect-icon": {
          color: darkMode ? WELLNESS_DARK.primary : "#9d5bd6",
        },
      },

      "& .MuiOutlinedInput-input": {
        fontSize: 17,
        color: darkMode ? "#f1f5f9" : WELLNESS.text,
        paddingRight: "8px",
      },
    }),
    [darkMode]
  );

  const labelMuted = darkMode ? WELLNESS_DARK.muted : WELLNESS.muted;
  const titleColor = darkMode ? WELLNESS_DARK.text : WELLNESS.text;
  const subtitleColor = darkMode ? WELLNESS_DARK.muted : WELLNESS.muted;

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
      ...(darkMode
        ? {
            bgcolor: "#1e293b",
            color: WELLNESS_DARK.text,
            border: "1px solid rgba(196, 165, 245, 0.25)",
            borderRadius: "14px",
            boxShadow: WELLNESS_DARK.shadowCard,
            "& .MuiMenuItem-root": { color: "#e2e8f0" },
            "& .MuiMenuItem-root:hover": {
              backgroundColor: "rgba(196, 165, 245, 0.12)",
            },
            "& .MuiMenuItem-root.Mui-selected": {
              backgroundColor: "rgba(196, 165, 245, 0.2)",
            },
          }
        : {
            bgcolor: "#ffffff",
            color: WELLNESS.text,
            border: "1px solid rgba(181, 123, 232, 0.22)",
            borderRadius: "14px",
            boxShadow: WELLNESS.shadowCard,
            mt: 0.5,
            "& .MuiMenuItem-root": {
              color: WELLNESS.text,
              fontSize: 16,
            },
            "& .MuiMenuItem-root:hover": {
              backgroundColor: "rgba(181, 123, 232, 0.08)",
            },
            "& .MuiMenuItem-root.Mui-selected": {
              backgroundColor: "rgba(181, 123, 232, 0.14)",
            },
            "& .MuiMenuItem-root.Mui-selected:hover": {
              backgroundColor: "rgba(181, 123, 232, 0.2)",
            },
          }),
    }),
    [locale, darkMode]
  );

  const phoneHasError = Boolean(fieldErrors.phoneNumber);

  const phoneInputStyle = useMemo(
    () => ({
      width: "100%",
      height: "58px",
      borderRadius: "14px",
      fontSize: "17px",
      border: phoneHasError
        ? "1.5px solid #ef4444"
        : darkMode
          ? "1px solid #475569"
          : "1px solid rgba(181, 123, 232, 0.22)",
      backgroundColor: darkMode ? "#0f172a" : "#ffffff",
      color: darkMode ? "#f1f5f9" : WELLNESS.text,
      direction: "ltr",
      textAlign: "left",
      unicodeBidi: "plaintext",
      paddingLeft: "52px",
      paddingRight: "12px",
    }),
    [darkMode, phoneHasError]
  );

  const phoneButtonStyle = useMemo(
    () => ({
      borderTopLeftRadius: "14px",
      borderBottomLeftRadius: "14px",
      border: phoneHasError
        ? "1.5px solid #ef4444"
        : darkMode
          ? "1px solid #475569"
          : "1px solid rgba(181, 123, 232, 0.22)",
      backgroundColor: darkMode ? "#1e293b" : "#ffffff",
    }),
    [darkMode, phoneHasError]
  );

  const dateFieldSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        backgroundColor: darkMode ? "#0f172a" : "#ffffff",
        height: 58,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",

        "& fieldset": {
          borderColor: darkMode ? "#475569" : "rgba(181, 123, 232, 0.22)",
        },

        "&:hover fieldset": {
          borderColor: darkMode
            ? "rgba(196, 165, 245, 0.45)"
            : "rgba(181, 123, 232, 0.45)",
        },

        "&.Mui-focused": {
          boxShadow: darkMode ? WELLNESS_DARK.focusRing : WELLNESS.focusRing,
        },

        "&.Mui-focused fieldset": {
          borderColor: darkMode ? WELLNESS_DARK.primary : WELLNESS.primary,
        },
      },

      "& input": {
        fontSize: 17,
        color: darkMode ? "#f1f5f9" : WELLNESS.text,
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
        borderRadius: WELLNESS.radiusLg,
        border: darkMode
          ? "1px solid rgba(196, 165, 245, 0.25)"
          : "1px solid rgba(181, 123, 232, 0.2)",
        backgroundColor: darkMode ? WELLNESS_DARK.card : WELLNESS.card,
        boxShadow: darkMode ? WELLNESS_DARK.shadowCard : WELLNESS.shadowCard,
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
                error={Boolean(fieldErrors.fullName)}
                helperText={fieldErrors.fullName || undefined}
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
                    borderColor: phoneHasError
                      ? "#ef4444 !important"
                      : darkMode
                        ? "#475569 !important"
                        : "rgba(181, 123, 232, 0.22) !important",
                    backgroundColor: darkMode
                      ? "#1e293b !important"
                      : "#ffffff !important",
                    borderRight: phoneHasError
                      ? "1.5px solid #ef4444 !important"
                      : darkMode
                        ? "1px solid #475569 !important"
                        : "1px solid rgba(181, 123, 232, 0.22) !important",
                  },
                  "& .react-tel-input .selected-flag": {
                    pointerEvents: "auto",
                    backgroundColor: darkMode
                      ? "#1e293b !important"
                      : "#ffffff !important",
                  },
                  "& .react-tel-input .form-control": {
                    direction: "ltr",
                    textAlign: "left",
                    unicodeBidi: "plaintext",
                    borderColor: phoneHasError
                      ? "#ef4444 !important"
                      : darkMode
                        ? "#475569 !important"
                        : "rgba(181, 123, 232, 0.22) !important",
                    borderWidth: phoneHasError ? "1.5px !important" : "1px !important",
                    backgroundColor: darkMode
                      ? "#0f172a !important"
                      : "#ffffff !important",
                    color: darkMode
                      ? "#f1f5f9 !important"
                      : `${WELLNESS.text} !important`,
                  },
                  "& .react-tel-input .country-list": {
                    direction: "ltr",
                    textAlign: "left",
                    backgroundColor: darkMode
                      ? "#0f172a !important"
                      : "#ffffff !important",
                    color: darkMode
                      ? "#f1f5f9 !important"
                      : `${WELLNESS.text} !important`,
                    borderColor: darkMode
                      ? "#475569 !important"
                      : "rgba(181, 123, 232, 0.22) !important",
                    border: darkMode
                      ? "1px solid #475569 !important"
                      : "1px solid rgba(181, 123, 232, 0.22) !important",
                  },
                  "& .react-tel-input .country-list .country": {
                    color: darkMode
                      ? "#f1f5f9 !important"
                      : `${WELLNESS.text} !important`,
                  },
                  "& .react-tel-input .country-list .country:hover": {
                    backgroundColor: darkMode
                      ? "rgba(196, 165, 245, 0.12) !important"
                      : "rgba(181, 123, 232, 0.1) !important",
                  },
                  "& .react-tel-input .country-list .country.highlight": {
                    backgroundColor: darkMode
                      ? "rgba(196, 165, 245, 0.2) !important"
                      : "rgba(181, 123, 232, 0.16) !important",
                  },
                }}
              >
                <PhoneInput
                  country={"il"}
                  value={formData.phoneNumber}
                  onChange={(phone) => {
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: phone,
                    }));
                    clearFieldError("phoneNumber");
                  }}
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
              {fieldErrors.phoneNumber ? (
                <FormHelperText error sx={{ mx: 0, mt: 0.5 }}>
                  {fieldErrors.phoneNumber}
                </FormHelperText>
              ) : null}
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
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email || undefined}
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
                error={Boolean(fieldErrors.streetAddress)}
                helperText={fieldErrors.streetAddress || undefined}
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
                error={Boolean(fieldErrors.city)}
                helperText={fieldErrors.city || undefined}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FieldLabel>{t("birthDate")}</FieldLabel>

              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={locale === "he" ? dateFnsHe : undefined}
              >
                <DatePicker
                  value={birthDateFormValueToDate(formData.birthDate)}
                  onChange={(newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      birthDate:
                        newValue == null || Number.isNaN(newValue?.getTime?.())
                          ? ""
                          : formatDateToYyyyMmDd(newValue),
                    }));
                    clearFieldError("birthDate");
                  }}
                  slots={{
                    openPickerIcon: CalendarMonthOutlinedIcon,
                  }}
                  slotProps={{
                    openPickerButton: {
                      sx: {
                        color: darkMode ? WELLNESS_DARK.primary : "#9d5bd6",
                        "&:hover": {
                          backgroundColor: darkMode
                            ? "rgba(196, 165, 245, 0.12)"
                            : "rgba(181, 123, 232, 0.1)",
                        },
                      },
                    },
                    textField: {
                      fullWidth: true,
                      error: Boolean(fieldErrors.birthDate),
                      helperText: fieldErrors.birthDate || undefined,
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
                error={Boolean(fieldErrors.preferredContactMethod)}
                helperText={fieldErrors.preferredContactMethod || undefined}
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
                error={Boolean(fieldErrors.language)}
                helperText={fieldErrors.language || undefined}
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
                  borderRadius: "18px",
                  px: 4,
                  py: 1.4,
                  fontWeight: 700,
                  fontSize: 16,
                  background: `linear-gradient(135deg, ${WELLNESS.primary} 0%, #e879c8 100%)`,
                  boxShadow: "0 8px 22px rgba(181, 123, 232, 0.28)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  color: "#ffffff",
                  "& .MuiButton-startIcon": {
                    color: "inherit",
                  },
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #a66ee0 0%, #df6aad 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 10px 26px rgba(181, 123, 232, 0.36)",
                  },
                  "&:disabled": {
                    color: "rgba(255,255,255,0.9)",
                    background:
                      "linear-gradient(135deg, #d4c4e8 0%, #e8b8d4 100%)",
                    boxShadow: "none",
                    transform: "none",
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
              startIcon={
                <LogoutOutlinedIcon sx={{ color: "inherit", fontSize: 20 }} />
              }
              onClick={onLogout}
              sx={{
                gap: 1,
                textTransform: "none",
                borderRadius: "18px",
                px: 2.5,
                py: 1,
                fontWeight: 600,
                fontSize: 15,
                color: "#6b4f9a",
                borderWidth: 1.5,
                borderColor: "rgba(181, 123, 232, 0.45)",
                backgroundColor: "#ffffff",
                transition:
                  "border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
                "& .MuiButton-startIcon": {
                  color: "inherit",
                },
                "&:hover": {
                  borderColor: WELLNESS.primary,
                  borderWidth: 1.5,
                  backgroundColor: "rgba(181, 123, 232, 0.06)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 14px rgba(181, 123, 232, 0.12)",
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
