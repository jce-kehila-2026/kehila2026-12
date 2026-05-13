import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase';

const FALLBACK_CONTENT = {
  organization: {
    name: 'She-Na',
    tagline: 'Community support, guidance, and growth for women.',
    description:
      'She-Na provides a welcoming space for programs, resources, and community-led support.',
    email: 'info@she-na.org',
    phone: '',
    address: '',
  },
  events: [
    {
      id: 'fallback-event-1',
      title: 'Community Support Circle',
      description:
        'A welcoming group session for sharing, listening, and finding steady support in community.',
      startDate: '2026-06-12',
      dateLabel: 'June 12, 2026',
      time: '17:00',
      location: 'She-Na Community Center',
      isPublic: true,
      active: true,
      status: 'upcoming',
    },
    {
      id: 'fallback-event-2',
      title: 'Wellbeing Skills Workshop',
      description:
        'Practical tools for building calm routines, setting boundaries, and navigating difficult days.',
      startDate: '2026-06-19',
      dateLabel: 'June 19, 2026',
      time: '10:30',
      location: 'Online',
      isPublic: true,
      active: true,
      status: 'upcoming',
    },
    {
      id: 'fallback-event-3',
      title: 'Resource Guidance Session',
      description:
        'A short introduction to available support services, community programs, and next steps.',
      startDate: '2026-06-26',
      dateLabel: 'June 26, 2026',
      time: '14:00',
      location: 'She-Na Center Hall',
      isPublic: true,
      active: true,
      status: 'upcoming',
    },
  ],
  articles: [
    {
      id: 'fallback-article-1',
      title: 'Latest Updates',
      content: 'Articles and news from the organization will appear here.',
    },
    {
      id: 'fallback-article-2',
      title: 'Community Stories',
      content: 'Public CMS content can highlight stories, announcements, and resources.',
    },
  ],
  team: [
    {
      id: 'fallback-team-1',
      name: 'Our Team',
      role: 'She-Na',
      description: 'Team profiles will appear here once they are published in the CMS.',
    },
  ],
};

function normalizeDoc(docSnapshot) {
  return {
    id: docSnapshot.id,
    ...docSnapshot.data(),
  };
}

function normalizeOrganization(items) {
  const primary = items[0];

  if (!primary) {
    return FALLBACK_CONTENT.organization;
  }

  return {
    ...FALLBACK_CONTENT.organization,
    ...primary,
    name: primary.title || primary.name || FALLBACK_CONTENT.organization.name,
    description: primary.content || primary.description || FALLBACK_CONTENT.organization.description,
  };
}

async function fetchCollection(collectionName, maxItems = 6) {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(query(collectionRef, orderBy('createdAt', 'desc'), limit(maxItems)));
    return snapshot.docs.map(normalizeDoc);
  } catch (error) {
    console.warn(`Public content fetch failed for ${collectionName}:`, error);
    return [];
  }
}

export async function getPublicHomepageContent() {
  const [orgInfo, articles] = await Promise.all([
    fetchCollection('org_info', 1),
    fetchCollection('articles', 3),
  ]);

  return {
    organization: normalizeOrganization(orgInfo),
    events: FALLBACK_CONTENT.events,
    articles: articles.length ? articles : FALLBACK_CONTENT.articles,
    team: FALLBACK_CONTENT.team,
  };
}

export { FALLBACK_CONTENT };
