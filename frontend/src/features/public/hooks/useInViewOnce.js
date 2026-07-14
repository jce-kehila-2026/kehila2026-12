import { useEffect, useState } from 'react';

export default function useInViewOnce(
  ref,
  { threshold = 0.18, rootMargin = '0px 0px -6% 0px', root = null } = {},
) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element || isInView) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          setIsInView(true);
          observer.disconnect();
        });
      },
      { threshold, rootMargin, root },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [isInView, ref, threshold, rootMargin, root]);

  return isInView;
}
