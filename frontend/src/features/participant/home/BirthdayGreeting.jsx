import { Cake } from 'lucide-react';
import { PublicSectionHeadingDivider } from '../../public/components/PublicSectionHeading';
import '../../public/styles/public-section-heading.css';
import './BirthdayGreeting.css';

export default function BirthdayGreeting({ firstName = '' }) {
  const resolvedName = String(firstName || '').trim() || 'there';

  return (
    <section className="birthday-greeting" role="status" aria-live="polite">
      <div className="birthday-greeting__content">
        <PublicSectionHeadingDivider />

        <span className="birthday-greeting__icon" aria-hidden="true">
          <Cake size={22} strokeWidth={1.65} />
        </span>

        <p className="birthday-greeting__title">Happy Birthday, {resolvedName}</p>
        <p className="birthday-greeting__subtitle">
          Wishing you a beautiful day filled with joy, strength, and wonderful moments.
        </p>
      </div>
    </section>
  );
}
