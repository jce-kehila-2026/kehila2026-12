import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import heroWomenSupport from '../../../assets/images/hero-women-support.png';
import { isKnownAboutUsIconKey, DEFAULT_ABOUT_US_ICON_KEY } from '../components/aboutUsIcons';

// Single source of truth for the public home page document.
//   collection: public_pages
//   document:   home
//   field groups: hero, aboutUs (this task), + future learnTogether,
//                 inspirationStories, donations, contactUs.

export const PUBLIC_PAGES_COLLECTION = 'public_pages';
export const PUBLIC_HOME_DOC_ID = 'home';

export const DEFAULT_HOME_HERO = {
  title: 'את לא לבד במסע שלך',
  subtitle: 'קהילה תומכת לנשים ולמתמודדות עם סרטן',
  description: 'מרחב חם, בטוח ומקצועי לתמיכה, ליווי, למידה ותקווה לאורך הדרך.',
  backgroundImageUrl: heroWomenSupport,
};

export const ABOUT_US_CARD_COUNT = 4;

export const DEFAULT_ABOUT_US = {
  paragraph:
    'SHE-NA היא ארגון ללא כוונת רווח המעניק תמיכה רגשית, חברתית וחינוכית לנשים ולמתמודדות עם סרטן. אנו מאמינות בכוח של קהילה תומכת ובחשיבות של ליווי אישי ומקצועי במסע האתגרי.',
  cards: [
    {
      iconKey: 'calendar-heart',
      title: 'סדנאות ואירועים',
      description: 'פעילויות העשרה ומפגשים מעצימים לנפש ולגוף.',
    },
    {
      iconKey: 'message-circle-heart',
      title: 'תמיכה קהילתית',
      description: 'חיבור בין נשים, אכפתיות וליווי חם במעגל תומך.',
    },
    {
      iconKey: 'users-round',
      title: 'קהילה בטוחה',
      description: 'מרחב תומך ומכיל לכל אישה בכל שלב במסע.',
    },
    {
      iconKey: 'heart',
      title: 'תמיכה רגשית',
      description: 'ליווי אישי וקבוצתי במסע שלך עם הבנה ואמפתיה.',
    },
  ],
};

export function mergeHero(hero) {
  const safeHero = hero && typeof hero === 'object' ? hero : {};
  return {
    title: safeHero.title || DEFAULT_HOME_HERO.title,
    subtitle: safeHero.subtitle || DEFAULT_HOME_HERO.subtitle,
    description: safeHero.description || DEFAULT_HOME_HERO.description,
    backgroundImageUrl: safeHero.backgroundImageUrl || DEFAULT_HOME_HERO.backgroundImageUrl,
  };
}

function mergeAboutCard(card, fallback) {
  const safe = card && typeof card === 'object' ? card : {};
  const iconKey = isKnownAboutUsIconKey(safe.iconKey) ? safe.iconKey : fallback.iconKey || DEFAULT_ABOUT_US_ICON_KEY;
  return {
    iconKey,
    title: typeof safe.title === 'string' && safe.title.trim() ? safe.title : fallback.title,
    description: typeof safe.description === 'string' && safe.description.trim() ? safe.description : fallback.description,
  };
}

export function mergeAboutUs(aboutUs) {
  const safe = aboutUs && typeof aboutUs === 'object' ? aboutUs : {};
  const cards = [];
  for (let i = 0; i < ABOUT_US_CARD_COUNT; i += 1) {
    const fallback = DEFAULT_ABOUT_US.cards[i];
    const incoming = Array.isArray(safe.cards) ? safe.cards[i] : undefined;
    cards.push(mergeAboutCard(incoming, fallback));
  }
  return {
    paragraph:
      typeof safe.paragraph === 'string' && safe.paragraph.trim()
        ? safe.paragraph
        : DEFAULT_ABOUT_US.paragraph,
    cards,
  };
}

export function getDefaultPublicHomeDoc() {
  return {
    hero: { ...DEFAULT_HOME_HERO },
    aboutUs: {
      paragraph: DEFAULT_ABOUT_US.paragraph,
      cards: DEFAULT_ABOUT_US.cards.map((card) => ({ ...card })),
    },
    updatedAt: null,
    updatedBy: '',
  };
}

export async function getPublicHomeDoc() {
  try {
    const snap = await getDoc(doc(db, PUBLIC_PAGES_COLLECTION, PUBLIC_HOME_DOC_ID));
    if (!snap.exists()) {
      return getDefaultPublicHomeDoc();
    }
    const data = snap.data() || {};
    return {
      ...data,
      hero: mergeHero(data.hero),
      aboutUs: mergeAboutUs(data.aboutUs),
    };
  } catch (error) {
    console.warn('[publicPagesService] Failed to load public_pages/home, using defaults.', error);
    return getDefaultPublicHomeDoc();
  }
}
