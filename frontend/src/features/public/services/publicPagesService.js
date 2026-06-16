import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import heroSupportJourney from '../../../assets/images/hero-support-journey.png';
import assutaLogo from '../../../assets/images/assuta.png';
import ichilovLogo from '../../../assets/images/ichilov.png';
import barzilaiLogo from '../../../assets/images/barzilai-logo.jpg';
import shamirLogo from '../../../assets/images/shamir.png';
import {
  isKnownAboutUsIconKey,
  DEFAULT_ABOUT_US_ICON_KEY,
} from '../components/cmsIcons';

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
  backgroundImageUrl: heroSupportJourney,
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

export const DEFAULT_LEARN_TOGETHER = {
  eyebrow: 'מרחב של תמיכה והשראה',
  title: 'השירותים והפעילויות שלנו',
  paragraph:
    'כאן תמצאי מרחבים רכים של ליווי, חיבור וחיזוק — בדיוק במקום שבו את נמצאת בדרך.',
  cards: [
    {
      id: 'seed-support-groups',
      imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80',
      title: 'קבוצות תמיכה',
      description: 'מפגשי תמיכה קבוצתיים במרחב בטוח ותומך עם נשים שעוברות חוויות דומות.',
      order: 0,
      popup: {
        title: 'קבוצות תמיכה',
        paragraph:
          'קבוצות תמיכה הן לב השי-נא — מרחב בטוח שבו נשים פוגשות נשים, משתפות, מקשיבות ומרגישות שיש מי שמבינה. בלי שיפוטיות, בקצב אנושי וחם.',
        sections: [
          {
            label: 'למי זה מתאים',
            text: 'לנשים ולמתמודדות עם סרטן שמחפשות קהילה, הקשבה וחיבור אמיתי עם נשים שחוות מסע דומה.',
          },
          {
            label: 'מה מקבלות',
            text: 'מפגשים קבוצתיים מונחים, שיח פתוח, כלים רגשיים ותחושת שייכות שמלווה לאורך הדרך.',
          },
          {
            label: 'איך מצטרפות',
            text: 'משאירות פרטים בטופס ההצטרפות או יוצרות קשר — נחזור אלייך בחום ונתאים קבוצה מתאימה.',
          },
        ],
        sideImageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80',
      },
    },
    {
      id: 'seed-lectures-workshops',
      imageUrl: 'https://images.unsplash.com/photo-1573496359142-bf2b0c2303f2?auto=format&fit=crop&w=1000&q=80',
      title: 'הרצאות וסדנאות',
      description: 'ידע מעשי, כלים רגשיים וסדנאות העצמה שמחזקות את ההתמודדות היומיומית.',
      order: 1,
      popup: {
        title: 'הרצאות וסדנאות',
        paragraph:
          'הרצאות וסדנאות שנבנות מתוך הקשבה לנשים בקהילה — ידע מקצועי, כלים מעשיים והעצמה רגשית במרחב נשי, רך ומחבק.',
        sections: [
          {
            label: 'למי זה מתאים',
            text: 'לנשים שרוצות להעמיק, ללמוד, לחזק את הביטחון ולקבל כלים להתמודדות היומיומית.',
          },
          {
            label: 'מה מקבלות',
            text: 'מפגשי תוכן, סדנאות חווייתיות, טיפים מקצועיים ומרחב לשאלות, שיתוף והשראה.',
          },
          {
            label: 'איך מצטרפות',
            text: 'ההרשמה נפתחת לפי אירועים קרובים — ניתן להירשם דרך דף האירועים או ליצור איתנו קשר.',
          },
        ],
        sideImageUrl: 'https://images.unsplash.com/photo-1573496359142-bf2b0c2303f2?auto=format&fit=crop&w=1000&q=80',
      },
    },
    {
      id: 'seed-inspiration-stories',
      imageUrl: 'https://images.unsplash.com/photo-1488520997922-dddff85973fb?auto=format&fit=crop&w=1000&q=80',
      title: 'סיפורי השראה',
      description: 'סיפורים אמיתיים של נשים שמצאו תקווה, כוח ומשמעות בתוך המסע.',
      order: 2,
      popup: {
        title: 'סיפורי השראה',
        paragraph:
          'סיפורי השראה אמיתיים של נשים מהקהילה — רגעים של תקווה, כוח, חברות וצמיחה שמזכירות לנו שאפשר לעבור את הדרך גם ברוך.',
        sections: [
          {
            label: 'למי זה מתאים',
            text: 'לכל מי שמחפשת עידוד, זיהוי, תקווה ודוגמאות חיות של נשים שממשיכות קדימה.',
          },
          {
            label: 'מה מקבלות',
            text: 'סיפורים אישיים, מסרים מעוררי השראה ותחושה שאת לא לבד במסע.',
          },
          {
            label: 'איך מצטרפות',
            text: 'אפשר לקרוא סיפורים באתר, לשתף סיפור משלך או לפנות אלינו — נשמח ללוות.',
          },
        ],
        sideImageUrl: 'https://images.unsplash.com/photo-1488520997922-dddff85973fb?auto=format&fit=crop&w=1000&q=80',
      },
    },
    {
      id: 'seed-chat-support',
      imageUrl: 'https://images.unsplash.com/photo-1529333166432-856ffee0e6b8?auto=format&fit=crop&w=1000&q=80',
      title: "צ'אט ותמיכה",
      description: 'ערוץ תמיכה נגיש לשיחה, שיתוף וליווי ברגעים שבהם צריך מענה קרוב.',
      order: 3,
      popup: {
        title: "צ'אט ותמיכה",
        paragraph:
          'ערוץ תמיכה נגיש וקרוב — מקום לשאלה, לשיתוף או למילה חמה ברגעים שבהם צריך מישהי שמבינה מעבר למילים.',
        sections: [
          {
            label: 'למי זה מתאים',
            text: 'לנשים שמעדיפות מענה קרוב, דיסקרטי ונגיש בין מפגשים או בשעות שקטות.',
          },
          {
            label: 'מה מקבלות',
            text: 'ליווי בשיח, הכוונה לפעילויות מתאימות ותחושת נוכחות של קהילה שדואגת.',
          },
          {
            label: 'איך מצטרפות',
            text: 'ניתן לפנות דרך טופס יצירת קשר או בערוצי הקהילה הפתוחים למצטרפות.',
          },
        ],
        sideImageUrl: 'https://images.unsplash.com/photo-1529333166432-856ffee0e6b8?auto=format&fit=crop&w=1000&q=80',
      },
    },
    {
      id: 'seed-donations-community',
      imageUrl: 'https://images.unsplash.com/photo-1487412727787-6dfaa1abf0f2?auto=format&fit=crop&w=1000&q=80',
      title: 'תרומות לקהילה',
      description: 'תרומות שמאפשרות להרחיב פעילות, להנגיש ליווי ולתמוך בנשים נוספות.',
      order: 4,
      popup: {
        title: 'תרומות לקהילה',
        paragraph:
          'כל תרומה מחזקת את הלב של הקהילה — מאפשרת לנו להרחיב תמיכה, ליווי ופעילות לנשים נוספות שזקוקות למרחב בטוח.',
        sections: [
          {
            label: 'למי זה מתאים',
            text: 'לכל מי שרוצה לקחת חלק בהשפעה, לתמוך בנשים בקהילה ולהרחיב את מעגל התמיכה.',
          },
          {
            label: 'מה מקבלות',
            text: 'תרומה ישירה לפעילות, ליווי ותמיכה רגשית וקהילתית לנשים במסע המשמעותי הזה.',
          },
          {
            label: 'איך מצטרפות',
            text: 'ניתן לתרום בקלות דרך עמוד התרומה — כל סכום, קטן כגדול, יוצר שינוי אמיתי.',
          },
        ],
        sideImageUrl: 'https://images.unsplash.com/photo-1487412727787-6dfaa1abf0f2?auto=format&fit=crop&w=1000&q=80',
      },
    },
    {
      id: 'seed-women-events',
      imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=80',
      title: 'אירועים לנשים',
      description: 'ערבי העצמה, מפגשי רווחה וחגיגות קהילתיות שמחברות ומחזקות.',
      order: 5,
      popup: {
        title: 'אירועים לנשים',
        paragraph:
          'אירועים לנשים שמחברים בין לב ללב — ערבי העצמה, מפגשי רווחה וחגיגות קהילתיות במרחב חם, צבעוני ומלא אהבה.',
        sections: [
          {
            label: 'למי זה מתאים',
            text: 'לנשים מהקהילה ולמי שמעוניינות להכיר, להתחבר ולחוות יחד רגעים של חיזוק.',
          },
          {
            label: 'מה מקבלות',
            text: 'מפגשים מעוררי השראה, חוויות משותפות, חברות ותחושת שייכות אמיתית.',
          },
          {
            label: 'איך מצטרפות',
            text: 'ההרשמה מתבצעת לפי אירוע — עקבי אחרי האירועים הקרובים באתר או פני אלינו.',
          },
        ],
        sideImageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=80',
      },
    },
  ],
};

