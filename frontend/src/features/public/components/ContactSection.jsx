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
      <div className="public-section__header public-section__header--contact reveal">
        <p className="public-eyebrow">{contactContent.eyebrow}</p>
        <h2 id="public-contact-title">{contactContent.title}</h2>
        <p className="public-section__text reveal reveal-delay-1">{contactContent.description}</p>
      </div>

      {hasAnyContact ? (
        <div className="public-contact__details stagger-children">
          {hasContactValue(contactContent.email) && (
            <article className="public-contact__item reveal">
              <span>אימייל</span>
              <a href={`mailto:${contactContent.email}`}>{contactContent.email}</a>
            </article>
          )}

          {hasContactValue(contactContent.phone) && (
            <article className="public-contact__item reveal">
              <span>טלפון</span>
              <a href={`tel:${contactContent.phone}`}>{contactContent.phone}</a>
            </article>
          )}

          {hasContactValue(contactContent.address) && (
            <article className="public-contact__item reveal">
              <span>מיקום</span>
              <p>{contactContent.address}</p>
            </article>
          )}

          {socialLinks.length > 0 && (
            <article className="public-contact__item public-contact__item--social reveal">
              <span>רשתות חברתיות</span>
              <nav className="public-contact__social" aria-label="קישורים לרשתות חברתיות">
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
          פרטי יצירת קשר יופיעו כאן כאשר יהיו זמינים.
        </div>
      )}
    </section>
  );
}
