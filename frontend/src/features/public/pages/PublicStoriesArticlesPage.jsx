import { useEffect, useMemo, useRef, useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import InspirationStoriesSection from '../components/InspirationStoriesSection';
import ArticlesPreviewSection from '../components/ArticlesPreviewSection';
import PublicFooter from '../components/PublicFooter';
import JoinCommunityModal from '../components/JoinCommunityModal';
import VolunteerModal from '../components/VolunteerModal';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import usePublicHomeScrollReset from '../hooks/usePublicHomeScrollReset';
import { getFallbackPublicHomepageContent, getPublicHomepageContent } from '../services/publicContentService';
import { getDefaultPublicHomeDoc, getPublicHomeDoc } from '../services/publicPagesService';
import { PublicLocaleProvider, usePublicLocale } from '../context/PublicLocaleContext';
import '../styles/PublicHomePage.css';

function PublicStoriesArticlesPageContent() {
  const pageRef = useRef(null);
  const { direction, lang, t } = usePublicLocale();
  const [content, setContent] = useState(() => getFallbackPublicHomepageContent());
  const [publicHomeDoc, setPublicHomeDoc] = useState(() => getDefaultPublicHomeDoc());
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const revealRefreshKey = useMemo(
    () => `${publicHomeDoc.inspirationalStories?.length || 0}:${publicHomeDoc.pressCoverage?.length || 0}`,
    [publicHomeDoc.inspirationalStories?.length, publicHomeDoc.pressCoverage?.length],
  );

  useRevealOnScroll(pageRef, revealRefreshKey);
  usePublicHomeScrollReset(pageRef, { preserveInitialHash: true });

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      const [homepageContent, homeDoc] = await Promise.all([
        getPublicHomepageContent(),
        getPublicHomeDoc(),
      ]);

      if (isMounted) {
        setContent(homepageContent);
        setPublicHomeDoc(homeDoc);
      }
    }

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="public-homepage" ref={pageRef} dir={direction} lang={lang}>
      <a className="public-skip-link" href="#public-main">
        {t('skipToContent')}
      </a>
      <PublicNavbar
        organization={content.organization}
        onJoinClick={() => setIsJoinModalOpen(true)}
        onVolunteerClick={() => setIsVolunteerModalOpen(true)}
        showHomeDropdown={false}
      />
      <main id="public-main">
        <InspirationStoriesSection stories={publicHomeDoc.inspirationalStories} />
        <ArticlesPreviewSection coverage={publicHomeDoc.pressCoverage} />
      </main>
      <PublicFooter organization={content.organization} contact={content.contact} />
      <JoinCommunityModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
      <VolunteerModal isOpen={isVolunteerModalOpen} onClose={() => setIsVolunteerModalOpen(false)} />
    </div>
  );
}

export default function PublicStoriesArticlesPage() {
  return (
    <PublicLocaleProvider>
      <PublicStoriesArticlesPageContent />
    </PublicLocaleProvider>
  );
}