export const LEARN_TOGETHER_MAX_SECTIONS = 3;

export const DEFAULT_INSPIRATIONAL_STORIES = [
  {
    id: 'seed-story-rachel',
    name: 'רחל כהן',
    occupation: 'מתמודדת מנצחת',
    story:
      'הקהילה של SHE-NA היתה האור שלי בתקופה החשוכה ביותר. מצאתי כאן לא רק תמיכה, אלא משפחה אמיתית שהבינה אותי.',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=78',
  },
  {
    id: 'seed-story-sara',
    name: 'שרה לוי',
    occupation: 'מתנדבת ותומכת',
    story:
      'אחרי שעברתי את המסע בעצמי, החלטתי לתת חזרה. כל יום שאני עוזרת לאישה אחרת מזכיר לי את הכוח שיש בנו.',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=78',
  },
  {
    id: 'seed-story-michal',
    name: 'מיכל אברהם',
    occupation: 'חברת קהילה',
    story:
      'הסדנאות וההרצאות שינו את הדרך שבה אני מסתכלת על החיים. למדתי שיש תקווה ושאני יכולה להיות חזקה יותר ממה שחשבתי.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=78',
  },
];

export const STATISTICS_MAX = 4;

export const STATISTIC_ICON_KEYS = [
  'hands-heart',
  'megaphone',
  'users-round',
  'book-open',
  'heart',
  'sparkles',
];

