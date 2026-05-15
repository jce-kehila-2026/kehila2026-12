export default function DonationSection({ donation = {} }) {
  return (
    <section className="public-donation" id="donate" aria-labelledby="public-donation-title">
      <div className="public-donation__content">
        <p className="public-eyebrow">{donation.eyebrow}</p>
        <h2 id="public-donation-title">{donation.title}</h2>
        <p>{donation.description}</p>
      </div>
      <a className="public-button public-button--primary public-donation__button" href={donation.href}>
        {donation.buttonLabel}
      </a>
    </section>
  );
}
