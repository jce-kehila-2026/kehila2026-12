function hasContactValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export default function ContactSection({ contact = {}, organization = {} }) {
  const contactEmail = hasContactValue(contact.email) ? contact.email : organization.email;
  const contactPhone = hasContactValue(contact.phone) ? contact.phone : organization.phone;
  const contactAddress = hasContactValue(contact.address) ? contact.address : organization.address;
  const contactContent = {
    ...contact,
    email: hasContactValue(contactEmail) ? contactEmail : '',
    phone: hasContactValue(contactPhone) ? contactPhone : '',
    address: hasContactValue(contactAddress) ? contactAddress : '',
  };
  const socialLinks = Array.isArray(contactContent.socialLinks) ? contactContent.socialLinks.filter(Boolean) : [];
  const hasAnyContact =
    hasContactValue(contactContent.email) ||
    hasContactValue(contactContent.phone) ||
    hasContactValue(contactContent.address) ||
    socialLinks.length > 0;

  return (
    <section className="public-section public-contact" id="contact" aria-labelledby="public-contact-title">
      <div className="public-section__header">
        <p className="public-eyebrow">{contactContent.eyebrow}</p>
        <h2 id="public-contact-title">{contactContent.title}</h2>
        <p className="public-section__text">{contactContent.description}</p>
      </div>

      {hasAnyContact ? (
        <div className="public-contact__details">
          {hasContactValue(contactContent.email) && (
            <article className="public-contact__item">
              <span>Email</span>
              <a href={`mailto:${contactContent.email}`}>{contactContent.email}</a>
            </article>
          )}

          {hasContactValue(contactContent.phone) && (
            <article className="public-contact__item">
              <span>Phone</span>
              <a href={`tel:${contactContent.phone}`}>{contactContent.phone}</a>
            </article>
          )}

          {hasContactValue(contactContent.address) && (
            <article className="public-contact__item">
              <span>Location</span>
              <p>{contactContent.address}</p>
            </article>
          )}

          {socialLinks.length > 0 && (
            <article className="public-contact__item public-contact__item--social">
              <span>Social</span>
              <nav className="public-contact__social" aria-label="Contact social links">
                {socialLinks.map((link) => (
                  <a href={link.href} key={link.id || link.label}>
                    {link.label}
                  </a>
                ))}
              </nav>
            </article>
          )}
        </div>
      ) : (
        <div className="public-section__empty">
          Contact information will be published here once it is available.
        </div>
      )}
    </section>
  );
}
