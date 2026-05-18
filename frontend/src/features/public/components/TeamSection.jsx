import { TEAM_MEMBERS } from '../constants/teamMembers';
import TeamSectionMemberCard from './TeamSectionMemberCard';

const PRIMARY_ROW_COUNT = 4;

export default function TeamSection({ contactEmail = '' }) {
  const primaryRow = TEAM_MEMBERS.slice(0, PRIMARY_ROW_COUNT);
  const secondaryRow = TEAM_MEMBERS.slice(PRIMARY_ROW_COUNT);

  return (
    <section
      className="public-section public-section--team-section"
      id="team"
      aria-labelledby="public-team-section-title"
    >
      <div className="public-team-section__inner">
        <header className="public-team-section__header">
          <p className="public-team-section__pill reveal">הכוח שמאחורי הקהילה</p>
          <h2 id="public-team-section-title" className="public-team-section__title reveal reveal-delay-1">
            הכירו את הצוות שלנו
          </h2>
          <p className="public-team-section__subtitle reveal reveal-delay-2">
            צוות מקצועי ומסור שמלווה נשים בדרך לצמיחה, תמיכה והחלמה.
          </p>
        </header>

        <div className="public-team-section__rows stagger-children">
          <div className="public-team-section__row public-team-section__row--primary">
            {primaryRow.map((member) => (
              <TeamSectionMemberCard member={member} contactEmail={contactEmail} key={member.id} />
            ))}
          </div>

          <div className="public-team-section__row public-team-section__row--secondary">
            {secondaryRow.map((member) => (
              <TeamSectionMemberCard member={member} contactEmail={contactEmail} key={member.id} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
