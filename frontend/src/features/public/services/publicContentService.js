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
  eyebrow: 'קהילה תומכת לנשים',
  title: 'את לא לבד במסע שלך',
  message: 'קהילה תומכת לנשים ולמתמודדות עם סרטן',
  supportText: 'מרחב חם, בטוח ומקצועי לתמיכה, ליווי, למידה ותקווה לאורך הדרך.',
  primaryAction: {
    label: 'להצטרף לקהילה',
    href: '#contact',
  },
  secondaryAction: {
    label: 'לתרום עכשיו',
    href: '#donate',
  },
  imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1800&q=82',
  imageAlt: 'נשים בקהילה תומכת',
  visualTitle: 'SHE-NA',
  visualText: 'קהילה, תמיכה וליווי נשי בגובה העיניים.',
};

const FALLBACK_ABOUT = {
  title: 'מי אנחנו?',
  intro:
    'SHE-NA היא ארגון ללא כוונת רווח המעניק תמיכה רגשית, חברתית וחינוכית לנשים ולמתמודדות עם סרטן. אנו מאמינות בכוח של קהילה תומכת ובחשיבות של ליווי אישי ומקצועי במסע האתגרי.',
  body: '',
};

const FALLBACK_STATISTICS = [
  {
    id: 'women',
    value: '+2,500',
    label: 'נשים בקהילה',
    note: 'מרחב תמיכה חי, מכיל ונגיש.',
    isVisible: true,
    active: true,
  },
  {
    id: 'events',
    value: '+120',
    label: 'אירועים שנתיים',
    note: 'סדנאות, הרצאות ומפגשי קהילה.',
    isVisible: true,
    active: true,
  },
  {
    id: 'volunteers',
    value: '+85',
    label: 'מתנדבים',
    note: 'נשים ואנשי מקצוע שמלווים באהבה.',
    isVisible: true,
    active: true,
  },
  {
    id: 'stories',
    value: '+1,500',
    label: 'סיפורי הצלחה',
    note: 'רגעים של תקווה, חוסן ושינוי.',
    isVisible: true,
    active: true,
  },
];

const FALLBACK_CENTER = {
  eyebrow: 'מרכז SHE-NA',
  title: 'מרחב החלמה שקט ותומך',
  description:
    'מרכז SHE-NA הוא מקום מכבד ובטוח לנשים בתהליך החלמה, עם ליווי, כלים מעשיים וחיבור לקהילה בקצב שמתאים לך.',
  activities: [
    'מעגלי תמיכה ומרחבי הקשבה',
    'סדנאות לשגרה יומיומית, חוסן ועצמאות',
    'הכוונה למשאבי בריאות ורווחה רגשית',
  ],
  ctaLabel: 'להצטרפות וקבלת תמיכה',
  ctaHref: '#contact',
  visualIcon: 'ש',
  visualTitle: 'החלמה, כבוד וליווי',
  visualText: 'מרחב קהילתי חם שמעניק תמיכה וכלים לנשים לאורך הדרך.',
  isVisible: true,
  active: true,
};

const FALLBACK_SUPPORT_AREAS = [
  {
    id: 'support-groups',
    icon: 'groups',
    title: 'קבוצות תמיכה',
    description: 'מפגשי תמיכה קבוצתיים במרחב בטוח ותומך עם נשים שעוברות חוויות דומות.',
    imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1000&q=78',
    readMoreUrl: '#contact',
    isVisible: true,
    active: true,
  },
  {
    id: 'lectures-workshops',
    icon: 'workshop',
    title: 'הרצאות וסדנאות',
    description: 'ידע מעשי, כלים רגשיים וסדנאות העצמה שמחזקות את ההתמודדות היומיומית.',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=78',
    readMoreUrl: '#articles',
    isVisible: true,
    active: true,
  },
  {
    id: 'inspiration-stories',
    icon: 'heart',
    title: 'סיפורי השראה',
    description: 'סיפורים אמיתיים של נשים שמצאו תקווה, כוח ומשמעות בתוך המסע.',
    imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1000&q=78',
    readMoreUrl: '#stories',
    isVisible: true,
    active: true,
  },
  {
    id: 'chat-support',
    icon: 'chat',
    title: "צ'אט ותמיכה",
    description: 'ערוץ תמיכה נגיש לשיחה, שיתוף וליווי ברגעים שבהם צריך מענה קרוב.',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=78',
    readMoreUrl: '#contact',
    isVisible: true,
    active: true,
  },
  {
    id: 'donations-community',
    icon: 'gift',
    title: 'תרומות לקהילה',
    description: 'תרומות שמאפשרות להרחיב פעילות, להנגיש ליווי ולתמוך בנשים נוספות.',
    imageUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1000&q=78',
    readMoreUrl: '#donate',
    isVisible: true,
    active: true,
  },
  {
    id: 'women-events',
    icon: 'calendar',
    title: 'אירועים לנשים',
    description: 'ערבי העצמה, מפגשי רווחה וחגיגות קהילתיות שמחברות ומחזקות.',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=78',
    readMoreUrl: '#support',
    isVisible: true,
    active: true,
  },
];

