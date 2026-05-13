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
      title: 'Community Workshop',
      date: 'Coming soon',
      content: 'Upcoming public activities will appear here once they are published.',
    },
    {
      id: 'fallback-event-2',
      title: 'Support Circle',
      date: 'Coming soon',
      content: 'CMS-managed event previews can be connected when the collection is confirmed.',
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
      title: 'Our Team',
      content: 'Team profiles will appear here once they are published in the CMS.',
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
  const [orgInfo, articles, teamProfiles] = await Promise.all([
    fetchCollection('org_info', 1),
    fetchCollection('articles', 3),
    fetchCollection('team_profiles', 4),
  ]);

  return {
    organization: normalizeOrganization(orgInfo),
    events: FALLBACK_CONTENT.events,
    articles: articles.length ? articles : FALLBACK_CONTENT.articles,
    team: teamProfiles.length ? teamProfiles : FALLBACK_CONTENT.team,
  };
}

export { FALLBACK_CONTENT };
