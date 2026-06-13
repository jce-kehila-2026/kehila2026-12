import { useEffect, useRef, useState } from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { WELLNESS, WELLNESS_DARK } from "../../appointments/appointmentTypeMeta";
import { uploadParticipantProfileImage } from "../services/participantService";

function ProfileCard({
  profile,
  participantId,
  isEditing,
  onEdit,
  onAvatarUpdated,
  darkMode = false,
  t = (k) => k,
}) {
  const [previewImage, setPreviewImage] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const blobUrlRef = useRef(null);

  const revokeBlob = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  useEffect(() => () => revokeBlob(), []);

  const initials = (profile?.fullName || "SA")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!participantId) {
      setAvatarError("Not signed in.");
      return;
    }

    setAvatarError("");
    revokeBlob();
    const blob = URL.createObjectURL(file);
    blobUrlRef.current = blob;
    setPreviewImage(blob);

    setAvatarUploading(true);
    try {
      const url = await uploadParticipantProfileImage(participantId, file);
      revokeBlob();
      setPreviewImage(url);
      setAvatarError("");
      onAvatarUpdated?.({ avatarUrl: url });
    } catch (e) {
      console.error(e);
      revokeBlob();
      setPreviewImage(null);
      setAvatarError(
        e?.message || "Could not upload photo. Please try again."
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const w = darkMode ? WELLNESS_DARK : WELLNESS;

  return (
    <Card
      elevation={0}
      sx={{
        minWidth: { lg: 300 },
        borderRadius: w.radiusLg,
        border: darkMode
          ? "1px solid rgba(196, 165, 245, 0.28)"
          : "1px solid rgba(181, 123, 232, 0.22)",
        backgroundColor: w.card,
        boxShadow: w.shadowCard,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.4} alignItems="center">
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
                bgcolor: darkMode ? "rgba(196, 165, 245, 0.22)" : "#EAD7FF",
                color: darkMode ? WELLNESS_DARK.primary : "#7c3aad",
                fontWeight: 700,
                fontSize: '2.5rem',
              }}
            >
              {initials}
            </Avatar>

            {avatarUploading ? (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(255,255,255,0.55)",
                  pointerEvents: "none",
                }}
              >
                <CircularProgress size={36} sx={{ color: WELLNESS.primary }} />
              </Box>
            ) : null}

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
                  background: `linear-gradient(135deg, ${WELLNESS.primary} 0%, #c49ef0 100%)`,
                  color: "#ffffff",
                  border: darkMode ? "2px solid #1e293b" : "2px solid #ffffff",
                  boxShadow: "0 4px 14px rgba(181, 123, 232, 0.35)",
                  cursor: avatarUploading ? "default" : "pointer",
                  opacity: avatarUploading ? 0.55 : 1,
                  pointerEvents: avatarUploading ? "none" : "auto",
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #a66ee0 0%, #b57be8 100%)",
                    transform: avatarUploading ? "none" : "translateY(-1px)",
                    boxShadow: "0 6px 18px rgba(181, 123, 232, 0.42)",
                  },
                }}
              >
                <PhotoCameraOutlinedIcon sx={{ fontSize: '1.125rem', color: "inherit" }} />
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  disabled={avatarUploading}
                  onChange={handleImageChange}
                />
              </Box>
            )}
          </Box>

          {avatarError ? (
            <Typography
              variant="caption"
              sx={{
                color: "#b91c1c",
                textAlign: "center",
                maxWidth: 260,
                lineHeight: 1.35,
              }}
            >
              {avatarError}
            </Typography>
          ) : null}

          <Box textAlign="center" width="100%">
            <Typography
              variant="h5"
              noWrap
              sx={{
                fontWeight: 700,
                color: w.text,
                fontSize: "1.6rem",
              }}
            >
              {profile?.fullName}
            </Typography>

            <Typography variant="body2" sx={{ color: w.muted, mt: 0.7 }}>
              {profile?.email}
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            justifyContent="center"
          >
            <Chip
              label={profile?.city || "San Francisco"}
              sx={{
                bgcolor: darkMode ? "rgba(196, 165, 245, 0.14)" : "rgba(234, 215, 255, 0.85)",
                color: darkMode ? "#e9d5ff" : "#5b2d9e",
                fontWeight: 600,
                border: darkMode
                  ? "1px solid rgba(196, 165, 245, 0.35)"
                  : "1px solid rgba(181, 123, 232, 0.2)",
              }}
            />
            <Chip
              label={`${t("languageChipPrefix")} ${
                (profile?.language || "english").toLowerCase() === "hebrew"
                  ? t("languageHebrew")
                  : t("languageEnglish")
              }`}
              sx={{
                bgcolor: darkMode ? "rgba(196, 165, 245, 0.14)" : "rgba(234, 215, 255, 0.85)",
                color: darkMode ? "#e9d5ff" : "#5b2d9e",
                fontWeight: 600,
                border: darkMode
                  ? "1px solid rgba(196, 165, 245, 0.35)"
                  : "1px solid rgba(181, 123, 232, 0.2)",
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
                borderRadius: "18px",
                borderWidth: 1.5,
                borderColor: darkMode
                  ? "rgba(196, 165, 245, 0.45)"
                  : "rgba(181, 123, 232, 0.55)",
                color: darkMode ? WELLNESS_DARK.primary : "#6b3f9e",
                fontWeight: 600,
                py: 1.1,
                transition:
                  "border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
                "&:hover": {
                  borderColor: WELLNESS.primary,
                  borderWidth: 1.5,
                  backgroundColor: darkMode
                    ? "rgba(196, 165, 245, 0.1)"
                    : "rgba(181, 123, 232, 0.08)",
                  boxShadow: darkMode
                    ? "0 4px 14px rgba(0, 0, 0, 0.25)"
                    : "0 4px 14px rgba(181, 123, 232, 0.15)",
                  transform: "translateY(-1px)",
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
