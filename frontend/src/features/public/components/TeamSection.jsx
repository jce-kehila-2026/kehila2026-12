import TeamSectionCard from './TeamSectionCard';
import { teamMembers } from '../data/teamSectionData';

const PRIMARY_ROW = teamMembers.slice(0, 4);
const SECONDARY_ROW = teamMembers.slice(4);

export default function TeamSection() {
  if (!teamMembers.length) {
    return null;
  }

  return (
    <section
      className="public-section public-section--team"
      id="team"
      aria-labelledby="public-team-section-title"
    >
      <header className="public-section__header public-section__header--team reveal">
        <p className="public-team-section__pill">הכוח שמאחורי הקהילה</p>
        <h2 id="public-team-section-title">הכירו את הצוות שלנו</h2>
        <p className="public-section__text reveal reveal-delay-1">
          צוות מקצועי ומסור שמלווה נשים בדרך לצמיחה, תמיכה והחלמה.
        </p>
      </header>

      <div className="public-team-section__grid">
        <div className="public-team-section__row public-team-section__row--primary">
          {PRIMARY_ROW.map((member, index) => (
            <TeamSectionCard member={member} index={index} key={member.name} />
          ))}
        </div>

        <div className="public-team-section__row public-team-section__row--secondary">
          {SECONDARY_ROW.map((member, index) => (
            <TeamSectionCard member={member} index={index + 4} key={member.name} />
          ))}
        </div>
      </div>
    </section>
  );
}