export const DEFAULT_STATISTICS = [
  {
    id: 'community_women',
    icon: 'hands-heart',
    value: 2545,
    title: 'נשים בקהילה',
    description: 'מרחב תמיכה חי, מכיל ונגיש.',
  },
  {
    id: 'annual_events',
    icon: 'megaphone',
    value: 120,
    title: 'אירועים שנתיים',
    description: 'סדנאות, הרצאות ומפגשי קהילה.',
  },
  {
    id: 'volunteers',
    icon: 'users-round',
    value: 85,
    title: 'מתנדבים',
    description: 'נשים ואנשי מקצוע שמלווים באהבה.',
  },
  {
    id: 'success_stories',
    icon: 'book-open',
    value: 1500,
    title: 'סיפורי הצלחה',
    description: 'רגעים של תקווה, חוסן ושינוי.',
  },
];

function isKnownStatisticIcon(value) {
  return typeof value === 'string' && STATISTIC_ICON_KEYS.includes(value);
}

function mergeStatistic(stat, index) {
  const safe = stat && typeof stat === 'object' ? stat : {};
  const fallback = DEFAULT_STATISTICS[index] || DEFAULT_STATISTICS[0];
  const rawValue = typeof safe.value === 'number' ? safe.value : Number(safe.value);
  const value = Number.isFinite(rawValue) && rawValue >= 0 ? Math.floor(rawValue) : fallback.value;
  return {
    id: safeString(safe.id) || fallback.id,
    icon: isKnownStatisticIcon(safe.icon) ? safe.icon : fallback.icon,
    value,
    title: safeString(safe.title) || fallback.title,
    description: safeString(safe.description),
    ...(safe.translations ? { translations: safe.translations } : {}),
  };
}

export function mergeStatistics(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_STATISTICS.map((s) => ({ ...s }));
  }
  return value.slice(0, STATISTICS_MAX).map((stat, index) => mergeStatistic(stat, index));
}

export const DEFAULT_PRESS_COVERAGE = [
  {
    id: 'seed-press-1',
    title: 'סיקור ב-Jerusalem Post',
    description: 'כתבה על הקהילה, החמלה והליווי שאנחנו מעניקים לנשים ולמשפחות.',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=80',
    articleUrl: 'https://www.jpost.com/',
  },
  {
    id: 'seed-press-2',
    title: 'קול נשי בתקשורת',
    description: 'סיפור על כוחה של קהילה תומכת ועל מרחב בטוח לנשים בדרך.',
    imageUrl: 'https://images.unsplash.com/photo-1573164574511-73c773193279?auto=format&fit=crop&w=1000&q=80',
    articleUrl: '',
  },
  {
    id: 'seed-press-3',
    title: 'תקווה, אמונה וחיבור',
    description: 'על העשייה הקהילתית של שנה ועל המשמעות של לא להיות לבד.',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1000&q=80',
    articleUrl: '',
  },
  {
    id: 'seed-press-4',
    title: 'מהעיתונות עלינו',
    description: 'עוד זווית על התמיכה, הליווי והאהבה שמלוות נשים בכל שלב.',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80',
    articleUrl: '',
  },
];

