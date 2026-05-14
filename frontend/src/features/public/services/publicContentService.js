import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase';

// Public homepage content service.
//
// This service is read-only. It only reads from Firestore collections already
// used elsewhere in the project, and falls back to static content whenever a
// public content contract is missing, empty, or unavailable.

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
    value: 'TBD',
    label: 'Support areas',
    note: 'Verified public data will be added later.',
    isVisible: true,
    active: true,
  },
  {
    id: 'activities',
    value: 'TBD',
    label: 'Activity types',
    note: 'Public activity details are being prepared.',
    isVisible: true,
    active: true,
  },
  {
    id: 'community',
    value: 'TBD',
    label: 'Community services',
    note: 'Numbers will appear after review.',
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
    id: 'fallback-article-1',
    title: 'Finding Support in Community',
    description:
      'Simple guidance on reaching out, staying connected, and finding steady support during difficult seasons.',
    readMoreUrl: '#articles',
    isPublished: true,
    isVisible: true,
    active: true,
  },
  {
    id: 'fallback-article-2',
    title: 'Practical Steps for Everyday Wellbeing',
    description:
      'Helpful reminders for building calm routines, asking for help, and making space for recovery.',
    readMoreUrl: '#articles',
    isPublished: true,
    isVisible: true,
    active: true,
  },
  {
    id: 'fallback-article-3',
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
    id: 'fallback-team-1',
    name: 'Community Programs',
    role: 'Program coordination',
    description: 'Coordinates supportive programs and helps create a welcoming environment for every participant.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'fallback-team-2',
    name: 'Participant Support',
    role: 'Resource guidance',
    description: 'Guides participants through available resources with care, privacy, and respect.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'fallback-team-3',
    name: 'Workshops',
    role: 'Learning and wellbeing',
    description: 'Supports learning circles, community workshops, and practical wellbeing activities.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'fallback-team-4',
    name: 'Volunteer Relations',
    role: 'Community coordination',
    description: 'Builds thoughtful connections between volunteers, staff, and community needs.',
    isVisible: true,
    isPublished: true,
    active: true,
  },
];

