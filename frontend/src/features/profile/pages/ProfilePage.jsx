import { useEffect, useMemo, useState } from "react";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { signOut } from "firebase/auth";
import {
  Box,
  ButtonBase,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import PersonalDetailsForm from "../components/PersonalDetailsForm";
import ProfileCard from "../components/ProfileCard";
import { getParticipantData } from "../services/participantService";

const navItems = [
  { label: "Dashboard", icon: HomeOutlinedIcon },
  { label: "Community", icon: GroupOutlinedIcon },
  { label: "Messages", icon: ChatBubbleOutlineOutlinedIcon },
  { label: "Events", icon: EventOutlinedIcon },
  { label: "Resources", icon: FavoriteBorderOutlinedIcon },
  { label: "Settings", icon: SettingsOutlinedIcon, active: true },
];

function ProfilePage() {
  const participantId = "participant-001";
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const parentTheme = useTheme();
  const ltrTheme = useMemo(
    () => createTheme({ ...parentTheme, direction: "ltr" }),
    [parentTheme]
  );

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const data = await getParticipantData(participantId);
      if (mounted) setProfile(data);
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  if (!profile) {
    return (
      <ThemeProvider theme={ltrTheme}>
        <Box
          dir="ltr"
          sx={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(140deg, #fff8fc 0%, #fdf3f8 100%)",
          }}
        >
          <CircularProgress sx={{ color: "#ec4899" }} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={ltrTheme}>
      <Box
        dir="ltr"
        sx={{
          minHeight: "100vh",
          display: "flex",
          background: "linear-gradient(140deg, #fff8fc 0%, #fdf3f8 100%)",
        }}
      >
        <Box
          component="aside"
          sx={{
            width: { xs: 92, sm: 210 },
            flexShrink: 0,
            borderRight: "1px solid #f6dce8",
            bgcolor: "#fffefe",
            px: { xs: 1, sm: 1.8 },
            py: 3,
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              color: "#be185d",
              fontSize: 36,
              px: 1,
              mb: 3.5,
              display: { xs: "none", sm: "block" },
            }}
          >
            She-Na
          </Typography>

          <Stack spacing={0.8}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <ButtonBase
                  key={item.label}
                  sx={{
                    width: "100%",
                    justifyContent: "flex-start",
                    gap: 1.1,
                    px: { xs: 1, sm: 1.3 },
                    py: 1.2,
                    borderRadius: 3,
                    color: item.active ? "#be185d" : "#374151",
                    border: item.active ? "1px solid #f2c3dd" : "1px solid transparent",
                    background: item.active
                      ? "linear-gradient(90deg, #fce7f3 0%, #fff3f8 100%)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: item.active ? "#fce7f3" : "#fdf2f8",
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                  <Typography sx={{ fontSize: 14.5, display: { xs: "none", sm: "block" } }}>
                    {item.label}
                  </Typography>
                </ButtonBase>
              );
            })}
          </Stack>
        </Box>

        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, sm: 4 },
            py: { xs: 2.5, sm: 3.6 },
          }}
        >
          <Box sx={{ maxWidth: 1120 }}>
            <Typography sx={{ fontSize: 52, fontWeight: 700, color: "#111827" }}>
              Profile Settings
            </Typography>
            <Typography sx={{ color: "#6b7280", fontSize: 22, mt: 0.5, mb: 3 }}>
              Manage your personal details and preferences.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "300px minmax(0, 1fr)" },
                gap: { xs: 2.2, lg: 2.8 },
                alignItems: "start",
              }}
            >
              <ProfileCard
  profile={profile}
  isEditing={isEditing}
  onEdit={() => setIsEditing(true)}
/><PersonalDetailsForm
  participantId={participantId}
  profile={profile}
  onProfileUpdated={setProfile}
  isEditing={isEditing}
  onFinishEditing={() => setIsEditing(false)}
  onLogout={handleLogout}
/>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default ProfilePage;
