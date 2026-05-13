export default function ContactSection({ organization }) {
  return (
    <section className="public-section public-contact" id="contact">
      <div className="public-section__header">
        <p className="public-eyebrow">Contact</p>
        <h2>Get in Touch</h2>
      </div>
      <div className="public-contact__details">
        {organization.email && (
          <a href={`mailto:${organization.email}`}>{organization.email}</a>
        )}
        {organization.phone && <a href={`tel:${organization.phone}`}>{organization.phone}</a>}
        {organization.address && <span>{organization.address}</span>}
      </div>
    </section>
  );
}
