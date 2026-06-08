import { useEffect, useRef } from 'react';
import { scrollTargetBelowPublicNavbar } from '../utils/publicSectionScroll';

function scrollToTopInstant() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

export default function usePublicHomeScrollReset(
  containerRef,
  { resetAfterLoad = false, isLoading = false, preserveInitialHash = false } = {},
) {
  const hasAppliedPostLoadResetRef = useRef(false);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const initialHash = window.location.hash;
    const initialTarget = initialHash
      ? document.getElementById(decodeURIComponent(initialHash.slice(1)))
      : null;

    if (initialHash && !preserveInitialHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }

    const scrollToInitialPosition = () => {
      if (preserveInitialHash && initialTarget) {
        scrollTargetBelowPublicNavbar(initialTarget);
        return;
      }

      scrollToTopInstant();
    };

    scrollToInitialPosition();

    const rafId = window.requestAnimationFrame(scrollToInitialPosition);
    const timeoutId = window.setTimeout(scrollToInitialPosition, 0);
    const layoutTimeoutId = window.setTimeout(scrollToInitialPosition, 120);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.clearTimeout(layoutTimeoutId);

      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, [preserveInitialHash]);

  useEffect(() => {
    if (!resetAfterLoad || isLoading || hasAppliedPostLoadResetRef.current) return;

    hasAppliedPostLoadResetRef.current = true;

    if (preserveInitialHash && window.location.hash) {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));

      if (target) {
        scrollTargetBelowPublicNavbar(target);
      }

      return undefined;
    }

    if (window.scrollY > 0) {
      scrollToTopInstant();
      const rafId = window.requestAnimationFrame(scrollToTopInstant);
      return () => window.cancelAnimationFrame(rafId);
    }

    return undefined;
  }, [isLoading, preserveInitialHash, resetAfterLoad]);

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
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${href}`);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollTargetBelowPublicNavbar(target, 'smooth');
        });
      });
    };

    root.addEventListener('click', handleAnchorClick);

    return () => root.removeEventListener('click', handleAnchorClick);
  }, [containerRef]);
}
