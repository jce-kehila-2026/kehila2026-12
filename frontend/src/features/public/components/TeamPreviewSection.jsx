import { useMemo } from 'react';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';
import PublicSectionHeading from './PublicSectionHeading';
import TeamMemberCard from './TeamMemberCard';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeTeamStories } from '../i18n/publicHomeContentLocalization';

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
  const { locale, t } = usePublicLocale();
  const visibleTeamMembers = useMemo(() => {
    const visible = getVisibleTeamMembers(teamMembers, maxItems);
    return localizeTeamStories(visible, locale);
  }, [locale, maxItems, teamMembers]);

  return (
    <section className="public-section public-section--team-preview" id="stories" aria-labelledby="public-team-title">
      <PublicSectionHeading
        eyebrow={t('storiesEyebrow')}
        title={t('storiesTitle')}
        titleId="public-team-title"
        subtitle={t('storiesSubtitle')}
      />

      {isLoading ? (
        <LoadingState message={t('loadingStories')} />
      ) : hasError ? (
        <ErrorState message={t('errorStories')} />
      ) : visibleTeamMembers.length ? (
        <div className="public-team-grid stagger-children">
          {visibleTeamMembers.map((member) => (
            <TeamMemberCard member={member} key={member.id || member.name} />
          ))}
        </div>
      ) : (
        <EmptyState message={t('emptyStories')} />
      )}
    </section>
  );
}
