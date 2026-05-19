import {
  assutaHero,
  assutaLogo,
  assafHarofehHero,
  barzilaiHero,
  barzilaiLogo,
  ichilovHero,
  ichilovLogo,
  shamirLogo,
} from './medicalPartnerImages';

export const MEDICAL_PARTNERS = [
  {
    id: 'assuta-ashdod',
    name: 'אסותא אשדוד',
    shortDescription: 'בית חולים פרטי המעניק ליווי רפואי מתקדם, מרחבים מותאמים ותמיכה רגשית לנשים ולמשפחות.',
    logoSrc: assutaLogo,
    heroImage: assutaHero,
    heroAlt: 'חזית בית חולים מודרני באור רך — סביבה רפואית מזמינה',
    heroPosition: 'center 42%',
    heroQuote: 'שותפות רפואית שמלווה בחמלה, במקצועיות ובביטחון.',
    longDescription:
      'שיתוף פעולה עם אסותא אשדוד מאפשר ליווי צמוד, גישה למומחים ולמרחבי טיפול נעימים — בשילוב תמיכה קהילתית רכה של שנה.',
    services: [
      { id: 'medical', label: 'ליווי רפואי', icon: 'medical' },
      { id: 'support', label: 'תמיכה נפשית', icon: 'support' },
      { id: 'groups', label: 'קבוצות תמיכה', icon: 'groups' },
      { id: 'family', label: 'ייעוץ למשפחה', icon: 'family' },
    ],
    phone: '08-870-4500',
    email: 'info@assuta.co.il',
    hours: 'ימים א׳–ה׳: 08:00–20:00 | שישי: 08:00–14:00',
    address: 'הרצל 7, אשדוד',
    contactHref: '/public#contact',
    registerHref: '/appointments',
  },
  {
    id: 'ichilov',
    name: 'סוראסקי איכילוב',
    shortDescription: 'מרכז רפואי מוביל המשלב מצוינות רפואית, מחקר ותמיכה אנושית לנשים בכל שלבי המסע.',
    logoSrc: ichilovLogo,
    heroImage: ichilovHero,
    heroAlt: 'מבנה רפואי מודרני — מרכז בריאות מקצועי ואמין',
    heroPosition: 'center 35%',
    heroQuote: 'מצוינות רפואית לצד ליווי אנושי — לאורך כל הדרך.',
    longDescription:
      'באיכילוב נשים מקבלות ליווי מקצועי, טיפול רב-תחומי וגישה למומחים — לצד מרחבי תמיכה רגשית וקהילתית של שנה.',
    services: [
      { id: 'medical', label: 'מומחיות רפואית', icon: 'medical' },
      { id: 'support', label: 'ליווי רגשי', icon: 'support' },
      { id: 'groups', label: 'מפגשי תמיכה', icon: 'groups' },
      { id: 'research', label: 'מחקר וחדשנות', icon: 'research' },
    ],
    phone: '03-697-4000',
    email: 'info@tasmc.org.il',
    hours: 'ימים א׳–ה׳: 07:30–20:00 | שישי: 07:30–13:00',
    address: 'ויצמן 6, תל אביב',
    contactHref: '/public#contact',
    registerHref: '/appointments',
  },
  {
    id: 'barzilai',
    name: 'ברזילי',
    shortDescription: 'בית חולים אזורי המעניק טיפול מסור, ליווי אישי ותמיכה לנשים ולמשפחות בדרום הארץ.',
    logoSrc: barzilaiLogo,
    heroImage: barzilaiHero,
    heroAlt: 'מסדרון בית חולים מואר — מרחב טיפולי נעים ומזמין',
    heroPosition: 'center 48%',
    heroQuote: 'טיפול קשוב ותמיכה חמה — קרוב לבית, קרוב ללב.',
    longDescription:
      'ברזילי משתף פעולה עם שנה כדי להעניק ליווי רפואי קשוב, שירותי תמיכה ומרחב בטוח לנשים ולמשפחות באזור הדרום.',
    services: [
      { id: 'medical', label: 'טיפול רפואי', icon: 'medical' },
      { id: 'support', label: 'תמיכה נפשית', icon: 'support' },
      { id: 'groups', label: 'קבוצות נשים', icon: 'groups' },
      { id: 'community', label: 'ליווי קהילתי', icon: 'family' },
    ],
    phone: '08-674-5111',
    email: 'barzilai@barzi.health.gov.il',
    hours: 'ימים א׳–ה׳: 08:00–19:00 | שישי: 08:00–13:00',
    address: 'ההסתדרות 2, אשקלון',
    contactHref: '/public#contact',
    registerHref: '/appointments',
  },
  {
    id: 'assaf-harofeh',
    name: 'שמיר אסף הרופא',
    shortDescription: 'מרכז רפואי מוביל המשלב מומחיות רפואית, חמלה ותמיכה מקיפה לנשים לאורך כל הדרך.',
    logoSrc: shamirLogo,
    heroImage: assafHarofehHero,
    heroAlt: 'לובי בית חולים מודרני ומואר — מרחב בריאות מזמין ומרגיע',
    heroPosition: 'center 40%',
    heroQuote: 'מומחיות, אמון ותמיכה — יחד בדרך לריפוי ולחיזוק.',
    longDescription:
      'בשמיר אסף הרופא נשים נפגשות עם צוותים מקצועיים, מסלולי טיפול מותאמים ותמיכה רגשית-קהילתית בשיתוף שנה.',
    services: [
      { id: 'medical', label: 'מומחים רפואיים', icon: 'medical' },
      { id: 'support', label: 'תמיכה רגשית', icon: 'support' },
      { id: 'groups', label: 'קבוצות תמיכה', icon: 'groups' },
      { id: 'rehab', label: 'שיקום וליווי', icon: 'research' },
    ],
    phone: '08-977-9111',
    email: 'info@assuta.co.il',
    hours: 'ימים א׳–ה׳: 08:00–18:00 | שישי: 08:00–12:00',
    address: 'צריפין',
    contactHref: '/public#contact',
    registerHref: '/appointments',
  },
];

export function getMedicalPartnerById(id) {
  return MEDICAL_PARTNERS.find((partner) => partner.id === id) || null;
}

export function resolveMedicalPartnerActionPath(href = '') {
  const value = String(href || '').trim();

  if (value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('#')) {
    return `/public${value}`;
  }

  return '/public#contact';
}
