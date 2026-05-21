import { useMemo, useRef } from 'react';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import PublicSectionHeading from './PublicSectionHeading';
import useInViewOnce from '../hooks/useInViewOnce';
import { usePublicLocale } from '../context/PublicLocaleContext';
import { localizeContactContent } from '../i18n/publicHomeContentLocalization';

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
  const { locale, t } = usePublicLocale();

  const contactEmail = hasContactValue(contact.email) ? contact.email : organization.email;
  const contactPhone = hasContactValue(contact.phone) ? contact.phone : organization.phone;
  const contactContent = useMemo(() => {
    const merged = {
      ...contact,
      email: hasContactValue(contactEmail) ? contactEmail : '',
      phone: hasContactValue(contactPhone) ? contactPhone : '',
    };
    return localizeContactContent(merged, locale);
  }, [contact, contactEmail, contactPhone, locale]);

  const socialLinks = Array.isArray(contactContent.socialLinks) ? contactContent.socialLinks.filter(Boolean) : [];
  const hasSocial = socialLinks.length > 0;
  const hasPhone = hasContactValue(contactContent.phone);
  const hasEmail = hasContactValue(contactContent.email);
  const hasAnyContact = hasSocial || hasPhone || hasEmail;

  const columnCount = [hasSocial, hasPhone, hasEmail].filter(Boolean).length;

  const eyebrow = contactContent.eyebrow || t('contactEyebrow');
  const title = contactContent.title || t('contactTitle');
  const description = contactContent.description || t('contactDescription');

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
              aria-label={t('contactDetailsAria')}
            >
              {hasSocial && (
                <div className="public-contact__column public-contact__column--social">
                  <span className="public-contact__icon" aria-hidden="true">
                    <ShareOutlinedIcon fontSize="inherit" />
                  </span>
                  <h3 className="public-contact__label">{t('contactSocial')}</h3>
                  <p className="public-contact__helper">{t('contactSocialHelper')}</p>
                  <nav className="public-contact__social-list" aria-label={t('contactSocialNav')}>
                    {socialLinks.map((link, index) => (
                      <a
                        className="public-contact__social-link"
                        href={link.href}
                        key={link.id || link.label}
                        aria-label={`${t('contactGoTo')} ${link.label}`}
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
                  <h3 className="public-contact__label">{t('contactPhone')}</h3>
                  <p className="public-contact__helper">{t('contactPhoneHelper')}</p>
                  <a
                    className="public-contact__action"
                    href={`tel:${contactContent.phone}`}
                    aria-label={`${t('contactCall')} ${contactContent.phone}`}
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
                  <h3 className="public-contact__label">{t('contactEmail')}</h3>
                  <p className="public-contact__helper">{t('contactEmailHelper')}</p>
                  <a
                    className="public-contact__action"
                    href={`mailto:${contactContent.email}`}
                    aria-label={`${t('contactSendEmail')} ${contactContent.email}`}
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
              {t('contactThanks')}
              <span className="public-contact__thanks-decor" aria-hidden="true">
                ♥
              </span>
            </p>
          </>
        ) : (
          <div className="public-section__empty reveal">{t('contactEmpty')}</div>
        )}
      </div>
    </section>
  );
}
