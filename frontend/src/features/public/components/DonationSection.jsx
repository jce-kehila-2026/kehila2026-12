const FALLBACK_DONATION = {
  eyebrow: 'Support',
  description:
    'Your support helps keep welcoming programs, resources, and community care available. Online giving will be connected later through the admin-managed donation link.',
  buttonLabel: 'Donate',
  href: '#donate',
};

export default function DonationSection({ donation = {}, organization }) {
  const organizationName = organization?.name || 'She-Na';
  const donationContent = {
    ...FALLBACK_DONATION,
    ...donation,
  };
  const donationHref = donationContent.href || '#donate';

  return (
    <section className="public-donation" id="donate" aria-labelledby="public-donation-title">
      <div className="public-donation__content">
        <p className="public-eyebrow">{donationContent.eyebrow}</p>
        <h2 id="public-donation-title">{donationContent.title || `Help ${organizationName} grow community programs`}</h2>
        <p>{donationContent.description}</p>
      </div>
      <a className="public-button public-button--primary public-donation__button" href={donationHref}>
        {donationContent.buttonLabel}
      </a>
    </section>
  );
}