const FALLBACK_EVENTS = [
  {
    id: 'fallback-event-1',
    title: 'Community Support Circle',
    description:
      'A welcoming group session for sharing, listening, and finding steady support in community.',
    dateLabel: 'Schedule to be announced',
    time: '',
    location: 'Location to be announced',
    isPublic: true,
    isVisible: true,
    active: true,
    status: 'upcoming',
  },
  {
    id: 'fallback-event-2',
    title: 'Wellbeing Skills Workshop',
    description:
      'Practical tools for building calm routines, setting boundaries, and navigating difficult days.',
    dateLabel: 'Schedule to be announced',
    time: '',
    location: 'Location to be announced',
    isPublic: true,
    isVisible: true,
    active: true,
    status: 'upcoming',
  },
  {
    id: 'fallback-event-3',
    title: 'Resource Guidance Session',
    description:
      'A short introduction to available support services, community programs, and next steps.',
    dateLabel: 'Schedule to be announced',
    time: '',
    location: 'Location to be announced',
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
  href: '#donate',
  isVisible: true,
  active: true,
};

const FALLBACK_CONTACT = {
  eyebrow: 'Contact',
  title: 'Get in touch',
  description:
    'Contact details will be published here when they are ready for the public website.',
  email: '',
  phone: 'Phone number coming soon',
  address: 'Location details coming soon',
  socialLinks: [],
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

function warnAndFallback(message, error) {
  if (error) {
    console.warn(`[publicContentService] ${message}`, error);
  } else {
    console.warn(`[publicContentService] ${message}`);
  }
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function textOrFallback(value, fallbackValue) {
  return hasText(value) ? value.trim() : fallbackValue;
}

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(date) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toTimeKey(date, fallback = '') {
  if (!date) return fallback;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function formatDateLabel(date) {
  if (!date) return '';

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function firstTextValue(...values) {
  return values.find(hasText)?.trim() || '';
}

function stripHtml(value) {
  return hasText(value) ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
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

function isVisiblePublicArticle(article) {
  if (!article || typeof article !== 'object') {
    return false;
  }

  const isPublic = article.isPublic !== false && article.public !== false;
  const isVisible = article.isVisible !== false && article.visible !== false && article.hidden !== true;
  const isPublished = article.isPublished !== false && article.published !== false;
  const isActive = article.active !== false && article.status !== 'inactive';
  const isDraft = article.status === 'draft' || article.status === 'unpublished';

  return isPublic && isVisible && isPublished && isActive && !isDraft;
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

async function getConfirmedPublicDocs(collectionName, constraints = []) {
  const docsQuery = constraints.length
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);
  const snapshot = await getDocs(docsQuery);
  return snapshot.docs.map((documentSnapshot) => ({ id: documentSnapshot.id, ...documentSnapshot.data() }));
}

async function getConfirmedPublicDoc(collectionName, documentId) {
  const snapshot = await getDoc(doc(db, collectionName, documentId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

function normalizeEvent(docData, fallbackEvent = {}) {
  const startDate = toDate(docData.startTime);
  const title = textOrFallback(docData.title, fallbackEvent.title || 'She-Na Event');
  const description = textOrFallback(docData.description, fallbackEvent.description || '');

  if (!title || !description || !startDate) {
    return null;
  }

  return {
    ...fallbackEvent,
    id: docData.id || fallbackEvent.id,
    title,
    category: docData.category || fallbackEvent.category || '',
    description,
    startDate: startDate.toISOString(),
    startTime: startDate.toISOString(),
    date: toDateKey(startDate),
    dateLabel: formatDateLabel(startDate),
    time: toTimeKey(startDate, fallbackEvent.time || ''),
    location: textOrFallback(docData.location, fallbackEvent.location || ''),
    maxParticipants: Number(docData.maxParticipants) || 0,
    isPublic: true,
    isVisible: true,
    isPublished: docData.status === 'published',
    active: docData.status === 'published',
    status: docData.status || 'published',
  };
}

function normalizeArticle(docData, fallbackArticle = {}) {
  const content = firstTextValue(docData.content, docData.body, docData.text, fallbackArticle.content);
  const title = firstTextValue(docData.title, docData.name, fallbackArticle.title);
  const description = firstTextValue(
    docData.description,
    docData.summary,
    docData.excerpt,
    stripHtml(content),
    fallbackArticle.description,
  );

  if (!title || !description) {
    return null;
  }

  const imageUrl = firstTextValue(
    docData.imageUrl,
    docData.imageURL,
    docData.image,
    docData.thumbnailUrl,
    docData.coverImage,
    fallbackArticle.imageUrl,
  );
  const publishedDate = toDate(docData.publishedAt || docData.publishDate || docData.createdAt || docData.updatedAt);

  return {
    ...fallbackArticle,
    id: docData.id || fallbackArticle.id,
    title,
    description,
    content,
    imageUrl,
    imageAlt: firstTextValue(docData.imageAlt, docData.altText, title),
    readMoreUrl: firstTextValue(docData.readMoreUrl, docData.url, docData.link, fallbackArticle.readMoreUrl) || '#articles',
    publishedAt: publishedDate ? publishedDate.toISOString() : docData.publishedAt || docData.createdAt || '',
    isPublic: docData.isPublic !== false && docData.public !== false,
    isVisible: docData.isVisible !== false && docData.visible !== false && docData.hidden !== true,
    isPublished: docData.isPublished !== false && docData.published !== false && docData.status !== 'draft' && docData.status !== 'unpublished',
    active: docData.active !== false && docData.status !== 'inactive',
    status: docData.status || fallbackArticle.status || 'published',
  };
}

function hasOwnField(item, fieldName) {
  return Object.prototype.hasOwnProperty.call(item, fieldName);
}

function isVisiblePublicTeamMember(member) {
  if (!member || typeof member !== 'object') {
    return false;
  }

  if (member.hidden === true || member.status === 'inactive' || member.status === 'draft' || member.status === 'unpublished') {
    return false;
  }

  const falseWhenPresentFields = ['isVisible', 'visible', 'isPublished', 'published', 'active', 'isPublic', 'public'];

  return falseWhenPresentFields.every((fieldName) => !hasOwnField(member, fieldName) || member[fieldName] !== false);
}

function normalizeTeamMember(docData) {
  const name = firstTextValue(
    docData.name,
    docData.fullName,
    docData.displayName,
    docData.title,
  );
  const role = firstTextValue(
    docData.role,
    docData.position,
    docData.jobTitle,
    docData.subtitle,
  );
  const content = firstTextValue(docData.content, docData.bio, docData.body, docData.text);
  const description = firstTextValue(
    docData.description,
    docData.summary,
    docData.excerpt,
    stripHtml(content),
  );

  if (!name && !description) {
    return null;
  }

  return {
    id: docData.id,
    name: name || 'Team member',
    title: docData.title || name || '',
    role,
    position: role,
    description,
    content,
    imageUrl: firstTextValue(
      docData.imageUrl,
      docData.imageURL,
      docData.photoUrl,
      docData.photoURL,
      docData.avatarUrl,
      docData.avatarURL,
      docData.image,
      docData.photo,
      docData.avatar,
    ),
    imageAlt: firstTextValue(docData.imageAlt, docData.altText, name ? `${name} profile photo` : ''),
    isPublic: docData.isPublic !== false && docData.public !== false,
    isVisible: docData.isVisible !== false && docData.visible !== false && docData.hidden !== true,
    isPublished: docData.isPublished !== false && docData.published !== false && docData.status !== 'draft' && docData.status !== 'unpublished',
    active: docData.active !== false && docData.status !== 'inactive',
    status: docData.status || 'published',
    order: docData.order ?? docData.displayOrder ?? docData.sortOrder ?? 0,
    createdAt: docData.createdAt || '',
    updatedAt: docData.updatedAt || '',
  };
}

function compareTeamMembers(left, right) {
  const leftOrder = Number(left.order);
  const rightOrder = Number(right.order);

  if (Number.isFinite(leftOrder) && Number.isFinite(rightOrder) && leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  const leftDate = toDate(left.updatedAt || left.createdAt);
  const rightDate = toDate(right.updatedAt || right.createdAt);

  if (!leftDate && !rightDate) return 0;
  if (!leftDate) return 1;
  if (!rightDate) return -1;

  return rightDate.getTime() - leftDate.getTime();
}

export async function getPublicStatistics() {
  // TODO: Connect statistics after the CMS confirms a collection/document contract
  // and public visibility fields for homepage metrics.
  return cloneFallback(FALLBACK_STATISTICS).filter(isVisiblePublicContent);
}

export async function getSupportAreas() {
  // TODO: Connect support areas after the CMS confirms a collection/document
  // contract and public visibility fields for support area cards.
  return cloneFallback(FALLBACK_SUPPORT_AREAS).filter(isVisiblePublicContent);
}

export async function getPublishedArticles(maxItems = 3) {
  try {
    const docs = await getConfirmedPublicDocs('articles');
    const articles = docs
      .map((articleDoc, index) => normalizeArticle(articleDoc, FALLBACK_ARTICLES[index]))
      .filter(Boolean)
      .filter(isVisiblePublicArticle)
      .sort((left, right) => {
        const leftDate = toDate(left.publishedAt);
        const rightDate = toDate(right.publishedAt);

        if (!leftDate && !rightDate) return 0;
        if (!leftDate) return 1;
        if (!rightDate) return -1;

        return rightDate.getTime() - leftDate.getTime();
      });

    return articles.length ? articles.slice(0, maxItems) : cloneFallback(FALLBACK_ARTICLES).slice(0, maxItems);
  } catch (error) {
    warnAndFallback('Failed to load public articles from Firestore. Using fallback articles.', error);
    return cloneFallback(FALLBACK_ARTICLES).slice(0, maxItems);
  }
}

export async function getVisibleTeamMembers(maxItems = 4) {
  try {
    const docs = await getConfirmedPublicDocs('team_profiles');
    const teamMembers = docs
      .map((teamMemberDoc) => normalizeTeamMember(teamMemberDoc))
      .filter(Boolean)
      .filter(isVisiblePublicTeamMember)
      .sort(compareTeamMembers);

    return teamMembers.length ? teamMembers.slice(0, maxItems) : cloneFallback(FALLBACK_TEAM_MEMBERS).slice(0, maxItems);
  } catch (error) {
    warnAndFallback('Failed to load public team profiles from Firestore. Using fallback team members.', error);
    return cloneFallback(FALLBACK_TEAM_MEMBERS).slice(0, maxItems);
  }
}

export async function getPublicUpcomingEvents(maxItems = 3) {
  try {
    const docs = await getConfirmedPublicDocs('events', [
      where('status', '==', 'published'),
      where('startTime', '>=', new Date()),
      orderBy('startTime', 'asc'),
      limit(maxItems),
    ]);

    const events = docs
      .map((eventDoc, index) => normalizeEvent(eventDoc, FALLBACK_EVENTS[index]))
      .filter(Boolean)
      .filter(isVisiblePublicContent)
      .filter(isUpcomingEvent);

    return events.length ? events : cloneFallback(FALLBACK_EVENTS).filter(isUpcomingEvent).slice(0, maxItems);
  } catch (error) {
    warnAndFallback('Failed to load public events from Firestore. Using fallback events.', error);
    return cloneFallback(FALLBACK_EVENTS).filter(isUpcomingEvent).slice(0, maxItems);
  }
}

export async function getRecoveryJourney() {
  // TODO: Connect recovery journey after the CMS confirms a homepage content
  // collection/document contract and stage visibility fields.
  const journey = cloneFallback(FALLBACK_RECOVERY_JOURNEY);

  return {
    ...journey,
    stages: asArray(journey.stages).filter((stage) => stage.isVisible !== false && stage.hidden !== true),
  };
}

export async function getDonationSettings() {
  // TODO: Connect donation settings after the CMS confirms a donation content
  // collection/document contract and public fields.
  return cloneFallback(FALLBACK_DONATION);
}

export async function getContactInfo() {
  // TODO: Connect contact details after the CMS confirms contact document IDs
  // and field names. The existing `org_info` collection only confirms generic
  // `title` and `content` fields.
  const contact = cloneFallback(FALLBACK_CONTACT);

  return {
    ...contact,
    socialLinks: asArray(contact.socialLinks).filter(isVisiblePublicContent),
  };
}

export async function getHomepageContent() {
  // TODO: The CMS currently confirms `org_info` with generic `title` and
  // `content` fields, but it does not confirm document IDs or section-specific
  // fields for hero, about, center, contact, donation, or homepage statistics.
  // Keep those sections on fallback until that public CMS contract exists.
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
