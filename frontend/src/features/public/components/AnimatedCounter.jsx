import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_COUNTER_DURATION_MS = 1200;

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

  const rawPrefix = text.slice(0, match.index);
  const rawSuffix = text.slice(endIndex);

  // Normalize "+85" style values to "85+" for display while counting.
  const plusAfterNumber = rawPrefix === '+' && !rawSuffix;

  return {
    finalNumber,
    prefix: plusAfterNumber ? '' : rawPrefix,
    suffix: plusAfterNumber ? '+' : rawSuffix,
  };
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

function renderStructuredValue({ parsedValue, displayNumber, reserveWidth = false }) {
  const finalNumberText = formatNumberOnly(parsedValue.finalNumber);

  return (
    <>
      {parsedValue.prefix ? (
        <span className="public-statistics__value-affix">{renderAffix(parsedValue.prefix)}</span>
      ) : null}
      {reserveWidth ? (
        <span className="public-statistics__value-number-slot">
          <strong className="public-statistics__value-number public-statistics__value-number--measure" aria-hidden="true">
            {finalNumberText}
          </strong>
          <strong className="public-statistics__value-number">{displayNumber}</strong>
        </span>
      ) : (
        <strong className="public-statistics__value-number">{displayNumber}</strong>
      )}
      {parsedValue.suffix ? (
        <span className="public-statistics__value-affix">{renderAffix(parsedValue.suffix)}</span>
      ) : null}
    </>
  );
}

export default function AnimatedCounter({
  value,
  structured = false,
  className = '',
  startAnimation = false,
  instant = false,
  durationMs = DEFAULT_COUNTER_DURATION_MS,
  runOnce = false,
}) {
  const elementRef = useRef(null);
  const hasCompletedRef = useRef(false);
  const parsedValue = useMemo(() => parseCounterValue(value), [value]);
  const [displayNumber, setDisplayNumber] = useState(() => {
    if (!parsedValue) return String(value ?? '');
    if (instant) return formatNumberOnly(parsedValue.finalNumber);
    return formatNumberOnly(0);
  });

  useEffect(() => {
    if (instant || !parsedValue) {
      if (!parsedValue) {
        setDisplayNumber(String(value ?? ''));
      } else if (instant) {
        setDisplayNumber(formatNumberOnly(parsedValue.finalNumber));
      }
      return undefined;
    }

    if (runOnce && hasCompletedRef.current) {
      setDisplayNumber(formatNumberOnly(parsedValue.finalNumber));
      return undefined;
    }

    if (!startAnimation) {
      setDisplayNumber(formatNumberOnly(0));
      return undefined;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      hasCompletedRef.current = true;
      setDisplayNumber(formatNumberOnly(parsedValue.finalNumber));
      return undefined;
    }

    let animationFrameId = 0;
    let cancelled = false;
    const startTime = performance.now();

    const tick = (currentTime) => {
      if (cancelled) return;

      const progress = Math.min((currentTime - startTime) / durationMs, 1);
      const easedProgress = easeOutCubic(progress);
      const currentValue =
        progress >= 1 ? parsedValue.finalNumber : Math.round(parsedValue.finalNumber * easedProgress);

      setDisplayNumber(formatNumberOnly(currentValue));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      hasCompletedRef.current = true;
    };

    setDisplayNumber(formatNumberOnly(0));
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameId);
    };
  }, [durationMs, instant, parsedValue, runOnce, startAnimation, value]);

  if (!structured || !parsedValue) {
    return (
      <strong ref={elementRef} className={className}>
        {displayNumber}
      </strong>
    );
  }

  return (
    <span className={`public-statistics__value ${className}`.trim()} ref={elementRef}>
      {renderStructuredValue({
        parsedValue,
        displayNumber,
        reserveWidth: !instant,
      })}
    </span>
  );
}
