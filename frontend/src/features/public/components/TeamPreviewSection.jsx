import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import TeamMemberCard from './TeamMemberCard';

const DEMO_TEAM_MEMBERS = [
  {
    id: 'demo-team-1',
    name: 'Maya Cohen',
    role: 'Community Programs Lead',
    description: 'Coordinates supportive programs and helps create a welcoming environment for every participant.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'demo-team-2',
    name: 'Lina Haddad',
    role: 'Participant Support Coordinator',
    description: 'Guides participants through available resources with care, privacy, and respect.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'demo-team-3',
    name: 'Noa Levi',
    role: 'Workshops Facilitator',
    description: 'Supports learning circles, community workshops, and practical wellbeing activities.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'demo-team-4',
    name: 'Sara Mansour',
    role: 'Volunteer Relations',
    description: 'Builds thoughtful connections between volunteers, staff, and community needs.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
];

function getVisibleTeamMembers(teamMembers, maxItems) {
  return (Array.isArray(teamMembers) ? teamMembers : [])
    .filter((member) => {
      const isVisible = member.isVisible !== false && member.visible !== false && member.hidden !== true;
      const isPublished = member.isPublished !== false && member.published !== false;
      const isActive = member.active !== false && member.status !== 'inactive';
      const isDraft = member.status === 'draft' || member.status === 'unpublished';

      return isVisible && isPublished && isActive && !isDraft;
    })
    .slice(0, maxItems);
}

export default function TeamPreviewSection({
  teamMembers = DEMO_TEAM_MEMBERS,
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