const TEAM_UNSPLASH_PARAMS = 'auto=format&fit=crop&w=256&h=256&q=85&crop=faces';

export const DEFAULT_TEAM_MEMBERS = [
  {
    id: 'seed-team-sarah',
    name: 'ד"ר שרה כהן',
    role: 'מנהלת רפואית ומייסדת',
    bio: 'רופאה מומחית באונקולוגיה עם ניסיון של 15 שנה בליווי נשים.',
    imageUrl: `https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?${TEAM_UNSPLASH_PARAMS}`,
    email: 'sarah@she-na.org.il',
    order: 0,
  },
  {
    id: 'seed-team-rachel',
    name: 'רחל לוי',
    role: 'מנהלת תמיכה רגשית',
    bio: 'פסיכולוגית קלינית המתמחה בטיפול בטראומה וליווי נשים.',
    imageUrl: `https://images.unsplash.com/photo-1580489944761-15a19d654956?${TEAM_UNSPLASH_PARAMS}`,
    email: 'rachel@she-na.org.il',
    order: 1,
  },
  {
    id: 'seed-team-michal',
    name: 'מיכל אברהם',
    role: 'רכזת קהילה ופעילויות',
    bio: 'עובדת סוציאלית ומנחת קבוצות תמיכה וחוויות משמעותיות.',
    imageUrl: `https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?${TEAM_UNSPLASH_PARAMS}`,
    email: 'michal@she-na.org.il',
    order: 2,
  },
  {
    id: 'seed-team-naomi',
    name: 'נעמי דוד',
    role: 'יועצת תזונה ואורח חיים',
    bio: 'תזונאית קלינית שמלווה נשים ביצירת הרגלי חיים בריאים.',
    imageUrl: `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?${TEAM_UNSPLASH_PARAMS}`,
    email: 'naomi@she-na.org.il',
    order: 3,
  },
];

function mergeTeamMember(member, index) {
  const safe = member && typeof member === 'object' ? member : {};
  const orderRaw = typeof safe.order === 'number' ? safe.order : Number(safe.order);
  const order = Number.isFinite(orderRaw) ? orderRaw : index;
  return {
    id: safeString(safe.id) || `team-${index}`,
    name: safeString(safe.name),
    role: safeString(safe.role),
    bio: safeString(safe.bio),
    imageUrl: safeString(safe.imageUrl),
    email: safeString(safe.email),
    order,
    // Preserve Azure translations so the public read path can localize.
    ...(safe.translations ? { translations: safe.translations } : {}),
  };
}

