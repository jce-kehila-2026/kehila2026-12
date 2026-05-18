import { useEffect, useMemo, useRef, useState } from 'react';

const COUNTER_DURATION_MS = 1200;

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

function formatNumberOnly(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3;
}

function renderAffix(text) {
  if (!text) return null;

  if (text.includes('+')) {
    return text.split(/(\+)/g).filter(Boolean).map((part, index) =>
      part === '+' ? (
        <span key={`accent-${index}`} className="public-statistics__value-accent">
          {part}
        </span>
      ) : (
        <span key={`text-${index}`}>{part}</span>
      ),
    );
  }

  return text;
}

export default function AnimatedCounter({
  value,
  structured = false,
  className = '',
  startAnimation = false,
}) {
  const elementRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const parsedValue = useMemo(() => parseCounterValue(value), [value]);
  const [displayValue, setDisplayValue] = useState(() => {
    if (!parsedValue) return String(value ?? '');
    return formatCounterValue(0, parsedValue);
  });
  const [displayNumber, setDisplayNumber] = useState(() => {
    if (!parsedValue) return String(value ?? '');
    return formatNumberOnly(0);
  });

  useEffect(() => {
    hasAnimatedRef.current = false;
    if (!parsedValue) {
      setDisplayValue(String(value ?? ''));
      setDisplayNumber(String(value ?? ''));
      return;
    }

    setDisplayValue(formatCounterValue(0, parsedValue));
    setDisplayNumber(formatNumberOnly(0));
  }, [parsedValue, value]);

  useEffect(() => {
    if (!startAnimation || !parsedValue || hasAnimatedRef.current) return undefined;

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      hasAnimatedRef.current = true;
      setDisplayValue(formatCounterValue(parsedValue.finalNumber, parsedValue));
      setDisplayNumber(formatNumberOnly(parsedValue.finalNumber));
      return undefined;
    }

    let animationFrameId = 0;
    hasAnimatedRef.current = true;

    const runCounter = () => {
      const startTime = performance.now();

      const tick = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / COUNTER_DURATION_MS, 1);
        const easedProgress = easeOutCubic(progress);
        const currentValue =
          progress >= 1 ? parsedValue.finalNumber : Math.round(parsedValue.finalNumber * easedProgress);

        setDisplayValue(formatCounterValue(currentValue, parsedValue));
        setDisplayNumber(formatNumberOnly(currentValue));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(tick);
        }
      };

      setDisplayValue(formatCounterValue(0, parsedValue));
      setDisplayNumber(formatNumberOnly(0));
      animationFrameId = requestAnimationFrame(tick);
    };

    runCounter();

    return () => cancelAnimationFrame(animationFrameId);
  }, [parsedValue, startAnimation]);

  if (!structured || !parsedValue) {
    return (
      <strong ref={elementRef} className={className}>
        {displayValue}
      </strong>
    );
  }

  return (
    <span className={`public-statistics__value ${className}`.trim()} ref={elementRef}>
      {parsedValue.prefix ? (
        <span className="public-statistics__value-affix">{renderAffix(parsedValue.prefix)}</span>
      ) : null}
      <strong className="public-statistics__value-number">{displayNumber}</strong>
      {parsedValue.suffix ? (
        <span className="public-statistics__value-affix">{renderAffix(parsedValue.suffix)}</span>
      ) : null}
    </span>
  );
}
