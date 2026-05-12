import { useState } from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

function ProfileCard({ profile, isEditing, onEdit, darkMode = false }) {
  const [previewImage, setPreviewImage] = useState(null);

  const initials = (profile?.fullName || "SA")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
  };

  const cardBorder = darkMode ? "1px solid rgba(236, 72, 153, 0.25)" : "1px solid #f8dce9";
  const cardBg = darkMode ? "#1e293b" : undefined;
  const cardShadow = darkMode ? "0 12px 30px rgba(0,0,0,0.35)" : undefined;
  const nameColor = darkMode ? "#f8fafc" : "#1f2937";
  const emailColor = darkMode ? "#94a3b8" : "#4b5563";
  const chipBg = darkMode ? "rgba(236, 72, 153, 0.15)" : "#fdf2f8";
  const chipColor = darkMode ? "#fbcfe8" : "#9d174d";
  const avatarBg = darkMode ? "rgba(236, 72, 153, 0.25)" : "#fbcfe8";
  const avatarColor = darkMode ? "#fce7f3" : "#be185d";

  return (
    <Card
      elevation={0}
      sx={{
        minWidth: { lg: 300 },
        borderRadius: 4,
        border: cardBorder,
        backgroundColor: cardBg,
        boxShadow: cardShadow,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.4} alignItems="center">
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={previewImage || profile?.avatarUrl || undefined}
              sx={{
                width: 92,
                height: 92,
                bgcolor: avatarBg,
                color: avatarColor,
                fontWeight: 700,
                fontSize: 40,
              }}
            >
              {initials}
            </Avatar>

            {isEditing && (
              <IconButton
                component="label"
                sx={{
                  position: "absolute",
                  right: -4,
                  bottom: -4,
                  bgcolor: "#ec4899",
                  color: "white",
                  width: 34,
                  height: 34,
                  "&:hover": { bgcolor: "#db2777" },
                }}
              >
                <PhotoCameraOutlinedIcon sx={{ fontSize: 18 }} />
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleImageChange}
                />
              </IconButton>
            )}
          </Box>

          <Box textAlign="center" width="100%">
            <Typography
              variant="h5"
              noWrap
              sx={{ fontWeight: 700, color: nameColor, fontSize: "1.6rem" }}
            >
              {profile?.fullName}
            </Typography>

            <Typography variant="body2" sx={{ color: emailColor, mt: 0.7 }}>
              {profile?.email}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
            <Chip label={profile?.city || "San Francisco"} sx={{ bgcolor: chipBg, color: chipColor }} />
            <Chip
  label={`Language: ${
    (profile?.language || "English").charAt(0).toUpperCase() +
    (profile?.language || "English").slice(1)
  }`}
  sx={{
    bgcolor: chipBg,
    color: chipColor,
    textTransform: "none",
  }}
/>
          </Stack>

          {!isEditing && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<EditOutlinedIcon />}
              onClick={onEdit}
              sx={{
                mt: 1,
                textTransform: "none",
                borderRadius: 99,
                borderColor: darkMode ? "rgba(244, 114, 182, 0.45)" : "#e9b5d2",
                color: darkMode ? "#f9a8d4" : "#be185d",
                fontWeight: 600,
                py: 1.1,
                "&:hover": {
                  borderColor: darkMode ? "#f472b6" : undefined,
                  backgroundColor: darkMode ? "rgba(236, 72, 153, 0.08)" : undefined,
                },
              }}
            >
              Edit Profile
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ProfileCard;