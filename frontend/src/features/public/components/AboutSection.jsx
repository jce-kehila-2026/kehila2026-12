import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';

const ABOUT_CARDS = [
  {
    title: 'תמיכה רגשית',
    description: 'ליווי אישי וקבוצתי במסע שלך',
    Icon: FavoriteBorderRoundedIcon,
  },
  {
    title: 'קהילה בטוחה',
    description: 'מרחב תומך ומכיל לכל אישה',
    Icon: GroupsRoundedIcon,
  },
  {
    title: 'ליווי אישי',
    description: 'הדרכה מקצועית ואישית',
    Icon: AutoAwesomeRoundedIcon,
  },
  {
    title: 'סדנאות ואירועים',
    description: 'פעילויות העשרה ומפגשים',
    Icon: EventAvailableRoundedIcon,
  },
];

export default function AboutSection({ about = {}, supportAreas = [] }) {
  const visibleSupportAreas = Array.isArray(supportAreas) ? supportAreas.filter(Boolean).slice(0, ABOUT_CARDS.length) : [];
  const aboutText = about.description || [about.intro, about.body].filter(Boolean).join(' ');

  return (
    <section className="public-section public-section--about" id="about" aria-labelledby="public-about-title">
      <div className="public-section__header reveal">
        <h2 id="public-about-title">{about.title}</h2>
        {aboutText ? <p className="public-section__text reveal reveal-delay-1">{aboutText}</p> : null}
      </div>
      <div className="public-about__content">
        <div className="public-about__cards stagger-children" aria-label="ערכי התמיכה המרכזיים">
          {ABOUT_CARDS.map((card, index) => {
            const matchingArea = visibleSupportAreas[index];
            const Icon = card.Icon;

            return (
              <article className="public-about__card reveal" key={card.title}>
                <span className="public-about__icon" aria-hidden="true">
                  <Icon fontSize="inherit" />
                </span>
                <h3>{matchingArea?.aboutTitle || card.title}</h3>
                <p>{matchingArea?.aboutDescription || card.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
