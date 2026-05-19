import { useRef } from 'react';
import { CalendarHeart, Heart, MessageCircleHeart, UsersRound } from 'lucide-react';
import useInViewOnce from '../hooks/useInViewOnce';

const ABOUT_ICON_PROPS = {
  className: 'public-about__icon-glyph',
  strokeWidth: 1.5,
  absoluteStrokeWidth: true,
  'aria-hidden': true,
};

const ABOUT_CARDS = [
  {
    id: 'emotional-support',
    title: 'תמיכה רגשית',
    description: 'ליווי אישי וקבוצתי במסע שלך עם הבנה ואמפתיה.',
    Icon: Heart,
  },
  {
    id: 'safe-community',
    title: 'קהילה בטוחה',
    description: 'מרחב תומך ומכיל לכל אישה בכל שלב במסע.',
    Icon: UsersRound,
  },
  {
    id: 'community-care',
    title: 'תמיכה קהילתית',
    description: 'חיבור בין נשים, אכפתיות וליווי חם במעגל תומך.',
    Icon: MessageCircleHeart,
  },
  {
    id: 'workshops',
    title: 'סדנאות ואירועים',
    description: 'פעילויות העשרה ומפגשים מעצימים לנפש ולגוף.',
    Icon: CalendarHeart,
  },
];

const CARD_STAGGER_MS = 90;

function AboutTitleDivider() {
  return (
    <div className="public-about__title-divider" aria-hidden="true">
      <span className="public-about__title-divider-line" />
      <span className="public-about__title-divider-heart">
        <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
          <path
            d="M12 20.25s-7.5-4.35-7.5-10.5C4.5 7.5 7.5 4.5 12 7.5c4.5-3 7.5 0 7.5 2.25 0 6.15-7.5 10.5-7.5 10.5z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="public-about__title-divider-line public-about__title-divider-line--end" />
    </div>
  );
}

export default function AboutSection({ about = {}, supportAreas = [] }) {
  const cardsRef = useRef(null);
  const cardsInView = useInViewOnce(cardsRef, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  const visibleSupportAreas = Array.isArray(supportAreas) ? supportAreas.filter(Boolean).slice(0, ABOUT_CARDS.length) : [];
  const aboutTitle = about.title || 'מי אנחנו?';
  const aboutText =
    about.description ||
    [about.intro, about.body].filter(Boolean).join(' ') ||
    'שה-נא היא קהילה מקצועית וחמה לנשים המתמודדות עם אתגרי החיים. אנחנו מאמינות בכוחה של כל אישה לצמוח, להתחזק ולמצוא תקווה חדשה.';

  return (
    <section className="public-section public-section--about" id="about" aria-labelledby="public-about-title">
      <svg className="public-about__icon-defs" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="public-about-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="52%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>
        </defs>
      </svg>

      <div className="public-about__decor" aria-hidden="true">
        <span className="public-about__dots" />
        <span className="public-about__blob public-about__blob--lavender" />
        <span className="public-about__blob public-about__blob--pink" />
        <span className="public-about__blob public-about__blob--purple" />
        <span className="public-about__sparkle public-about__sparkle--1" />
        <span className="public-about__sparkle public-about__sparkle--2" />
        <span className="public-about__sparkle public-about__sparkle--3" />
        <span className="public-about__butterfly public-about__butterfly--start" />
        <span className="public-about__butterfly public-about__butterfly--end" />
      </div>

      <div className="public-about__inner">
        <header className="public-about__header">
          <h2 id="public-about-title" className="public-about__title reveal">
            {aboutTitle}
          </h2>
          <AboutTitleDivider />
          <p className="public-about__subtitle reveal reveal-delay-1">{aboutText}</p>
        </header>

        <div className="public-about__cards" ref={cardsRef} aria-label="ערכי התמיכה המרכזיים">
          {ABOUT_CARDS.map((card, index) => {
            const matchingArea = visibleSupportAreas[index];
            const Icon = card.Icon;
            const title = matchingArea?.aboutTitle || card.title;
            const description = matchingArea?.aboutDescription || card.description;

            return (
              <article
                className={['public-about__card', 'reveal', cardsInView ? 'reveal-visible' : ''].filter(Boolean).join(' ')}
                key={card.id}
                style={{ '--about-card-stagger': `${index * CARD_STAGGER_MS}ms` }}
              >
                <span className="public-about__card-blob public-about__card-blob--start" aria-hidden="true" />
                <span className="public-about__card-blob public-about__card-blob--end" aria-hidden="true" />
                <span className="public-about__icon" aria-hidden="true">
                  <Icon {...ABOUT_ICON_PROPS} />
                </span>
                <h3>{title}</h3>
                <p className="public-about__card-text">{description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
