import supportGroups from '../../../assets/images/support-groups.jpeg';
import womenEvents from '../../../assets/images/women-events.jpeg';
import inspirationStories from '../../../assets/images/inspiration-stories.jpeg';

/** Cohesive warm community imagery — same emotional tone across cards */
export const EVENT_PREVIEW_IMAGES = [
  {
    src: supportGroups,
    alt: 'נשים מתחבקות ותומכות זו בזו במעגל קהילתי',
    position: 'center 55%',
  },
  {
    src: womenEvents,
    alt: 'נשים שמחות יחד במפגש קהילתי חם',
    position: 'center 38%',
  },
  {
    src: inspirationStories,
    alt: 'רגע של תקווה, חיבור והשראה בין נשים',
    position: 'center 32%',
  },
];

export function getEventPreviewImageMeta(event = {}, index = 0) {
  const bundled = EVENT_PREVIEW_IMAGES[index % EVENT_PREVIEW_IMAGES.length];

  return {
    src: bundled.src,
    fallbackSrc: bundled.src,
    position: bundled.position,
    alt: event.imageAlt || bundled.alt || event.title || '',
  };
}
