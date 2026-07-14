import { useEffect, useState } from 'react';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { getCommunitySettingsGuidelines } from '../services/communityService';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';
import { getParticipantCommunityContent } from '../../i18n/participantUiTranslations';

export default function CommunityGuidelinesCard({ onReadFullGuidelines }) {
  const { t, locale } = useParticipantLocale();
  // Localized fallback; replaced by admin-authored guidelines when configured.
  const [guidelines, setGuidelines] = useState(
    () => getParticipantCommunityContent(locale).shortGuidelines,
  );

  useEffect(() => {
    setGuidelines(getParticipantCommunityContent(locale).shortGuidelines);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    getCommunitySettingsGuidelines().then((data) => {
      if (!cancelled && Array.isArray(data?.shortGuidelines) && data.shortGuidelines.length > 0) {
        setGuidelines(data.shortGuidelines);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="guidelines-card" aria-labelledby="community-guidelines-title">
      <div className="guidelines-card__heading">
        <span className="guidelines-card__icon">
          <VolunteerActivismOutlinedIcon />
        </span>
        <div>
          <span>{t('safeSpace')}</span>
          <h2 id="community-guidelines-title">{t('communityGuidelines')}</h2>
        </div>
      </div>
      <p className="guidelines-card__intro">{t('guidelinesIntro')}</p>
      <ul>
        {guidelines.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <button type="button" onClick={onReadFullGuidelines}>
        {t('readFullGuidelines')}
      </button>
    </section>
  );
}
