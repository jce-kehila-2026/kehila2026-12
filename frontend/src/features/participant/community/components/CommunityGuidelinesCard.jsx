import { useEffect, useState } from 'react';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { communityGuidelines } from '../communityMockData';
import { getCommunitySettingsGuidelines } from '../services/communityService';

export default function CommunityGuidelinesCard({ onReadFullGuidelines }) {
  const [guidelines, setGuidelines] = useState(communityGuidelines);

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
          <span>Safe space</span>
          <h2 id="community-guidelines-title">Community Guidelines</h2>
        </div>
      </div>
      <p className="guidelines-card__intro">A quick reminder for keeping this space warm and supportive.</p>
      <ul>
        {guidelines.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <button type="button" onClick={onReadFullGuidelines}>
        Read full guidelines
      </button>
    </section>
  );
}
