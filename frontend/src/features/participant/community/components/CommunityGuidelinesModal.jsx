import { useEffect, useRef, useState } from 'react';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import { modalGuidelines } from '../communityMockData';

export default function CommunityGuidelinesModal({ onContinue }) {
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div className="community-guidelines-modal" role="dialog" aria-modal="true" aria-labelledby="community-guidelines-modal-title">
      <div className="community-guidelines-modal__panel">
        <span className="community-guidelines-modal__icon" aria-hidden="true">
          <Diversity3OutlinedIcon />
        </span>
        <div className="community-guidelines-modal__copy">
          <h2 id="community-guidelines-modal-title" ref={titleRef} tabIndex="-1">Welcome to the Community</h2>
          <p>This is a safe space for sharing, support, and respectful interaction.</p>
        </div>
        <ul className="community-guidelines-modal__list">
          {modalGuidelines.map((guideline) => (
            <li key={guideline}>{guideline}</li>
          ))}
        </ul>
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
      </div>
    </div>
  );
}