const FALLBACK_ARTICLES = [
  {
    id: 'fallback-article-1',
    title: 'סיפורי השראה',
    description:
      'סיפורים אמיתיים של נשים אמיצות שעוברות את המסע עם תקווה וחוזק.',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1000&q=78',
    readMoreUrl: '#stories',
    isPublished: true,
    isVisible: true,
    active: true,
  },
  {
    id: 'fallback-article-2',
    title: 'הרצאות וסדנאות',
    description:
      'סדנאות העשרה, הרצאות מעוררות השראה וכלים מעשיים להתמודדות.',
    imageUrl: 'https://images.unsplash.com/photo-1573497491208-6b1acb260507?auto=format&fit=crop&w=1000&q=78',
    readMoreUrl: '#support',
    isPublished: true,
    isVisible: true,
    active: true,
  },
  {
    id: 'fallback-article-3',
    title: 'קבוצות תמיכה',
    description:
      'מפגשי תמיכה קבוצתיים עם הקשבה, הכלה וחיבור לנשים במסע דומה.',
    imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1000&q=78',
    readMoreUrl: '#contact',
    isPublished: true,
    isVisible: true,
    active: true,
  },
];

const FALLBACK_TEAM_MEMBERS = [
  {
    id: 'fallback-team-1',
    name: 'רחל כהן',
    role: 'מתמודדת מנצחת',
    description: 'הקהילה של SHE-NA היתה האור שלי בתקופה החשוכה ביותר. מצאתי כאן לא רק תמיכה, אלא משפחה אמיתית שהבינה אותי.',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=78',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'fallback-team-2',
    name: 'שרה לוי',
    role: 'מתנדבת ותומכת',
    description: 'אחרי שעברתי את המסע בעצמי, החלטתי לתת חזרה. כל יום שאני עוזרת לאישה אחרת מזכיר לי את הכוח שיש בנו.',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=78',
    isVisible: true,
    isPublished: true,
    active: true,
  },
  {
    id: 'fallback-team-3',
    name: 'מיכל אברהם',
    role: 'חברת קהילה',
    description: 'הסדנאות וההרצאות שינו את הדרך שבה אני מסתכלת על החיים. למדתי שיש תקווה ושאני יכולה להיות חזקה יותר ממה שחשבתי.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=78',
    isVisible: true,
    isPublished: true,
    active: true,
  },
];

const FALLBACK_EVENTS = [
  {
    id: 'fallback-event-1',
    title: 'מעגל תמיכה קהילתי',
    description:
      'מפגש קבוצתי חם לשיתוף, הקשבה וחיזוק תחושת התמיכה בקהילה.',
    dateLabel: 'המועד יפורסם בקרוב',
    time: '',
    location: 'המיקום יפורסם בקרוב',
    isPublic: true,
    isVisible: true,
    active: true,
    status: 'upcoming',
  },
  {
    id: 'fallback-event-2',
    title: 'סדנת כלים לרווחה וחוסן',
    description:
      'כלים מעשיים לבניית שגרה רגועה, הצבת גבולות והתמודדות עם ימים מורכבים.',
    dateLabel: 'המועד יפורסם בקרוב',
    time: '',
    location: 'המיקום יפורסם בקרוב',
    isPublic: true,
    isVisible: true,
    active: true,
    status: 'upcoming',
  },
  {
    id: 'fallback-event-3',
    title: 'מפגש הכוונה למשאבי תמיכה',
    description:
      'היכרות קצרה עם שירותי תמיכה, תוכניות קהילה וצעדים אפשריים להמשך.',
    dateLabel: 'המועד יפורסם בקרוב',
    time: '',
    location: 'המיקום יפורסם בקרוב',
    isPublic: true,
    isVisible: true,
    active: true,
    status: 'upcoming',
  },
];

const FALLBACK_RECOVERY_JOURNEY = {
  eyebrow: 'מסע ההחלמה',
  title: 'דרך יציבה של תמיכה וליווי',
  description:
    'כל אישה עוברת שינוי בקצב אחר. SHE-NA מציעה מרחב רגוע, מכבד ותומך לכל שלב במסע.',
  stages: [
    {
      id: 'before',
      label: 'לפני',
      title: 'מה היה',
      description:
        'התבוננות עדינה בצרכים, בשאלות ובחוויות שמובילות אישה לחפש תמיכה.',
      isVisible: true,
    },
    {
      id: 'during',
      label: 'במהלך',
      title: 'מה קורה עכשיו',
      description:
        'תמיכה הניתנת צעד אחר צעד דרך הקשבה, הכוונה, תוכניות קהילה וליווי רציף.',
      isVisible: true,
    },
    {
      id: 'after',
      label: 'אחרי',
      title: 'מה יקרה בהמשך',
      description:
        'המסע ממשיך עם כלים מעשיים, חיבור לקהילה ומרחב להתקדם בקצב אישי.',
      isVisible: true,
    },
  ],
  isVisible: true,
  active: true,
};

