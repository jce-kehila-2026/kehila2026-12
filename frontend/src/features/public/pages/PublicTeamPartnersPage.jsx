import { useEffect, useMemo, useRef, useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import TeamSection from '../components/TeamSection';
import MedicalPartnersSection from '../components/MedicalPartnersSection';
import PublicFooter from '../components/PublicFooter';
import JoinCommunityModal from '../components/JoinCommunityModal';
import VolunteerModal from '../components/VolunteerModal';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import usePublicHomeScrollReset from '../hooks/usePublicHomeScrollReset';
import { getFallbackPublicHomepageContent, getPublicHomepageContent } from '../services/publicContentService';
import { getDefaultPublicHomeDoc, getPublicHomeDoc } from '../services/publicPagesService';
import { PublicLocaleProvider, usePublicLocale } from '../context/PublicLocaleContext';
import '../styles/PublicHomePage.css';

function PublicTeamPartnersPageContent() {
  const pageRef = useRef(null);
  const { direction, lang, locale, t } = usePublicLocale();
  const [content, setContent] = useState(() => getFallbackPublicHomepageContent());
  const [publicHomeDoc, setPublicHomeDoc] = useState(() => getDefaultPublicHomeDoc());
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const revealRefreshKey = useMemo(
    () => `${locale}:${publicHomeDoc.teamMembers?.length || 0}:${publicHomeDoc.partners?.length || 0}`,
    [locale, publicHomeDoc.partners?.length, publicHomeDoc.teamMembers?.length],
  );

  useRevealOnScroll(pageRef, revealRefreshKey);
  usePublicHomeScrollReset(pageRef, {
    resetAfterLoad: true,
    isLoading: isContentLoading,
    preserveInitialHash: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      try {
        const [homepageContent, homeDoc] = await Promise.all([
          getPublicHomepageContent(),
          getPublicHomeDoc(),
        ]);

        if (isMounted) {
          setContent(homepageContent);
          setPublicHomeDoc(homeDoc);
        }
      } finally {
        if (isMounted) {
          setIsContentLoading(false);
        }
      }
    }

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className="public-homepage public-standalone-page public-team-partners-page"
      ref={pageRef}
      dir={direction}
      lang={lang}
    >
      <a className="public-skip-link" href="#public-main">
        {t('skipToContent')}
      </a>
      <PublicNavbar
        organization={content.organization}
        onJoinClick={() => setIsJoinModalOpen(true)}
        onVolunteerClick={() => setIsVolunteerModalOpen(true)}
      />
      <main id="public-main">
        <TeamSection members={publicHomeDoc.teamMembers} />
        <MedicalPartnersSection partners={publicHomeDoc.partners} />
      </main>
      <PublicFooter organization={content.organization} contact={publicHomeDoc.contact} />
      <JoinCommunityModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
      <VolunteerModal isOpen={isVolunteerModalOpen} onClose={() => setIsVolunteerModalOpen(false)} />
    </div>
  );
}

export default function PublicTeamPartnersPage() {
  return (
    <PublicLocaleProvider>
      <PublicTeamPartnersPageContent />
    </PublicLocaleProvider>
  );
}
