import { useEffect, useMemo, useState } from "react";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputLabel,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { auth } from "../../../firebase";
import { WELLNESS } from "../appointmentTypeMeta";
import {
  checkDuplicateAppointment,
  createAppointment,
} from "../services/appointmentService";

/**
 * Default bookable times (every 15 min, 08:00–18:00). Override via `timeSlotOptions` prop when wiring availability.
 */
function buildDefaultTimeSlotStrings() {
  const out = [];
  for (let h = 8; h <= 18; h += 1) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 18 && m > 0) break;
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}

function providerDisplayName(p) {
  if (!p) return "";
  return p.name ?? "";
}

/**
 * Section 2 — book appointment (therapist, date, time, notes, CTA). Light wellness UI only.
 * @param {string | null} selectedAppointmentTypeKey — appointment type card key; filters therapists
 * @param {{ id: string, name: string, specialty?: string, availableTimes?: string[] }[]} providerOptions — therapists matching the selected type
 * @param {string[]} [timeSlotOptions] — optional HH:mm list; defaults to generated slots
 * @param {() => void | Promise<void>} [onBookingComplete] — refresh list after successful book
 */
function AppointmentBookingForm({
  selectedAppointmentTypeKey = null,
  providerOptions = [],
  timeSlotOptions,
  onBookingComplete,
} = {}) {
  const outerTheme = useTheme();
  const ltrTheme = useMemo(
    () =>
      createTheme({
        ...outerTheme,
        direction: "ltr",
      }),
    [outerTheme]
  );

  const [providerId, setProviderId] = useState("");
  const [date, setDate] = useState(() => new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showMessage = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    setProviderId((prev) => {
      if (!selectedAppointmentTypeKey) return "";
      if (!providerOptions.length) return "";
      if (prev && providerOptions.some((p) => p.id === prev)) return prev;
      return "";
    });
  }, [selectedAppointmentTypeKey, providerOptions]);

  useEffect(() => {
    setSelectedTime("");
  }, [providerId]);

  const therapistSelectDisabled =
    !selectedAppointmentTypeKey || providerOptions.length === 0;

  const selectedProvider = useMemo(
    () => providerOptions.find((p) => p.id === providerId),
    [providerOptions, providerId]
  );

  const slotOptions = useMemo(() => {
    if (!providerId) return [];
    const fromTherapist = selectedProvider?.availableTimes;
    if (Array.isArray(fromTherapist) && fromTherapist.length > 0) {
      return fromTherapist;
    }
    if (Array.isArray(timeSlotOptions) && timeSlotOptions.length > 0) {
      return timeSlotOptions;
    }
    return [];
  }, [providerId, selectedProvider, timeSlotOptions]);

  useEffect(() => {
    if (selectedTime && slotOptions.length > 0 && !slotOptions.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedTime, slotOptions]);

  const fieldSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        borderRadius: "18px",
        backgroundColor: WELLNESS.card,
        minHeight: 52,
        transition: "border-color 0.22s ease, box-shadow 0.22s ease",
        "& fieldset": {
          borderColor: "rgba(181, 123, 232, 0.2)",
        },
        "&:hover fieldset": { borderColor: WELLNESS.primary },
        "&.Mui-focused fieldset": { borderColor: WELLNESS.primary, borderWidth: "1.5px" },
        "&.Mui-focused": { boxShadow: WELLNESS.focusRing },
      },
      "& .MuiOutlinedInput-input": {
        py: 1.15,
        fontSize: 15,
        fontFamily: '"Poppins", "Inter", sans-serif',
        color: WELLNESS.text,
      },
    }),
    []
  );

  const dateFieldSx = useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        borderRadius: "18px",
        backgroundColor: WELLNESS.card,
        minHeight: 52,
        "& fieldset": {
          borderColor: "rgba(181, 123, 232, 0.2)",
        },
        "&:hover fieldset": { borderColor: WELLNESS.primary },
        "&.Mui-focused fieldset": { borderColor: WELLNESS.primary, borderWidth: "1.5px" },
        "&.Mui-focused": { boxShadow: WELLNESS.focusRing },
      },
      "& input": {
        fontSize: 15,
        fontFamily: '"Poppins", "Inter", sans-serif',
        color: WELLNESS.text,
      },
    }),
    []
  );

  const menuPaperSx = useMemo(
    () => ({
      borderRadius: "16px",
    }),
    []
  );

  const selectMenuPaperSx = useMemo(
    () => ({
      ...menuPaperSx,
      direction: "ltr",
      textAlign: "left",
      unicodeBidi: "plaintext",
      "& .MuiList-root": {
        direction: "ltr",
        textAlign: "left",
      },
      "& .MuiMenuItem-root": {
        direction: "ltr",
        textAlign: "left",
        justifyContent: "flex-start",
        fontFamily: '"Poppins", "Inter", sans-serif',
        paddingInlineStart: "16px !important",
        paddingInlineEnd: "16px !important",
      },
    }),
    [menuPaperSx]
  );

  const selectMenuProps = useMemo(
    () => ({
      disablePortal: false,
      anchorOrigin: { vertical: "bottom", horizontal: "left" },
      transformOrigin: { vertical: "top", horizontal: "left" },
      PaperProps: {
        dir: "ltr",
        sx: selectMenuPaperSx,
      },
      MenuListProps: {
        dir: "ltr",
        sx: {
          direction: "ltr",
          textAlign: "left",
        },
      },
    }),
    [selectMenuPaperSx]
  );

  const therapistFieldSx = useMemo(
    () => ({
      ...fieldSx,
      direction: "ltr",
      "& .MuiOutlinedInput-root": {
        ...fieldSx["& .MuiOutlinedInput-root"],
        direction: "ltr",
      },
      "& .MuiSelect-select": {
        textAlign: "left !important",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingLeft: "14px !important",
        paddingRight: "42px !important",
      },
      "& .MuiSelect-icon": {
        left: "auto !important",
        right: "12px !important",
      },
    }),
    [fieldSx]
  );

  const timeFieldLtrSx = useMemo(
    () => ({
      ...fieldSx,
      direction: "ltr",
      "& .MuiOutlinedInput-root": {
        ...fieldSx["& .MuiOutlinedInput-root"],
        direction: "ltr",
      },
      "& .MuiSelect-select": {
        textAlign: "left !important",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingLeft: "14px !important",
        paddingRight: "42px !important",
      },
      "& .MuiSelect-icon": {
        left: "auto !important",
        right: "12px !important",
      },
    }),
    [fieldSx]
  );

  const placeholderTypographySx = {
    color: "#9ca3af",
    fontFamily: '"Poppins", "Inter", sans-serif',
    textAlign: "left",
    width: "100%",
    direction: "ltr",
    unicodeBidi: "plaintext",
  };

  const notesSx = useMemo(
    () => ({
      ...fieldSx,
      "& .MuiOutlinedInput-root": {
        ...fieldSx["& .MuiOutlinedInput-root"],
        height: "auto",
        minHeight: { xs: 120, md: 140 },
        alignItems: "flex-start",
        paddingTop: "14px",
        paddingBottom: "14px",
        backgroundColor: "rgba(252, 228, 236, 0.35)",
        "& fieldset": {
          borderColor: "rgba(181, 123, 232, 0.18)",
        },
      },
    }),
    [fieldSx]
  );

  const labelSx = {
    fontFamily: '"Poppins", "Inter", sans-serif',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.02em",
    color: WELLNESS.muted,
    mb: 0.75,
    direction: "ltr",
    textAlign: "left",
  };

  const handleBook = async () => {
    if (!selectedAppointmentTypeKey) {
      showMessage("Please select an appointment type.", "error");
      return;
    }
    if (!providerId) {
      showMessage("Please select a therapist.", "error");
      return;
    }
    if (!date || Number.isNaN(date.getTime?.())) {
      showMessage("Please select a date.", "error");
      return;
    }
    if (!selectedTime) {
      showMessage("Please select a time.", "error");
      return;
    }
    if (!auth.currentUser) {
      showMessage("You must be signed in to book an appointment.", "error");
      return;
    }

    const therapist = providerOptions.find((p) => p.id === providerId);
    const therapistName = therapist?.name?.trim() || "";
    if (!therapistName) {
      showMessage("Please select a therapist.", "error");
      return;
    }

    const dateStr = format(date, "yyyy-MM-dd");

    setSaving(true);
    try {
      const isDuplicate = await checkDuplicateAppointment(
        dateStr,
        selectedTime,
        therapistName
      );
      if (isDuplicate) {
        showMessage("This appointment time is already booked.", "error");
        return;
      }

      await createAppointment({
        type: selectedAppointmentTypeKey,
        therapistName,
        date: dateStr,
        time: selectedTime,
        notes: notes.trim(),
        status: "confirmed",
      });

      setProviderId("");
      setDate(new Date());
      setSelectedTime("");
      setNotes("");
      showMessage("Your appointment was booked successfully.", "success");

      if (typeof onBookingComplete === "function") {
        await onBookingComplete();
      }
    } catch (err) {
      console.error(err);
      showMessage(
        err?.message || "Could not book appointment. Please try again.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemeProvider theme={ltrTheme}>
      <Box component="div" dir="ltr" lang="en" sx={{ direction: "ltr" }}>
    <Card
      elevation={0}
      sx={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
        borderRadius: WELLNESS.radiusLg,
        border: "1px solid rgba(181, 123, 232, 0.14)",
        backgroundColor: WELLNESS.card,
        boxShadow: WELLNESS.shadowCard,
        fontFamily: '"Poppins", "Inter", sans-serif',
        overflow: "visible",
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2.75, sm: 3.25 },
          "&:last-child": { pb: { xs: 2.75, sm: 3.25 } },
          overflow: "visible",
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Poppins", "Inter", sans-serif',
            fontWeight: 800,
            fontSize: { xs: "1.25rem", sm: "1.45rem" },
            letterSpacing: "-0.02em",
            color: WELLNESS.text,
            mb: 3,
          }}
        >
          2. Book Your Appointment
        </Typography>

        <Stack spacing={3}>
          <Box
            component="div"
            dir="ltr"
            lang="en"
            sx={{
              direction: "ltr",
              width: "100%",
              minWidth: 0,
              overflow: "visible",
            }}
          >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2.5, md: 2 }}
            alignItems={{ md: "flex-start" }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <InputLabel shrink={false} sx={labelSx}>
                Select Therapist
              </InputLabel>
              <TextField
                fullWidth
                select
                disabled={therapistSelectDisabled}
                value={therapistSelectDisabled ? "" : providerId}
                onChange={(e) => setProviderId(e.target.value)}
                sx={therapistFieldSx}
                SelectProps={{
                  inputProps: { dir: "ltr" },
                  displayEmpty: true,
                  renderValue: (v) => {
                    if (!selectedAppointmentTypeKey) {
                      return (
                        <Typography component="span" sx={placeholderTypographySx}>
                          Select an appointment type first
                        </Typography>
                      );
                    }
                    if (providerOptions.length === 0) {
                      return (
                        <Typography component="span" sx={placeholderTypographySx}>
                          No therapists available for this type
                        </Typography>
                      );
                    }
                    if (!v) {
                      return (
                        <Typography component="span" sx={placeholderTypographySx}>
                          Choose a therapist
                        </Typography>
                      );
                    }
                    const opt = providerOptions.find((p) => p.id === v);
                    const name = providerDisplayName(opt) || opt?.name || v;
                    return (
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: '"Poppins", "Inter", sans-serif',
                          color: WELLNESS.text,
                          textAlign: "left",
                          width: "100%",
                          direction: "ltr",
                          unicodeBidi: "plaintext",
                        }}
                      >
                        {name}
                      </Typography>
                    );
                  },
                  MenuProps: selectMenuProps,
                }}
              >
                <MenuItem value="" sx={{ direction: "ltr", textAlign: "left", justifyContent: "flex-start" }}>
                  <em>Choose a therapist</em>
                </MenuItem>
                {providerOptions.map((p) => (
                  <MenuItem
                    key={p.id}
                    value={p.id}
                    sx={{ direction: "ltr", textAlign: "left", justifyContent: "flex-start" }}
                  >
                    {providerDisplayName(p)}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <InputLabel shrink={false} sx={labelSx}>
                Select Date
              </InputLabel>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={date}
                  onChange={(v) => v && setDate(v)}
                  slots={{ openPickerIcon: CalendarMonthRoundedIcon }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: dateFieldSx,
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <InputLabel shrink={false} sx={labelSx}>
                Select Time
              </InputLabel>
              <TextField
                fullWidth
                select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                sx={timeFieldLtrSx}
                SelectProps={{
                  inputProps: { dir: "ltr" },
                  displayEmpty: true,
                  renderValue: (v) => {
                    if (!v) {
                      return (
                        <Typography component="span" sx={placeholderTypographySx}>
                          Choose a time
                        </Typography>
                      );
                    }
                    return (
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: '"Poppins", "Inter", sans-serif',
                          fontVariantNumeric: "tabular-nums",
                          textAlign: "left",
                          width: "100%",
                          color: WELLNESS.text,
                          direction: "ltr",
                          unicodeBidi: "plaintext",
                        }}
                      >
                        {v}
                      </Typography>
                    );
                  },
                  MenuProps: selectMenuProps,
                }}
              >
                <MenuItem value="" sx={{ direction: "ltr", textAlign: "left", justifyContent: "flex-start" }}>
                  <em>Choose a time</em>
                </MenuItem>
                {slotOptions.map((slot) => (
                  <MenuItem
                    key={slot}
                    value={slot}
                    sx={{ direction: "ltr", textAlign: "left", justifyContent: "flex-start" }}
                  >
                    {slot}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Stack>
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2.5}
            alignItems={{ xs: "stretch", md: "flex-end" }}
          >
            <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <InputLabel shrink={false} sx={labelSx}>
                Notes
              </InputLabel>
              <TextField
                fullWidth
                multiline
                minRows={4}
                placeholder="Anything we should know?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={notesSx}
                slotProps={{
                  input: {
                    sx: {
                      fontFamily: '"Poppins", "Inter", sans-serif',
                      "& textarea::placeholder": {
                        color: "#9ca3af",
                        opacity: 1,
                      },
                    },
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "stretch", md: "flex-end" },
              }}
            >
              <Button
                type="button"
                variant="contained"
                disabled={saving}
                onClick={handleBook}
                startIcon={<CalendarMonthRoundedIcon sx={{ fontSize: 22 }} />}
                sx={{
                  width: { xs: "100%", md: "auto" },
                  minHeight: 52,
                  maxHeight: 56,
                  py: 1.25,
                  px: { xs: 2, md: 2.75 },
                  textTransform: "none",
                  borderRadius: "18px",
                  fontWeight: 800,
                  fontSize: 15,
                  fontFamily: '"Poppins", "Inter", sans-serif',
                  whiteSpace: "nowrap",
                  background: `linear-gradient(135deg, ${WELLNESS.primary} 0%, #e879c8 100%)`,
                  boxShadow: "0 8px 22px rgba(181, 123, 232, 0.28)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    background: "linear-gradient(135deg, #a66ee0 0%, #df6aad 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 10px 26px rgba(181, 123, 232, 0.36)",
                  },
                }}
              >
                Book Appointment
              </Button>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default AppointmentBookingForm;
