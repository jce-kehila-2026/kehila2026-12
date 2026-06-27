import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import './AdminPreviewButton.css';

export default function AdminPreviewButton({ label, onClick, href, target, rel }) {
  const navigationProps = href
    ? { component: 'a', href, target, rel }
    : { type: 'button', onClick };

  return (
    <Tooltip title={label} arrow>
      <IconButton
        className="admin-preview-button"
        aria-label={label}
        {...navigationProps}
      >
        <VisibilityOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}
