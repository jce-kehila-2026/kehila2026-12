import inspirationStories from '../../../assets/images/inspiration-stories.jpeg';
import workshopsSeminars from '../../../assets/images/workshops-seminars.jpeg';
import supportGroups from '../../../assets/images/support-groups.jpeg';
import womenEvents from '../../../assets/images/women-events.jpeg';
import communityDonations from '../../../assets/images/community-donations.jpeg';
import supportChat from '../../../assets/images/support-chat.jpeg';

/**
 * Bundled scene imagery — one local asset per support area card.
 */
export const SUPPORT_AREA_IMAGE_META = {
  'inspiration-stories': {
    bundledSrc: inspirationStories,
    position: 'center 32%',
    alt: 'אישה ברגע תקווה ושקט, תאורה טבעית',
  },
  'lectures-workshops': {
    bundledSrc: workshopsSeminars,
    position: 'center 50%',
    alt: 'מעגל נשים בסדנה ותמיכה בטבע',
  },
  'support-groups': {
    bundledSrc: supportGroups,
    position: 'center 55%',
    alt: 'נשים מתחבקות ותומכות זו בזו',
  },
  'women-events': {
    bundledSrc: womenEvents,
    position: 'center 38%',
    alt: 'נשים שמחות במפגש קהילתי בחוץ',
  },
  'donations-community': {
    bundledSrc: communityDonations,
    position: 'center 42%',
    alt: 'מתנדבים מגישים אוכל ותמיכה לקהילה',
  },
  'chat-support': {
    bundledSrc: supportChat,
    position: 'center 40%',
    alt: 'שיחת תמיכה חמה בין שתי נשים',
  },
};

export const DEFAULT_SUPPORT_AREA_IMAGE = supportGroups;

export const SUPPORT_AREA_IMAGES = Object.fromEntries(
  Object.entries(SUPPORT_AREA_IMAGE_META).map(([id, meta]) => [id, meta.bundledSrc]),
);

export const SUPPORT_AREA_IMAGE_ORDER = [
  'support-groups',
  'lectures-workshops',
  'inspiration-stories',
  'chat-support',
  'donations-community',
  'women-events',
];

const CURATED_IMAGE_SRCS = new Set(
  [...Object.values(SUPPORT_AREA_IMAGE_META).map((meta) => meta.bundledSrc), DEFAULT_SUPPORT_AREA_IMAGE].filter(Boolean),
);

export function getSupportAreaImageCandidates(area = {}, index = 0) {
  const meta = getSupportAreaImageMeta(area, index);
  return [meta.bundledSrc].filter(Boolean);
}

export function isBundledSupportAreaImage(src) {
  if (!src || typeof src !== 'string') {
    return false;
  }

  const trimmed = src.trim();

  if (!trimmed) {
    return false;
  }

  return !/^https?:\/\//i.test(trimmed);
}

export function isCuratedSupportAreaImage(src) {
  if (!src || typeof src !== 'string') {
    return false;
  }

  return CURATED_IMAGE_SRCS.has(src.trim());
}

export function isValidSupportAreaImageSrc(src) {
  return isBundledSupportAreaImage(src) || isCuratedSupportAreaImage(src);
}

export function getSupportAreaImageMeta(area = {}, index = 0) {
  const id = area?.id && SUPPORT_AREA_IMAGE_META[area.id] ? area.id : SUPPORT_AREA_IMAGE_ORDER[index % SUPPORT_AREA_IMAGE_ORDER.length];
  return SUPPORT_AREA_IMAGE_META[id] || SUPPORT_AREA_IMAGE_META['support-groups'];
}

export function getSupportAreaImageForCard(area = {}, index = 0) {
  return getSupportAreaImageMeta(area, index).bundledSrc;
}

export function getSupportAreaImagePositionForCard(area = {}, index = 0) {
  return getSupportAreaImageMeta(area, index).position;
}

export function getSupportAreaImageAltForCard(area = {}, index = 0) {
  const meta = getSupportAreaImageMeta(area, index);
  return area?.imageAlt || meta.alt || area?.title || '';
}

/** @deprecated Use getSupportAreaImageForCard for homepage cards. */
export function getSupportAreaImageUrl(area = {}, index = 0) {
  return getSupportAreaImageForCard(area, index);
}

export function getSupportAreaImageFallback() {
  return DEFAULT_SUPPORT_AREA_IMAGE;
}
