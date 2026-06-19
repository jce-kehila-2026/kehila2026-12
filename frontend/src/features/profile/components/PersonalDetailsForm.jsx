import { useEffect, useMemo, useState } from "react";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { he as dateFnsHe } from "date-fns/locale/he";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import {
  Box,
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
import useCommunityProfile from "../../participant/community/hooks/useCommunityProfile";
import { WELLNESS, WELLNESS_DARK } from "../../appointments/appointmentTypeMeta";

const defaultT = (key) => key;

const PROFILE_DARK_FIELD = {
  bg: "#172033",
  border: "rgba(236, 72, 153, 0.22)",
  borderHover: "rgba(196, 165, 245, 0.45)",
};

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

function splitFullName(fullName) {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function combineFullName(firstName, lastName) {
  return [firstName, lastName]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(" ");
}

function validatePersonalDetailsForm(formData, t) {
  const errors = {};

  const fullName = combineFullName(formData.firstName, formData.lastName);
  if (!fullName) errors.firstName = t("validationFullNameRequired");

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

function profileToFormSnapshot(profile) {
  const p = profile || {};
  const { firstName, lastName } = splitFullName(p.fullName);
  return {
    firstName,
    lastName,
    phoneNumber: p.phoneNumber || "",
    email: p.email || "",
    streetAddress: p.streetAddress || "",
    city: p.city || "",
    birthDate: normalizeBirthDateFromFirestore(p.birthDate),
    preferredContactMethod: p.preferredContactMethod || "email",
  };
}

function PersonalDetailsForm({
  participantId,
  profile,
  onProfileUpdated,
  darkMode = false,
  t = defaultT,
  /** Applied locale only: translations, dir, phone/date/menu formatting. */
  locale = "en",
  variant = "default",
}) {
  const [formData, setFormData] = useState(profile || {});
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const p = profile || {};
    const { firstName, lastName } = splitFullName(p.fullName);
    setFormData({
      ...p,
      firstName,
      lastName,
      birthDate: normalizeBirthDateFromFirestore(p.birthDate),
    });
  }, [profile]);

  const savedSnapshot = useMemo(() => profileToFormSnapshot(profile), [profile]);

  const { showBirthdayInCommunity, handleBirthdayVisibilityChange } = useCommunityProfile({
    personalDetails: {
      id: participantId,
      ...profile,
    },
    onProfileSync: (patch) => {
      onProfileUpdated?.({ ...(profile || {}), ...patch });
    },
  });

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(profileToFormSnapshot(formData)) !== JSON.stringify(savedSnapshot),
    [formData, savedSnapshot]
  );

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
    if (name === "firstName" || name === "lastName") {
      clearFieldError("firstName");
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
      dataToSave.fullName = combineFullName(dataToSave.firstName, dataToSave.lastName);
      delete dataToSave.firstName;
      delete dataToSave.lastName;
      const bd = birthDateFormValueToDate(dataToSave.birthDate);
      dataToSave.birthDate = bd ? formatDateToYyyyMmDd(bd) : "";
      await updateParticipantData(participantId, dataToSave);
      onProfileUpdated(dataToSave);
    } finally {
      setSaving(false);
    }
  };

  const embedded = variant === "embedded";
  const inputHeight = embedded ? 54 : 58;
  const inputFontSize = embedded ? 15 : 17;
  const inputRadius = embedded ? "12px" : "14px";
  const gridSpacing = embedded ? 3 : 3;
  const fieldBorderColor = embedded
    ? darkMode
      ? PROFILE_DARK_FIELD.border
      : "rgba(219, 79, 159, 0.14)"
    : darkMode
      ? PROFILE_DARK_FIELD.border
      : "rgba(181, 123, 232, 0.22)";
  const fieldBorderHover = embedded
    ? darkMode
      ? PROFILE_DARK_FIELD.borderHover
      : "rgba(219, 79, 159, 0.24)"
    : darkMode
      ? PROFILE_DARK_FIELD.borderHover
      : "rgba(181, 123, 232, 0.45)";
  const fieldBg = darkMode ? PROFILE_DARK_FIELD.bg : embedded ? "#fffafb" : "#ffffff";
  const fieldTextColor = darkMode ? "#f8fafc" : WELLNESS.text;
  const fieldDisabledTextColor = darkMode ? "#cbd5e1" : undefined;
  const iconColor = darkMode ? WELLNESS_DARK.primary : embedded ? "#db4f9f" : WELLNESS.primary;
  const errorBorderColor = "#ef4444";
  const focusBorderColor = embedded && !darkMode ? "#db4f9f" : iconColor;
  const focusRingShadow =
    embedded && !darkMode
      ? "0 0 0 3px rgba(219, 79, 159, 0.18)"
      : darkMode
        ? WELLNESS_DARK.focusRing
        : WELLNESS.focusRing;
  const fieldTransition = "box-shadow 0.2s ease, border-color 0.2s ease";

  const fieldSx = useMemo(() => {
    const outlinedRootBase = {
      borderRadius: inputRadius,
      backgroundColor: fieldBg,
      height: inputHeight,
      paddingRight: "8px",
      transition: fieldTransition,
    };

    const outlinedBorderBase = {
      borderColor: fieldBorderColor,
      borderWidth: "1px",
    };

    const outlinedHoverBorder = {
      borderColor: fieldBorderHover,
    };

    const outlinedFocusStyles = {
      "&.Mui-focused:not(.Mui-error)": {
        boxShadow: focusRingShadow,
      },
      "&.Mui-focused:not(.Mui-error) fieldset": {
        borderColor: focusBorderColor,
        borderWidth: "1.5px",
      },
      "&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
        borderColor: `${focusBorderColor} !important`,
        borderWidth: "1.5px !important",
      },
    };

    const outlinedErrorStyles = {
      "&.Mui-error fieldset": {
        borderColor: errorBorderColor,
      },
      "&.Mui-error .MuiOutlinedInput-notchedOutline": {
        borderColor: `${errorBorderColor} !important`,
      },
    };

    const pickerFocusStyles = {
      "&.MuiPickersInputBase-focused:not(.MuiPickersInputBase-error) .MuiPickersOutlinedInput-notchedOutline":
        {
          borderColor: `${focusBorderColor} !important`,
          borderWidth: "1.5px !important",
        },
      "&.Mui-focused:not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline, &.Mui-focused:not(.Mui-error) fieldset":
        {
          borderColor: `${focusBorderColor} !important`,
          borderWidth: "1.5px !important",
        },
      "&.MuiPickersInputBase-colorPrimary.MuiPickersInputBase-focused:not(.MuiPickersInputBase-error) .MuiPickersOutlinedInput-notchedOutline":
        {
          borderColor: `${focusBorderColor} !important`,
          borderWidth: "1.5px !important",
        },
    };

    const pickerErrorStyles = {
      "&.MuiPickersInputBase-error .MuiPickersOutlinedInput-notchedOutline": {
        borderColor: `${errorBorderColor} !important`,
      },
    };

    return {
      "& .MuiOutlinedInput-root": {
        ...outlinedRootBase,
        "& fieldset": outlinedBorderBase,
        "& .MuiOutlinedInput-notchedOutline": outlinedBorderBase,
        "&:hover fieldset": outlinedHoverBorder,
        "&:hover .MuiOutlinedInput-notchedOutline": outlinedHoverBorder,
        ...outlinedFocusStyles,
        ...outlinedErrorStyles,
        "& .MuiSelect-icon": {
          color: iconColor,
        },
        "&.Mui-disabled .MuiSelect-icon": {
          color: fieldDisabledTextColor,
          opacity: 1,
        },
      },

      "& .MuiPickersOutlinedInput-root": {
        ...outlinedRootBase,
        "& .MuiPickersOutlinedInput-notchedOutline": outlinedBorderBase,
        "&:hover .MuiPickersOutlinedInput-notchedOutline": outlinedHoverBorder,
        ...pickerFocusStyles,
        ...pickerErrorStyles,
      },

      "& .MuiOutlinedInput-input, & .MuiSelect-select": {
        fontSize: inputFontSize,
        color: fieldTextColor,
        WebkitTextFillColor: darkMode ? fieldTextColor : undefined,
        paddingRight: "8px",
        outline: "none",
      },

      "& .MuiOutlinedInput-input:focus, & .MuiSelect-select:focus, & .MuiPickersInputBase-input:focus, & .MuiPickersSectionList-root:focus-within":
        {
          outline: "none",
        },

      "& .MuiSelect-select:focus": {
        backgroundColor: "transparent",
      },

      "& .MuiOutlinedInput-input.Mui-disabled, & .Mui-disabled .MuiSelect-select": {
        color: fieldDisabledTextColor,
        WebkitTextFillColor: fieldDisabledTextColor,
        opacity: 1,
      },

      "& .MuiOutlinedInput-root.Mui-disabled, & .MuiPickersOutlinedInput-root.Mui-disabled": {
        opacity: 1,
      },

      "& .MuiOutlinedInput-root.Mui-disabled fieldset, & .MuiPickersOutlinedInput-root.Mui-disabled .MuiPickersOutlinedInput-notchedOutline":
        {
          borderColor: darkMode ? PROFILE_DARK_FIELD.border : undefined,
        },

      "& .MuiPickersSectionList-sectionContent": {
        color: fieldTextColor,
        WebkitTextFillColor: darkMode ? fieldTextColor : undefined,
        fontSize: inputFontSize,
      },

      "& .Mui-disabled .MuiPickersSectionList-sectionContent": {
        color: fieldDisabledTextColor,
        WebkitTextFillColor: fieldDisabledTextColor,
        opacity: 1,
      },
    };
  }, [
    darkMode,
    embedded,
    fieldBg,
    fieldBorderColor,
    fieldBorderHover,
    fieldDisabledTextColor,
    fieldTextColor,
    focusBorderColor,
    focusRingShadow,
    iconColor,
    inputFontSize,
    inputHeight,
    inputRadius,
  ]);

  const datePickerRootSx = useMemo(
    () => ({
      borderRadius: inputRadius,
      backgroundColor: fieldBg,
      height: inputHeight,
      paddingRight: "8px",
      transition: fieldTransition,
      overflow: "visible",
      position: "relative",
      "&.MuiPickersInputBase-focused:not(.MuiPickersInputBase-error), &.Mui-focused:not(.Mui-error)": {
        boxShadow: "none",
      },
      "&.MuiPickersInputBase-focused:not(.MuiPickersInputBase-error) .MuiPickersOutlinedInput-notchedOutline, &.Mui-focused:not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline, &.MuiPickersInputBase-focused:not(.MuiPickersInputBase-error) fieldset, &.Mui-focused:not(.Mui-error) fieldset":
        {
          borderColor: `${focusBorderColor} !important`,
          borderWidth: "1.5px !important",
        },
      "&.MuiPickersInputBase-colorPrimary.MuiPickersInputBase-focused:not(.MuiPickersInputBase-error) .MuiPickersOutlinedInput-notchedOutline":
        {
          borderColor: `${focusBorderColor} !important`,
          borderWidth: "1.5px !important",
        },
      "& .MuiPickersSectionList-root:focus-within, & .MuiPickersInputBase-input:focus": {
        outline: "none !important",
      },
    }),
    [
      fieldBg,
      focusBorderColor,
      inputHeight,
      inputRadius,
      fieldTransition,
    ]
  );

  const datePickerFieldSx = useMemo(
    () => ({
      ...fieldSx,
      overflow: "visible",
      borderRadius: inputRadius,
      transition: fieldTransition,
      "&:focus-within:not(.Mui-error):not(.MuiPickersTextField-error)": {
        borderRadius: inputRadius,
        boxShadow: `${focusRingShadow} !important`,
      },
      "&.MuiPickersTextField-focused:not(.MuiPickersTextField-error)": {
        borderRadius: inputRadius,
        boxShadow: `${focusRingShadow} !important`,
      },
      "& .MuiPickersOutlinedInput-root": {
        ...fieldSx["& .MuiPickersOutlinedInput-root"],
        overflow: "visible",
        boxShadow: "none !important",
        "&.MuiPickersInputBase-focused:not(.MuiPickersInputBase-error), &.Mui-focused:not(.Mui-error)":
          {
            boxShadow: "none !important",
          },
      },
    }),
    [fieldSx, focusRingShadow, inputRadius, fieldTransition]
  );

  const phoneHasError = Boolean(fieldErrors.phoneNumber);

  const phoneBorder = phoneHasError ? errorBorderColor : fieldBorderColor;
  const phoneBorderWidth = phoneHasError ? "1.5px" : "1px";

  const phoneInputStyle = useMemo(
    () => ({
      width: "100%",
      height: `${inputHeight}px`,
      borderRadius: inputRadius,
      fontSize: `${inputFontSize}px`,
      border: `${phoneBorderWidth} solid ${phoneBorder}`,
      backgroundColor: fieldBg,
      color: fieldTextColor,
      direction: "ltr",
      textAlign: "left",
      unicodeBidi: "plaintext",
      paddingLeft: "52px",
      paddingRight: "12px",
      outline: "none",
      transition: fieldTransition,
    }),
    [
      fieldBg,
      fieldTextColor,
      inputFontSize,
      inputHeight,
      inputRadius,
      phoneBorder,
      phoneBorderWidth,
    ]
  );

  const phoneButtonStyle = useMemo(
    () => ({
      borderTopLeftRadius: inputRadius,
      borderBottomLeftRadius: inputRadius,
      border: `${phoneBorderWidth} solid ${phoneBorder}`,
      backgroundColor: fieldBg,
    }),
    [fieldBg, inputRadius, phoneBorder, phoneBorderWidth]
  );

  const phoneFieldSx = useMemo(
    () => ({
      direction: "ltr",
      unicodeBidi: "isolate",
      "& .react-tel-input": {
        direction: "ltr",
        textAlign: "left",
      },
      "& .react-tel-input .flag-dropdown, & .react-tel-input .selected-flag": {
        pointerEvents: "auto",
        backgroundColor: `${fieldBg} !important`,
      },
      "& .react-tel-input .flag-dropdown": {
        zIndex: 3,
        borderColor: `${phoneBorder} !important`,
        borderRight: `${phoneBorderWidth} solid ${phoneBorder} !important`,
      },
      "& .react-tel-input .form-control": {
        direction: "ltr",
        textAlign: "left",
        unicodeBidi: "plaintext",
        borderColor: `${phoneBorder} !important`,
        borderWidth: `${phoneBorderWidth} !important`,
        backgroundColor: `${fieldBg} !important`,
        color: `${fieldTextColor} !important`,
        outline: "none !important",
        transition: fieldTransition,
      },
      "& .react-tel-input .form-control:hover": {
        borderColor: `${phoneHasError ? errorBorderColor : fieldBorderHover} !important`,
      },
      "& .react-tel-input .form-control:focus": {
        outline: "none !important",
        borderColor: `${phoneHasError ? errorBorderColor : focusBorderColor} !important`,
        borderWidth: "1.5px !important",
        boxShadow: phoneHasError ? "none !important" : `${focusRingShadow} !important`,
      },
      "& .react-tel-input .country-list": {
        direction: "ltr",
        textAlign: "left",
        backgroundColor: `${fieldBg} !important`,
        color: `${fieldTextColor} !important`,
        border: `${phoneBorderWidth} solid ${fieldBorderColor} !important`,
      },
      "& .react-tel-input .country-list .country": {
        color: `${fieldTextColor} !important`,
      },
      "& .react-tel-input .country-list .country:hover": {
        backgroundColor: darkMode
          ? "rgba(196, 165, 245, 0.12) !important"
          : embedded
            ? "rgba(219, 79, 159, 0.08) !important"
            : "rgba(181, 123, 232, 0.1) !important",
      },
      "& .react-tel-input .country-list .country.highlight": {
        backgroundColor: darkMode
          ? "rgba(196, 165, 245, 0.2) !important"
          : embedded
            ? "rgba(219, 79, 159, 0.12) !important"
            : "rgba(181, 123, 232, 0.16) !important",
      },
    }),
    [
      darkMode,
      embedded,
      fieldBg,
      fieldBorderColor,
      fieldBorderHover,
      fieldTextColor,
      focusBorderColor,
      focusRingShadow,
      phoneBorder,
      phoneBorderWidth,
      phoneHasError,
    ]
  );

  const pickerButtonSx = useMemo(
    () => ({
      color: iconColor,
      opacity: 1,
      "&:hover": {
        backgroundColor: darkMode
          ? "rgba(196, 165, 245, 0.12)"
          : embedded
            ? "rgba(219, 79, 159, 0.08)"
            : "rgba(181, 123, 232, 0.1)",
        color: iconColor,
      },
      "&.Mui-focused": {
        color: iconColor,
      },
      "&.Mui-disabled": {
        color: fieldDisabledTextColor,
        opacity: 1,
      },
    }),
    [darkMode, embedded, fieldDisabledTextColor, iconColor]
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

  const menuPaperSx = useMemo(
    () => ({
      direction: "ltr",
      textAlign: "left",
      ...(darkMode
        ? {
            bgcolor: "#1e293b",
            color: WELLNESS_DARK.text,
            border: "1px solid rgba(196, 165, 245, 0.25)",
            borderRadius: "14px",
            boxShadow: WELLNESS_DARK.shadowCard,
            "& .MuiMenuItem-root": {
              color: "#e2e8f0",
              justifyContent: "flex-start",
              textAlign: "left",
              direction: "ltr",
              paddingLeft: "16px",
              paddingRight: "16px",
            },
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
              justifyContent: "flex-start",
              textAlign: "left",
              direction: "ltr",
              paddingLeft: "16px",
              paddingRight: "16px",
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
    [darkMode]
  );

  const contactSelectSx = useMemo(
    () => ({
      ...fieldSx,
      direction: "ltr",
      unicodeBidi: "isolate",
      "& .MuiOutlinedInput-root": {
        ...fieldSx["& .MuiOutlinedInput-root"],
        direction: "ltr",
        "& .MuiSelect-icon": {
          ...fieldSx["& .MuiOutlinedInput-root"]["& .MuiSelect-icon"],
          right: 12,
          left: "auto !important",
        },
      },
      "& .MuiOutlinedInput-input, & .MuiSelect-select": {
        ...fieldSx["& .MuiOutlinedInput-input, & .MuiSelect-select"],
        textAlign: "left",
        direction: "ltr",
        paddingLeft: embedded ? "16px" : "18px",
        paddingRight: "36px !important",
      },
    }),
    [embedded, fieldSx]
  );

  const FieldLabel = ({ children }) => (
    <Typography
      sx={{
        mb: embedded ? 0.6 : 0.8,
        color: labelMuted,
        fontSize: embedded ? 13 : 14,
        fontWeight: embedded ? 600 : 500,
      }}
    >
      {children}
    </Typography>
  );

  const formBody = (
    <Stack
      className={embedded ? "profile-settings-form" : undefined}
      component="form"
      spacing={embedded ? 2.5 : 3.2}
      onSubmit={handleSave}
    >
      {!embedded ? (
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
      ) : null}

      <Grid container spacing={gridSpacing}>
        <Grid item xs={12} md={6}>
          <FieldLabel>{t("firstName")}</FieldLabel>
          <TextField
            fullWidth
            name="firstName"
            value={formData.firstName || ""}
            onChange={handleChange}
            sx={fieldSx}
            error={Boolean(fieldErrors.firstName)}
            helperText={fieldErrors.firstName || undefined}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FieldLabel>{t("lastName")}</FieldLabel>
          <TextField
            fullWidth
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleChange}
            sx={fieldSx}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FieldLabel>{t("phoneNumber")}</FieldLabel>

          <Box dir="ltr" lang="en" sx={phoneFieldSx}>
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
              disabled={false}
            />
          </Box>
          {fieldErrors.phoneNumber ? (
            <FormHelperText error sx={{ mx: 0, mt: 0.5 }}>
              {fieldErrors.phoneNumber}
            </FormHelperText>
          ) : null}
        </Grid>

        <Grid item xs={12} md={6}>
          <FieldLabel>{t("emailAddress")}</FieldLabel>
          <TextField
            fullWidth
            name="email"
            value={formData.email}
            onChange={handleChange}
            sx={fieldSx}
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
            error={Boolean(fieldErrors.city)}
            helperText={fieldErrors.city || undefined}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FieldLabel>{t("birthDate")}</FieldLabel>

          <Box className="profile-settings-form__date-field">
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
                    sx: pickerButtonSx,
                  },
                  textField: {
                    fullWidth: true,
                    error: Boolean(fieldErrors.birthDate),
                    helperText: fieldErrors.birthDate || undefined,
                    sx: datePickerFieldSx,
                    slotProps: {
                      input: {
                        slotProps: {
                          root: {
                            sx: datePickerRootSx,
                          },
                        },
                      },
                    },
                  },
                }}
                disabled={false}
              />
            </LocalizationProvider>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <FieldLabel>{t("preferredContactMethod")}</FieldLabel>
          <TextField
            fullWidth
            select
            className="profile-settings-form__contact-select"
            name="preferredContactMethod"
            value={formData.preferredContactMethod || "email"}
            onChange={handleChange}
            sx={contactSelectSx}
            MenuProps={{
              PaperProps: {
                className: "profile-settings-form__contact-menu",
                sx: menuPaperSx,
              },
              MenuListProps: {
                sx: {
                  direction: "ltr",
                  textAlign: "left",
                },
              },
            }}
            error={Boolean(fieldErrors.preferredContactMethod)}
            helperText={fieldErrors.preferredContactMethod || undefined}
          >
            {contactOptions.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                sx={{
                  justifyContent: "flex-start",
                  textAlign: "left",
                  direction: "ltr",
                  pl: "16px",
                  pr: "16px",
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {hasUnsavedChanges ? (
        <Box
          className="profile-settings-form__save-row"
          display="flex"
          justifyContent="flex-end"
        >
          <button
            type="submit"
            className="ps-btn ps-btn--soft"
            disabled={saving}
          >
            {saving ? t("saving") : t("saveChanges")}
          </button>
        </Box>
      ) : null}

      <Box className={embedded ? "profile-settings-form__pref-row" : undefined} sx={{ mt: embedded ? 0 : 2 }}>
        <div className="profile-settings__setting-row">
          <div className="profile-settings__setting-copy">
            <span className="profile-settings__setting-icon" aria-hidden="true">
              <CakeOutlinedIcon />
            </span>
            <div>
              <p className="profile-settings__setting-title">{t("showBirthdayTitle")}</p>
              <p className="profile-settings__setting-desc">{t("showBirthdayDescription")}</p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={showBirthdayInCommunity}
            aria-label={t("showBirthdayTitle")}
            className={`profile-settings__toggle${showBirthdayInCommunity ? " is-on" : ""}`}
            onClick={() => handleBirthdayVisibilityChange(!showBirthdayInCommunity)}
          >
            <span />
          </button>
        </div>
      </Box>
    </Stack>
  );

  if (embedded) {
    return formBody;
  }

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
      <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>{formBody}</CardContent>
    </Card>
  );
}

export default PersonalDetailsForm;
