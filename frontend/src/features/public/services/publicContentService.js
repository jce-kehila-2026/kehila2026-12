// Public homepage content service.
//
// Commit 10 keeps the public website read-only and fallback-driven.
// These temporary values are here so the homepage can keep rendering while the
// Admin CMS and Firestore document contracts are finalized.
//
// Future Firestore work:
// - Real data should come from the same Firestore collections used by the Admin CMS.
// - Collection names and field names must be confirmed with the team before adding queries.
// - Only public, published, active, and visible content should be displayed here.
// - This service must remain read-only: no add, update, delete, or collection creation.
//
// When collection contracts are confirmed, import read helpers only, for example:
// import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
// import { db } from '../../../firebase';

const FALLBACK_HERO = {
  eyebrow: 'Support for women in recovery',
  title: 'She-Na: support for every step forward',
  message: 'A warm community helping recovering women find knowledge, care, and steady support.',
  supportText:
    'She-Na supports recovering women with respectful guidance, practical resources, and a caring place to turn to.',
  primaryAction: {
    label: 'Donate',
    href: '#donate',
  },
  secondaryAction: {
    label: 'Join / Get Support',
    href: '#contact',
  },
};

const FALLBACK_ABOUT = {
  title: 'About She-Na',
  intro: 'She-Na provides a welcoming space for programs, resources, and community-led support.',
  body:
    'The organization supports recovering women as they rebuild daily routines, strengthen wellbeing, and connect with people who understand their journey.',
};

const FALLBACK_STATISTICS = [
  {
    id: 'programs',
    value: '3+',
    label: 'Support areas',
    note: 'Placeholder until CMS data is connected.',
    isVisible: true,
    active: true,
  },
  {
    id: 'activities',
    value: '6',
    label: 'Activity types',
    note: 'Temporary planning number.',
    isVisible: true,
    active: true,
  },
  {
    id: 'community',
    value: '1',
    label: 'Recovery center',
    note: 'Prepared for verified public data.',
    isVisible: true,
    active: true,
  },
];

const FALLBACK_CENTER = {
  eyebrow: 'SHEna Center',
  title: 'A calm recovery center for steady support',
  description:
    'The SHEna center is a respectful place for recovering women to find guidance, practical tools, and community connection at a pace that feels safe.',
  activities: [
    'Support circles and listening spaces',
    'Workshops for daily routines and independence',
    'Guidance toward health and emotional wellbeing resources',
  ],
  ctaLabel: 'Join / Get Support',
  ctaHref: '#contact',
  isVisible: true,
  active: true,
};

const FALLBACK_SUPPORT_AREAS = [
  {
    id: 'independence',
    icon: 'I',
    title: 'Independence',
    description: 'Practical guidance for routines, confidence, and daily decisions.',
    isVisible: true,
    active: true,
  },
  {
    id: 'health',
    icon: 'H',
    title: 'Health',
    description: 'Support that respects care needs, body wellbeing, and personal pace.',
    isVisible: true,
    active: true,
  },
  {
    id: 'emotional-mental-support',
    icon: 'E',
    title: 'Emotional / Mental Support',
    description: 'Listening spaces, encouragement, and steady community connection.',
    isVisible: true,
    active: true,
  },
];

const FALLBACK_ARTICLES = [
  {
    id: 'demo-article-1',
    title: 'Finding Support in Community',
    description:
      'Simple guidance on reaching out, staying connected, and finding steady support during difficult seasons.',
    readMoreUrl: '#articles',
    isPublished: true,
    isVisible: true,
    active: true,
  },
  {
    id: 'demo-article-2',
    title: 'Practical Steps for Everyday Wellbeing',
    description:
      'Helpful reminders for building calm routines, asking for help, and making space for recovery.',
    readMoreUrl: '#articles',
    isPublished: true,
    isVisible: true,
    active: true,
  },
  {
    id: 'demo-article-3',
    title: 'Understanding Available Resources',
    description:
      'An introduction to the types of community programs, workshops, and support resources that may be available.',
    readMoreUrl: '#articles',
    isPublished: true,
    isVisible: true,
    active: true,
  },
];

