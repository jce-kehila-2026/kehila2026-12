import { useEffect, useMemo, useRef, useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import StatisticsSection from '../components/StatisticsSection';
import SupportAreasSection from '../components/SupportAreasSection';
import TeamPreviewSection from '../components/TeamPreviewSection';
import DonationSection from '../components/DonationSection';
import ArticlesPreviewSection from '../components/ArticlesPreviewSection';
import EventsPreviewSection from '../components/EventsPreviewSection';
import ContactSection from '../components/ContactSection';
import PublicFooter from '../components/PublicFooter';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import usePublicHomeScrollReset from '../hooks/usePublicHomeScrollReset';
import { getFallbackPublicHomepageContent, getPublicHomepageContent } from '../services/publicContentService';
import '../styles/PublicHomePage.css';

export default function PublicHomePage() {
  const pageRef = useRef(null);
  const [content, setContent] = useState(() => getFallbackPublicHomepageContent());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const revealRefreshKey = useMemo(
    () => [
      loading ? 'loading' : 'ready',
      content.supportAreas?.length || 0,
      content.statistics?.length || 0,
      content.teamMembers?.length || 0,
      content.articles?.length || 0,
      content.events?.length || 0,
    ].join(':'),
    [
      content.articles?.length,
      content.events?.length,
      content.statistics?.length,
      content.supportAreas?.length,
      content.teamMembers?.length,
      loading,
    ],
  );

  useRevealOnScroll(pageRef, revealRefreshKey);
  usePublicHomeScrollReset(pageRef, { resetAfterLoad: true, isLoading: loading });

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
    <div className="public-homepage" ref={pageRef}>
      <a className="public-skip-link" href="#public-main">
        דילוג לתוכן המרכזי
      </a>
      <PublicNavbar organization={content.organization} />
      <main id="public-main">
        {error ? (
          <ErrorState message="חלק מהתוכן הציבורי לא נטען. מציגות את המידע הזמין." />
        ) : null}
        {!loading && !content ? (
          <EmptyState message="תוכן דף הבית הציבורי עדיין לא זמין." />
        ) : null}
        <HeroSection hero={content.hero} loading={loading} />
        <AboutSection about={content.about} supportAreas={content.supportAreas} />
        <SupportAreasSection supportAreas={content.supportAreas} isLoading={loading} />
        <StatisticsSection statistics={content.statistics} isLoading={loading} />
        <TeamPreviewSection teamMembers={content.teamMembers} isLoading={loading} />
        <ArticlesPreviewSection articles={content.articles} isLoading={loading} hasError={error} />
        <EventsPreviewSection events={content.events} isLoading={loading} hasError={error} />
        <DonationSection donation={content.donation} />
        <ContactSection contact={content.contact} organization={content.organization} />
      </main>
      <PublicFooter organization={content.organization} contact={content.contact} />
    </div>
  );
}
