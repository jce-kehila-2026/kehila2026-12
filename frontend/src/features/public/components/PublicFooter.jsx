import footerLogo from '../../../assets/logo2.png';

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export default function PublicFooter({ organization, contact = {} }) {
  const organizationName = organization.name;
  const currentYear = new Date().getFullYear();
  const email = hasValue(contact.email) ? contact.email : organization?.email;
  const phone = hasValue(contact.phone) ? contact.phone : organization?.phone;
  const address = hasValue(contact.address) ? contact.address : organization?.address;
  const socialLinks = Array.isArray(contact.socialLinks) ? contact.socialLinks.filter(Boolean) : [];

  return (
    <footer className="public-footer">
      <div className="public-footer__main">
        <div className="public-footer__brand">
          <img className="public-footer__brand-logo" src={footerLogo} alt="She-Na logo" />
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
            <nav className="public-footer__social" aria-label="Footer social links">
              {socialLinks.map((link) => (
                <a href={link.href} key={link.id || link.label}>
                  {link.label}
                </a>
              ))}
            </nav>
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
