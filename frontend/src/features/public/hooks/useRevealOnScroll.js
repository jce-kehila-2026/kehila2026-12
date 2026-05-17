import { useEffect } from 'react';

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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -8% 0px',
      },
    );

    revealElements.forEach((element) => {
      if (!element.classList.contains('reveal-visible')) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [containerRef, refreshKey]);
}
