import { useEffect, useRef } from 'react';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function CommunityAccessPanel({ onGoToSettings }) {
  const { t } = useParticipantLocale();
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
          <span>{t('communityAccessEyebrow')}</span>
          <h2 id="community-access-title" ref={titleRef} tabIndex="-1">{t('completeDetailsTitle')}</h2>
          <p>{t('completeDetailsBody')}</p>
        </div>
      </div>
      <button className="community-profile-setup__action" type="button" onClick={onGoToSettings}>
        {t('goToSettings')}
      </button>
    </section>
  );
}
