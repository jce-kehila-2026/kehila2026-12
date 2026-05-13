import { useEffect, useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import StatisticsSection from '../components/StatisticsSection';
import ShenaCenterSection from '../components/ShenaCenterSection';
import SupportAreasSection from '../components/SupportAreasSection';
import EventsPreview from '../components/EventsPreview';
import ArticlesPreview from '../components/ArticlesPreview';
import TeamSection from '../components/TeamSection';
import DonationSection from '../components/DonationSection';
import ContactSection from '../components/ContactSection';
import PublicFooter from '../components/PublicFooter';
import { FALLBACK_CONTENT, getPublicHomepageContent } from '../services/publicContentService';
import '../styles/PublicHomePage.css';

export default function PublicHomePage() {
  const [content, setContent] = useState(FALLBACK_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      try {
        const homepageContent = await getPublicHomepageContent();
        if (isMounted) {
          setContent(homepageContent);
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
      <PublicNavbar organization={content.organization} />
      <main>
        <HeroSection organization={content.organization} loading={loading} />
        <AboutSection organization={content.organization} />
        <StatisticsSection />
        <ShenaCenterSection />
        <SupportAreasSection />
        <EventsPreview events={content.events} />
        <ArticlesPreview articles={content.articles} />
        <TeamSection team={content.team} />
        <DonationSection organization={content.organization} />
        <ContactSection organization={content.organization} />
      </main>
      <PublicFooter organization={content.organization} />
    </div>
  );
}
