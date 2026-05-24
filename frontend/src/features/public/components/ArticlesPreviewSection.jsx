import { useCallback, useEffect, useRef, useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArticleCard from './ArticleCard';
import EmptyState from './EmptyState';
import PublicSectionHeading from './PublicSectionHeading';
import { usePublicLocale } from '../context/PublicLocaleContext';
import '../styles/public-articles-section.css';

export default function ArticlesPreviewSection({ coverage = [] }) {
  const { t, direction } = usePublicLocale();
  const scrollerRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const items = Array.isArray(coverage) ? coverage : [];

  const updateBoundaries = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 1) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }
    const absScroll = Math.abs(el.scrollLeft);
    setCanScrollPrev(absScroll > 1);
    setCanScrollNext(absScroll < maxScroll - 1);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    updateBoundaries();
    el.addEventListener('scroll', updateBoundaries, { passive: true });
    window.addEventListener('resize', updateBoundaries);
    return () => {
      el.removeEventListener('scroll', updateBoundaries);
      window.removeEventListener('resize', updateBoundaries);
    };
  }, [updateBoundaries, items.length]);

  function scrollByCards(delta) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector('.press-article-card');
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    const dir = direction === 'rtl' ? -delta : delta;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <section
      className="public-section public-section--press-articles"
      id="articles"
      aria-labelledby="press-articles-title"
    >
      <div className="press-articles__inner">
        <PublicSectionHeading
          className="press-articles__heading-wrap"
          eyebrow={t('articlesEyebrow')}
          title={t('articlesTitle')}
          titleId="press-articles-title"
          subtitle={t('articlesSubtitle')}
        />

        {items.length ? (
          <div className="public-stories-slider press-articles__slider">
            <button
              type="button"
              className="public-stories-slider__arrow public-stories-slider__arrow--prev"
              onClick={() => scrollByCards(-1)}
              disabled={!canScrollPrev}
              aria-label="Previous"
            >
              <ChevronRightIcon />
            </button>
            <div className="public-stories-slider__track press-articles__track" ref={scrollerRef}>
              {items.map((article) => (
                <ArticleCard article={article} key={article.id} />
              ))}
            </div>
            <button
              type="button"
              className="public-stories-slider__arrow public-stories-slider__arrow--next"
              onClick={() => scrollByCards(1)}
              disabled={!canScrollNext}
              aria-label="Next"
            >
              <ChevronLeftIcon />
            </button>
          </div>
        ) : (
          <div className="press-articles__state">
            <EmptyState message={t('emptyArticles')} />
          </div>
        )}
      </div>
    </section>
  );
}
