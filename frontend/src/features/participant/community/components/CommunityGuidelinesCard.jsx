import { useState } from 'react';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { communityGuidelines } from '../communityMockData';

export default function CommunityGuidelinesCard() {
  const [guidelinesFeedback, setGuidelinesFeedback] = useState('');

  return (
    <section className="guidelines-card" aria-labelledby="community-guidelines-title">
      <div className="guidelines-card__heading">
        <span className="guidelines-card__icon">
          <VolunteerActivismOutlinedIcon />
        </span>
        <div>
          <span>Safe space</span>
          <h2 id="community-guidelines-title">Community Guidelines</h2>
        </div>
      </div>
      <p className="guidelines-card__intro">A quick reminder for keeping this space warm and supportive.</p>
      <ul>
        {communityGuidelines.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <button type="button" onClick={() => setGuidelinesFeedback('Full guidelines preview is coming soon.')}>
        Read full guidelines
      </button>
      {guidelinesFeedback && (
        <p className="guidelines-card__feedback" aria-live="polite">{guidelinesFeedback}</p>
      )}
    </section>
  );
}
