/**
 * Card/modal image — bundled assets only (no remote fallbacks).
 */
export default function SupportAreaCardImage({ src, alt = '', areaId = '', position = 'center' }) {
  const areaClass = areaId ? ` public-support__image-stack--${areaId}` : '';

  return (
    <div className={`public-support__image-stack${areaClass}`}>
      <img
        className="public-support__image"
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ objectPosition: position || 'center' }}
      />
    </div>
  );
}
