import { useEffect, useRef } from 'react';
import {
  cancelPendingPublicSectionScroll,
  scrollToPublicSection,
} from '../utils/publicSectionScroll';

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
    const initialTargetId = initialHash
      ? decodeURIComponent(initialHash.slice(1))
      : '';

    if (initialHash && !preserveInitialHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }

    if (preserveInitialHash && initialTargetId) {
      scrollToPublicSection(initialTargetId, 'auto');
    } else {
      scrollToTopInstant();
    }

    return () => {
      cancelPendingPublicSectionScroll();

      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, [preserveInitialHash]);

  useEffect(() => {
    if (!resetAfterLoad || isLoading || hasAppliedPostLoadResetRef.current) return;

    hasAppliedPostLoadResetRef.current = true;

    if (preserveInitialHash && window.location.hash) {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      scrollToPublicSection(targetId, 'auto');

      return () => cancelPendingPublicSectionScroll();
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
      if (!document.getElementById(targetId)) return;

      event.preventDefault();
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${href}`);
      scrollToPublicSection(targetId, 'smooth');
    };

    root.addEventListener('click', handleAnchorClick);

    return () => root.removeEventListener('click', handleAnchorClick);
  }, [containerRef]);
}
