import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import { communityGuidelines } from '../communityMockData';

export default function CommunityGuidelinesCard() {
  return (
    <section className="guidelines-card" aria-labelledby="community-guidelines-title">
      <div className="guidelines-card__heading">
        <span className="guidelines-card__icon">
          <VolunteerActivismOutlinedIcon />
        </span>
        <h2 id="community-guidelines-title">Community Guidelines</h2>
      </div>
      <ul>
        {communityGuidelines.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <button type="button">Read full guidelines</button>
    </section>
  );
}
