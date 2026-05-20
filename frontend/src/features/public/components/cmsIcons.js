import {
  BookOpen,
  CalendarHeart,
  Compass,
  Flower,
  Gift,
  GraduationCap,
  HandHeart,
  Handshake,
  Headphones,
  Heart,
  Leaf,
  Library,
  LifeBuoy,
  Lightbulb,
  MessageCircleHeart,
  Mic,
  Presentation,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Sun,
  Target,
  UsersRound,
} from 'lucide-react';

// Single source of truth for the CMS icon library, shared across the public
// home page admin sections (About Us, Learn Together, future sections).
// Admin pickers and public renderers both import from here.
//
// To add or remove an icon, edit this list. Every key must be a stable string.

export const CMS_ICON_LIBRARY = [
  { key: 'calendar-heart',       label: 'Calendar Heart',  Icon: CalendarHeart },
  { key: 'message-circle-heart', label: 'Message Heart',   Icon: MessageCircleHeart },
  { key: 'users-round',          label: 'Community',       Icon: UsersRound },
  { key: 'heart',                label: 'Heart',           Icon: Heart },
  { key: 'hand-heart',           label: 'Hand Heart',      Icon: HandHeart },
  { key: 'handshake',            label: 'Handshake',       Icon: Handshake },
  { key: 'sparkles',             label: 'Sparkles',        Icon: Sparkles },
  { key: 'shield-check',         label: 'Shield',          Icon: ShieldCheck },
  { key: 'flower',               label: 'Flower',          Icon: Flower },
  { key: 'leaf',                 label: 'Leaf',            Icon: Leaf },
  { key: 'star',                 label: 'Star',            Icon: Star },
  { key: 'life-buoy',            label: 'Life Buoy',       Icon: LifeBuoy },
  { key: 'lightbulb',            label: 'Lightbulb',       Icon: Lightbulb },
  { key: 'sun',                  label: 'Sun',             Icon: Sun },
  { key: 'smile',                label: 'Smile',           Icon: Smile },
  { key: 'book-open',            label: 'Book',            Icon: BookOpen },
  { key: 'gift',                 label: 'Gift',            Icon: Gift },
  { key: 'mic',                  label: 'Microphone',      Icon: Mic },
  { key: 'target',               label: 'Target',          Icon: Target },
  { key: 'compass',              label: 'Compass',         Icon: Compass },
  { key: 'graduation-cap',       label: 'Graduation',      Icon: GraduationCap },
  { key: 'presentation',         label: 'Presentation',    Icon: Presentation },
  { key: 'library',              label: 'Library',         Icon: Library },
  { key: 'headphones',           label: 'Headphones',      Icon: Headphones },
];

export const DEFAULT_CMS_ICON_KEY = 'heart';

const ICON_BY_KEY = CMS_ICON_LIBRARY.reduce((acc, entry) => {
  acc[entry.key] = entry;
  return acc;
}, {});

export const CMS_ICON_KEYS = CMS_ICON_LIBRARY.map((entry) => entry.key);

export function isKnownCmsIconKey(key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(ICON_BY_KEY, key);
}

export function getCmsIconEntry(key) {
  return ICON_BY_KEY[key] || ICON_BY_KEY[DEFAULT_CMS_ICON_KEY];
}

export function getCmsIconComponent(key) {
  return getCmsIconEntry(key).Icon;
}

// Backwards-compat aliases — About Us tab and section import these names.
export const ABOUT_US_ICON_LIBRARY = CMS_ICON_LIBRARY;
export const ABOUT_US_ICON_KEYS = CMS_ICON_KEYS;
export const DEFAULT_ABOUT_US_ICON_KEY = DEFAULT_CMS_ICON_KEY;
export const isKnownAboutUsIconKey = isKnownCmsIconKey;
export const getAboutUsIconEntry = getCmsIconEntry;
export const getAboutUsIconComponent = getCmsIconComponent;
