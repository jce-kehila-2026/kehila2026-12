import { BadgeCheck, HandHeart, Heart, ShieldCheck } from 'lucide-react';
import donationHandsImage from '../../../assets/images/donation-hands.png';
import { PUBLIC_DONATION_TARGET } from '../constants/publicDonationLink';

const FEATURE_ICON_PROPS = {
  className: 'public-support-cta__feature-icon-glyph',
  strokeWidth: 1.5,
  absoluteStrokeWidth: true,
  'aria-hidden': true,
};

const SUPPORT_FEATURES = [
  {
    id: 'ongoing-support',
    icon: ShieldCheck,
    title: 'תמיכה מתמשכת',
    description: 'ליווי אישי וקהילתי חם לאורך כל הדרך.',
  },
  {
    id: 'real-impact',
    icon: HandHeart,
    title: 'השפעה אמיתית',
    description: 'כל תרומה מגיעה ישירות לנשים בקהילה.',
  },
  {
    id: 'trust',
    icon: BadgeCheck,
    title: 'ביטחון ואמינות',
    description: 'שקיפות מלאה ושימוש אחראי במשאבים.',
  },
];

export default function CommunitySupportCta({ onDonationClick }) {
  function handleDonationClick(event) {
    event.preventDefault();
    onDonationClick?.();
  }

  return (
    <section
      className="public-section public-section--donation-cta public-support-cta"
      id="donate"
      aria-labelledby="public-support-cta-title"
    >
      <div className="public-support-cta__decor" aria-hidden="true">
        <span className="public-support-cta__blob public-support-cta__blob--pink" />
        <span className="public-support-cta__blob public-support-cta__blob--lavender" />
        <span className="public-support-cta__blob public-support-cta__blob--purple" />
        <span className="public-support-cta__petal public-support-cta__petal--one" />
        <span className="public-support-cta__petal public-support-cta__petal--two" />
        <span className="public-support-cta__petal public-support-cta__petal--three" />
        <span className="public-support-cta__heart public-support-cta__heart--one">♥</span>
        <span className="public-support-cta__heart public-support-cta__heart--two">♥</span>
      </div>

      <div className="public-support-cta__inner">
        <div className="public-support-cta__visual">
          <div className="public-support-cta__visual-stage">
            <div className="public-support-cta__visual-backdrop" aria-hidden="true">
              <div className="public-support-cta__visual-floral">
                <span className="public-support-cta__floral-wing public-support-cta__floral-wing--start" />
                <span className="public-support-cta__floral-wing public-support-cta__floral-wing--end" />
                <span className="public-support-cta__floral-petal public-support-cta__floral-petal--one" />
                <span className="public-support-cta__floral-petal public-support-cta__floral-petal--two" />
                <span className="public-support-cta__floral-petal public-support-cta__floral-petal--three" />
                <span className="public-support-cta__floral-petal public-support-cta__floral-petal--four" />
                <span className="public-support-cta__floral-petal public-support-cta__floral-petal--five" />
                <span className="public-support-cta__floral-bloom" />
              </div>
              <span className="public-support-cta__visual-glow" />
            </div>
            <img
              className="public-support-cta__image"
              src={donationHandsImage}
              alt="ידיים מחבקות לב ורוד — סמל לתמיכה ולתרומה"
              width={560}
              height={560}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        <div className="public-support-cta__content">
          <p className="public-support-cta__label reveal">
            <span className="public-support-cta__label-heart" aria-hidden="true">
              ♥
            </span>
            עזרו לנו להמשיך לתמוך
          </p>

          <h2 id="public-support-cta-title" className="public-support-cta__title reveal reveal-delay-1">
            כל <span className="public-support-cta__title-accent">תרומה</span> קטנה יוצרת{' '}
            <span className="public-support-cta__title-accent">שינוי גדול</span>
          </h2>

          <p className="public-support-cta__subtitle reveal reveal-delay-2">
            בעזרתכם נוכל להמשיך להעניק תמיכה, ליווי ותקווה לנשים בקהילה.
          </p>

          <ul className="public-support-cta__features stagger-children">
            {SUPPORT_FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <li className="public-support-cta__feature reveal" key={feature.id}>
                  <span className="public-support-cta__feature-icon">
                    <Icon {...FEATURE_ICON_PROPS} />
                  </span>
                  <span className="public-support-cta__feature-copy">
                    <strong>{feature.title}</strong>
                    <span>{feature.description}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <a className="public-support-cta__button reveal reveal-delay-3" href={PUBLIC_DONATION_TARGET} onClick={handleDonationClick}>
            <Heart className="public-support-cta__button-icon" strokeWidth={2} fill="currentColor" aria-hidden="true" />
            לתרומה
          </a>
        </div>
      </div>
    </section>
  );
}
