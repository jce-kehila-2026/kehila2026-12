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
import { FALLBACK_CONTENT, getPublicHomepageContent } from '../services/publicContentService';
import '../styles/PublicHomePage.css';

function normalizeHomepageContent(homepageContent) {
  const safeContent = homepageContent && typeof homepageContent === 'object' ? homepageContent : {};
  const arrayOrFallback = (fieldName, legacyFieldName) => {
    if (Array.isArray(safeContent[fieldName])) {
      return safeContent[fieldName];
    }

    if (legacyFieldName && Array.isArray(safeContent[legacyFieldName])) {
      return safeContent[legacyFieldName];
    }

    return FALLBACK_CONTENT[fieldName];
  };

  return {
    ...FALLBACK_CONTENT,
    ...safeContent,
    organization: {
      ...FALLBACK_CONTENT.organization,
      ...(safeContent.organization || {}),
    },
    hero: {
      ...FALLBACK_CONTENT.hero,
      ...(safeContent.hero || {}),
    },
    about: {
      ...FALLBACK_CONTENT.about,
      ...(safeContent.about || {}),
    },
    contact: {
      ...FALLBACK_CONTENT.contact,
      ...(safeContent.contact || {}),
    },
    donation: {
      ...FALLBACK_CONTENT.donation,
      ...(safeContent.donation || {}),
    },
    center: {
      ...FALLBACK_CONTENT.center,
      ...(safeContent.center || {}),
    },
    statistics: arrayOrFallback('statistics'),
    supportAreas: arrayOrFallback('supportAreas'),
    articles: arrayOrFallback('articles'),
    teamMembers: arrayOrFallback('teamMembers', 'team'),
    events: arrayOrFallback('events'),
    recoveryJourney: {
      ...FALLBACK_CONTENT.recoveryJourney,
      ...(safeContent.recoveryJourney || safeContent.journey || {}),
    },
  };
}

export default function PublicHomePage() {
  const [content, setContent] = useState(FALLBACK_CONTENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      try {
        const homepageContent = await getPublicHomepageContent();
        if (isMounted) {
          setContent(normalizeHomepageContent(homepageContent));
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setContent(FALLBACK_CONTENT);
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
        <HeroSection hero={content.hero} organization={content.organization} loading={loading} />
        <AboutSection about={content.about} organization={content.organization} supportAreas={content.supportAreas} />
        <StatisticsSection statistics={content.statistics} isLoading={loading} />
        <ShenaCenterSection center={content.center} />
        <SupportAreasSection supportAreas={content.supportAreas} isLoading={loading} />
        <ArticlesPreviewSection articles={content.articles} isLoading={loading} />
        <TeamPreviewSection teamMembers={content.teamMembers} isLoading={loading} />
        <EventsPreviewSection events={content.events} isLoading={loading} />
        <RecoveryJourneySection journey={content.recoveryJourney} />
        <DonationSection donation={content.donation} organization={content.organization} />
        <ContactSection contact={content.contact} organization={content.organization} />
      </main>
      <PublicFooter organization={content.organization} contact={content.contact} />
    </div>
  );
}
