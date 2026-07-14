import { Cake } from 'lucide-react';
import { PublicSectionHeadingDivider } from '../../public/components/PublicSectionHeading';
import { useParticipantLocale } from '../context/ParticipantLocaleContext';
import '../../public/styles/public-section-heading.css';
import './BirthdayGreeting.css';

export default function BirthdayGreeting({ firstName = '' }) {
  const { t } = useParticipantLocale();
  const resolvedName = String(firstName || '').trim() || t('birthdayThere');

  return (
    <section className="birthday-greeting" role="status" aria-live="polite">
      <div className="birthday-greeting__content">
        <PublicSectionHeadingDivider />

        <span className="birthday-greeting__icon" aria-hidden="true">
          <Cake size={22} strokeWidth={1.65} />
        </span>

        <p className="birthday-greeting__title">{t('happyBirthdayNamed').replace('{name}', resolvedName)}</p>
        <p className="birthday-greeting__subtitle">
          {t('birthdaySubtitle')}
        </p>
      </div>
    </section>
  );
}
