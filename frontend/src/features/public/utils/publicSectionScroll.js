function getSettledNavbarHeight(targetDocumentTop) {
  const navbar = document.querySelector('.public-navbar');
  if (!navbar) return 0;

  const measuredNavbar = navbar.cloneNode(true);
  measuredNavbar.setAttribute('aria-hidden', 'true');
  measuredNavbar.style.visibility = 'hidden';
  measuredNavbar.style.pointerEvents = 'none';
  measuredNavbar.style.transition = 'none';
  measuredNavbar.querySelectorAll('.public-navbar__menu--open').forEach((menu) => {
    menu.classList.remove('public-navbar__menu--open');
  });
  measuredNavbar.querySelectorAll('.public-navbar__dropdown--open').forEach((dropdown) => {
    dropdown.classList.remove('public-navbar__dropdown--open');
  });
  measuredNavbar.querySelectorAll('[aria-expanded="true"]').forEach((control) => {
    control.setAttribute('aria-expanded', 'false');
  });
  document.body.appendChild(measuredNavbar);

  measuredNavbar.classList.remove('public-navbar--scrolled');
  const unscrolledNavbarHeight = measuredNavbar.getBoundingClientRect().height;
  measuredNavbar.classList.add('public-navbar--scrolled');
  const scrolledNavbarHeight = measuredNavbar.getBoundingClientRect().height;
  measuredNavbar.remove();

  return targetDocumentTop - scrolledNavbarHeight > 18
    ? scrolledNavbarHeight
    : unscrolledNavbarHeight;
}

export function scrollTargetBelowPublicNavbar(target, behavior = 'auto') {
  const targetDocumentTop = target.getBoundingClientRect().top + window.scrollY;
  const navbarHeight = getSettledNavbarHeight(targetDocumentTop);
  const page = target.closest('.public-homepage');
  const configuredGap = page
    ? parseFloat(getComputedStyle(page).getPropertyValue('--public-anchor-gap'))
    : 0;
  const anchorGap = Number.isFinite(configuredGap) ? configuredGap : 0;
  const targetScrollTop = Math.floor(targetDocumentTop - navbarHeight - anchorGap);

  window.scrollTo({
    top: Math.max(0, targetScrollTop),
    left: 0,
    behavior,
  });
}
