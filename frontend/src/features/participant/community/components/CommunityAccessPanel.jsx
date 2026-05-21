import { useEffect, useRef } from 'react';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';

export default function CommunityAccessPanel({ onGoToSettings }) {
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <section
      className="community-profile-setup"
      role="dialog"
      aria-labelledby="community-access-title"
    >
      <div className="community-profile-setup__heading">
        <span className="community-profile-setup__icon" aria-hidden="true">
          <Diversity3OutlinedIcon />
        </span>
        <div>
          <span>Community access</span>
          <h2 id="community-access-title" ref={titleRef} tabIndex="-1">Complete your personal details</h2>
          <p>Please complete your display name and birthday in Settings before using the community.</p>
        </div>
      </div>
      <button className="community-profile-setup__action" type="button" onClick={onGoToSettings}>
        Go to Settings
      </button>
    </section>
  );
}