const FALLBACK_DONATION = {
  eyebrow: 'עזרי לנו להמשיך לתמוך',
  title: 'כל תרומה, קטנה כגדולה, עוזרת לנו להמשיך לספק תמיכה, ליווי ותקווה לנשים במסע שלהן.',
  description:
    'ביחד נוכל ליצור שינוי אמיתי ולהגיע לנשים נוספות שזקוקות לקהילה חמה ובטוחה.',
  buttonLabel: 'לתרומה',
  href: '#donate',
  isVisible: true,
  active: true,
};

const FALLBACK_CONTACT = {
  eyebrow: 'צרי קשר',
  title: 'אנחנו כאן בשבילך',
  description:
    'אפשר לפנות אלינו להצטרפות, תמיכה, התנדבות או שיתוף פעולה.',
  email: 'info@she-na.org.il',
  phone: '03-1234567',
  address: '',
  socialLinks: [
    { id: 'linkedin', label: 'LinkedIn', href: '#contact', isVisible: true, active: true },
    { id: 'instagram', label: 'Instagram', href: '#contact', isVisible: true, active: true },
    { id: 'facebook', label: 'Facebook', href: '#contact', isVisible: true, active: true },
  ],
  footerText: 'קהילה תומכת לנשים ולמתמודדות עם סרטן. יחד אנחנו חזקות יותר.',
  isVisible: true,
  active: true,
};

const FALLBACK_ORGANIZATION = {
  name: 'SHE-NA',
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
  teamMembers: FALLBACK_TEAM_MEMBERS,
  events: FALLBACK_EVENTS,
  recoveryJourney: FALLBACK_RECOVERY_JOURNEY,
  donation: FALLBACK_DONATION,
  contact: FALLBACK_CONTACT,
};

export function normalizePublicHomepageContent(homepageContent) {
  const safeContent = homepageContent && typeof homepageContent === 'object' ? homepageContent : {};
  const arrayOrFallback = (fieldName, legacyFieldName) => {
    if (Array.isArray(safeContent[fieldName])) {
      return safeContent[fieldName];
    }

    if (legacyFieldName && Array.isArray(safeContent[legacyFieldName])) {
      return safeContent[legacyFieldName];
    }

    return cloneFallback(FALLBACK_CONTENT[fieldName]);
  };

  return {
    ...cloneFallback(FALLBACK_CONTENT),
    ...safeContent,
    organization: {
      ...cloneFallback(FALLBACK_CONTENT.organization),
      ...(safeContent.organization || {}),
    },
    hero: {
      ...cloneFallback(FALLBACK_CONTENT.hero),
      ...(safeContent.hero || {}),
      primaryAction: {
        ...cloneFallback(FALLBACK_CONTENT.hero.primaryAction),
        ...(safeContent.hero?.primaryAction || {}),
      },
      secondaryAction: {
        ...cloneFallback(FALLBACK_CONTENT.hero.secondaryAction),
        ...(safeContent.hero?.secondaryAction || {}),
      },
    },
    about: {
      ...cloneFallback(FALLBACK_CONTENT.about),
      ...(safeContent.about || {}),
    },
    contact: {
      ...cloneFallback(FALLBACK_CONTENT.contact),
      ...(safeContent.contact || {}),
    },
    donation: {
      ...cloneFallback(FALLBACK_CONTENT.donation),
      ...(safeContent.donation || {}),
    },
    center: {
      ...cloneFallback(FALLBACK_CONTENT.center),
      ...(safeContent.center || {}),
    },
    statistics: arrayOrFallback('statistics'),
    supportAreas: arrayOrFallback('supportAreas'),
    articles: arrayOrFallback('articles'),
    teamMembers: arrayOrFallback('teamMembers', 'team'),
    events: arrayOrFallback('events'),
    recoveryJourney: {
      ...cloneFallback(FALLBACK_CONTENT.recoveryJourney),
      ...(safeContent.recoveryJourney || safeContent.journey || {}),
    },
  };
}

export function getFallbackPublicHomepageContent() {
  return normalizePublicHomepageContent(FALLBACK_CONTENT);
}

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

function fallbackOrgInfoContent() {
  return {
    organization: cloneFallback(FALLBACK_ORGANIZATION),
    about: cloneFallback(FALLBACK_ABOUT),
    contact: cloneFallback(FALLBACK_CONTACT),
  };
}

