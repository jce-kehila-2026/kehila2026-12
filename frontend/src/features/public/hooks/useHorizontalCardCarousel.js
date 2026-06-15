import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const BOUNDARY_EPSILON = 2;

export default function useHorizontalCardCarousel({
  cardSelector,
  direction = 'rtl',
  itemCount = 0,
  visibleCardCount = 3,
}) {
  const scrollerRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const showControls = itemCount > visibleCardCount;

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollTo({ left: 0, behavior: 'auto' });
  }, [direction, itemCount]);

  const updateBoundaries = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !showControls) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const cards = Array.from(scroller.querySelectorAll(cardSelector));
    const firstCard = cards[0];
    const lastCard = cards.at(-1);

    if (!firstCard || !lastCard) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const firstRect = firstCard.getBoundingClientRect();
    const lastRect = lastCard.getBoundingClientRect();

    if (direction === 'rtl') {
      setCanScrollPrev(firstRect.right > scrollerRect.right + BOUNDARY_EPSILON);
      setCanScrollNext(lastRect.left < scrollerRect.left - BOUNDARY_EPSILON);
      return;
    }

    setCanScrollPrev(firstRect.left < scrollerRect.left - BOUNDARY_EPSILON);
    setCanScrollNext(lastRect.right > scrollerRect.right + BOUNDARY_EPSILON);
  }, [cardSelector, direction, showControls]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    const frameId = window.requestAnimationFrame(updateBoundaries);
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateBoundaries);

    resizeObserver?.observe(scroller);
    scroller.addEventListener('scroll', updateBoundaries, { passive: true });
    window.addEventListener('resize', updateBoundaries);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      scroller.removeEventListener('scroll', updateBoundaries);
      window.removeEventListener('resize', updateBoundaries);
    };
  }, [direction, itemCount, updateBoundaries]);

  const scrollByCards = useCallback(
    (stepDirection) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const cards = Array.from(scroller.querySelectorAll(cardSelector));
      const scrollerRect = scroller.getBoundingClientRect();
      const currentIndex = cards.findIndex((card) => {
        const rect = card.getBoundingClientRect();
        return rect.right > scrollerRect.left + BOUNDARY_EPSILON
          && rect.left < scrollerRect.right - BOUNDARY_EPSILON;
      });
      const fallbackIndex = stepDirection > 0 ? 0 : cards.length - 1;
      const targetIndex = Math.min(
        cards.length - 1,
        Math.max(0, (currentIndex < 0 ? fallbackIndex : currentIndex) + stepDirection),
      );

      cards[targetIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
    },
    [cardSelector],
  );

  return {
    canScrollNext,
    canScrollPrev,
    fadeLeft: direction === 'rtl' ? canScrollNext : canScrollPrev,
    fadeRight: direction === 'rtl' ? canScrollPrev : canScrollNext,
    scrollerRef,
    scrollByCards,
    showControls,
  };
}
