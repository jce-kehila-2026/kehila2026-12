import { useEffect, useMemo, useRef, useState } from 'react';

function parseCounterValue(value) {
  const text = String(value ?? '');
  const match = text.match(/\d[\d,]*/);

  if (!match) {
    return null;
  }

  const numberText = match[0];
  const endIndex = match.index + numberText.length;
  const finalNumber = Number(numberText.replace(/,/g, ''));

  if (!Number.isFinite(finalNumber)) {
    return null;
  }

  return {
    finalNumber,
    prefix: text.slice(0, match.index),
    suffix: text.slice(endIndex),
  };
}

function formatCounterValue(value, parsedValue) {
  return `${parsedValue.prefix}${new Intl.NumberFormat('en-US').format(value)}${parsedValue.suffix}`;
}

export default function AnimatedCounter({ value }) {
  const elementRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const parsedValue = useMemo(() => parseCounterValue(value), [value]);
  const [displayValue, setDisplayValue] = useState(() => String(value ?? ''));

  useEffect(() => {
    setDisplayValue(String(value ?? ''));
    hasAnimatedRef.current = false;
  }, [value]);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || !parsedValue) return undefined;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setDisplayValue(formatCounterValue(parsedValue.finalNumber, parsedValue));
      hasAnimatedRef.current = true;
      return undefined;
    }

    let animationFrameId = 0;

    const runCounter = () => {
      if (hasAnimatedRef.current) return;

      hasAnimatedRef.current = true;
      const duration = 1350;
      const startTime = performance.now();

      const tick = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(parsedValue.finalNumber * easedProgress);

        setDisplayValue(formatCounterValue(currentValue, parsedValue));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(tick);
        }
      };

      setDisplayValue(formatCounterValue(0, parsedValue));
      animationFrameId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          runCounter();
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.42,
        rootMargin: '0px 0px -8% 0px',
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [parsedValue, value]);

  return <strong ref={elementRef}>{displayValue}</strong>;
}
