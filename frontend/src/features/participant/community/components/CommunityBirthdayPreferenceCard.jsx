import { useEffect, useRef } from 'react';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';

export default function CommunityBirthdayPreferenceCard({ onSave }) {
  const { t } = useParticipantLocale();
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
          <span>{t('communityPreferenceEyebrow')}</span>
          <h2 id="community-birthday-preference-title">{t('birthdayVisibilityTitle')}</h2>
          <p>{t('birthdayVisibilityBody')}</p>
        </div>
      </div>
      <div className="community-profile-setup__actions">
        <button type="button" ref={firstActionRef} onClick={() => onSave(true)}>
          {t('showMyBirthday')}
        </button>
        <button type="button" onClick={() => onSave(false)}>
          {t('keepItPrivate')}
        </button>
      </div>
    </section>
  );
}
