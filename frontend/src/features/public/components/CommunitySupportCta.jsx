import { useMemo } from 'react';
import { BadgeCheck, HandHeart, ShieldCheck } from 'lucide-react';
import donationHandsImage from '../../../assets/images/donation-hands.png';
import { PUBLIC_DONATION_TARGET } from '../constants/publicDonationLink';
import PublicSectionHeading from './PublicSectionHeading';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeDonationFeatures } from '../i18n/publicHomeContentLocalization';

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

export default function CommunitySupportCta({ onDonationClick, sectionId = 'donate' }) {
  const { locale, t } = usePublicLocale();
  const features = useMemo(() => localizeDonationFeatures(SUPPORT_FEATURES, locale), [locale]);

  function handleDonationClick(event) {
    event.preventDefault();
    onDonationClick?.();
  }

  return (
    <section
      className="public-section public-section--donation-cta public-support-cta"
      id={sectionId}
      aria-labelledby="public-support-cta-title"
    >
      <div className="public-support-cta__inner">
        <div className="public-support-cta__content">
          <PublicSectionHeading
            className="public-support-cta__heading"
            eyebrow={t('donationEyebrow')}
            title={t('donationTitle')}
            titleId="public-support-cta-title"
            subtitle={t('donationSubtitle')}
          />

          <div className="public-support-cta__feature-zone stagger-children">
            <ul className="public-support-cta__features">
              {features.map((feature) => {
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

            <a className="public-support-cta__button reveal" href={PUBLIC_DONATION_TARGET} onClick={handleDonationClick}>
              {t('donationButton')}
            </a>
          </div>
        </div>

        <div className="public-support-cta__visual reveal reveal-delay-2">
          <div className="public-support-cta__visual-stage">
            <div className="public-support-cta__image-wrap">
              <img
                className="public-support-cta__image"
                src={donationHandsImage}
                alt={t('donationImageAlt')}
                width={560}
                height={560}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
