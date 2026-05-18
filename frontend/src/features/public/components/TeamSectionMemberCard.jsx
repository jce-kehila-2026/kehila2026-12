import { useState } from 'react';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('');
}

function getSocialLinks(member, contactEmail) {
  const emailTarget = member.email || contactEmail;
  const instagramHref = member.instagram || '#';
  const whatsappHref = member.whatsapp || '#';
  const emailHref = emailTarget ? `mailto:${emailTarget}` : '#';

  return [
    {
      id: 'instagram',
      href: instagramHref,
      label: `אינסטגרם של ${member.name}`,
      Icon: InstagramIcon,
    },
    {
      id: 'whatsapp',
      href: whatsappHref,
      label: `וואטסאפ של ${member.name}`,
      Icon: ChatBubbleOutlineRoundedIcon,
    },
    {
      id: 'email',
      href: emailHref,
      label: `שליחת אימייל ל${member.name}`,
      Icon: EmailOutlinedIcon,
    },
  ];
}

export default function TeamSectionMemberCard({ member, contactEmail = '' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = member.image && !imageFailed;
  const socialLinks = getSocialLinks(member, contactEmail);

  return (
    <article className="public-team-section__card reveal">
      <div className="public-team-section__avatar-wrap">
        {showImage ? (
          <img
            className="public-team-section__avatar"
            src={member.image}
            alt={member.name}
            width={110}
            height={110}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="public-team-section__avatar public-team-section__avatar--placeholder" aria-hidden="true">
            {getInitials(member.name)}
          </div>
        )}
      </div>

      <h3 className="public-team-section__name">{member.name}</h3>
      <p className="public-team-section__role">{member.role}</p>
      <p className="public-team-section__description">{member.description}</p>

      <div className="public-team-section__social" role="group" aria-label={`דרכי יצירת קשר עם ${member.name}`}>
        {socialLinks.map(({ id, href, label, Icon }) => (
          <a
            key={id}
            className="public-team-section__social-link"
            href={href}
            aria-label={label}
            {...(href === '#' ? { 'aria-disabled': true, tabIndex: -1 } : {})}
          >
            <Icon className="public-team-section__social-glyph" fontSize="inherit" aria-hidden="true" />
          </a>
        ))}
      </div>
    </article>
  );
}
