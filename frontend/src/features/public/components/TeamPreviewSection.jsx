import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import TeamMemberCard from './TeamMemberCard';

function getVisibleTeamMembers(teamMembers, maxItems) {
  return (Array.isArray(teamMembers) ? teamMembers : [])
    .filter((member) => {
      if (!member || typeof member !== 'object') {
        return false;
      }

      const isVisible = member.isVisible !== false && member.visible !== false && member.hidden !== true;
      const isPublished = member.isPublished !== false && member.published !== false;
      const isActive = member.active !== false && member.status !== 'inactive';
      const isDraft = member.status === 'draft' || member.status === 'unpublished';

      return isVisible && isPublished && isActive && !isDraft;
    })
    .slice(0, maxItems);
}

export default function TeamPreviewSection({
  teamMembers = [],
  maxItems = 4,
  isLoading = false,
  hasError = false,
}) {
  const visibleTeamMembers = getVisibleTeamMembers(teamMembers, maxItems);

  return (
    <section className="public-section public-section--team-preview" id="team">
      <div className="public-section__header public-section__header--team">
        <p className="public-eyebrow">Team</p>
        <h2>Meet the Team</h2>
        <p className="public-section__text">
          Dedicated people supporting She-Na&apos;s community with professionalism, care, and respect.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Loading team information..." />
      ) : hasError ? (
        <ErrorState message="Could not load the team information. Please try again later." />
      ) : visibleTeamMembers.length ? (
        <div className="public-team-grid">
          {visibleTeamMembers.map((member) => (
            <TeamMemberCard member={member} key={member.id || member.name} />
          ))}
        </div>
      ) : (
        <EmptyState message="No team members are available at the moment." />
      )}
    </section>
  );
}
