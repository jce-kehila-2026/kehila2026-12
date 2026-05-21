import { useRef } from 'react';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import PublicSectionHeading from './PublicSectionHeading';
import useInViewOnce from '../hooks/useInViewOnce';

const THANK_YOU_MESSAGE = 'תודה שאת/ה חלק מהקהילה שלנו';

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
  const panelRef = useRef(null);
  const panelInView = useInViewOnce(panelRef, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

  const contactEmail = hasContactValue(contact.email) ? contact.email : organization.email;
  const contactPhone = hasContactValue(contact.phone) ? contact.phone : organization.phone;
  const contactContent = {
    ...contact,
    email: hasContactValue(contactEmail) ? contactEmail : '',
    phone: hasContactValue(contactPhone) ? contactPhone : '',
  };
  const socialLinks = Array.isArray(contactContent.socialLinks) ? contactContent.socialLinks.filter(Boolean) : [];
  const hasSocial = socialLinks.length > 0;
  const hasPhone = hasContactValue(contactContent.phone);
  const hasEmail = hasContactValue(contactContent.email);
  const hasAnyContact = hasSocial || hasPhone || hasEmail;

  const columnCount = [hasSocial, hasPhone, hasEmail].filter(Boolean).length;

  const eyebrow = contactContent.eyebrow || 'צרי קשר';
  const title = contactContent.title || 'אנחנו כאן בשבילך';
  const description =
    contactContent.description ||
    'אפשר לפנות אלינו להצטרפות, תמיכה, התנדבות או שיתוף פעולה.';

  return (
    <section className="public-section public-contact" id="contact" aria-labelledby="public-contact-title">
      <div className="public-contact__decor" aria-hidden="true">
        <span className="public-contact__glow public-contact__glow--pink" />
        <span className="public-contact__glow public-contact__glow--purple" />
        <span className="public-contact__glow public-contact__glow--lavender" />
        <span className="public-contact__float-heart public-contact__float-heart--1">♥</span>
        <span className="public-contact__float-heart public-contact__float-heart--2">♥</span>
        <span className="public-contact__float-dot public-contact__float-dot--1" />
        <span className="public-contact__float-dot public-contact__float-dot--2" />
      </div>

      <div className="public-contact__shell">
        <PublicSectionHeading
          className="public-contact__heading-wrap"
          eyebrow={eyebrow}
          title={title}
          titleId="public-contact-title"
          subtitle={description}
        />

        {hasAnyContact ? (
          <>
            <div
              ref={panelRef}
              className={['public-contact__panel', 'reveal', panelInView ? 'reveal-visible' : ''].filter(Boolean).join(' ')}
              style={{ '--contact-columns': columnCount }}
              aria-label="פרטי יצירת קשר"
            >
              {hasSocial && (
                <div className="public-contact__column public-contact__column--social">
                  <span className="public-contact__icon" aria-hidden="true">
                    <ShareOutlinedIcon fontSize="inherit" />
                  </span>
                  <h3 className="public-contact__label">רשתות חברתיות</h3>
                  <p className="public-contact__helper">עקבי אחרי עדכונים, אירועים וסיפורי השראה.</p>
                  <nav className="public-contact__social-list" aria-label="קישורים לרשתות חברתיות">
                    {socialLinks.map((link, index) => (
                      <a
                        className="public-contact__social-link"
                        href={link.href}
                        key={link.id || link.label}
                        aria-label={`מעבר אל ${link.label}`}
                      >
                        <span className="public-contact__social-link-icon" aria-hidden="true">
                          {getSocialIcon(link, index)}
                        </span>
                        <span className="public-contact__social-link-label">{link.label}</span>
                        <span className="public-contact__social-link-arrow" aria-hidden="true">
                          <ChevronLeftRoundedIcon fontSize="inherit" />
                        </span>
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {hasPhone && (
                <div className="public-contact__column public-contact__column--phone">
                  <span className="public-contact__icon" aria-hidden="true">
                    <PhoneOutlinedIcon fontSize="inherit" />
                  </span>
                  <h3 className="public-contact__label">טלפון</h3>
                  <p className="public-contact__helper">לשיחה אישית, הצטרפות או תמיכה.</p>
                  <a
                    className="public-contact__action"
                    href={`tel:${contactContent.phone}`}
                    aria-label={`חיוג אל ${contactContent.phone}`}
                  >
                    <span className="public-contact__action-icon" aria-hidden="true">
                      <PhoneOutlinedIcon fontSize="inherit" />
                    </span>
                    <span className="public-contact__action-value">{contactContent.phone}</span>
                  </a>
                </div>
              )}

              {hasEmail && (
                <div className="public-contact__column public-contact__column--email">
                  <span className="public-contact__icon" aria-hidden="true">
                    <EmailOutlinedIcon fontSize="inherit" />
                  </span>
                  <h3 className="public-contact__label">אימייל</h3>
                  <p className="public-contact__helper">כתבי לנו ונחזור אלייך בהקדם.</p>
                  <a
                    className="public-contact__action"
                    href={`mailto:${contactContent.email}`}
                    aria-label={`שליחת אימייל אל ${contactContent.email}`}
                  >
                    <span className="public-contact__action-icon" aria-hidden="true">
                      <EmailOutlinedIcon fontSize="inherit" />
                    </span>
                    <span className="public-contact__action-value">{contactContent.email}</span>
                  </a>
                </div>
              )}
            </div>

            <p className="public-contact__thanks reveal reveal-delay-2">
              <span className="public-contact__thanks-decor" aria-hidden="true">
                ♥
              </span>
              {THANK_YOU_MESSAGE}
              <span className="public-contact__thanks-decor" aria-hidden="true">
                ♥
              </span>
            </p>
          </>
        ) : (
          <div className="public-section__empty reveal">
            פרטי יצירת קשר יופיעו כאן כאשר יהיו זמינים.
          </div>
        )}
      </div>
    </section>
  );
}
