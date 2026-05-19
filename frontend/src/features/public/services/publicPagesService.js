import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import heroWomenSupport from '../../../assets/images/hero-women-support.png';

// Single source of truth for the public home page document.
//   collection: public_pages
//   document:   home
//   field groups: hero (this task), + future aboutUs, learnTogether,
//                 inspirationStories, donations, contactUs.

export const PUBLIC_PAGES_COLLECTION = 'public_pages';
export const PUBLIC_HOME_DOC_ID = 'home';

export const DEFAULT_HOME_HERO = {
  title: 'את לא לבד במסע שלך',
  subtitle: 'קהילה תומכת לנשים ולמתמודדות עם סרטן',
  description: 'מרחב חם, בטוח ומקצועי לתמיכה, ליווי, למידה ותקווה לאורך הדרך.',
  backgroundImageUrl: heroWomenSupport,
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

export function getDefaultPublicHomeDoc() {
  return {
    hero: { ...DEFAULT_HOME_HERO },
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
    };
  } catch (error) {
    console.warn('[publicPagesService] Failed to load public_pages/home, using defaults.', error);
    return getDefaultPublicHomeDoc();
  }
}
