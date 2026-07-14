import {
  getSupportAreaImageAltForCard,
  getSupportAreaImageForCard,
  getSupportAreaImagePositionForCard,
  isValidSupportAreaImageSrc,
} from './supportAreaImages';

const SUPPORT_AREA_MODAL_DETAILS = {
  'support-groups': {
    imageQuote: 'כאן אף פעם לא הולכות לבד — יש אוזן קשובה ולב פתוח.',
    longDescription:
      'מרחב בטוח שבו נשים פוגשות נשים, משתפות ומרגישות שיש מי שמבינה — בלי שיפוטיות, בקצב אנושי וחם.',
    infoPoints: [
      {
        label: 'למי זה מתאים',
        text: 'לנשים שמחפשות קהילה, הקשבה וחיבור אמיתי עם נשים במסע דומה.',
      },
      {
        label: 'מה מקבלות',
        text: 'מפגשים קבוצתיים, שיח פתוח ותחושת שייכות שמלווה לאורך הדרך.',
      },
      {
        label: 'איך מצטרפות',
        text: 'משאירות פרטים בטופס ההצטרפות — נחזור אלייך בחום ונתאים קבוצה.',
      },
    ],
    actionLabel: 'להרשמה',
    actionHref: '#join',
  },
  'lectures-workshops': {
    imageQuote: 'ידע, כלים והעצמה — במרחב נשי שמרגיש כמו בית.',
    longDescription:
      'הרצאות וסדנאות מתוך הקשבה לנשים בקהילה — ידע מקצועי, כלים מעשיים והעצמה רגשית.',
    infoPoints: [
      {
        label: 'למי זה מתאים',
        text: 'לנשים שרוצות להעמיק, ללמוד ולחזק את הביטחון היומיומי.',
      },
      {
        label: 'מה מקבלות',
        text: 'מפגשי תוכן, סדנאות חווייתיות ומרחב לשאלות והשראה.',
      },
      {
        label: 'איך מצטרפות',
        text: 'ההרשמה נפתחת לפי אירועים קרובים — בדף האירועים או ביצירת קשר.',
      },
    ],
    actionLabel: 'לצפייה באירועים',
    actionHref: '#events',
  },
  'inspiration-stories': {
    imageQuote: 'סיפורים שמזכירים לנו שאפשר לעבור את הדרך גם ברוך.',
    longDescription:
      'סיפורים אמיתיים של נשים מהקהילה — רגעים של תקווה, כוח וחברות שמעוררים השראה.',
    infoPoints: [
      {
        label: 'למי זה מתאים',
        text: 'לכל מי שמחפשת עידוד, זיהוי ותקווה מתוך חוויות אמיתיות.',
      },
      {
        label: 'מה מקבלות',
        text: 'סיפורים אישיים, מסרים מעוררי השראה ותחושה שאת לא לבד.',
      },
      {
        label: 'איך מצטרפות',
        text: 'קוראים באתר, משתפות סיפור משלכן או פונות אלינו בחום.',
      },
    ],
    actionLabel: 'לסיפורי השראה',
    actionHref: '#stories',
  },
  'chat-support': {
    imageQuote: 'לפעמים מספיקה מילה חמה — ויש מי שמקשיבה באמת.',
    longDescription:
      'ערוץ תמיכה נגיש וקרוב — לשאלה, לשיתוף או למילה חמה ברגעים שצריך מענה.',
    infoPoints: [
      {
        label: 'למי זה מתאים',
        text: 'לנשים שמעדיפות מענה קרוב ודיסקרטי בין מפגשים.',
      },
      {
        label: 'מה מקבלות',
        text: 'ליווי בשיח, הכוונה לפעילויות ותחושת נוכחות של קהילה.',
      },
      {
        label: 'איך מצטרפות',
        text: 'ניתן לפנות דרך טופס יצירת קשר או בערוצי הקהילה.',
      },
    ],
    actionLabel: 'צרי קשר',
    actionHref: '#contact',
  },
  'donations-community': {
    imageQuote: 'כל תרומה מרחיבה את מעגל התמיכה והאהבה.',
    longDescription:
      'כל תרומה מחזקת את הלב של הקהילה — ומאפשרת ליווי ותמיכה לנשים נוספות.',
    infoPoints: [
      {
        label: 'למי זה מתאים',
        text: 'לכל מי שרוצה לקחת חלק בהשפעה ולתמוך בנשים בקהילה.',
      },
      {
        label: 'מה מקבלות',
        text: 'תרומה ישירה לפעילות, ליווי ותמיכה רגשית וקהילתית.',
      },
      {
        label: 'איך מצטרפות',
        text: 'ניתן לתרום בקלות דרך עמוד התרומה — כל סכום יוצר שינוי.',
      },
    ],
    actionLabel: 'לתרומה',
    actionHref: '#donate',
  },
  'women-events': {
    imageQuote: 'מפגשים שמחברים בין לב ללב — ומחזירים את האור.',
    longDescription:
      'אירועים לנשים שמחברים — ערבי העצמה, מפגשי רווחה וחגיגות קהילתיות חמות.',
    infoPoints: [
      {
        label: 'למי זה מתאים',
        text: 'לנשים מהקהילה ולמי שמעוניינות להכיר ולהתחבר.',
      },
      {
        label: 'מה מקבלות',
        text: 'מפגשים מעוררי השראה, חוויות משותפות ותחושת שייכות.',
      },
      {
        label: 'איך מצטרפות',
        text: 'ההרשמה לפי אירוע — עקבי אחרי האירועים הקרובים באתר.',
      },
    ],
    actionLabel: 'לאירועים קרובים',
    actionHref: '#events',
  },
};

/**
 * Maps modal CTA targets to existing app routes (or public section hashes).
 */
export function resolveSupportAreaActionPath(actionHref = '') {
  const href = String(actionHref || '').trim();

  const routeByHash = {
    '#join': '/events',
    '#events': '/events',
    '#stories': '/public/stories-articles',
    '#contact': '/public#contact',
    '#donate': '/public/donations',
  };

  if (routeByHash[href]) {
    return routeByHash[href];
  }

  if (href.startsWith('/') && !href.startsWith('//')) {
    return href;
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  return '/public#contact';
}

export function enrichSupportAreaForModal(area = {}) {
  if (!area || typeof area !== 'object') {
    return null;
  }

  const details = SUPPORT_AREA_MODAL_DETAILS[area.id] || {};

  return {
    ...area,
    imageUrl: isValidSupportAreaImageSrc(area.imageUrl) ? area.imageUrl : getSupportAreaImageForCard(area),
    imagePosition: area.imagePosition || getSupportAreaImagePositionForCard(area),
    imageAlt: area.imageAlt || getSupportAreaImageAltForCard(area),
    imageQuote: area.imageQuote || details.imageQuote || '',
    longDescription: details.longDescription || area.longDescription || area.description || area.text || '',
    infoPoints: Array.isArray(area.infoPoints) && area.infoPoints.length ? area.infoPoints : details.infoPoints || [],
    actionLabel: area.actionLabel || details.actionLabel || 'צרי קשר',
    actionHref: area.actionHref || details.actionHref || area.readMoreUrl || '#contact',
  };
}

export default SUPPORT_AREA_MODAL_DETAILS;
