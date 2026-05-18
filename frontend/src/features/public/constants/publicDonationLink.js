/** In-page donation/support section anchor. */
export const PUBLIC_DONATION_TARGET = '#donate';

const LEGACY_DONATION_HREFS = new Set(['#donate', '/donate', '/public/donate']);

export function resolvePublicDonationHref(href) {
  if (typeof href !== 'string' || !href.trim()) {
    return PUBLIC_DONATION_TARGET;
  }

  const normalized = href.trim();

  if (LEGACY_DONATION_HREFS.has(normalized.toLowerCase())) {
    return PUBLIC_DONATION_TARGET;
  }

  return normalized;
}
