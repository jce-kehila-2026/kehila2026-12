import { useEffect, useRef } from 'react';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';

export default function CommunityBirthdayPreferenceCard({ onSave }) {
  const firstActionRef = useRef(null);

  useEffect(() => {
    firstActionRef.current?.focus();
  }, []);

  return (
    <section
      className="community-profile-setup"
      role="dialog"
      aria-labelledby="community-birthday-preference-title"
    >
      <div className="community-profile-setup__heading">
        <span className="community-profile-setup__icon" aria-hidden="true">
          <Diversity3OutlinedIcon />
        </span>
        <div>
          <span>Community preference</span>
          <h2 id="community-birthday-preference-title">Birthday visibility</h2>
          <p>Would you like your birthday to be visible to the community?</p>
        </div>
      </div>
      <div className="community-profile-setup__actions">
        <button type="button" ref={firstActionRef} onClick={() => onSave(true)}>
          Show my birthday
        </button>
        <button type="button" onClick={() => onSave(false)}>
          Keep it private
        </button>
      </div>
    </section>
  );
}
