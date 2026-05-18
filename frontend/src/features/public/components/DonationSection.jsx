import { resolvePublicDonationHref } from '../constants/publicDonationLink';

export default function DonationSection({ donation = {} }) {
  return (
    <section className="public-donation reveal" id="donate" aria-labelledby="public-donation-title">
      <div className="public-donation__content reveal reveal-delay-1">
        <p className="public-eyebrow">{donation.eyebrow}</p>
        <h2 id="public-donation-title">{donation.title}</h2>
        <p>{donation.description}</p>
      </div>
      <a
        className="public-button public-button--primary public-donation__button reveal reveal-delay-2"
        href={resolvePublicDonationHref(donation.href)}
      >
        {donation.buttonLabel}
      </a>
    </section>
  );
}
