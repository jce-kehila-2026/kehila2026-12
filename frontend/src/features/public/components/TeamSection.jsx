import { useRef } from 'react';
import { TEAM_MEMBERS } from '../constants/teamMembers';
import PublicSectionHeading from './PublicSectionHeading';
import TeamSectionMemberCard from './TeamSectionMemberCard';
import useInViewOnce from '../hooks/useInViewOnce';

const PRIMARY_ROW_COUNT = 4;
const TEAM_CARD_STAGGER_MS = 100;

export default function TeamSection() {
  const rowsRef = useRef(null);
  const cardsInView = useInViewOnce(rowsRef, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
  const primaryRow = TEAM_MEMBERS.slice(0, PRIMARY_ROW_COUNT);
  const secondaryRow = TEAM_MEMBERS.slice(PRIMARY_ROW_COUNT);

  return (
    <section
      className="public-section public-section--team-section"
      id="team"
      aria-labelledby="public-team-section-title"
    >
      <div className="public-team-section__inner">
        <PublicSectionHeading
          className="public-team-section__heading"
          eyebrow="הכוח שמאחורי הקהילה"
          title="הכירו את הצוות שלנו"
          titleId="public-team-section-title"
          subtitle="צוות מקצועי ומסור שמלווה נשים בדרך לצמיחה, תמיכה והחלמה."
        />

        <div className="public-team-section__rows" ref={rowsRef}>
          <div className="public-team-section__row public-team-section__row--primary">
            {primaryRow.map((member, index) => (
              <TeamSectionMemberCard
                member={member}
                key={member.id}
                revealIndex={index}
                revealVisible={cardsInView}
                staggerMs={TEAM_CARD_STAGGER_MS}
              />
            ))}
          </div>

          <div className="public-team-section__row public-team-section__row--secondary">
            {secondaryRow.map((member, index) => (
              <TeamSectionMemberCard
                member={member}
                key={member.id}
                revealIndex={index + PRIMARY_ROW_COUNT}
                revealVisible={cardsInView}
                staggerMs={TEAM_CARD_STAGGER_MS}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
