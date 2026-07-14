import { useEffect, useRef, useState } from "react";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import MailOutlineOutlinedIcon from "@mui/icons-material/MailOutlineOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import {
  Avatar,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import { WELLNESS, WELLNESS_DARK } from "../../appointments/appointmentTypeMeta";
import { uploadParticipantProfileImage } from "../services/participantService";

function formatBirthDateLabel(raw) {
  if (!raw) return "—";
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    const [year, month, day] = raw.trim().split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }
  return String(raw);
}

const PROFILE_ROWS = [
  { key: "email", labelKey: "emailAddress", icon: MailOutlineOutlinedIcon, field: "email" },
  { key: "city", labelKey: "city", icon: LocationOnOutlinedIcon, field: "city" },
  { key: "language", labelKey: "language", icon: PublicOutlinedIcon, field: "language" },
  { key: "birthDate", labelKey: "birthDateLabel", icon: CalendarTodayOutlinedIcon, field: "birthDate" },
];

function ProfileCard({
  profile,
  participantId,
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

  const languageLabel =
    (profile?.language || "english").toLowerCase() === "hebrew"
      ? t("languageHebrew")
      : t("languageEnglish");

  const rowValues = {
    email: profile?.email || "—",
    city: profile?.city || "—",
    language: languageLabel,
    birthDate: formatBirthDateLabel(profile?.birthDate),
  };

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
      setAvatarError(e?.message || "Could not upload photo. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <aside className="profile-summary">
      <div className="profile-summary__hero">
        <Box
          className="profile-summary__avatar-wrap"
          sx={{
            position: "relative",
            overflow: "visible",
          }}
        >
        <Avatar
          src={previewImage || profile?.avatarUrl || undefined}
          sx={{
            width: 76,
            height: 76,
            mx: "auto",
            bgcolor: darkMode ? "rgba(196, 165, 245, 0.34)" : "#FDEEF6",
            color: darkMode ? "#f3e8ff" : "#2F145C",
            fontWeight: 700,
            fontSize: 28,
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
            <CircularProgress size={28} sx={{ color: WELLNESS.primary }} />
          </Box>
        ) : null}

        <Box
          component="label"
          aria-label="Upload profile photo"
          sx={{
            position: "absolute",
            right: "-4px",
            bottom: "-4px",
            width: 28,
            height: 28,
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: darkMode ? "#5b1e8c" : "#EC168C",
            color: "#ffffff",
            border: darkMode ? "2px solid #1e293b" : "2px solid #ffffff",
            boxShadow: "0 2px 8px rgba(236, 22, 140, 0.12)",
            cursor: avatarUploading ? "default" : "pointer",
            opacity: avatarUploading ? 0.55 : 1,
            pointerEvents: avatarUploading ? "none" : "auto",
          }}
        >
          <PhotoCameraOutlinedIcon sx={{ fontSize: 15, color: "inherit" }} />
          <input
            hidden
            accept="image/*"
            type="file"
            disabled={avatarUploading}
            onChange={handleImageChange}
          />
        </Box>
        </Box>

        {avatarError ? (
          <Typography
            variant="caption"
            sx={{
              color: "#b91c1c",
              textAlign: "center",
              display: "block",
              mt: 0.5,
              lineHeight: 1.35,
            }}
          >
            {avatarError}
          </Typography>
        ) : null}

        <h2 className="profile-summary__name">{profile?.fullName}</h2>
        <p className="profile-summary__email" title={profile?.email || undefined}>
          {profile?.email || "—"}
        </p>
      </div>

      <ul className="profile-summary__meta">
        {PROFILE_ROWS.map(({ key, labelKey, icon: RowIcon, field }) => (
          <li key={key} className={`profile-summary__row${field === "email" ? " is-email" : ""}`}>
            <span className="profile-summary__row-icon" aria-hidden="true">
              <RowIcon fontSize="small" />
            </span>
            <div className="profile-summary__row-copy">
              <span className="profile-summary__row-label">{t(labelKey)}</span>
              <strong
                className="profile-summary__row-value"
                title={field === "email" ? rowValues[field] : undefined}
              >
                {rowValues[field]}
              </strong>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default ProfileCard;
