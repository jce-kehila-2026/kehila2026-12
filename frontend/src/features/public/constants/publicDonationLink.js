/** Scroll target until a dedicated public donation page exists. */
export const PUBLIC_DONATION_TARGET = '#contact';

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
