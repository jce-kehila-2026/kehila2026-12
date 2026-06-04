import { useEffect, useRef, useState } from 'react';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import { modalGuidelines } from '../communityMockData';
import { getCommunitySettingsGuidelines } from '../services/communityService';

export default function CommunityGuidelinesModal({ mode = 'acceptance', onClose, onContinue }) {
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [guidelines, setGuidelines] = useState(modalGuidelines);
  const titleRef = useRef(null);
  const isReadOnly = mode === 'read';

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

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
            aria-label="Close community guidelines"
            className="community-guidelines-modal__close"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        )}
        <div className="community-guidelines-modal__copy">
          <h2 id="community-guidelines-modal-title" ref={titleRef} tabIndex="-1">
            {isReadOnly ? 'Community Guidelines' : 'Welcome to the Community'}
          </h2>
          <p>
            {isReadOnly
              ? 'The full guidelines for keeping this space supportive and respectful.'
              : 'This is a safe space for sharing, support, and respectful interaction.'}
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
              <span>I agree to the community guidelines</span>
            </label>
            <button type="button" disabled={!agreedToGuidelines} onClick={onContinue}>
              Continue
            </button>
          </>
        )}
        {isReadOnly && (
          <button type="button" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