export function mergeTeamMembers(value) {
  if (!Array.isArray(value)) return DEFAULT_TEAM_MEMBERS.map((m) => ({ ...m }));
  return value
    .map((member, index) => mergeTeamMember(member, index))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function mergePressCoverageItem(item, index) {
  const safe = item && typeof item === 'object' ? item : {};
  return {
    id: safeString(safe.id) || `press-${index}`,
    title: safeString(safe.title),
    description: safeString(safe.description),
    imageUrl: safeString(safe.imageUrl),
    articleUrl: safeString(safe.articleUrl),
    ...(safe.translations ? { translations: safe.translations } : {}),
  };
}

export function mergePressCoverage(value) {
  if (!Array.isArray(value)) return DEFAULT_PRESS_COVERAGE.map((item) => ({ ...item }));
  return value.map((item, index) => mergePressCoverageItem(item, index));
}

function mergeInspirationalStory(story, index) {
  const safe = story && typeof story === 'object' ? story : {};
  return {
    id: safeString(safe.id) || `story-${index}`,
    name: safeString(safe.name),
    story: safeString(safe.story),
    imageUrl: safeString(safe.imageUrl),
    occupation: safeString(safe.occupation),
    ...(safe.translations ? { translations: safe.translations } : {}),
  };
}

export function mergeInspirationalStories(value) {
  if (!Array.isArray(value)) return DEFAULT_INSPIRATIONAL_STORIES.map((s) => ({ ...s }));
  return value.map((story, index) => mergeInspirationalStory(story, index));
}

export function emptyLearnTogetherPopup() {
  return {
    title: '',
    paragraph: '',
    sections: [],
    sideImageUrl: '',
  };
}

function safeString(value) {
  return typeof value === 'string' ? value : '';
}

function normalizeSection(section) {
  if (!section || typeof section !== 'object') return null;
  const label = safeString(section.label).trim();
  const text = safeString(section.text).trim();
  if (!label || !text) return null;
  return { label, text };
}

function legacySectionsFromPopup(popup) {
  const out = [];
  for (let i = 1; i <= LEARN_TOGETHER_MAX_SECTIONS; i += 1) {
    const label = safeString(popup?.[`section${i}Label`]).trim();
    const text = safeString(popup?.[`section${i}Text`]).trim();
    if (label && text) out.push({ label, text });
  }
  return out;
}

function mergeLearnTogetherPopup(popup) {
  const safe = popup && typeof popup === 'object' ? popup : {};
  const incoming = Array.isArray(safe.sections) ? safe.sections : null;
  const sectionsSource = incoming && incoming.length ? incoming : legacySectionsFromPopup(safe);
  const sections = sectionsSource
    .map(normalizeSection)
    .filter(Boolean)
    .slice(0, LEARN_TOGETHER_MAX_SECTIONS);
  return {
    title: safeString(safe.title),
    paragraph: safeString(safe.paragraph),
    sections,
    sideImageUrl: safeString(safe.sideImageUrl),
  };
}

export function popupHasLegacyFields(popup) {
  if (!popup || typeof popup !== 'object') return false;
  if ('ctaText' in popup || 'ctaUrl' in popup) return true;
  for (let i = 1; i <= LEARN_TOGETHER_MAX_SECTIONS; i += 1) {
    if (`section${i}Label` in popup || `section${i}Text` in popup) return true;
  }
  return false;
}

function mergeLearnTogetherCard(card, index) {
  const safe = card && typeof card === 'object' ? card : {};
  const order = Number.isFinite(safe.order) ? safe.order : index;
  return {
    id: safeString(safe.id) || `card-${index}`,
    imageUrl: safeString(safe.imageUrl),
    title: safeString(safe.title),
    description: safeString(safe.description),
    order,
    createdAt: safe.createdAt || null,
    popup: mergeLearnTogetherPopup(safe.popup),
    ...(safe.translations ? { translations: safe.translations } : {}),
  };
}

export function mergeLearnTogether(learnTogether) {
  const safe = learnTogether && typeof learnTogether === 'object' ? learnTogether : {};
  const incomingCards = Array.isArray(safe.cards) ? safe.cards : null;
  const cards = (incomingCards && incomingCards.length
    ? incomingCards
    : DEFAULT_LEARN_TOGETHER.cards
  )
    .map((card, index) => mergeLearnTogetherCard(card, index))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return {
    eyebrow:
      safeString(safe.eyebrow).trim() || DEFAULT_LEARN_TOGETHER.eyebrow,
    title: safeString(safe.title).trim() || DEFAULT_LEARN_TOGETHER.title,
    paragraph:
      safeString(safe.paragraph).trim() || DEFAULT_LEARN_TOGETHER.paragraph,
    cards,
    ...(safe.translations ? { translations: safe.translations } : {}),
  };
}

export const DEFAULT_CONTACT = {
  email: 'info@she-na.org.il',
  phone: '03-1234567',
  linkedinUrl: '',
  instagramUrl: '',
  facebookUrl: '',
};

export function mergeContact(value) {
  const safe = value && typeof value === 'object' ? value : {};
  const linkedinUrl = safeString(safe.linkedinUrl);
  const instagramUrl = safeString(safe.instagramUrl);
  const facebookUrl = safeString(safe.facebookUrl);

  const socialLinks = [
    linkedinUrl && { id: 'linkedin', label: 'LinkedIn', href: linkedinUrl },
    instagramUrl && { id: 'instagram', label: 'Instagram', href: instagramUrl },
    facebookUrl && { id: 'facebook', label: 'Facebook', href: facebookUrl },
  ].filter(Boolean);

  return {
    email: safeString(safe.email) || DEFAULT_CONTACT.email,
    phone: safeString(safe.phone) || DEFAULT_CONTACT.phone,
    linkedinUrl,
    instagramUrl,
    facebookUrl,
    socialLinks,
  };
}

export const DEFAULT_PARTNERS = [
  {
    id: 'seed-partner-assuta',
    name: 'אסותא אשדוד',
    logoUrl: assutaLogo,
    description: 'בית חולים פרטי המעניק ליווי רפואי מתקדם ושירותי בריאות מקיפים לנשים ולמשפחותיהן.',
    order: 0,
  },
  {
    id: 'seed-partner-ichilov',
    name: 'סוראסקי איכילוב',
    logoUrl: ichilovLogo,
    description: 'מרכז רפואי מוביל המציע מגוון שירותים אונקולוגיים וליווי מקצועי לאורך הטיפול.',
    order: 1,
  },
  {
    id: 'seed-partner-barzilai',
    name: 'ברזילי',
    logoUrl: barzilaiLogo,
    description: 'בית חולים ממשלתי עם מחלקה אונקולוגית מתקדמת ושירותי תמיכה לנשים.',
    order: 2,
  },
  {
    id: 'seed-partner-assaf',
    name: 'אסף הרופא',
    logoUrl: shamirLogo,
    description: 'מרכז רפואי גדול עם מומחיות בטיפולים אונקולוגיים ותמיכה הוליסטית.',
    order: 3,
  },
];

function mergePartner(partner, index) {
  const safe = partner && typeof partner === 'object' ? partner : {};
  const orderRaw = typeof safe.order === 'number' ? safe.order : Number(safe.order);
  const order = Number.isFinite(orderRaw) ? orderRaw : index;
  return {
    id: safeString(safe.id) || `partner-${index}`,
    name: safeString(safe.name),
    logoUrl: safeString(safe.logoUrl) || (DEFAULT_PARTNERS.find((d) => d.id === safeString(safe.id))?.logoUrl ?? ''),
    description: safeString(safe.description),
    order,
    ...(safe.translations ? { translations: safe.translations } : {}),
  };
}

export function mergePartners(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_PARTNERS.map((p) => ({ ...p }));
  }
  return value
    .map((partner, index) => mergePartner(partner, index))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function mergeHero(hero) {
  const safeHero = hero && typeof hero === 'object' ? hero : {};
  return {
    title: safeHero.title || DEFAULT_HOME_HERO.title,
    subtitle: safeHero.subtitle || DEFAULT_HOME_HERO.subtitle,
    description: safeHero.description || DEFAULT_HOME_HERO.description,
    backgroundImageUrl: safeHero.backgroundImageUrl || DEFAULT_HOME_HERO.backgroundImageUrl,
    ...(safeHero.translations ? { translations: safeHero.translations } : {}),
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
    learnTogether: {
      eyebrow: DEFAULT_LEARN_TOGETHER.eyebrow,
      title: DEFAULT_LEARN_TOGETHER.title,
      paragraph: DEFAULT_LEARN_TOGETHER.paragraph,
      cards: DEFAULT_LEARN_TOGETHER.cards.map((card) => ({
        ...card,
        popup: { ...card.popup },
      })),
    },
    inspirationalStories: DEFAULT_INSPIRATIONAL_STORIES.map((s) => ({ ...s })),
    pressCoverage: DEFAULT_PRESS_COVERAGE.map((p) => ({ ...p })),
    statistics: DEFAULT_STATISTICS.map((s) => ({ ...s })),
    teamMembers: DEFAULT_TEAM_MEMBERS.map((m) => ({ ...m })),
    partners: DEFAULT_PARTNERS.map((p) => ({ ...p })),
    contact: { ...DEFAULT_CONTACT },
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
      learnTogether: mergeLearnTogether(data.learnTogether),
      inspirationalStories: mergeInspirationalStories(data.inspirationalStories),
      pressCoverage: mergePressCoverage(data.pressCoverage),
      statistics: mergeStatistics(data.statistics),
      teamMembers: mergeTeamMembers(data.teamMembers),
      partners: mergePartners(data.partners),
      contact: mergeContact(data.contact),
    };
  } catch (error) {
    console.warn('[publicPagesService] Failed to load public_pages/home, using defaults.', error);
    return getDefaultPublicHomeDoc();
  }
}
