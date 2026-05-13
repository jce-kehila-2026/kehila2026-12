const FALLBACK_CONTACT = {
  eyebrow: 'Contact',
  title: 'Get in touch',
  description:
    'Contact details shown here are temporary placeholders until the public site content is managed from the admin CMS.',
  email: '',
  phone: '',
  address: '',
  socialLinks: [],
};

function hasContactValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export default function ContactSection({ contact = {}, organization = {} }) {
  const useFallback = contact.useFallback !== false;
  const fallbackValue = (fieldName) => (useFallback ? FALLBACK_CONTACT[fieldName] : '');
  const contactContent = {
    eyebrow: contact.eyebrow || FALLBACK_CONTACT.eyebrow,
    title: contact.title || FALLBACK_CONTACT.title,
    description: contact.description || FALLBACK_CONTACT.description,
    email: hasContactValue(organization.email) ? organization.email : fallbackValue('email'),
    phone: hasContactValue(organization.phone) ? organization.phone : fallbackValue('phone'),
    address: hasContactValue(organization.address) ? organization.address : fallbackValue('address'),
    socialLinks: [],
    ...contact,
  };
  const socialLinks = Array.isArray(contactContent.socialLinks) ? contactContent.socialLinks.filter(Boolean) : [];
  const hasAnyContact =
    hasContactValue(contactContent.email) ||
    hasContactValue(contactContent.phone) ||
    hasContactValue(contactContent.address) ||
    socialLinks.length > 0;

  return (
    <section className="public-section public-contact" id="contact">
      <div className="public-section__header">
        <p className="public-eyebrow">{contactContent.eyebrow}</p>
        <h2>{contactContent.title}</h2>
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
              {contactContent.phone.includes('coming soon') ? (
                <p>{contactContent.phone}</p>
              ) : (
                <a href={`tel:${contactContent.phone}`}>{contactContent.phone}</a>
              )}
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
              <div className="public-contact__social">
                {socialLinks.map((link) => (
                  <a href={link.href || '#contact'} key={link.id || link.label}>
                    {link.label}
                  </a>
                ))}
              </div>
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
