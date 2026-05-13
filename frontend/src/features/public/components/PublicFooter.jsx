function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export default function PublicFooter({ organization, contact = {} }) {
  const organizationName = organization?.name || 'She-Na';
  const currentYear = new Date().getFullYear();
  const footerText =
    contact.footerText ||
    'Public community information. Final contact details will be managed from the admin content system.';
  const email = hasValue(contact.email) ? contact.email : organization?.email;
  const phone = hasValue(contact.phone) ? contact.phone : organization?.phone;
  const address = hasValue(contact.address) ? contact.address : organization?.address;
  const socialLinks = Array.isArray(contact.socialLinks) ? contact.socialLinks.filter(Boolean) : [];

  return (
    <footer className="public-footer">
      <div className="public-footer__main">
        <div className="public-footer__brand">
          <p className="public-footer__name">{organizationName}</p>
          <p className="public-footer__text">{footerText}</p>
        </div>

        <div className="public-footer__group">
          <h2>Quick Links</h2>
          <nav className="public-footer__links" aria-label="Footer public navigation">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#articles">Articles</a>
            <a href="#team">Team</a>
            <a href="#donate">Donate</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>

        <div className="public-footer__group">
          <h2>Contact</h2>
          <address className="public-footer__contact">
            {hasValue(email) ? <span>{email}</span> : null}
            {hasValue(phone) ? <span>{phone}</span> : null}
            {hasValue(address) ? <span>{address}</span> : null}
            {!hasValue(email) && !hasValue(phone) && !hasValue(address) ? (
              <span>Contact details coming soon</span>
            ) : null}
          </address>
        </div>

        <div className="public-footer__group">
          <h2>Social</h2>
          {socialLinks.length ? (
            <div className="public-footer__social" aria-label="Social media links">
              {socialLinks.map((link) => (
                <a href={link.href || '#contact'} key={link.id || link.label}>
                  {link.label || 'Social link'}
                </a>
              ))}
            </div>
          ) : (
            <p className="public-footer__text">Social links coming soon</p>
          )}
        </div>
      </div>

      <div className="public-footer__bottom">
        <p>&copy; {currentYear} {organizationName}. All rights reserved.</p>
      </div>
    </footer>
  );
}
