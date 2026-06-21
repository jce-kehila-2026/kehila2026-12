import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonIcon from '@mui/icons-material/Person';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

function getFieldIcon(fieldKey) {
  const iconSx = { fontSize: '1.125rem' };
  const map = {
    fullName: <PersonIcon sx={iconSx} />,
    email: <EmailOutlinedIcon sx={iconSx} />,
    phone: <PhoneOutlinedIcon sx={iconSx} />,
    address: <PlaceOutlinedIcon sx={iconSx} />,
    dob: <CakeOutlinedIcon sx={iconSx} />,
    role: <ShieldOutlinedIcon sx={iconSx} />,
    emergencyContact: <PhoneOutlinedIcon sx={iconSx} />,
    howHeard: <ShareOutlinedIcon sx={iconSx} />,
    bio: <FavoriteBorderIcon sx={iconSx} />,
    consent: <ShareOutlinedIcon sx={iconSx} />,
    readyToJoin: <PersonIcon sx={iconSx} />,
    whatsappNote: <PhoneOutlinedIcon sx={iconSx} />,
    decision: <ShieldOutlinedIcon sx={iconSx} />,
  };
  return map[fieldKey] || <PersonIcon sx={iconSx} />;
}

export default function AdminDetailInfoCard({ label, value, icon, iconKey }) {
  const displayValue = value || '-';

  return (
    <Box
      dir="ltr"
      sx={{
        px: 1.5,
        py: 1.125,
        width: '100%',
        height: '100%',
        minHeight: '4.875rem',
        boxSizing: 'border-box',
        borderRadius: '16px',
        border: '1px solid rgba(130, 92, 206, 0.12)',
        bgcolor: 'rgba(255, 255, 255, 0.72)',
        boxShadow: '0 8px 20px rgba(91, 57, 145, 0.045)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexDirection: 'row',
        textAlign: 'left',
      }}
    >
      <Box
        sx={{
          width: '2.375rem',
          height: '2.375rem',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color: '#7C3AED',
          bgcolor: 'rgba(124, 58, 237, 0.08)',
          '& .MuiSvgIcon-root': {
            fontSize: '1.0625rem',
          },
        }}
      >
        {icon || getFieldIcon(iconKey)}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={800}
          sx={{ display: 'block', lineHeight: 1.15, fontSize: '0.6875rem', letterSpacing: '0.02em', textTransform: 'uppercase', textAlign: 'left' }}
        >
          {label}
        </Typography>
        <Typography
          fontWeight={850}
          title={displayValue}
          sx={{
            color: '#17122E',
            fontSize: '0.875rem',
            mt: 0.35,
            lineHeight: 1.3,
            textAlign: 'left',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {displayValue}
        </Typography>
      </Box>
    </Box>
  );
}
