import { useEffect, useRef, useState } from 'react';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import { getCommunitySettingsGuidelines } from '../services/communityService';
import { useParticipantLocale } from '../../context/ParticipantLocaleContext';
import { getParticipantCommunityContent } from '../../i18n/participantUiTranslations';

export default function CommunityGuidelinesModal({ mode = 'acceptance', onClose, onContinue }) {
  const { t, locale } = useParticipantLocale();
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  // Localized fallback; replaced by admin-authored guidelines when configured.
  const [guidelines, setGuidelines] = useState(
    () => getParticipantCommunityContent(locale).fullGuidelines,
  );
  const titleRef = useRef(null);
  const isReadOnly = mode === 'read';

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    setGuidelines(getParticipantCommunityContent(locale).fullGuidelines);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    getCommunitySettingsGuidelines().then((data) => {
      if (!cancelled && Array.isArray(data?.fullGuidelines) && data.fullGuidelines.length > 0) {
        setGuidelines(data.fullGuidelines);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="community-guidelines-modal" role="dialog" aria-modal="true" aria-labelledby="community-guidelines-modal-title">
      <div className="community-guidelines-modal__panel">
        <span className="community-guidelines-modal__icon" aria-hidden="true">
          <Diversity3OutlinedIcon />
        </span>
        {isReadOnly && (
          <button
            aria-label={t('closeGuidelines')}
            className="community-guidelines-modal__close"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        )}
        <div className="community-guidelines-modal__copy">
          <h2 id="community-guidelines-modal-title" ref={titleRef} tabIndex="-1">
            {isReadOnly ? t('communityGuidelines') : t('welcomeToCommunity')}
          </h2>
          <p>
            {isReadOnly ? t('guidelinesReadDesc') : t('guidelinesWelcomeDesc')}
          </p>
        </div>
        <ul className="community-guidelines-modal__list">
          {guidelines.map((guideline) => (
            <li key={guideline}>{guideline}</li>
          ))}
        </ul>
        {!isReadOnly && (
          <>
            <label className="community-guidelines-modal__agree">
              <input
                type="checkbox"
                checked={agreedToGuidelines}
                onChange={(event) => setAgreedToGuidelines(event.target.checked)}
              />
              <span>{t('agreeToGuidelines')}</span>
            </label>
            <button type="button" disabled={!agreedToGuidelines} onClick={onContinue}>
              {t('continue')}
            </button>
          </>
        )}
        {isReadOnly && (
          <button type="button" onClick={onClose}>
            {t('close')}
          </button>
        )}
      </div>
    </div>
  );
}
