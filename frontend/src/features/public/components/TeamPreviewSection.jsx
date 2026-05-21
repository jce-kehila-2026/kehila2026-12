import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import PublicSectionHeading from './PublicSectionHeading';
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
  maxItems = 3,
  isLoading = false,
  hasError = false,
}) {
  const visibleTeamMembers = getVisibleTeamMembers(teamMembers, maxItems);

  return (
    <section className="public-section public-section--team-preview" id="stories" aria-labelledby="public-team-title">
      <PublicSectionHeading
        eyebrow="קולות מהקהילה"
        title="סיפורי השראה"
        titleId="public-team-title"
        subtitle="סיפורים אמיתיים של נשים שמצאו תמיכה, כוח ותקווה במסע שלהן."
      />

      {isLoading ? (
        <LoadingState message="טוענות סיפורי השראה..." />
      ) : hasError ? (
        <ErrorState message="לא ניתן לטעון את סיפורי ההשראה. נסי שוב מאוחר יותר." />
      ) : visibleTeamMembers.length ? (
        <div className="public-team-grid stagger-children">
          {visibleTeamMembers.map((member) => (
            <TeamMemberCard member={member} key={member.id || member.name} />
          ))}
        </div>
      ) : (
        <EmptyState message="סיפורי ההשראה יופיעו כאן כאשר התוכן הציבורי יהיה זמין." />
      )}
    </section>
  );
}
