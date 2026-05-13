export default function PublicFooter({ organization }) {
  const organizationName = organization?.name || 'She-Na';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="public-footer">
      <div className="public-footer__main">
        <div className="public-footer__brand">
          <p className="public-footer__name">{organizationName}</p>
          <p className="public-footer__text">
            Public community information. Final contact details will be managed from the admin content system.
          </p>
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
            <span>Email placeholder</span>
            <span>Phone placeholder</span>
            <span>Location placeholder</span>
          </address>
        </div>

        <div className="public-footer__group">
          <h2>Social</h2>
          <div className="public-footer__social" aria-label="Social media placeholders">
            <a href="#home" aria-label="Facebook placeholder">
              Facebook
            </a>
            <a href="#home" aria-label="Instagram placeholder">
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="public-footer__bottom">
        <p>&copy; {currentYear} {organizationName}. All rights reserved.</p>
      </div>
    </footer>
  );
}
