import {
  CalendarHeart,
  Flower,
  HandHeart,
  Handshake,
  Heart,
  Leaf,
  LifeBuoy,
  Lightbulb,
  MessageCircleHeart,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Sun,
  UsersRound,
} from 'lucide-react';

// Single source of truth for the About Us card icon library.
// Admin form lets editors pick from these keys; the public component
// resolves the key to a component at render time.
//
// To add or remove an icon, edit this list. Both the admin picker and
// the public renderer pick it up automatically.

export const ABOUT_US_ICON_LIBRARY = [
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
];

export const DEFAULT_ABOUT_US_ICON_KEY = 'heart';

const ICON_BY_KEY = ABOUT_US_ICON_LIBRARY.reduce((acc, entry) => {
  acc[entry.key] = entry;
  return acc;
}, {});

export const ABOUT_US_ICON_KEYS = ABOUT_US_ICON_LIBRARY.map((entry) => entry.key);

export function isKnownAboutUsIconKey(key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(ICON_BY_KEY, key);
}

export function getAboutUsIconEntry(key) {
  return ICON_BY_KEY[key] || ICON_BY_KEY[DEFAULT_ABOUT_US_ICON_KEY];
}

export function getAboutUsIconComponent(key) {
  return getAboutUsIconEntry(key).Icon;
}