async function loadHomepageSection(sectionName, loader, fallbackValue) {
  try {
    const sectionContent = await loader();

    if (sectionContent === undefined || sectionContent === null) {
      warnAndFallback(`Public ${sectionName} content was empty. Using fallback ${sectionName} content.`);
      return cloneFallback(fallbackValue);
    }

    return sectionContent;
  } catch (error) {
    warnAndFallback(`Failed to load public ${sectionName} content. Using fallback ${sectionName} content.`, error);
    return cloneFallback(fallbackValue);
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

  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function firstTextValue(...values) {
  return values.find(hasText)?.trim() || '';
}

function getImageTextValue(value, fieldNames) {
  if (hasText(value)) {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  return firstTextValue(...fieldNames.map((fieldName) => value[fieldName]));
}

function firstImageUrl(...values) {
  const urlFields = ['url', 'src', 'href', 'downloadUrl', 'imageUrl', 'photoUrl', 'avatarUrl'];

  for (const value of values) {
    const imageUrl = getImageTextValue(value, urlFields);

    if (imageUrl) {
      return imageUrl;
    }
  }

  return '';
}

function firstImageAlt(fallbackAlt, ...values) {
  const altFields = ['alt', 'altText', 'imageAlt', 'description', 'caption', 'title'];

  for (const value of values) {
    const imageAlt = getImageTextValue(value, altFields);

    if (imageAlt) {
      return imageAlt;
    }
  }

  return fallbackAlt || '';
}

function stripHtml(value) {
  return hasText(value) ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function normalizedKey(value) {
  return hasText(value) ? value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') : '';
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

function numberOrText(value, fallbackValue = '') {
  if (value === 0) return '0';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return firstTextValue(value, fallbackValue);
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
    imageUrl: firstImageUrl(
      docData.imageUrl,
      docData.imageURL,
      docData.thumbnailUrl,
      docData.coverImageUrl,
      docData.heroImageUrl,
      docData.image,
      docData.thumbnail,
      docData.coverImage,
      fallbackEvent.imageUrl,
    ),
    imageAlt: firstImageAlt(title, docData.imageAlt, docData.altText, docData.image, docData.thumbnail, docData.coverImage),
    maxParticipants: Number(docData.maxParticipants) || 0,
    isPublic: true,
    isVisible: true,
    isPublished: docData.status === 'published',
    active: docData.status === 'published',
    status: docData.status || 'published',
  };
}

function normalizeStatistic(docData, fallbackStatistic = {}) {
  const label = firstTextValue(docData.label, docData.title, docData.name, fallbackStatistic.label);
  const value = numberOrText(docData.value ?? docData.count ?? docData.total ?? docData.number, fallbackStatistic.value);

  if (!label || !value) {
    return null;
  }

  return {
    ...fallbackStatistic,
    id: docData.id || normalizedKey(label) || fallbackStatistic.id,
    value,
    label,
    note: firstTextValue(docData.note, docData.description, docData.summary, fallbackStatistic.note),
    isPublic: docData.isPublic !== false && docData.public !== false,
    isVisible: docData.isVisible !== false && docData.visible !== false && docData.hidden !== true,
    isPublished: docData.isPublished !== false && docData.published !== false,
    active: docData.active !== false && docData.status !== 'inactive',
    status: docData.status || fallbackStatistic.status || 'published',
    order: docData.order ?? docData.displayOrder ?? docData.sortOrder ?? 0,
  };
}

function normalizeSupportArea(docData, fallbackArea = {}) {
  const title = firstTextValue(docData.title, docData.name, docData.label, fallbackArea.title);
  const description = firstTextValue(docData.description, docData.summary, docData.content, docData.text, fallbackArea.description);

  if (!title || !description) {
    return null;
  }

  return {
    ...fallbackArea,
    id: docData.id || normalizedKey(title) || fallbackArea.id,
    icon: firstTextValue(docData.icon, docData.initial, fallbackArea.icon) || title.charAt(0),
    title,
    description,
    imageUrl: firstImageUrl(
      docData.imageUrl,
      docData.imageURL,
      docData.thumbnailUrl,
      docData.coverImageUrl,
      docData.heroImageUrl,
      docData.image,
      docData.thumbnail,
      docData.coverImage,
      fallbackArea.imageUrl,
    ),
    imageAlt: firstImageAlt(title, docData.imageAlt, docData.altText, docData.image, docData.thumbnail, docData.coverImage),
    readMoreUrl: firstTextValue(docData.readMoreUrl, docData.url, docData.link, docData.href, fallbackArea.readMoreUrl) || '#support',
    isPublic: docData.isPublic !== false && docData.public !== false,
    isVisible: docData.isVisible !== false && docData.visible !== false && docData.hidden !== true,
    isPublished: docData.isPublished !== false && docData.published !== false,
    active: docData.active !== false && docData.status !== 'inactive',
    status: docData.status || fallbackArea.status || 'published',
    order: docData.order ?? docData.displayOrder ?? docData.sortOrder ?? 0,
  };
}

function normalizeHeroContent(docData = {}, fallbackHero = FALLBACK_HERO) {
  const title = firstTextValue(docData.title, docData.heading, fallbackHero.title);
  const message = firstTextValue(docData.message, docData.subtitle, docData.description, docData.summary, fallbackHero.message);

  return {
    ...fallbackHero,
    id: docData.id || fallbackHero.id,
    eyebrow: firstTextValue(docData.eyebrow, docData.label, fallbackHero.eyebrow),
    title,
    message,
    supportText: firstTextValue(docData.supportText, docData.body, docData.content, docData.text, fallbackHero.supportText),
    imageUrl: firstImageUrl(
      docData.imageUrl,
      docData.imageURL,
      docData.heroImageUrl,
      docData.heroImageURL,
      docData.coverImageUrl,
      docData.coverImageURL,
      docData.image,
      docData.heroImage,
      docData.coverImage,
      fallbackHero.imageUrl,
    ),
    imageAlt: firstImageAlt(title, docData.imageAlt, docData.altText, docData.image, docData.heroImage, docData.coverImage),
    visualTitle: firstTextValue(docData.visualTitle, docData.badgeTitle, fallbackHero.visualTitle),
    visualText: firstTextValue(docData.visualText, docData.badgeText, fallbackHero.visualText),
    primaryAction: {
      ...fallbackHero.primaryAction,
      ...(docData.primaryAction || {}),
      label: firstTextValue(docData.primaryAction?.label, docData.primaryCtaLabel, docData.ctaLabel, fallbackHero.primaryAction.label),
      href: firstTextValue(docData.primaryAction?.href, docData.primaryCtaHref, docData.ctaHref, fallbackHero.primaryAction.href),
    },
    secondaryAction: {
      ...fallbackHero.secondaryAction,
      ...(docData.secondaryAction || {}),
      label: firstTextValue(docData.secondaryAction?.label, docData.secondaryCtaLabel, fallbackHero.secondaryAction.label),
      href: firstTextValue(docData.secondaryAction?.href, docData.secondaryCtaHref, fallbackHero.secondaryAction.href),
    },
    isPublic: docData.isPublic !== false && docData.public !== false,
    isVisible: docData.isVisible !== false && docData.visible !== false && docData.hidden !== true,
    isPublished: docData.isPublished !== false && docData.published !== false,
    active: docData.active !== false && docData.status !== 'inactive',
    status: docData.status || fallbackHero.status || 'published',
  };
}

function normalizeJourneyStage(stage, index) {
  if (!stage || typeof stage !== 'object') {
    return null;
  }

  const title = firstTextValue(stage.title, stage.name, stage.heading);
  const description = firstTextValue(stage.description, stage.summary, stage.content, stage.text);

  if (!title || !description) {
    return null;
  }

  return {
    id: stage.id || normalizedKey(title) || `stage-${index + 1}`,
    label: firstTextValue(stage.label, stage.eyebrow, `שלב ${index + 1}`),
    title,
    description,
    isVisible: stage.isVisible !== false && stage.visible !== false && stage.hidden !== true,
    active: stage.active !== false && stage.status !== 'inactive',
    order: stage.order ?? stage.displayOrder ?? stage.sortOrder ?? index,
  };
}

function normalizeRecoveryJourney(docData = {}, fallbackJourney = FALLBACK_RECOVERY_JOURNEY) {
  const stages = asArray(docData.stages || docData.items || docData.steps)
    .map(normalizeJourneyStage)
    .filter(Boolean)
    .filter(isVisiblePublicContent)
    .sort(compareOrderedContent);

  return {
    ...fallbackJourney,
    id: docData.id || fallbackJourney.id,
    eyebrow: firstTextValue(docData.eyebrow, docData.label, fallbackJourney.eyebrow),
    title: firstTextValue(docData.title, docData.heading, fallbackJourney.title),
    description: firstTextValue(docData.description, docData.summary, docData.content, fallbackJourney.description),
    stages: stages.length ? stages : cloneFallback(fallbackJourney.stages),
    isPublic: docData.isPublic !== false && docData.public !== false,
    isVisible: docData.isVisible !== false && docData.visible !== false && docData.hidden !== true,
    isPublished: docData.isPublished !== false && docData.published !== false,
    active: docData.active !== false && docData.status !== 'inactive',
    status: docData.status || fallbackJourney.status || 'published',
  };
}

function normalizeDonationSettings(docData = {}, fallbackDonation = FALLBACK_DONATION) {
  return {
    ...fallbackDonation,
    id: docData.id || fallbackDonation.id,
    eyebrow: firstTextValue(docData.eyebrow, docData.label, fallbackDonation.eyebrow),
    title: firstTextValue(docData.title, docData.heading, fallbackDonation.title),
    description: firstTextValue(docData.description, docData.summary, docData.content, fallbackDonation.description),
    buttonLabel: firstTextValue(docData.buttonLabel, docData.ctaLabel, docData.label, fallbackDonation.buttonLabel),
    href: firstTextValue(docData.href, docData.url, docData.link, docData.donationUrl, fallbackDonation.href),
    isPublic: docData.isPublic !== false && docData.public !== false,
    isVisible: docData.isVisible !== false && docData.visible !== false && docData.hidden !== true,
    isPublished: docData.isPublished !== false && docData.published !== false,
    active: docData.active !== false && docData.status !== 'inactive',
    status: docData.status || fallbackDonation.status || 'published',
  };
}

function compareOrderedContent(left, right) {
  const leftOrder = Number(left.order);
  const rightOrder = Number(right.order);

  if (Number.isFinite(leftOrder) && Number.isFinite(rightOrder) && leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return 0;
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

  const imageUrl = firstImageUrl(
    docData.imageUrl,
    docData.imageURL,
    docData.thumbnailUrl,
    docData.thumbnailURL,
    docData.coverImageUrl,
    docData.coverImageURL,
    docData.heroImageUrl,
    docData.heroImageURL,
    docData.image,
    docData.thumbnail,
    docData.coverImage,
    docData.heroImage,
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
    imageAlt: firstImageAlt(title, docData.imageAlt, docData.altText, docData.image, docData.thumbnail, docData.coverImage, docData.heroImage),
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

function hasAnyOwnField(item, fieldNames) {
  return fieldNames.some((fieldName) => hasOwnField(item, fieldName));
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
    imageUrl: firstImageUrl(
      docData.imageUrl,
      docData.imageURL,
      docData.photoUrl,
      docData.photoURL,
      docData.avatarUrl,
      docData.avatarURL,
      docData.profileImageUrl,
      docData.profileImageURL,
      docData.headshotUrl,
      docData.headshotURL,
      docData.portraitUrl,
      docData.portraitURL,
      docData.image,
      docData.photo,
      docData.avatar,
      docData.profileImage,
      docData.headshot,
      docData.portrait,
    ),
    imageAlt: firstImageAlt(
      name ? `${name} profile photo` : '',
      docData.imageAlt,
      docData.altText,
      docData.image,
      docData.photo,
      docData.avatar,
      docData.profileImage,
      docData.headshot,
      docData.portrait,
    ),
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

function isVisibleOrgInfoDoc(docData) {
  if (!docData || typeof docData !== 'object') {
    return false;
  }

  if (docData.hidden === true || docData.status === 'inactive' || docData.status === 'draft' || docData.status === 'unpublished') {
    return false;
  }

  const falseWhenPresentFields = ['isVisible', 'visible', 'isPublished', 'published', 'active', 'isPublic', 'public'];

  return falseWhenPresentFields.every((fieldName) => !hasOwnField(docData, fieldName) || docData[fieldName] !== false);
}

function normalizeSocialLink(link, index) {
  if (!link || typeof link !== 'object') {
    return null;
  }

  const href = firstTextValue(link.href, link.url, link.link);
  const label = firstTextValue(link.label, link.name, link.title, href);

  if (!href && !label) {
    return null;
  }

  return {
    id: link.id || `social-${index}`,
    label: label || 'קישור חברתי',
    href: href || '#contact',
    isVisible: link.isVisible !== false && link.visible !== false && link.hidden !== true,
    active: link.active !== false && link.status !== 'inactive',
  };
}

function normalizeSocialLinks(value) {
  return asArray(value).map(normalizeSocialLink).filter(Boolean).filter(isVisiblePublicContent);
}

function getOrgInfoSectionKey(docData) {
  const keyCandidates = [
    docData.section,
    docData.type,
    docData.category,
    docData.key,
    docData.slug,
    docData.id,
    docData.title,
  ].map(normalizedKey);

  if (keyCandidates.some((key) => ['organization', 'organisation', 'org', 'org_info', 'organization_info', 'about_us'].includes(key))) {
    return 'organization';
  }

  if (keyCandidates.some((key) => ['about', 'about_she_na', 'about_shena'].includes(key))) {
    return 'about';
  }

  if (keyCandidates.some((key) => ['contact', 'contact_info', 'contact_details', 'contacts'].includes(key))) {
    return 'contact';
  }

  const searchableText = keyCandidates.join(' ');

  if (searchableText.includes('contact')) {
    return 'contact';
  }

  if (searchableText.includes('about')) {
    return 'about';
  }

  if (searchableText.includes('organization') || searchableText.includes('organisation')) {
    return 'organization';
  }

  return '';
}

function normalizeOrganizationInfo(docData) {
  const content = firstTextValue(docData.content, docData.description, docData.body, docData.text);
  const name = firstTextValue(docData.name, docData.organizationName, docData.orgName, docData.title);
  const description = firstTextValue(docData.description, docData.summary, docData.tagline, stripHtml(content));

  if (!name && !description && !docData.email && !docData.phone && !docData.address) {
    return null;
  }

  return {
    name: name || '',
    tagline: firstTextValue(docData.tagline, docData.subtitle, docData.eyebrow),
    description,
    email: firstTextValue(docData.email, docData.contactEmail),
    phone: firstTextValue(docData.phone, docData.phoneNumber, docData.contactPhone),
    address: firstTextValue(docData.address, docData.location),
  };
}

function normalizeAboutInfo(docData) {
  const content = firstTextValue(docData.content, docData.body, docData.text);
  const title = firstTextValue(docData.aboutTitle, docData.heading, docData.title);
  const intro = firstTextValue(docData.intro, docData.summary, docData.description, stripHtml(content));
  const body = firstTextValue(docData.body, docData.details, docData.longDescription, stripHtml(content));

  if (!title && !intro && !body) {
    return null;
  }

  return {
    title,
    intro,
    body,
  };
}

function normalizeContactInfo(docData) {
  const content = firstTextValue(docData.content, docData.body, docData.text);
  const title = firstTextValue(docData.contactTitle, docData.heading, docData.title);
  const description = firstTextValue(docData.description, docData.summary, stripHtml(content));
  const email = firstTextValue(docData.email, docData.contactEmail);
  const phone = firstTextValue(docData.phone, docData.phoneNumber, docData.contactPhone);
  const address = firstTextValue(docData.address, docData.location);
  const socialLinks = normalizeSocialLinks(docData.socialLinks || docData.social || docData.links);

  if (!title && !description && !email && !phone && !address && !socialLinks.length && !docData.footerText) {
    return null;
  }

  return {
    eyebrow: firstTextValue(docData.eyebrow, docData.label),
    title,
    description,
    email,
    phone,
    address,
    socialLinks,
    footerText: firstTextValue(docData.footerText, docData.footer, docData.note),
    useFallback: docData.useFallback,
  };
}

function mergeSectionData(currentValue, nextValue) {
  if (!nextValue) {
    return currentValue;
  }

  if (!currentValue) {
    return nextValue;
  }

  return Object.entries(nextValue).reduce((mergedValue, [key, value]) => {
    if (Array.isArray(value)) {
      return value.length ? { ...mergedValue, [key]: value } : mergedValue;
    }

    return value !== undefined && value !== '' ? { ...mergedValue, [key]: value } : mergedValue;
  }, currentValue);
}

function normalizeOrgInfoContent(docs) {
  return asArray(docs).filter(isVisibleOrgInfoDoc).reduce(
    (content, docData) => {
      const sectionKey = getOrgInfoSectionKey(docData);
      const hasOrganizationFields = hasAnyOwnField(docData, [
        'name',
        'organizationName',
        'orgName',
        'tagline',
        'logoUrl',
      ]);
      const hasAboutFields = hasAnyOwnField(docData, [
        'aboutTitle',
        'intro',
        'summary',
        'body',
        'details',
        'longDescription',
      ]);
      const hasContactFields = hasAnyOwnField(docData, [
        'contactTitle',
        'email',
        'contactEmail',
        'phone',
        'phoneNumber',
        'contactPhone',
        'address',
        'location',
        'socialLinks',
        'social',
        'links',
        'footerText',
      ]);

      if (sectionKey === 'organization') {
        return {
          ...content,
          organization: mergeSectionData(content.organization, normalizeOrganizationInfo(docData)),
        };
      }

      if (sectionKey === 'about') {
        return {
          ...content,
          about: mergeSectionData(content.about, normalizeAboutInfo(docData)),
        };
      }

      if (sectionKey === 'contact') {
        return {
          ...content,
          contact: mergeSectionData(content.contact, normalizeContactInfo(docData)),
        };
      }

      return {
        organization: hasOrganizationFields
          ? mergeSectionData(content.organization, normalizeOrganizationInfo(docData))
          : content.organization,
        about: hasAboutFields ? mergeSectionData(content.about, normalizeAboutInfo(docData)) : content.about,
        contact: hasContactFields ? mergeSectionData(content.contact, normalizeContactInfo(docData)) : content.contact,
      };
    },
    {
      organization: null,
      about: null,
      contact: null,
    },
  );
}

export async function getOrgInfoContent() {
  try {
    const docs = await getConfirmedPublicDocs('org_info');
    const orgInfoContent = normalizeOrgInfoContent(docs);
    const hasMatchingData = Boolean(orgInfoContent.organization || orgInfoContent.about || orgInfoContent.contact);

    if (!hasMatchingData) {
      warnAndFallback('No matching public organization info was found in Firestore. Using fallback organization content.');
      return fallbackOrgInfoContent();
    }

    return orgInfoContent;
  } catch (error) {
    warnAndFallback('Failed to load public organization info from Firestore. Using fallback organization content.', error);
    return fallbackOrgInfoContent();
  }
}

export async function getHeroContent() {
  try {
    const docData = await getConfirmedPublicDoc('homepage_content', 'hero');
    const hero = docData ? normalizeHeroContent(docData) : cloneFallback(FALLBACK_HERO);

    return isVisiblePublicContent(hero) ? hero : cloneFallback(FALLBACK_HERO);
  } catch (error) {
    warnAndFallback('Failed to load public hero content from Firestore. Using fallback hero content.', error);
    return cloneFallback(FALLBACK_HERO);
  }
}

export async function getPublicStatistics() {
  try {
    const docs = await getConfirmedPublicDocs('homepage_statistics');
    const statistics = docs
      .map((statisticDoc, index) => normalizeStatistic(statisticDoc, FALLBACK_STATISTICS[index]))
      .filter(Boolean)
      .filter(isVisiblePublicContent)
      .sort(compareOrderedContent);

    return statistics.length ? statistics : cloneFallback(FALLBACK_STATISTICS).filter(isVisiblePublicContent);
  } catch (error) {
    warnAndFallback('Failed to load public homepage statistics from Firestore. Using fallback statistics.', error);
    return cloneFallback(FALLBACK_STATISTICS).filter(isVisiblePublicContent);
  }
}

export async function getSupportAreas() {
  try {
    const docs = await getConfirmedPublicDocs('support_areas');
    const supportAreas = docs
      .map((areaDoc, index) => normalizeSupportArea(areaDoc, FALLBACK_SUPPORT_AREAS[index]))
      .filter(Boolean)
      .filter(isVisiblePublicContent)
      .sort(compareOrderedContent);

    return supportAreas.length ? supportAreas : cloneFallback(FALLBACK_SUPPORT_AREAS).filter(isVisiblePublicContent);
  } catch (error) {
    warnAndFallback('Failed to load public support areas from Firestore. Using fallback support areas.', error);
    return cloneFallback(FALLBACK_SUPPORT_AREAS).filter(isVisiblePublicContent);
  }
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
  try {
    const docData = await getConfirmedPublicDoc('homepage_content', 'recovery_journey');
    const journey = docData ? normalizeRecoveryJourney(docData) : cloneFallback(FALLBACK_RECOVERY_JOURNEY);

    return {
      ...journey,
      stages: asArray(journey.stages).filter((stage) => stage.isVisible !== false && stage.hidden !== true),
    };
  } catch (error) {
    warnAndFallback('Failed to load public recovery journey from Firestore. Using fallback recovery journey.', error);
    const journey = cloneFallback(FALLBACK_RECOVERY_JOURNEY);

    return {
      ...journey,
      stages: asArray(journey.stages).filter((stage) => stage.isVisible !== false && stage.hidden !== true),
    };
  }
}

export async function getDonationSettings() {
  try {
    const docData = await getConfirmedPublicDoc('homepage_content', 'donation');
    const donation = docData ? normalizeDonationSettings(docData) : cloneFallback(FALLBACK_DONATION);

    return isVisiblePublicContent(donation) ? donation : cloneFallback(FALLBACK_DONATION);
  } catch (error) {
    warnAndFallback('Failed to load public donation settings from Firestore. Using fallback donation settings.', error);
    return cloneFallback(FALLBACK_DONATION);
  }
}

export async function getContactInfo() {
  const { contact } = await getOrgInfoContent();
  const safeContact = contact || cloneFallback(FALLBACK_CONTACT);

  return {
    ...safeContact,
    socialLinks: asArray(safeContact.socialLinks).filter(isVisiblePublicContent),
  };
}

export async function getHomepageContent() {
  try {
    const [
      orgInfo,
      hero,
      statistics,
      supportAreas,
      articles,
      teamMembers,
      events,
      recoveryJourney,
      donation,
    ] = await Promise.all([
      loadHomepageSection('organization info', getOrgInfoContent, fallbackOrgInfoContent()),
      loadHomepageSection('hero', getHeroContent, FALLBACK_HERO),
      loadHomepageSection('statistics', getPublicStatistics, FALLBACK_STATISTICS),
      loadHomepageSection('support areas', getSupportAreas, FALLBACK_SUPPORT_AREAS),
      loadHomepageSection('articles', getPublishedArticles, FALLBACK_ARTICLES),
      loadHomepageSection('team profiles', getVisibleTeamMembers, FALLBACK_TEAM_MEMBERS),
      loadHomepageSection('events', getPublicUpcomingEvents, FALLBACK_EVENTS),
      loadHomepageSection('recovery journey', getRecoveryJourney, FALLBACK_RECOVERY_JOURNEY),
      loadHomepageSection('donation settings', getDonationSettings, FALLBACK_DONATION),
    ]);

    return normalizePublicHomepageContent({
      organization: orgInfo.organization,
      hero,
      about: orgInfo.about,
      statistics,
      center: cloneFallback(FALLBACK_CENTER),
      supportAreas,
      articles,
      teamMembers,
      events,
      recoveryJourney,
      donation,
      contact: orgInfo.contact,
    });
  } catch (error) {
    warnAndFallback('Unexpected failure while composing public homepage content. Using full fallback homepage content.', error);
    return getFallbackPublicHomepageContent();
  }
}

// Backward-compatible name used by the current public page. Components can move
// to getHomepageContent() in a later commit without changing the data contract.
export async function getPublicHomepageContent() {
  return getHomepageContent();
}
