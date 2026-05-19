import inspirationStories from '../../../assets/images/inspiration-stories.jpeg';
import womenEvents from '../../../assets/images/women-events.jpeg';
import supportGroups from '../../../assets/images/support-groups.jpeg';
import communityDonations from '../../../assets/images/community-donations.jpeg';
import { PRESS_FEATURED_ARTICLE_URL } from './pressArticles';

/** Bundled press card imagery — reliable, same visual language as support section. */
export const PRESS_ARTICLE_BUNDLED_IMAGES = [
  inspirationStories,
  womenEvents,
  supportGroups,
  communityDonations,
];

export const DEFAULT_PRESS_ARTICLE_IMAGE = supportGroups;

export function getBundledPressArticleImage(index = 0) {
  return PRESS_ARTICLE_BUNDLED_IMAGES[index % PRESS_ARTICLE_BUNDLED_IMAGES.length];
}

export function isUsablePressArticleImageUrl(url) {
  const value = String(url || '').trim();

  if (!value || value.startsWith('#')) {
    return false;
  }

  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith('/') ||
    value.startsWith('data:') ||
    value.includes('/assets/')
  );
}

/**
 * Primary src for the card (CMS/external when valid), plus a bundled fallback if load fails.
 */
function resolveImageAsset(value) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === 'object' && typeof value.default === 'string') {
    return value.default.trim();
  }

  return '';
}

export function getPressArticleImageSources(article = {}, index = 0) {
  const fallback = getBundledPressArticleImage(index);
  const candidate = resolveImageAsset(article.imageUrl || article.image);
  const primary = isUsablePressArticleImageUrl(candidate) ? candidate : fallback;

  const resolvedFallback = resolveImageAsset(fallback) || DEFAULT_PRESS_ARTICLE_IMAGE;
  const resolvedPrimary = resolveImageAsset(primary) || resolvedFallback;

  return {
    primary: resolvedPrimary,
    fallback: resolvedFallback,
  };
}

export const FALLBACK_PRESS_ARTICLES = [
  {
    id: 'fallback-press-1',
    title: 'סיקור ב-Jerusalem Post',
    description: 'כתבה על הקהילה, החמלה והליווי שאנחנו מעניקים לנשים ולמשפחות.',
    imageUrl: inspirationStories,
    readMoreUrl: PRESS_FEATURED_ARTICLE_URL,
    isPublished: true,
    isVisible: true,
    active: true,
  },
  {
    id: 'fallback-press-2',
    title: 'קול נשי בתקשורת',
    description: 'סיפור על כוחה של קהילה תומכת ועל מרחב בטוח לנשים בדרך.',
    imageUrl: womenEvents,
    readMoreUrl: PRESS_FEATURED_ARTICLE_URL,
    isPublished: true,
    isVisible: true,
    active: true,
  },
  {
    id: 'fallback-press-3',
    title: 'תקווה, אמונה וחיבור',
    description: 'על העשייה הקהילתית של שנה ועל המשמעות של לא להיות לבד.',
    imageUrl: supportGroups,
    readMoreUrl: PRESS_FEATURED_ARTICLE_URL,
    isPublished: true,
    isVisible: true,
    active: true,
  },
  {
    id: 'fallback-press-4',
    title: 'מהעיתונות עלינו',
    description: 'עוד זווית על התמיכה, הליווי והאהבה שמלוות נשים בכל שלב.',
    imageUrl: communityDonations,
    readMoreUrl: PRESS_FEATURED_ARTICLE_URL,
    isPublished: true,
    isVisible: true,
    active: true,
  },
];
