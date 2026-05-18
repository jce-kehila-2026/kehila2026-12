export const teamMembers = [
  {
    name: 'ד"ר שרה כהן',
    role: 'מנהלת רפואית ומייסדת',
    image: '/images/team/sarah.jpg',
    email: 'sarah@she-na.org',
    description: 'רופאה מומחית באונקולוגיה עם ניסיון של 15 שנה בליווי נשים.',
  },
  {
    name: 'רחל לוי',
    role: 'מנהלת תמיכה רגשית',
    image: '/images/team/rachel.jpg',
    email: 'rachel@she-na.org',
    description: 'פסיכולוגית קלינית המתמחה בטיפול בטראומה וליווי נשים.',
  },
  {
    name: 'מיכל אברהם',
    role: 'רכזת קהילה ופעילויות',
    image: '/images/team/michal.jpg',
    email: 'michal@she-na.org',
    description: 'עובדת סוציאלית ומנחת קבוצות תמיכה וחוויות משמעותיות.',
  },
  {
    name: 'נעמי דוד',
    role: 'יועצת תזונה ואורח חיים',
    image: '/images/team/naomi.jpg',
    email: 'naomi@she-na.org',
    description: 'תזונאית קלינית שמלווה נשים ביצירת הרגלי חיים בריאים.',
  },
  {
    name: 'תמר גרין',
    role: 'מדריכת מיינדפולנס ומדיטציה',
    image: '/images/team/tamar.jpg',
    email: 'tamar@she-na.org',
    description: 'מורה ליוגה ומדיטציה, מעניקה כלים לרוגע וחיבור פנימי.',
  },
  {
    name: 'אסתר מזרחי',
    role: 'רכזת סדנאות והעשרה',
    image: '/images/team/ester.jpg',
    email: 'ester@she-na.org',
    description: 'אמנית ויוצרת, מובילה סדנאות אומנות טיפולית והעצמה אישית.',
  },
  {
    name: 'יעל בן דוד',
    role: 'מנהלת תקשורת ושיווק',
    image: '/images/team/yael.jpg',
    email: 'yael@she-na.org',
    description: 'מומחית דיגיטל ותקשורת, מפיצה את מסר התקווה והתמיכה.',
  },
];

const TEAM_PLACEHOLDER_PORTRAITS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=220&h=220&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=220&h=220&q=80',
  'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=220&h=220&q=80',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=220&h=220&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=220&h=220&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=220&h=220&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=220&h=220&q=80',
];

export function getTeamMemberInitials(name) {
  return name
    .replace(/ד"ר\s*/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('');
}

export function getTeamMemberFallbackImage(index) {
  return TEAM_PLACEHOLDER_PORTRAITS[index % TEAM_PLACEHOLDER_PORTRAITS.length];
}
