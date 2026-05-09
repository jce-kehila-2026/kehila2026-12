import { useEffect, useState } from "react";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { updateParticipantData } from "../services/participantService";

const contactOptions = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone Call" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
];
const languageOptions = [
  { value: "english", label: "English" },
  { value: "hebrew", label: "Hebrew" },
];

function PersonalDetailsForm({
  participantId,
  profile,
  onProfileUpdated,
  isEditing,
  onFinishEditing,
  onLogout,
}) {
  const [formData, setFormData] = useState(profile || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(profile || {});
  }, [profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

  const handleSave = async (event) => {
    event.preventDefault();
    if (!isValidEmail(formData.email || "")) {
  alert("Please enter a valid email address");
  return;
}
  const cleanPhone = formData.phoneNumber.replace(/\D/g, "");

if (cleanPhone.length < 12) {
  alert("Please enter a valid Israeli phone number");
  return;
}
    setSaving(true);

    try {
      const updated = await updateParticipantData(participantId, formData);
      onProfileUpdated(updated);
       onFinishEditing();
    } finally {
      setSaving(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      backgroundColor: "#ffffff",
      height: 58,
      paddingRight: "8px",

      "& fieldset": {
        borderColor: "#d9dee7",
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
      color: "#111827",
      paddingRight: "8px",
    },
  };

  const FieldLabel = ({ children }) => (
    <Typography
      sx={{
        mb: 0.8,
        color: "#4b5563",
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
        border: "1px solid #f3d9e5",
        backgroundColor: "#ffffff",
        boxShadow: "0 12px 30px rgba(236,72,153,0.08)",
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
        <Stack component="form" spacing={3.2} onSubmit={handleSave}>
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: "#111827", mb: 1 }}
            >
              Personal Details
            </Typography>

            <Typography sx={{ color: "#6b7280" }}>
              Update your information and communication preferences.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FieldLabel>Full Name</FieldLabel>
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
  <FieldLabel>Phone Number</FieldLabel>

  <PhoneInput
    country={"il"}
    value={formData.phoneNumber}
    onChange={(phone) =>
      setFormData((prev) => ({
        ...prev,
        phoneNumber: phone,
      }))
    }
    inputStyle={{
      width: "100%",
      height: "58px",
      borderRadius: "14px",
      fontSize: "17px",
      border: "1px solid #d9dee7",
    }}
    buttonStyle={{
      borderTopLeftRadius: "14px",
      borderBottomLeftRadius: "14px",
      border: "1px solid #d9dee7",
    }}
    disabled={!isEditing}
  />
</Grid>

            <Grid item xs={12}>
              <FieldLabel>Email Address</FieldLabel>
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
              <FieldLabel>Street Address</FieldLabel>
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
              <FieldLabel>City</FieldLabel>
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
  <FieldLabel>Birth Date</FieldLabel>

  <LocalizationProvider dateAdapter={AdapterDateFns}>
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
          sx: {
            "& .MuiOutlinedInput-root": {
              borderRadius: "14px",
              backgroundColor: "#ffffff",
              height: 58,

              "& fieldset": {
                borderColor: "#d9dee7",
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
              color: "#111827",
            },
          },
        },
      }}
      disabled={!isEditing}
    />
  </LocalizationProvider>
</Grid>

            <Grid item xs={12} md={6}>
              <FieldLabel>Preferred Contact Method</FieldLabel>
              <TextField
  fullWidth
  select
  name="preferredContactMethod"
  value={formData.preferredContactMethod || "email"}
  onChange={handleChange}
  sx={fieldSx}
  MenuProps={{
    PaperProps: {
      sx: {
        direction: "ltr",
        textAlign: "left",
      },
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
              <FieldLabel>Language</FieldLabel>
              <TextField
                fullWidth
                select
                name="language"
                value={formData.language || "english"}
                onChange={handleChange}
                sx={fieldSx}
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
      {saving ? "Saving..." : "Save Changes"}
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
                backgroundColor: "#fff9fc",
                "&:hover": {
                  borderColor: "#ec4899",
                  backgroundColor: "#fff1f7",
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default PersonalDetailsForm;