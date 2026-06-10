const LAYOUT_STABLE_FRAMES = 2;
const SCROLL_STABLE_FRAMES = 4;
const POSITION_EPSILON = 0.75;

let nextScrollRequestId = 0;
let activeScrollRequest = null;

function getNavbarHeight() {
  const navbar = document.querySelector('[data-public-navbar]');
  return navbar ? navbar.getBoundingClientRect().height : 0;
}

function getTargetScrollTop(target, navbarHeight = getNavbarHeight()) {
  return Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - navbarHeight,
  );
}

function isNearlyEqual(left, right) {
  return Math.abs(left - right) <= POSITION_EPSILON;
}

function requestNextFrame(request, callback) {
  request.frameId = window.requestAnimationFrame(() => {
    if (activeScrollRequest?.id !== request.id) return;
    callback();
  });
}

function finishScrollRequest(request) {
  if (activeScrollRequest?.id === request.id) {
    activeScrollRequest = null;
  }
}

function applyFinalCorrection(request) {
  const correctedTop = getTargetScrollTop(request.target);

  if (!isNearlyEqual(window.scrollY, correctedTop)) {
    window.scrollTo({
      top: correctedTop,
      left: 0,
      behavior: 'auto',
    });
  }

  finishScrollRequest(request);
}

function waitForScrollAndNavbarToSettle(request, initialTop) {
  let previousScrollY = window.scrollY;
  let previousNavbarHeight = getNavbarHeight();
  let stableScrollFrames = 0;
  let stableNavbarFrames = 0;
  let hasStartedMoving = isNearlyEqual(previousScrollY, initialTop);

  function observe() {
    const currentScrollY = window.scrollY;
    const currentNavbarHeight = getNavbarHeight();

    if (!isNearlyEqual(currentScrollY, previousScrollY)) {
      hasStartedMoving = true;
      stableScrollFrames = 0;
    } else {
      stableScrollFrames += 1;
    }

    if (isNearlyEqual(currentNavbarHeight, previousNavbarHeight)) {
      stableNavbarFrames += 1;
    } else {
      stableNavbarFrames = 0;
    }

    previousScrollY = currentScrollY;
    previousNavbarHeight = currentNavbarHeight;

    if (
      hasStartedMoving &&
      stableScrollFrames >= SCROLL_STABLE_FRAMES &&
      stableNavbarFrames >= LAYOUT_STABLE_FRAMES
    ) {
      applyFinalCorrection(request);
      return;
    }

    requestNextFrame(request, observe);
  }

  requestNextFrame(request, observe);
}

function startScrollAfterLayoutSettles(request) {
  let previousNavbarHeight = getNavbarHeight();
  let previousTargetTop = request.target.getBoundingClientRect().top + window.scrollY;
  let stableFrames = 0;

  function observeLayout() {
    const navbarHeight = getNavbarHeight();
    const targetTop = request.target.getBoundingClientRect().top + window.scrollY;

    if (
      isNearlyEqual(navbarHeight, previousNavbarHeight) &&
      isNearlyEqual(targetTop, previousTargetTop)
    ) {
      stableFrames += 1;
    } else {
      stableFrames = 0;
    }

    previousNavbarHeight = navbarHeight;
    previousTargetTop = targetTop;

    if (stableFrames < LAYOUT_STABLE_FRAMES) {
      requestNextFrame(request, observeLayout);
      return;
    }

    const initialTop = getTargetScrollTop(request.target, navbarHeight);
    window.scrollTo({
      top: initialTop,
      left: 0,
      behavior: request.behavior,
    });
    waitForScrollAndNavbarToSettle(request, initialTop);
  }

  requestNextFrame(request, observeLayout);
}

export function cancelPendingPublicSectionScroll() {
  if (activeScrollRequest?.frameId) {
    window.cancelAnimationFrame(activeScrollRequest.frameId);
  }

  activeScrollRequest = null;
}

export function scrollTargetBelowPublicNavbar(target, behavior = 'smooth') {
  if (!target) return false;

  cancelPendingPublicSectionScroll();

  const request = {
    id: ++nextScrollRequestId,
    target,
    behavior,
    frameId: 0,
  };

  activeScrollRequest = request;
  startScrollAfterLayoutSettles(request);
  return true;
}

export function scrollToPublicSection(sectionId, behavior = 'smooth') {
  return scrollTargetBelowPublicNavbar(document.getElementById(sectionId), behavior);
}

export function scrollToPublicSectionAfterMenuClose(sectionId, behavior = 'smooth') {
  return scrollToPublicSection(sectionId, behavior);
}
