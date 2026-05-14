import { useEffect, useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import StatisticsSection from '../components/StatisticsSection';
import ShenaCenterSection from '../components/ShenaCenterSection';
import SupportAreasSection from '../components/SupportAreasSection';
import EventsPreviewSection from '../components/EventsPreviewSection';
import RecoveryJourneySection from '../components/RecoveryJourneySection';
import ArticlesPreviewSection from '../components/ArticlesPreviewSection';
import TeamPreviewSection from '../components/TeamPreviewSection';
import DonationSection from '../components/DonationSection';
import ContactSection from '../components/ContactSection';
import PublicFooter from '../components/PublicFooter';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { getFallbackPublicHomepageContent, getPublicHomepageContent } from '../services/publicContentService';
import '../styles/PublicHomePage.css';

export default function PublicHomePage() {
  const [content, setContent] = useState(() => getFallbackPublicHomepageContent());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      try {
        const homepageContent = await getPublicHomepageContent();
        if (isMounted) {
          setContent(homepageContent);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setContent(getFallbackPublicHomepageContent());
          setError(loadError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="public-homepage">
      <a className="public-skip-link" href="#public-main">
        Skip to main content
      </a>
      <PublicNavbar organization={content.organization} />
      <main id="public-main">
        {error ? (
          <ErrorState message="Some public content could not be loaded. Showing available information." />
        ) : null}
        {!loading && !content ? (
          <EmptyState message="Public homepage content is not available yet." />
        ) : null}
        <HeroSection hero={content.hero} loading={loading} />
        <AboutSection about={content.about} supportAreas={content.supportAreas} />
        <StatisticsSection statistics={content.statistics} isLoading={loading} />
        <ShenaCenterSection center={content.center} />
        <SupportAreasSection supportAreas={content.supportAreas} isLoading={loading} />
        <ArticlesPreviewSection articles={content.articles} isLoading={loading} />
        <TeamPreviewSection teamMembers={content.teamMembers} isLoading={loading} />
        <EventsPreviewSection events={content.events} isLoading={loading} />
        <RecoveryJourneySection journey={content.recoveryJourney} />
        <DonationSection donation={content.donation} />
        <ContactSection contact={content.contact} organization={content.organization} />
      </main>
      <PublicFooter organization={content.organization} contact={content.contact} />
    </div>
  );
}
