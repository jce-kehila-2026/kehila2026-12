import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { communityGuidelines } from '../communityMockData';

export default function CommunityGuidelinesCard({ onReadFullGuidelines }) {
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
      <button type="button" onClick={onReadFullGuidelines}>
        Read full guidelines
      </button>
    </section>
  );
}
