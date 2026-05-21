function PublicSectionHeadingDivider() {
  return (
    <div className="public-section-heading__divider public-section-heading__divider--title" aria-hidden="true">
      <span className="public-section-heading__divider-line" />
      <span className="public-section-heading__divider-heart">♥</span>
      <span className="public-section-heading__divider-line" />
    </div>
  );
}

export default function PublicSectionHeading({
  eyebrow,
  title,
  titleId,
  subtitle,
  className = '',
  reveal = true,
}) {
  return (
    <header className={['public-section-heading', reveal ? 'reveal' : '', className].filter(Boolean).join(' ')}>
      <p className="public-section-heading__eyebrow">
        <span className="public-section-heading__eyebrow-line" aria-hidden="true" />
        <span className="public-section-heading__eyebrow-heart" aria-hidden="true">
          ♥
        </span>
        <span className="public-section-heading__eyebrow-text">{eyebrow}</span>
        <span className="public-section-heading__eyebrow-heart" aria-hidden="true">
          ♥
        </span>
        <span className="public-section-heading__eyebrow-line" aria-hidden="true" />
      </p>

      <h2 id={titleId} className="public-section-heading__title">
        {title}
      </h2>

      <PublicSectionHeadingDivider />

      {subtitle ? (
        <p className={['public-section-heading__subtitle', reveal ? 'reveal reveal-delay-1' : ''].filter(Boolean).join(' ')}>
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
