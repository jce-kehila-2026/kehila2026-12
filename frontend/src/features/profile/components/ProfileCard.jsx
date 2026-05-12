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
  Stack,
  Typography,
} from "@mui/material";

function ProfileCard({ profile, isEditing, onEdit, darkMode = false, t = (k) => k }) {
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
          {/* Avatar + camera only — positioning context is this 92×92 box, not the card */}
          <Box
            sx={{
              position: "relative",
              width: "92px",
              height: "92px",
              flexShrink: 0,
              overflow: "visible",
              lineHeight: 0,
            }}
          >
            <Avatar
              src={previewImage || profile?.avatarUrl || undefined}
              sx={{
                width: "100%",
                height: "100%",
                bgcolor: avatarBg,
                color: avatarColor,
                fontWeight: 700,
                fontSize: 40,
              }}
            >
              {initials}
            </Avatar>

            {isEditing && (
              <Box
                component="label"
                aria-label="Upload profile photo"
                sx={{
                  position: "absolute",
                  right: "-8px",
bottom: "-8px",
width: "32px",
height: "32px",
                  zIndex: 1,
                  
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  bgcolor: "#ec4899",
                  color: "#ffffff",
                  border: "2px solid #ffffff",
                  boxShadow:
                    "0 2px 12px rgba(0, 0, 0, 0.16), 0 1px 4px rgba(236, 72, 153, 0.45)",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    bgcolor: "#db2777",
                    boxShadow:
                      "0 3px 14px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(236, 72, 153, 0.5)",
                  },
                }}
              >
                <PhotoCameraOutlinedIcon sx={{ fontSize: 18, color: "inherit" }} />
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleImageChange}
                />
              </Box>
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
              label={`${t("languageChipPrefix")} ${
                (profile?.language || "english").toLowerCase() === "hebrew"
                  ? t("languageHebrew")
                  : t("languageEnglish")
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
              {t("editProfile")}
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ProfileCard;