const FALLBACK_TEAM_MEMBERS = [
  {
    id: 'demo-team-1',
    name: 'Maya Cohen',
    role: 'Community Programs Lead',
    description: 'Coordinates supportive programs and helps create a welcoming environment for every participant.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'demo-team-2',
    name: 'Lina Haddad',
    role: 'Participant Support Coordinator',
    description: 'Guides participants through available resources with care, privacy, and respect.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'demo-team-3',
    name: 'Noa Levi',
    role: 'Workshops Facilitator',
    description: 'Supports learning circles, community workshops, and practical wellbeing activities.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'demo-team-4',
    name: 'Sara Mansour',
    role: 'Volunteer Relations',
    description: 'Builds thoughtful connections between volunteers, staff, and community needs.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
];

const FALLBACK_EVENTS = [
  {
    id: 'demo-event-1',
    title: 'Community Support Circle',
    description:
      'A welcoming group session for sharing, listening, and finding steady support in community.',
    startDate: '2026-06-12',
    dateLabel: 'June 12, 2026',
    time: '17:00',
    location: 'She-Na Community Center',
    isPublic: true,
    isVisible: true,
    active: true,
    status: 'upcoming',
  },
  {
    id: 'demo-event-2',
    title: 'Wellbeing Skills Workshop',
    description:
      'Practical tools for building calm routines, setting boundaries, and navigating difficult days.',
    startDate: '2026-06-19',
    dateLabel: 'June 19, 2026',
    time: '10:30',
    location: 'Online',
    isPublic: true,
    isVisible: true,
    active: true,
    status: 'upcoming',
  },
  {
    id: 'demo-event-3',
    title: 'Resource Guidance Session',
    description:
      'A short introduction to available support services, community programs, and next steps.',
    startDate: '2026-06-26',
    dateLabel: 'June 26, 2026',
    time: '14:00',
    location: 'She-Na Center Hall',
    isPublic: true,
    isVisible: true,
    active: true,
    status: 'upcoming',
  },
];

const FALLBACK_RECOVERY_JOURNEY = {
  eyebrow: 'Recovery Journey',
  title: 'A steady path of support',
  description:
    'Every person moves through change differently. She-Na offers a calm, respectful space for each part of the journey.',
  stages: [
    {
      id: 'before',
      label: 'Before',
      title: 'What was',
      description:
        'A gentle look at the needs, questions, and experiences that may bring someone to seek support.',
      isVisible: true,
    },
    {
      id: 'during',
      label: 'During',
      title: 'What is happening',
      description:
        'Support is offered step by step through listening, guidance, community programs, and steady care.',
      isVisible: true,
    },
    {
      id: 'after',
      label: 'After',
      title: 'What will happen',
      description:
        'The journey continues with practical tools, connection, and space to move forward at a personal pace.',
      isVisible: true,
    },
  ],
  isVisible: true,
  active: true,
};

const FALLBACK_DONATION = {
  eyebrow: 'Support',
  title: 'Help She-Na grow community programs',
  description:
    'Your support helps keep welcoming programs, resources, and community care available. Online giving will be connected later through the admin-managed donation link.',
  buttonLabel: 'Donate',
  href: '#contact',
  isVisible: true,
  active: true,
};

const FALLBACK_CONTACT = {
  eyebrow: 'Contact',
  title: 'Get in touch',
  description:
    'Contact details shown here are temporary placeholders until the public site content is managed from the admin CMS.',
  email: 'contact@example.org',
  phone: 'Phone number coming soon',
  address: 'Location details coming soon',
  socialLinks: [
    { id: 'facebook', label: 'Facebook', href: '#contact', isVisible: true },
    { id: 'instagram', label: 'Instagram', href: '#contact', isVisible: true },
  ],
  footerText: 'Public community information. Final contact details will be managed from the admin content system.',
  isVisible: true,
  active: true,
};

const FALLBACK_ORGANIZATION = {
  name: 'She-Na',
  tagline: FALLBACK_HERO.eyebrow,
  description: FALLBACK_ABOUT.intro,
  email: FALLBACK_CONTACT.email,
  phone: '',
  address: '',
};

export const FALLBACK_CONTENT = {
  organization: FALLBACK_ORGANIZATION,
  hero: FALLBACK_HERO,
  about: FALLBACK_ABOUT,
  statistics: FALLBACK_STATISTICS,
  center: FALLBACK_CENTER,
  supportAreas: FALLBACK_SUPPORT_AREAS,
  articles: FALLBACK_ARTICLES,
  team: FALLBACK_TEAM_MEMBERS,
  teamMembers: FALLBACK_TEAM_MEMBERS,
  events: FALLBACK_EVENTS,
  journey: FALLBACK_RECOVERY_JOURNEY,
  recoveryJourney: FALLBACK_RECOVERY_JOURNEY,
  donation: FALLBACK_DONATION,
  contact: FALLBACK_CONTACT,
};

function cloneFallback(value) {
  return JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isVisiblePublicContent(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const isPublic = item.isPublic !== false && item.public !== false;
  const isVisible = item.isVisible !== false && item.visible !== false && item.hidden !== true;
  const isPublished = item.isPublished !== false && item.published !== false;
  const isActive = item.active !== false && item.status !== 'inactive';
  const isDraft = item.status === 'draft' || item.status === 'unpublished';
  const isCancelled = item.cancelled === true || item.status === 'cancelled';

  return isPublic && isVisible && isPublished && isActive && !isDraft && !isCancelled;
}

function isUpcomingEvent(event) {
  if (!event?.startDate && !event?.date) {
    return true;
  }

  const eventDate = new Date(event.startDate || event.date);

  if (Number.isNaN(eventDate.getTime())) {
    return true;
  }

  return eventDate >= new Date();
}

function withFallbackArray(items, fallbackItems, maxItems) {
  const visibleItems = asArray(items).filter(isVisiblePublicContent);
  const safeItems = visibleItems.length ? visibleItems : cloneFallback(fallbackItems);

  return typeof maxItems === 'number' ? safeItems.slice(0, maxItems) : safeItems;
}

// Firestore query placeholders belong here after collection names are confirmed.
// Example shape only:
// async function getConfirmedPublicDocs(collectionName, constraints = []) {
//   const docsQuery = query(collection(db, collectionName), ...constraints);
//   const snapshot = await getDocs(docsQuery);
//   return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
// }

export async function getPublicStatistics() {
  return cloneFallback(FALLBACK_STATISTICS).filter(isVisiblePublicContent);
}

export async function getSupportAreas() {
  return cloneFallback(FALLBACK_SUPPORT_AREAS).filter(isVisiblePublicContent);
}

export async function getPublishedArticles(maxItems = 3) {
  return withFallbackArray(FALLBACK_ARTICLES, FALLBACK_ARTICLES, maxItems);
}

export async function getVisibleTeamMembers(maxItems = 4) {
  return withFallbackArray(FALLBACK_TEAM_MEMBERS, FALLBACK_TEAM_MEMBERS, maxItems);
}

export async function getPublicUpcomingEvents(maxItems = 3) {
  return withFallbackArray(FALLBACK_EVENTS, FALLBACK_EVENTS, maxItems).filter(isUpcomingEvent);
}

export async function getRecoveryJourney() {
  const journey = cloneFallback(FALLBACK_RECOVERY_JOURNEY);

  return {
    ...journey,
    stages: asArray(journey.stages).filter((stage) => stage.isVisible !== false && stage.hidden !== true),
  };
}

export async function getDonationSettings() {
  return cloneFallback(FALLBACK_DONATION);
}

export async function getContactInfo() {
  const contact = cloneFallback(FALLBACK_CONTACT);

  return {
    ...contact,
    socialLinks: asArray(contact.socialLinks).filter(isVisiblePublicContent),
  };
}

export async function getHomepageContent() {
  const [
    statistics,
    supportAreas,
    articles,
    teamMembers,
    events,
    recoveryJourney,
    donation,
    contact,
  ] = await Promise.all([
    getPublicStatistics(),
    getSupportAreas(),
    getPublishedArticles(),
    getVisibleTeamMembers(),
    getPublicUpcomingEvents(),
    getRecoveryJourney(),
    getDonationSettings(),
    getContactInfo(),
  ]);

  return {
    organization: cloneFallback(FALLBACK_ORGANIZATION),
    hero: cloneFallback(FALLBACK_HERO),
    about: cloneFallback(FALLBACK_ABOUT),
    statistics,
    center: cloneFallback(FALLBACK_CENTER),
    supportAreas,
    articles,
    team: teamMembers,
    teamMembers,
    events,
    journey: recoveryJourney,
    recoveryJourney,
    donation,
    contact,
  };
}

// Backward-compatible name used by the current public page. Components can move
// to getHomepageContent() in a later commit without changing the data contract.
export async function getPublicHomepageContent() {
  return getHomepageContent();
}
