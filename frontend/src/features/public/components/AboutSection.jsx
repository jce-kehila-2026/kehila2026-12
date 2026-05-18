import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';

const ABOUT_CARDS = [
  {
    title: 'תמיכה רגשית',
    description: 'ליווי אישי וקבוצתי במסע שלך עם הבנה ואמפתיה.',
    Icon: FavoriteBorderRoundedIcon,
    iconStroke: true,
  },
  {
    title: 'קהילה בטוחה',
    description: 'מרחב תומך ומכיל לכל אישה בכל שלב במסע.',
    Icon: GroupsOutlinedIcon,
    iconStroke: true,
  },
  {
    title: 'ליווי אישי',
    description: 'הדרכה מקצועית ואישית מותאמת לצרכים שלך.',
    Icon: AutoAwesomeOutlinedIcon,
    iconStroke: true,
  },
  {
    title: 'סדנאות ואירועים',
    description: 'פעילויות העשרה ומפגשים מעצימים לנפש ולגוף.',
    Icon: EventAvailableOutlinedIcon,
    iconStroke: true,
  },
];

const ABOUT_ICON_GRADIENT_ID = 'public-about-icon-gradient';

export default function AboutSection({ about = {}, supportAreas = [] }) {
  const visibleSupportAreas = Array.isArray(supportAreas) ? supportAreas.filter(Boolean).slice(0, ABOUT_CARDS.length) : [];
  const aboutTitle = about.title || 'מי אנחנו?';
  const aboutText = about.description || [about.intro, about.body].filter(Boolean).join(' ');

  return (
    <section className="public-section public-section--about" id="about" aria-labelledby="public-about-title">
      <svg className="public-about__icon-defs" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={ABOUT_ICON_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="52%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="public-about__decor" aria-hidden="true">
        <span className="public-about__blob public-about__blob--purple" />
        <span className="public-about__blob public-about__blob--pink" />
        <span className="public-about__sparkle public-about__sparkle--1" />
        <span className="public-about__sparkle public-about__sparkle--2" />
        <span className="public-about__sparkle public-about__sparkle--3" />
        <span className="public-about__sparkle public-about__sparkle--4" />
      </div>
      <span className="public-about__wave" aria-hidden="true" />

      <div className="public-about__inner">
        <header className="public-about__header reveal">
          <h2 id="public-about-title">{aboutTitle}</h2>
          <div className="public-about__title-divider" aria-hidden="true">
            <span className="public-about__title-divider-wing public-about__title-divider-wing--start" />
            <span className="public-about__title-divider-heart">♥</span>
            <span className="public-about__title-divider-wing public-about__title-divider-wing--end" />
          </div>
          {aboutText ? (
            <p className="public-about__subtitle reveal reveal-delay-1">{aboutText}</p>
          ) : null}
        </header>

        <div className="public-about__content">
          <div className="public-about__cards stagger-children" aria-label="ערכי התמיכה המרכזיים">
            {ABOUT_CARDS.map((card, index) => {
              const matchingArea = visibleSupportAreas[index];
              const Icon = card.Icon;
              const title = matchingArea?.aboutTitle || card.title;
              const description = matchingArea?.aboutDescription || card.description;

              return (
                <article className="public-about__card" key={card.title}>
                  <span className="public-about__card-leaf" aria-hidden="true" />
                  <span className="public-about__icon" aria-hidden="true">
                    <Icon
                      className={`public-about__icon-glyph${card.iconStroke ? ' public-about__icon-glyph--stroke' : ''}`}
                    />
                  </span>
                  <h3>{title}</h3>
                  <div className="public-about__card-divider" aria-hidden="true">
                    <span className="public-about__card-divider-line" />
                    <span className="public-about__card-divider-heart">♥</span>
                    <span className="public-about__card-divider-line" />
                  </div>
                  <p className="public-about__card-text">{description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
