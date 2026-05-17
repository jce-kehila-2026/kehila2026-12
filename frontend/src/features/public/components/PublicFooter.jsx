import footerLogo from '../../../assets/logo2.png';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export default function PublicFooter({ organization, contact = {} }) {
  const organizationName = organization?.name || 'SHE-NA';
  const currentYear = new Date().getFullYear();
  const email = hasValue(contact.email) ? contact.email : organization?.email;
  const phone = hasValue(contact.phone) ? contact.phone : organization?.phone;
  const address = hasValue(contact.address) ? contact.address : organization?.address;
  const socialLinks = Array.isArray(contact.socialLinks) ? contact.socialLinks.filter(Boolean) : [];

  return (
    <footer className="public-footer" id="contact">
      <div className="public-footer__main stagger-children">
        <div className="public-footer__brand reveal">
          <img className="public-footer__brand-logo" src={footerLogo} alt="She-Na logo" />
          <p className="public-footer__text">
            {contact.footerText || organization?.description || 'קהילה תומכת לנשים ולמתמודדות עם סרטן. יחד אנחנו חזקות יותר.'}
          </p>
        </div>

        <div className="public-footer__group reveal">
          <h2>קישורים מהירים</h2>
          <nav className="public-footer__links" aria-label="ניווט תחתון">
            <a href="#home">הבית</a>
            <a href="#about">מי אנחנו</a>
            <a href="#support">בואי נלמד ביחד</a>
            <a href="#stories">סיפורי השראה</a>
            <a href="#donate">תרומות</a>
          </nav>
        </div>

        <div className="public-footer__group reveal">
          <h2>צרי קשר</h2>
          <address className="public-footer__contact">
            {hasValue(email) ? <a href={`mailto:${email}`}><EmailOutlinedIcon fontSize="small" /> {email}</a> : null}
            {hasValue(phone) ? <a href={`tel:${phone}`}><PhoneOutlinedIcon fontSize="small" /> {phone}</a> : null}
            {hasValue(address) ? <span>{address}</span> : null}
            {!hasValue(email) && !hasValue(phone) && !hasValue(address) ? (
              <span>פרטי קשר יפורסמו כאן כשהם יהיו זמינים.</span>
            ) : null}
          </address>
        </div>

        <div className="public-footer__group reveal">
          <h2>עקבי אחרינו</h2>
          {socialLinks.length ? (
            <nav className="public-footer__social" aria-label="קישורים לרשתות חברתיות">
              {socialLinks.map((link, index) => (
                <a href={link.href} key={link.id || link.label}>
                  {index % 3 === 0 ? <LinkedInIcon fontSize="small" /> : index % 3 === 1 ? <InstagramIcon fontSize="small" /> : <FacebookIcon fontSize="small" />}
                  <span>{link.label}</span>
                </a>
              ))}
            </nav>
          ) : (
            <p className="public-footer__text">קישורי רשתות חברתיות יפורסמו כאשר יהיו זמינים.</p>
          )}
        </div>
      </div>

      <div className="public-footer__bottom">
        <p>&copy; {currentYear} {organizationName}. כל הזכויות שמורות.</p>
        <div className="public-footer__legal">
          <a href="#contact">מדיניות פרטיות</a>
          <a href="#contact">תנאי שימוש</a>
        </div>
      </div>
    </footer>
  );
}
