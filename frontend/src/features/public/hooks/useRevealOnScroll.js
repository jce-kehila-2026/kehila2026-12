import { useEffect } from 'react';

const OBSERVER_OPTIONS = {
  threshold: 0.08,
  rootMargin: '0px 0px -4% 0px',
};

function revealIfInViewport(element) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);

  if (visibleHeight <= 0 || visibleWidth <= 0) {
    return false;
  }

  const heightRatio = visibleHeight / Math.max(rect.height, 1);
  const widthRatio = visibleWidth / Math.max(rect.width, 1);

  if (heightRatio >= OBSERVER_OPTIONS.threshold || widthRatio >= OBSERVER_OPTIONS.threshold) {
    element.classList.add('reveal-visible');
    return true;
  }

  return false;
}

export default function useRevealOnScroll(containerRef, refreshKey) {
  useEffect(() => {
    const root = containerRef.current;

    if (!root) return undefined;

    const revealElements = Array.from(root.querySelectorAll('.reveal'));
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      revealElements.forEach((element) => element.classList.add('reveal-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      });
    }, OBSERVER_OPTIONS);

    revealElements.forEach((element) => {
      if (element.classList.contains('reveal-visible')) {
        return;
      }

      if (revealIfInViewport(element)) {
        return;
      }

      observer.observe(element);
    });

    const rescanReveals = () => {
      revealElements.forEach((element) => {
        if (!element.classList.contains('reveal-visible') && revealIfInViewport(element)) {
          observer.unobserve(element);
        }
      });
    };

    const rafId = window.requestAnimationFrame(rescanReveals);
    const timeoutId = window.setTimeout(rescanReveals, 150);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [containerRef, refreshKey]);
}
