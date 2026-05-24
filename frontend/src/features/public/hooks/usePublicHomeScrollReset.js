import { useEffect, useRef } from 'react';

function scrollToTopInstant() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

export default function usePublicHomeScrollReset(containerRef, { resetAfterLoad = false, isLoading = false } = {}) {
  const hasAppliedPostLoadResetRef = useRef(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }

    scrollToTopInstant();

    const rafId = window.requestAnimationFrame(scrollToTopInstant);
    const timeoutId = window.setTimeout(scrollToTopInstant, 0);
    const layoutTimeoutId = window.setTimeout(scrollToTopInstant, 120);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.clearTimeout(layoutTimeoutId);

      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    if (!resetAfterLoad || isLoading || hasAppliedPostLoadResetRef.current) return;

    hasAppliedPostLoadResetRef.current = true;

    if (window.scrollY > 0) {
      scrollToTopInstant();
      const rafId = window.requestAnimationFrame(scrollToTopInstant);
      return () => window.cancelAnimationFrame(rafId);
    }

    return undefined;
  }, [isLoading, resetAfterLoad]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const handleAnchorClick = (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || !root.contains(link)) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const targetId = decodeURIComponent(href.slice(1));
      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${href}`);
    };

    root.addEventListener('click', handleAnchorClick);

    return () => root.removeEventListener('click', handleAnchorClick);
  }, [containerRef]);
}
