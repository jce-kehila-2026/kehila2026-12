import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

function hasContactValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function getSocialIcon(link = {}, index) {
  const socialText = `${link.id || ''} ${link.label || ''}`.toLowerCase();

  if (socialText.includes('linkedin')) {
    return <LinkedInIcon fontSize="inherit" />;
  }

  if (socialText.includes('instagram')) {
    return <InstagramIcon fontSize="inherit" />;
  }

  if (socialText.includes('facebook')) {
    return <FacebookIcon fontSize="inherit" />;
  }

  return index % 3 === 0 ? (
    <LinkedInIcon fontSize="inherit" />
  ) : index % 3 === 1 ? (
    <InstagramIcon fontSize="inherit" />
  ) : (
    <FacebookIcon fontSize="inherit" />
  );
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
    socialLinks.length > 0;

  return (
    <section className="public-section public-contact" id="contact" aria-labelledby="public-contact-title">
      <div className="public-contact__shell">
        <div className="public-section__header public-section__header--contact reveal">
          <p className="public-eyebrow">{contactContent.eyebrow}</p>
          <h2 id="public-contact-title">{contactContent.title}</h2>
          <p className="public-section__text reveal reveal-delay-1">{contactContent.description}</p>
        </div>

        {hasAnyContact ? (
          <div className="public-contact__details stagger-children" aria-label="פרטי יצירת קשר">
            {hasContactValue(contactContent.email) && (
              <article className="public-contact__item reveal">
                <span className="public-contact__icon" aria-hidden="true">
                  <EmailOutlinedIcon fontSize="inherit" />
                </span>
                <div className="public-contact__item-body">
                  <span className="public-contact__label">אימייל</span>
                  <p className="public-contact__helper">כתבי לנו ונחזור אלייך בהקדם.</p>
                  <a href={`mailto:${contactContent.email}`} aria-label={`שליחת אימייל אל ${contactContent.email}`}>
                    {contactContent.email}
                  </a>
                </div>
              </article>
            )}

            {hasContactValue(contactContent.phone) && (
              <article className="public-contact__item reveal">
                <span className="public-contact__icon" aria-hidden="true">
                  <PhoneOutlinedIcon fontSize="inherit" />
                </span>
                <div className="public-contact__item-body">
                  <span className="public-contact__label">טלפון</span>
                  <p className="public-contact__helper">לשיחה אישית, הצטרפות או תמיכה.</p>
                  <a href={`tel:${contactContent.phone}`} aria-label={`חיוג אל ${contactContent.phone}`}>
                    {contactContent.phone}
                  </a>
                </div>
              </article>
            )}

            {socialLinks.length > 0 && (
              <article className="public-contact__item public-contact__item--social reveal">
                <span className="public-contact__icon" aria-hidden="true">
                  <ShareOutlinedIcon fontSize="inherit" />
                </span>
                <div className="public-contact__item-body">
                  <span className="public-contact__label">רשתות חברתיות</span>
                  <p className="public-contact__helper">עקבי אחרי עדכונים, אירועים וסיפורי השראה.</p>
                  <nav className="public-contact__social" aria-label="קישורים לרשתות חברתיות">
                    {socialLinks.map((link, index) => (
                      <a href={link.href} key={link.id || link.label} aria-label={`מעבר אל ${link.label}`}>
                        <span aria-hidden="true">{getSocialIcon(link, index)}</span>
                        {link.label}
                      </a>
                    ))}
                  </nav>
                </div>
              </article>
            )}
          </div>
        ) : (
          <div className="public-section__empty">
            פרטי יצירת קשר יופיעו כאן כאשר יהיו זמינים.
          </div>
        )}
      </div>
    </section>
  );
}
