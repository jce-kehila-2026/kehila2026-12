import { useEffect, useRef, useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import CommunitySupportCta from '../components/CommunitySupportCta';
import PublicFooter from '../components/PublicFooter';
import JoinCommunityModal from '../components/JoinCommunityModal';
import VolunteerModal from '../components/VolunteerModal';
import DonationModal from '../components/DonationModal';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import usePublicHomeScrollReset from '../hooks/usePublicHomeScrollReset';
import { getFallbackPublicHomepageContent, getPublicHomepageContent } from '../services/publicContentService';
import { getDefaultPublicHomeDoc, getPublicHomeDoc } from '../services/publicPagesService';
import { PublicLocaleProvider, usePublicLocale } from '../context/PublicLocaleContext';
import '../styles/PublicHomePage.css';

function PublicDonationsPageContent() {
  const pageRef = useRef(null);
  const { direction, lang, t } = usePublicLocale();
  const [content, setContent] = useState(() => getFallbackPublicHomepageContent());
  const [publicHomeDoc, setPublicHomeDoc] = useState(() => getDefaultPublicHomeDoc());
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  useRevealOnScroll(pageRef, 'donations');
  usePublicHomeScrollReset(pageRef);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getPublicHomepageContent(), getPublicHomeDoc()]).then(([homepageContent, homeDoc]) => {
      if (isMounted) {
        setContent(homepageContent);
        setPublicHomeDoc(homeDoc);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className="public-homepage public-standalone-page public-donations-page"
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
        showHomeDropdown={false}
      />
      <main id="public-main">
        <CommunitySupportCta
          sectionId="donations"
          onDonationClick={() => setIsDonationModalOpen(true)}
        />
      </main>
      <PublicFooter organization={content.organization} contact={publicHomeDoc.contact} />
      <JoinCommunityModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
      <VolunteerModal isOpen={isVolunteerModalOpen} onClose={() => setIsVolunteerModalOpen(false)} />
      <DonationModal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} />
    </div>
  );
}

export default function PublicDonationsPage() {
  return (
    <PublicLocaleProvider>
      <PublicDonationsPageContent />
    </PublicLocaleProvider>
  );
}
