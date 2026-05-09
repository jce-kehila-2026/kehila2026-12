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

function ProfileCard({ profile, isEditing, onEdit }) {
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

  return (
    <Card elevation={0} sx={{ minWidth: { lg: 300 }, borderRadius: 4, border: "1px solid #f8dce9" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.4} alignItems="center">
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={previewImage || profile?.avatarUrl || undefined}
              sx={{
                width: 92,
                height: 92,
                bgcolor: "#fbcfe8",
                color: "#be185d",
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
              sx={{ fontWeight: 700, color: "#1f2937", fontSize: "1.6rem" }}
            >
              {profile?.fullName}
            </Typography>

            <Typography variant="body2" sx={{ color: "#4b5563", mt: 0.7 }}>
              {profile?.email}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
            <Chip label={profile?.city || "San Francisco"} sx={{ bgcolor: "#fdf2f8", color: "#9d174d" }} />
            <Chip
  label={`Language: ${
    (profile?.language || "English").charAt(0).toUpperCase() +
    (profile?.language || "English").slice(1)
  }`}
  sx={{
    bgcolor: "#fdf2f8",
    color: "#9d174d",
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
                borderColor: "#e9b5d2",
                color: "#be185d",
                fontWeight: 600,
                py: 1.1,
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