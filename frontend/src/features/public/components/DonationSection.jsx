export default function DonationSection({ organization }) {
  return (
    <section className="public-donation" id="donate">
      <div>
        <p className="public-eyebrow">Support</p>
        <h2>Help {organization.name} grow community programs</h2>
      </div>
      <a className="public-button public-button--primary" href="#contact">
        Ask About Donations
      </a>
    </section>
  );
}
